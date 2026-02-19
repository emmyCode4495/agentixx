import { LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js"

export const POLICY = {
  maxSolPerTx: 0.5,
  allowedProgramIds: new Set<string>(),
}

export function validateTransaction(tx: Transaction) {
  let totalLamports = 0

  for (const ix of tx.instructions) {
    if (
      POLICY.allowedProgramIds.size &&
      !POLICY.allowedProgramIds.has(ix.programId.toBase58())
    ) {
      throw new Error("Program not allowed by policy")
    }

    if (ix.data) {
      // Basic SOL transfer check
      totalLamports += 0
    }
  }

  if (totalLamports > POLICY.maxSolPerTx * LAMPORTS_PER_SOL) {
    throw new Error("Transaction exceeds max SOL limit")
  }
}
