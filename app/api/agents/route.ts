// /**
//  * GET /api/agents
//  * Returns the current state of all agents — real balances from Solana devnet.
//  * Initializes agents (creates wallets + airdrops) on first call.
//  */

// import { NextResponse } from "next/server"
// import {
//   ensureAgentsInitialized,
//   getAllAgents,
//   refreshBalance,
//   isInitialized,
//   isInitializing,
// } from "@/lib/agentStore"

// export const dynamic = "force-dynamic"

// export async function GET() {
//   try {
//     // Initialize agents if not done yet (first request)
//     if (!isInitialized() && !isInitializing()) {
//       // Don't await — let it run in background, return "initializing" state
//       ensureAgentsInitialized().catch(console.error)
//     }

//     // If already initialized, refresh all balances from chain in parallel
//     if (isInitialized()) {
//       const agents = getAllAgents()
//       await Promise.allSettled(agents.map((a) => refreshBalance(a.id)))
//     }

//     const agents = getAllAgents()

//     return NextResponse.json({
//       ok: true,
//       initialized: isInitialized(),
//       initializing: isInitializing(),
//       agents: agents.map((a) => ({
//         id: a.id,
//         publicKey: a.publicKey,
//         status: a.status,
//         balanceSOL: a.balanceSOL,
//         tradeCount: a.trades.length,
//         lastTrade: a.trades[0] ?? null,
//         pnl: a.pnl,
//         lastUpdated: a.lastUpdated,
//         error: a.error,
//         explorerUrl: `https://explorer.solana.com/address/${a.publicKey}?cluster=devnet`,
//       })),
//     })
//   } catch (err) {
//     console.error("[GET /api/agents]", err)
//     return NextResponse.json(
//       { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
//       { status: 500 }
//     )
//   }
// }

/**
 * app/api/agents/route.ts
 * Returns all agent records from Vercel KV.
 * Triggers initialization on first call.
 *
 * Place at: app/api/agents/route.ts
 */
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