/**
 * GET /api/agents/[id]/history
 * Fetches the REAL on-chain transaction history for an agent
 * directly from Solana devnet RPC.
 */

import { NextRequest, NextResponse } from "next/server"
import { getAgent, isInitialized } from "@/lib/agentStore"
import { getTxHistory } from "@/lib/solana"

export const dynamic = "force-dynamic"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isInitialized()) {
    return NextResponse.json({ ok: false, error: "Agents still initializing" }, { status: 503 })
  }

  const agent = getAgent(id)
  if (!agent) {
    return NextResponse.json({ ok: false, error: `Agent ${id} not found` }, { status: 404 })
  }

  try {
    // Real on-chain tx signatures from devnet
    const history = await getTxHistory(agent.publicKey, 20)

    return NextResponse.json({
      ok: true,
      agentId: id,
      publicKey: agent.publicKey,
      transactions: history.map((sig) => ({
        signature: sig.signature,
        slot: sig.slot,
        blockTime: sig.blockTime,
        err: sig.err,
        explorerUrl: `https://explorer.solana.com/tx/${sig.signature}?cluster=devnet`,
      })),
    })
  } catch (err) {
    console.error(`[GET /api/agents/${id}/history]`, err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Failed to fetch history" },
      { status: 500 }
    )
  }
}