/**
 * lib/wallet/engine.ts
 * Core wallet execution layer for each agent.
 * Wraps a Keypair and Connection, validates policy, simulates,
 * then broadcasts transactions on Solana devnet.
 */

import {
  Keypair,
  Connection,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js"
import { getConnection } from "../solana"
import { validateTransaction } from "./policy"

export class WalletEngine {
  private _keypair:   Keypair
  private _connection: Connection

  /**
   * @param keypair    - agent's signing keypair (from agentStore)
   * @param connection - optional: pass getConnection() from registry,
   *                     or omit to fall back to the shared singleton
   */
  constructor(keypair: Keypair, connection?: Connection) {
    this._keypair    = keypair
    this._connection = connection ?? getConnection()
  }

  // Public getter — loop.ts and trade route can read the pubkey
  get keypair(): Keypair {
    return this._keypair
  }

  // Get live SOL balance of this agent's wallet from devnet
  async getBalance(): Promise<number> {
    const lamports = await this._connection.getBalance(this._keypair.publicKey)
    return lamports / 1_000_000_000
  }

  // Simulate a transaction without broadcasting
  async simulate(tx: Transaction) {
    return this._connection.simulateTransaction(tx)
  }

  // Validate, simulate, then execute a transaction on-chain
  async execute(tx: Transaction): Promise<string> {
    // Policy check — throws if the transaction violates agent spending rules
    validateTransaction(tx)

    // Dry-run first — catches most RPC errors before spending fees
    const simulation = await this.simulate(tx)
    if (simulation.value.err) {
      throw new Error(
        `Simulation failed: ${JSON.stringify(simulation.value.err)}`
      )
    }

    return sendAndConfirmTransaction(this._connection, tx, [this._keypair], {
      commitment: "confirmed",
    })
  }
}