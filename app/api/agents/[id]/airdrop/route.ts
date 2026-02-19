/**
 * POST /api/agents/[id]/airdrop
 * Requests a real devnet SOL airdrop for an agent wallet.
 * Devnet allows 1-2 SOL per request, rate-limited.
 */

import { NextRequest, NextResponse } from "next/server"
import { getAgent, refreshBalance, isInitialized } from "@/lib/agentStore"
import { requestAirdrop } from "@/lib/solana"

export const dynamic = "force-dynamic"

export async function POST(
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
    const signature = await requestAirdrop(agent.publicKey, 1)
    const newBalance = await refreshBalance(id)

    return NextResponse.json({
      ok: true,
      signature,
      newBalanceSOL: newBalance,
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    })
  } catch (err) {
    console.error(`[POST /api/agents/${id}/airdrop]`, err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Airdrop failed — devnet rate limit?" },
      { status: 500 }
    )
  }
}