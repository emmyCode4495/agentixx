import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { PublicKey, Transaction } from "@solana/web3.js"

export async function createATAInstruction(
  mint: PublicKey,
  owner: PublicKey,
  payer: PublicKey
) {
  const ata = await getAssociatedTokenAddress(mint, owner)

  const ix = createAssociatedTokenAccountInstruction(
    payer,
    ata,
    owner,
    mint,
    TOKEN_PROGRAM_ID
  )

  return { ata, ix }
}
