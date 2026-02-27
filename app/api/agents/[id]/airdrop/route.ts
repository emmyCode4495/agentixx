
// import { NextRequest, NextResponse } from "next/server"
// import { getAgent, refreshBalance, isInitialized } from "@/lib/agentStore"
// import {
//   Connection,
//   PublicKey,
//   SystemProgram,
//   Transaction,
//   sendAndConfirmTransaction,
//   Keypair,
//   LAMPORTS_PER_SOL,
// } from "@solana/web3.js"

// export const dynamic = "force-dynamic"

// const connection = new Connection("https://api.devnet.solana.com", "confirmed")

// // ── Load master wallet from env ───────────────────────────────────
// function getMasterWallet(): Keypair {
//   const raw = process.env.MASTER_WALLET

//   if (!raw) {
//     throw new Error(
//       "MASTER_WALLET is not set in .env.local. " +
//       "Add it as a JSON byte array, e.g: MASTER_WALLET=[1,2,3,...] (64 numbers)"
//     )
//   }

//   let bytes: number[]
//   try {
//     bytes = JSON.parse(raw) as number[]
//   } catch {
//     throw new Error(
//       "MASTER_WALLET is not valid JSON. " +
//       "It must be a JSON array of 64 numbers, e.g: [12,34,56,...]"
//     )
//   }

//   if (!Array.isArray(bytes) || bytes.length !== 64) {
//     throw new Error(
//       `MASTER_WALLET must be an array of exactly 64 numbers. Got ${Array.isArray(bytes) ? bytes.length : "non-array"}.`
//     )
//   }

//   return Keypair.fromSecretKey(Uint8Array.from(bytes))
// }

// // ── Route handler ─────────────────────────────────────────────────
// export async function POST(
//   _req: NextRequest,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   const { id } = await params

//   if (!isInitialized()) {
//     return NextResponse.json({ ok: false, error: "Agents still initializing" }, { status: 503 })
//   }

//   const agent = getAgent(id)
//   if (!agent) {
//     return NextResponse.json({ ok: false, error: `Agent ${id} not found` }, { status: 404 })
//   }

//   // Load master wallet — return clear error if misconfigured
//   let masterWallet: Keypair
//   try {
//     masterWallet = getMasterWallet()
//   } catch (err) {
//     return NextResponse.json(
//       { ok: false, error: err instanceof Error ? err.message : "Master wallet config error" },
//       { status: 500 }
//     )
//   }

//   try {
//     const agentPubKey = new PublicKey(agent.publicKey)

//     // Check master wallet has enough balance
//     const masterBalance = await connection.getBalance(masterWallet.publicKey)
//     if (masterBalance < 1.1 * LAMPORTS_PER_SOL) {
//       return NextResponse.json({
//         ok: false,
//         error: `Master wallet has insufficient balance (${(masterBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL). ` +
//           `Fund it at faucet.solana.com using: ${masterWallet.publicKey.toBase58()}`,
//         masterPublicKey: masterWallet.publicKey.toBase58(),
//       }, { status: 400 })
//     }

//     // Skip if agent already has enough SOL
//     const agentBalance = await connection.getBalance(agentPubKey)
//     if (agentBalance >= 1 * LAMPORTS_PER_SOL) {
//       return NextResponse.json({
//         ok: true,
//         message: "Agent already has sufficient balance",
//         currentBalanceSOL: agentBalance / LAMPORTS_PER_SOL,
//       })
//     }

//     // Transfer 1 SOL from master → agent
//     const tx = new Transaction().add(
//       SystemProgram.transfer({
//         fromPubkey: masterWallet.publicKey,
//         toPubkey: agentPubKey,
//         lamports: 1 * LAMPORTS_PER_SOL,
//       })
//     )

//     console.log(`[Airdrop] Sending 1 SOL from master (${masterWallet.publicKey.toBase58()}) → ${id} (${agent.publicKey})`)

//     const signature = await sendAndConfirmTransaction(connection, tx, [masterWallet], {
//       commitment: "confirmed",
//     })

