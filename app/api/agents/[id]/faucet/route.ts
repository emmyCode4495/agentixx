import { NextRequest, NextResponse } from "next/server"
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js"
import { getAgent, refreshBalance, isInitialized } from "@/lib/agentStore"

export const dynamic = "force-dynamic"

const connection = new Connection("https://api.devnet.solana.com", "confirmed")

// How much to request from faucet (max 2 SOL on devnet)
const FAUCET_AMOUNT_SOL = 1

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isInitialized()) {
    return NextResponse.json(
      { ok: false, error: "Agents still initializing" },
      { status: 503 }
    )
  }

  const agent = getAgent(id)
  if (!agent) {
    return NextResponse.json(
      { ok: false, error: `Agent ${id} not found` },
      { status: 404 }
    )
  }

  // Skip if agent already has enough SOL
  try {
    const agentPubKey  = new PublicKey(agent.publicKey)
    const currentLamps = await connection.getBalance(agentPubKey)
    if (currentLamps >= 1 * LAMPORTS_PER_SOL) {
      return NextResponse.json({
        ok: true,
        message: "Agent already has sufficient balance",
        newBalanceSOL: currentLamps / LAMPORTS_PER_SOL,
        source: "faucet",
      })
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Balance check failed" },
      { status: 500 }
    )
  }

  // Attempt faucet airdrop
  try {
    const agentPubKey = new PublicKey(agent.publicKey)
    console.log(`[Faucet] Requesting ${FAUCET_AMOUNT_SOL} SOL airdrop for ${id} (${agent.publicKey})`)

    const signature = await connection.requestAirdrop(
      agentPubKey,
      FAUCET_AMOUNT_SOL * LAMPORTS_PER_SOL
    )

    // Wait for confirmation with a 30s timeout
    const latestBlockhash = await connection.getLatestBlockhash()
    await connection.confirmTransaction(
      {
        signature,
        blockhash:            latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      "confirmed"
    )

    const newBalance = await refreshBalance(id)

    console.log(`[Faucet] ✓ ${id} funded via faucet. Balance: ${newBalance} SOL. Sig: ${signature}`)

    return NextResponse.json({
      ok: true,
      signature,
      newBalanceSOL: newBalance,
      source: "faucet",
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Faucet airdrop failed"
    const isRateLimit =
      message.toLowerCase().includes("rate") ||
      message.toLowerCase().includes("429") ||
      message.toLowerCase().includes("too many") ||
      message.toLowerCase().includes("airdrop limit")

    console.warn(`[Faucet] ✗ ${id} faucet failed (${isRateLimit ? "rate-limited" : "error"}): ${message}`)

    return NextResponse.json(
      {
        ok: false,
        error: isRateLimit
          ? "Faucet rate-limited — too many requests. Try again in 24h."
          : message,
        rateLimited: isRateLimit,
      },
      { status: isRateLimit ? 429 : 500 }
    )
  }
}