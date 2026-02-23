
import { getConnection, sendSOL, sendMemoTransaction } from "../solana"
import { getMarketState } from "./market"
import { createAgentInstance } from "./registry"
import {
  getAgent,
  getKeypair,
  recordTrade,
  refreshBalance,
  setAgentStatus,
} from "../agentStore"

// Devnet DEX treasury — receives BUY payments (mock protocol address)
const DEX_TREASURY = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
const TRADE_AMOUNT_SOL = 0.01
const MIN_BALANCE_SOL  = 0.05  // reserve — never trade below this

// ── Loop store (server singleton) ─────────────────────────────────
// Persisted on globalThis so Next.js hot-reloads don't spawn duplicate loops
const g = globalThis as typeof globalThis & {
  __agentLoops?: Map<string, ReturnType<typeof setInterval>>
}
if (!g.__agentLoops) g.__agentLoops = new Map()
const loops = g.__agentLoops

// ── Execute one trade cycle for an agent ──────────────────────────
async function runCycle(agentId: string): Promise<void> {
  const agent   = getAgent(agentId)
  const keypair = getKeypair(agentId)

  if (!agent || !keypair) return

  // Skip if agent is already mid-trade or still initializing
  if (agent.status === "running" || agent.status === "initializing") return

  // Safety guard — stop trading if balance is too low
  if (agent.balanceSOL < MIN_BALANCE_SOL) {
    setAgentStatus(agentId, "idle")
    console.warn(`[${agentId}] Balance ${agent.balanceSOL} SOL below minimum — skipping cycle`)
    return
  }

  try {
    // 1. Read market state
    const market = getMarketState()

    // 2. Apply this agent's strategy to get a decision
    const agentInstance = createAgentInstance(agentId)
    const decision      = agentInstance.strategy(market, agent.balanceSOL)

    setAgentStatus(agentId, "running")

    let signature: string | undefined

    // 3. Execute on-chain ─────────────────────────────────────────
    if (decision.type === "BUY") {
      // Real SOL transfer: agent wallet → DEX treasury
      // Uses shared connection singleton from lib/solana.ts
      signature = await sendSOL(keypair, DEX_TREASURY, TRADE_AMOUNT_SOL)
      console.log(`[${agentId}] BUY executed — sig: ${signature.slice(0, 16)}…`)

    } else if (decision.type === "SELL") {
      // Real Memo program transaction — agent signs JSON trade metadata
      // on-chain. Permanently verifiable on Explorer even though no SOL
      // transfers back without a deployed program counterparty.
      const memo = JSON.stringify({
        action:    "SELL",
        agent:     agentId,
        price:     market.price.toFixed(2),
        amountSOL: TRADE_AMOUNT_SOL,
        reason:    decision.reason,
        ts:        new Date().toISOString(),
      })
      signature = await sendMemoTransaction(keypair, memo)
      console.log(`[${agentId}] SELL memo recorded on-chain — sig: ${signature.slice(0, 16)}…`)

    } else {
      // HOLD — no transaction needed
      console.log(`[${agentId}] HOLD — ${decision.reason}`)
    }

    // 4. Refresh real balance from devnet RPC
    const newBalance = await refreshBalance(agentId)

    // 5. Record the trade in agent history
    recordTrade(agentId, {
      id:        `${agentId}-${Date.now()}`,
      type:      decision.type,
      amountSOL: decision.type === "HOLD" ? 0 : TRADE_AMOUNT_SOL,
      price:     market.price,
      signature,
      timestamp: new Date().toISOString(),
      reason:    decision.reason,
    })

    setAgentStatus(agentId, "running")

    console.log(
      `[${agentId}] Cycle complete — ${decision.type} @ $${market.price.toFixed(2)} | ` +
      `balance: ${newBalance.toFixed(4)} SOL` +
      (signature ? ` | sig: ${signature.slice(0, 16)}…` : "")
    )

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error(`[${agentId}] Cycle error:`, msg)

    // Insufficient funds → go idle (needs airdrop before resuming)
    // Any other RPC error → stay running and retry next cycle
    if (msg.includes("insufficient") || msg.includes("0x1")) {
      setAgentStatus(agentId, "idle")
    } else {
      setAgentStatus(agentId, "running")
    }
  }
}

// ── Start an agent's loop ─────────────────────────────────────────
export function startAgentLoop(agentId: string): void {
  if (loops.has(agentId)) {
    console.log(`[Loop] ${agentId} already running`)
    return
  }

  const agentInstance = createAgentInstance(agentId)
  const intervalMs    = agentInstance.loopIntervalMs

  console.log(`[Loop] Starting ${agentId} (interval: ${intervalMs / 1000}s, min balance: ${MIN_BALANCE_SOL} SOL)`)

  // Fire the first cycle immediately so the dashboard updates right away
  runCycle(agentId).catch(console.error)

  // Then repeat on the agent's configured interval
  const interval = setInterval(() => {
    runCycle(agentId).catch(console.error)
  }, intervalMs)

  loops.set(agentId, interval)
}

// ── Stop an agent's loop ──────────────────────────────────────────
export function stopAgentLoop(agentId: string): void {
  const interval = loops.get(agentId)
  if (interval) {
    clearInterval(interval)
    loops.delete(agentId)
    setAgentStatus(agentId, "idle")
    console.log(`[Loop] Stopped ${agentId}`)
  }
}

// ── Bulk controls ─────────────────────────────────────────────────
export function startAllLoops(agentIds: string[]): void {
  agentIds.forEach((id, i) => {
    // Stagger starts by 3 s each so agents don't hammer the RPC simultaneously
    setTimeout(() => startAgentLoop(id), i * 3000)
  })
}

export function stopAllLoops(): void {
  for (const id of loops.keys()) stopAgentLoop(id)
}

export function getRunningLoops(): string[] {
  return Array.from(loops.keys())
}