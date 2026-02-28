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

const DEX_TREASURY = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"

const PYTH_SOL_FEED_ID =
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d"

interface PythResult {
  price:      number
  confidence: number
  source:     "pyth" | "simulated"
}

async function getSolPrice(): Promise<PythResult> {
  try {
    const url = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${PYTH_SOL_FEED_ID}`
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`Pyth HTTP ${res.status}`)
    const data = (await res.json()) as {
      parsed?: Array<{ price: { price: string; expo: number; conf: string } }>
    }
    const p = data.parsed?.[0]?.price
    if (!p) throw new Error("Empty Pyth response")
    const mul      = Math.pow(10, p.expo)
    const priceUSD = +(parseFloat(p.price) * mul).toFixed(2)
    const confUSD  = +(parseFloat(p.conf)  * mul).toFixed(2)
    if (!isFinite(priceUSD) || priceUSD <= 0) throw new Error(`Bad price: ${priceUSD}`)
    console.log(`[Pyth] SOL/USD = $${priceUSD} ± $${confUSD}`)
    return { price: priceUSD, confidence: confUSD, source: "pyth" }
  } catch (err) {
    const fallback = +(130 + Math.random() * 80).toFixed(2)
    console.warn(`[Pyth] Unavailable (${err instanceof Error ? err.message : err}) — simulated $${fallback}`)
    return { price: fallback, confidence: 2.5, source: "simulated" }
  }
}

interface Decision {
  type:   "BUY" | "SELL" | "HOLD"
  reason: string
  source: "llm" | "rule-based"
}

function getRuleBasedDecision(price: number, balanceSOL: number): Decision {
  const MIN_BALANCE = 0.06
  if (price <= 150 && balanceSOL >= MIN_BALANCE) {
    return { type: "BUY",  reason: `Rule-based: price $${price} below buy threshold $150`,         source: "rule-based" }
  }
  if (price >= 200) {
    return { type: "SELL", reason: `Rule-based: price $${price} exceeds sell threshold $200`,       source: "rule-based" }
  }
  return   { type: "HOLD", reason: `Rule-based: price $${price} within neutral range, holding`,     source: "rule-based" }
}

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
// ROUTE HANDLER
// ─────────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!(await isInitialized())) {
    return NextResponse.json({ ok: false, error: "Agents still initializing" }, { status: 503 })
  }

  const [agent, keypair] = await Promise.all([
    getAgent(id),
    Promise.resolve(getKeypair(id)),
  ])

  if (!agent || !keypair) {
    return NextResponse.json({ ok: false, error: `Agent ${id} not found` }, { status: 404 })
  }

  const { price, confidence, source: priceSource } = await getSolPrice()
  const tradeAmount = 0.01

  const body = (await req.json().catch(() => ({}))) as { type?: string }
  let decision: Decision

  const tradeCount = agent.trades?.length ?? 0
  const pnl        = agent.pnl

  if (body.type && ["BUY", "SELL", "HOLD"].includes(body.type.toUpperCase())) {
    const manualType = body.type.toUpperCase() as "BUY" | "SELL" | "HOLD"
    const llm = await getLLMDecision({
      agentId: id, price, confidence, priceSource,
      balanceSOL: agent.balanceSOL, tradeCount, pnl,
    })
    decision = {
      type:   manualType,
      reason: `[Manual ${manualType}] ${llm.reason}`,
      source: llm.source,
    }
  } else {
    decision = await getLLMDecision({
      agentId: id, price, confidence, priceSource,
      balanceSOL: agent.balanceSOL, tradeCount, pnl,
    })
  }

  const { type: tradeType, reason: tradeReason, source: decisionSource } = decision
  let signature: string | undefined

  try {
    await setAgentStatus(id, "running")

    if (tradeType === "BUY") {
      if (agent.balanceSOL < tradeAmount + 0.001) {
        return NextResponse.json(
          { ok: false, error: `Insufficient balance (${agent.balanceSOL.toFixed(4)} SOL)` },
          { status: 400 }
        )
      }
      signature = await sendSOL(keypair, DEX_TREASURY, tradeAmount)

    } else if (tradeType === "SELL") {
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
    await recordTrade(id, trade)
    await setAgentStatus(id, "idle")

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
    await setAgentStatus(id, "error")
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Trade failed" },
      { status: 500 }
    )
  }
}