//     const newBalance = await refreshBalance(id)

//     console.log(`[Airdrop] ✓ ${id} funded. Balance: ${newBalance} SOL. Sig: ${signature}`)

//     return NextResponse.json({
//       ok: true,
//       signature,
//       newBalanceSOL: newBalance,
//       explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
//     })
//   } catch (err) {
//     console.error(`[POST /api/agents/${id}/airdrop]`, err)
//     return NextResponse.json(
//       { ok: false, error: err instanceof Error ? err.message : "Funding failed" },
//       { status: 500 }
//     )
//   }
// }

import { NextRequest, NextResponse } from "next/server"
import { getAgent, refreshBalance, isInitialized } from "@/lib/agentStore"
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js"

export const dynamic = "force-dynamic"

const connection = new Connection("https://api.devnet.solana.com", "confirmed")

function getMasterWallet(): Keypair {
  const raw = process.env.MASTER_WALLET
  if (!raw) {
    throw new Error(
      "MASTER_WALLET is not set in .env.local. " +
      "Add it as a JSON byte array, e.g: MASTER_WALLET=[1,2,3,...] (64 numbers)"
    )
  }
  let bytes: number[]
  try {
    bytes = JSON.parse(raw) as number[]
  } catch {
    throw new Error(
      "MASTER_WALLET is not valid JSON. " +
      "It must be a JSON array of 64 numbers, e.g: [12,34,56,...]"
    )
  }
  if (!Array.isArray(bytes) || bytes.length !== 64) {
    throw new Error(
      `MASTER_WALLET must be an array of exactly 64 numbers. Got ${Array.isArray(bytes) ? bytes.length : "non-array"}.`
    )
  }
  return Keypair.fromSecretKey(Uint8Array.from(bytes))
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!(await isInitialized())) {
    return NextResponse.json({ ok: false, error: "Agents still initializing" }, { status: 503 })
  }

  const agent = await getAgent(id)
  if (!agent) {
    return NextResponse.json({ ok: false, error: `Agent ${id} not found` }, { status: 404 })
  }

  let masterWallet: Keypair
  try {
    masterWallet = getMasterWallet()
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Master wallet config error" },
      { status: 500 }
    )
  }

  try {
    const agentPubKey = new PublicKey(agent.publicKey)

    const masterBalance = await connection.getBalance(masterWallet.publicKey)
    if (masterBalance < 1.1 * LAMPORTS_PER_SOL) {
      return NextResponse.json({
        ok: false,
        error: `Master wallet has insufficient balance (${(masterBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL). ` +
          `Fund it at faucet.solana.com using: ${masterWallet.publicKey.toBase58()}`,
        masterPublicKey: masterWallet.publicKey.toBase58(),
      }, { status: 400 })
    }

    const agentBalance = await connection.getBalance(agentPubKey)
    if (agentBalance >= 1 * LAMPORTS_PER_SOL) {
      return NextResponse.json({
        ok: true,
        message: "Agent already has sufficient balance",
        currentBalanceSOL: agentBalance / LAMPORTS_PER_SOL,
      })
    }

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: masterWallet.publicKey,
        toPubkey:   agentPubKey,
        lamports:   1 * LAMPORTS_PER_SOL,
      })
    )

    console.log(`[Airdrop] Sending 1 SOL from master (${masterWallet.publicKey.toBase58()}) → ${id} (${agent.publicKey})`)

    const signature = await sendAndConfirmTransaction(connection, tx, [masterWallet], {
      commitment: "confirmed",
    })

    const newBalance = await refreshBalance(id)

    console.log(`[Airdrop] ✓ ${id} funded. Balance: ${newBalance} SOL. Sig: ${signature}`)

    return NextResponse.json({
      ok: true,
      signature,
      newBalanceSOL: newBalance,
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    })
  } catch (err) {
    console.error(`[POST /api/agents/${id}/airdrop]`, err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Funding failed" },
      { status: 500 }
    )
  }
}