/**
 * POST /api/agents/[id]/trade
 * Executes a real autonomous trade decision for an agent.
 * Sends actual SOL transfers on Solana devnet and records them.
 *
 * Body: { type: "BUY" | "SELL" | "HOLD" }   ← manual override from dashboard
 *       (omit body / pass auto:true to let the LLM decide autonomously)
 *
 * BUY  → agent sends 0.01 SOL to DEX treasury (real on-chain tx)
 * SELL → agent records decision on-chain via a signed Memo instruction
 *         — permanently verifiable on Explorer with full LLM reasoning
 * HOLD → records decision only, no transaction needed
 *
 * Place this file at: app/api/agents/[id]/trade/route.ts
 */
import { NextRequest, NextResponse } from "next/server"
import {
  getAgent,
  getKeypair,
  recordTrade,
  refreshBalance,
  setAgentStatus,
  isInitialized,
} from "@/lib/agentStore"
import { sendSOL, sendMemoTransaction } from "@/lib/solana"

export const dynamic = "force-dynamic"

/**
 * DEX treasury — Memo program pubkey used as a well-known devnet
 * counterparty. BUY transfers SOL here; Explorer renders it cleanly
 * as "Memo Program" so judges can verify every transaction.
 */
const DEX_TREASURY = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"

// ─────────────────────────────────────────────────────────────────
// 1. REAL PRICE ORACLE — Pyth Network Hermes REST API
// ─────────────────────────────────────────────────────────────────
// SOL/USD price feed ID (same on mainnet + devnet via Hermes)
// Source: https://pyth.network/developers/price-feed-ids
const PYTH_SOL_FEED_ID =
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"

interface PythResult {
  price:      number          // USD
  confidence: number          // ±USD
  source:     "pyth" | "simulated"
}

/**
 * Fetch live SOL/USD price from Pyth's Hermes REST endpoint.
 * No API key required — publicly available.
 * Gracefully falls back to a realistic simulated range on failure
 * so agents always have a price to reason about.
 */
