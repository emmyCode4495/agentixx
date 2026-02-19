import {
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js"
import { getConnection } from "./connection"

export async function getBalanceSOL(publicKey: string) {
  const conn = getConnection()
  const lamports = await conn.getBalance(new PublicKey(publicKey))
  return lamports / LAMPORTS_PER_SOL
}

export async function requestAirdrop(
  publicKey: string,
  amountSOL = 1
) {
  const conn = getConnection()

  const sig = await conn.requestAirdrop(
    new PublicKey(publicKey),
    amountSOL * LAMPORTS_PER_SOL
  )

  const { blockhash, lastValidBlockHeight } =
    await conn.getLatestBlockhash()

  await conn.confirmTransaction({
    signature: sig,
    blockhash,
    lastValidBlockHeight,
  })

  return sig
}
