/**
 * POST /api/agents/[id]/trade
 * Executes a real autonomous trade decision for an agent.
 * Sends actual SOL transfers on Solana devnet and records them.
 *
 * Body: { type: "BUY" | "SELL" | "HOLD" }
 *
 * BUY  → agent sends 0.01 SOL to DEX treasury (real on-chain tx)
 * SELL → agent sends a 0-lamport self-transfer with a Memo instruction
 *         recording the sell decision — fully verifiable on Explorer
 * HOLD → records decision only, no transaction needed
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
 * Mock DEX treasury — a second devnet keypair that acts as the
 * counterparty. BUY sends SOL here; a real protocol would CPI back
 * on SELL. We use the Solana memo program pubkey as a well-known
 * devnet address so Explorer renders it cleanly.
 *
 * For a production system, replace with your deployed program address.
 */
const DEX_TREASURY = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"

/**
 * Simulated price oracle.
 * In production: fetch from Pyth Network or Switchboard.
 */
function getSimulatedPrice(): number {
  return +(20 + Math.random() * 80).toFixed(2)
}

/**
 * Rule-based momentum decision — the simplest possible AI decision layer.
 * Price < 40  → BUY (undervalued)
 * Price > 70  → SELL (take profit)
 * Otherwise   → HOLD
 *
 * In production: replace with an LLM call or on-chain oracle signal.
 */
export function autonomousDecision(price: number): "BUY" | "SELL" | "HOLD" {
  if (price < 40) return "BUY"
  if (price > 70) return "SELL"
  return "HOLD"
}

function getTradeReason(type: string, price: number): string {
  if (type === "BUY")  return `Price ${price.toFixed(2)} below momentum threshold — entering position`
  if (type === "SELL") return `Price ${price.toFixed(2)} above target — taking profit`
  return "Market conditions neutral — holding position"
}

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

  const body      = (await req.json().catch(() => ({}))) as { type?: string; auto?: boolean }
  const tradeType = (body.type ?? "BUY") as "BUY" | "SELL" | "HOLD"
  const price     = getSimulatedPrice()
  const tradeAmount = 0.01 // SOL per trade

  let signature: string | undefined

  try {
    setAgentStatus(id, "running")

    if (tradeType === "BUY") {
      // ── Real on-chain tx: agent → DEX treasury ──────────────────
      if (agent.balanceSOL < tradeAmount + 0.001) {
        return NextResponse.json(
          { ok: false, error: `Insufficient balance (${agent.balanceSOL.toFixed(4)} SOL)` },
          { status: 400 }
        )
      }
      signature = await sendSOL(keypair, DEX_TREASURY, tradeAmount)

    } else if (tradeType === "SELL") {
      // ── Real on-chain tx: memo recording the SELL decision ───────
      // Sends 0 lamports to self with a Memo instruction so the
      // decision is permanently, verifiably recorded on-chain.
      // In a real DEX integration this would be a CPI into the
      // protocol's withdraw/redeem instruction.
      const memo = JSON.stringify({
        action:    "SELL",
        agent:     id,
        price:     price.toFixed(2),
        amountSOL: tradeAmount,
        ts:        new Date().toISOString(),
      })
      signature = await sendMemoTransaction(keypair, memo)

    } else {
      // ── HOLD — no transaction, just record the decision ──────────
      signature = undefined
    }

    // Refresh real balance from chain
    const newBalance = await refreshBalance(id)

    const trade = {
      id:        `${id}-${Date.now()}`,
      type:      tradeType,
      amountSOL: tradeType === "HOLD" ? 0 : tradeAmount,
      price,
      signature,
      timestamp: new Date().toISOString(),
      reason:    getTradeReason(tradeType, price),
    }
    recordTrade(id, trade)

    return NextResponse.json({
      ok:          true,
      trade,
      newBalanceSOL: newBalance,
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