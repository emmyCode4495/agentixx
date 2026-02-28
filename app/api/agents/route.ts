import { NextResponse } from "next/server"
import {
  ensureAgentsInitialized,
  getAllAgents,
  isInitialized,
  isInitializing,
} from "@/lib/agentStore"

export const dynamic = "force-dynamic"

export async function GET() {
  // Trigger initialization if not yet done (non-blocking on subsequent calls)
  ensureAgentsInitialized().catch((err) =>
    console.error("[/api/agents] Init error:", err)
  )

  const [initialized, initializing, agents] = await Promise.all([
    isInitialized(),
    isInitializing(),
    getAllAgents(),
  ])

  // Map AgentRecord → the shape the dashboard expects
  const mapped = agents.map((a) => ({
    id:          a.id,
    publicKey:   a.publicKey,
    status:      a.status,
    balanceSOL:  a.balanceSOL,
    pnl:         a.pnl,
    tradeCount:  a.trades?.length ?? 0,
    lastTrade:   a.trades?.[0] ?? null,
    lastUpdated: a.lastUpdated,
    error:       a.error,
    explorerUrl: `https://explorer.solana.com/address/${a.publicKey}?cluster=devnet`,
  }))

  return NextResponse.json({ ok: true, initialized, initializing, agents: mapped })
}