async function getSolPrice(): Promise<PythResult> {
  try {
    const url = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${PYTH_SOL_FEED_ID}`
    const res = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) throw new Error(`Pyth HTTP ${res.status}`)

    const data = (await res.json()) as {
      parsed?: Array<{
        price: { price: string; expo: number; conf: string }
      }>
    }
    const p = data.parsed?.[0]?.price
    if (!p) throw new Error("Empty Pyth response")

    const mul        = Math.pow(10, p.expo)           // expo is negative, e.g. -8
    const priceUSD   = +(parseFloat(p.price) * mul).toFixed(2)
    const confUSD    = +(parseFloat(p.conf)  * mul).toFixed(2)

    if (!isFinite(priceUSD) || priceUSD <= 0) throw new Error(`Bad price: ${priceUSD}`)

    console.log(`[Pyth] SOL/USD = $${priceUSD} ± $${confUSD}`)
    return { price: priceUSD, confidence: confUSD, source: "pyth" }

  } catch (err) {
    // Realistic SOL range as fallback — not the original toy $20–$100
    const fallback = +(130 + Math.random() * 80).toFixed(2)
    console.warn(`[Pyth] Unavailable (${err instanceof Error ? err.message : err}) — simulated $${fallback}`)
    return { price: fallback, confidence: 2.5, source: "simulated" }
  }
}

// ─────────────────────────────────────────────────────────────────
// 2. TYPES
// ─────────────────────────────────────────────────────────────────

interface Decision {
  type:   "BUY" | "SELL" | "HOLD"
  reason: string
  source: "llm" | "rule-based"
}

// ─────────────────────────────────────────────────────────────────
// 3. RULE-BASED FALLBACK DECISION
// ─────────────────────────────────────────────────────────────────

/**
 * Simple deterministic fallback when the LLM is unavailable.
 * Buys if balance is healthy and price looks low, sells if price
 * is high, otherwise holds.
 */
function getRuleBasedDecision(price: number, balanceSOL: number): Decision {
  const BUY_THRESHOLD  = 150   // buy below this price
  const SELL_THRESHOLD = 200   // sell above this price
  const MIN_BALANCE    = 0.06  // 0.01 trade + 0.05 reserve + small buffer

  if (price <= BUY_THRESHOLD && balanceSOL >= MIN_BALANCE) {
    return {
      type:   "BUY",
      reason: `Rule-based: price $${price} is below buy threshold $${BUY_THRESHOLD}`,
      source: "rule-based",
    }
  }
  if (price >= SELL_THRESHOLD) {
    return {
      type:   "SELL",
      reason: `Rule-based: price $${price} exceeds sell threshold $${SELL_THRESHOLD}`,
      source: "rule-based",
    }
  }
  return {
    type:   "HOLD",
    reason: `Rule-based: price $${price} is within neutral range, holding position`,
    source: "rule-based",
  }
}

// ─────────────────────────────────────────────────────────────────
// 4. LLM AUTONOMOUS DECISION — Groq (llama-3.1-8b-instant)
// ─────────────────────────────────────────────────────────────────

/**
 * Calls Groq's llama-3.1-8b-instant to make a real AI trading decision.
 * Groq's OpenAI-compatible API delivers sub-second inference for free.
 *
 * The agent receives live market context — Pyth price, confidence
 * interval, its own balance, trade count, and P&L — and returns a
 * structured JSON decision with a natural language reason.
 */
async function getLLMDecision(context: {
  agentId:     string
  price:       number
  confidence:  number
  priceSource: "pyth" | "simulated"
  balanceSOL:  number
  tradeCount:  number
  pnl:         number
}): Promise<Decision> {
  const { agentId, price, confidence, priceSource, balanceSOL, tradeCount, pnl } = context
  const RESERVE   = 0.05
  const tradeable = +(balanceSOL - RESERVE).toFixed(4)

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.warn("[LLM] GROQ_API_KEY not set — rule-based fallback")
    return getRuleBasedDecision(price, balanceSOL)
  }

  const system = `You are ${agentId}, an autonomous Solana trading agent.
You make disciplined, risk-managed decisions to grow your SOL balance.
Constraints:
  - BUY costs exactly 0.01 SOL
  - Tradeable balance: ${tradeable} SOL (after ${RESERVE} SOL fee reserve)
  - You cannot BUY if tradeable < 0.01
  - Reason clearly from the data — do not hallucinate trends
  - Reply with pure JSON only, no markdown fences`

  const user = `Live market snapshot:
  SOL/USD price : $${price.toFixed(2)} (source: ${priceSource})
  Confidence    : ±${confidence.toFixed(2)}
  Your balance  : ${balanceSOL.toFixed(4)} SOL
  Total trades  : ${tradeCount}
  Cumulative P&L: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(4)} SOL


What is your decision? Reply with pure JSON — no markdown, no explanation outside the object:
{"decision":"BUY"|"SELL"|"HOLD","reason":"<1-2 sentences max>"}`

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       "llama-3.1-8b-instant",
        max_tokens:  120,
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user",   content: user   },
        ],
      }),
      signal: AbortSignal.timeout(12000),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => "")
      throw new Error(`Groq HTTP ${res.status}: ${errText.slice(0, 120)}`)
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const raw  = data.choices?.[0]?.message?.content?.trim() ?? ""

    // Strip markdown code fences if the model adds them despite instructions
    const text = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim()
    const json = JSON.parse(text) as { decision?: string; reason?: string }

    const type = json.decision?.toUpperCase()
    
    if (type !== "BUY" && type !== "SELL" && type !== "HOLD") {
      throw new Error(`Unexpected decision value: ${type}`)
    }

    console.log(`[Groq] ${agentId} → ${type}: ${json.reason}`)
    
    return { type, reason: json.reason ?? "AI decision", source: "llm" }

  } catch (err) {
    console.warn(`[Groq] Failed (${err instanceof Error ? err.message : err}) — rule-based fallback`)
    return getRuleBasedDecision(price, balanceSOL)
  }
}

// ─────────────────────────────────────────────────────────────────
// 5. ROUTE HANDLER
// ─────────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isInitialized()) {
    return NextResponse.json({ ok: false, error: "Agents still initializing" }, { status: 503 })
  }

  const agent   = getAgent(id)
  const keypair = getKeypair(id)
  if (!agent || !keypair) {
    return NextResponse.json({ ok: false, error: `Agent ${id} not found` }, { status: 404 })
  }

  // ── Fetch live price first — used by both manual and auto paths ─
  const { price, confidence, source: priceSource } = await getSolPrice()
  const tradeAmount = 0.01

  // ── Determine trade type + reason ───────────────────────────────
  const body = (await req.json().catch(() => ({}))) as { type?: string }
  let decision: Decision

  if (body.type && ["BUY", "SELL", "HOLD"].includes(body.type.toUpperCase())) {
    // Manual override — honour the type, but enrich the reason with LLM context
    const manualType = body.type.toUpperCase() as "BUY" | "SELL" | "HOLD"
    const llm = await getLLMDecision({
      agentId:     id,
      price,
      confidence,
      priceSource,
      balanceSOL:  agent.balanceSOL,
      tradeCount:  agent.trades.length,   // ← fixed: was agent.tradeCount
      pnl:         agent.pnl,
    })
    decision = {
      type:   manualType,
      reason: `[Manual ${manualType}] ${llm.reason}`,
      source: llm.source,
    }
  } else {
    // Fully autonomous — LLM picks type AND writes the reason
    decision = await getLLMDecision({
      agentId:     id,
      price,
      confidence,
      priceSource,
      balanceSOL:  agent.balanceSOL,
      tradeCount:  agent.trades.length,   // ← fixed: was agent.tradeCount
      pnl:         agent.pnl,
    })
  }

  const { type: tradeType, reason: tradeReason, source: decisionSource } = decision
  let signature: string | undefined

  try {
    setAgentStatus(id, "running")

    if (tradeType === "BUY") {
      if (agent.balanceSOL < tradeAmount + 0.001) {
        return NextResponse.json(
          { ok: false, error: `Insufficient balance (${agent.balanceSOL.toFixed(4)} SOL)` },
          { status: 400 }
        )
      }
      // Real on-chain tx: agent → DEX treasury
      signature = await sendSOL(keypair, DEX_TREASURY, tradeAmount)

    } else if (tradeType === "SELL") {
      // Signed Memo tx — records the full LLM decision permanently on-chain.
      // Every field is verifiable on Explorer: agent id, live price, AI reason.
      const memo = JSON.stringify({
        action:   "SELL",
        agent:    id,
        price:    price.toFixed(2),
        amt:      tradeAmount,
        src:      priceSource,
        decision: decisionSource,
        reason:   tradeReason.slice(0, 120),
        ts:       new Date().toISOString(),
      })
      signature = await sendMemoTransaction(keypair, memo)

    } else {
      // HOLD — no on-chain action needed
      signature = undefined
    }

    const newBalance = await refreshBalance(id)

    const trade = {
      id:        `${id}-${Date.now()}`,
      type:      tradeType,
      amountSOL: tradeType === "HOLD" ? 0 : tradeAmount,
      price,
      signature,
      timestamp: new Date().toISOString(),
      reason:    tradeReason,
    }
    recordTrade(id, trade)

    return NextResponse.json({
      ok:            true,
      trade,
      newBalanceSOL: newBalance,
      priceSource,
      decisionSource,
      explorerUrl: signature
        ? `https://explorer.solana.com/tx/${signature}?cluster=devnet`
        : null,
    })

  } catch (err) {
    console.error(`[POST /api/agents/${id}/trade]`, err)
    setAgentStatus(id, "error")
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Trade failed" },
      { status: 500 }
    )
  }
}