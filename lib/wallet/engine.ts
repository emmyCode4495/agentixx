import {
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js"
import { getConnection } from "../solana/connection"
import { validateTransaction } from "./policy"

export class WalletEngine {
  constructor(private keypair: Keypair) {}

  async simulate(tx: Transaction) {
    const conn = getConnection()
    return conn.simulateTransaction(tx)
  }

  async execute(tx: Transaction) {
    validateTransaction(tx)

    const conn = getConnection()

    const simulation = await this.simulate(tx)
    if (simulation.value.err) {
      throw new Error("Simulation failed")
    }

    return sendAndConfirmTransaction(conn, tx, [this.keypair], {
      commitment: "confirmed",
    })
  }
}
