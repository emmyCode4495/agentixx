

import { WalletEngine } from "../wallet/engine"
import { TraderAgent } from "./traderAgent"
import { BaseAgent } from "./baseAgent"
import { getKeypair } from "../agentStore"
import { getConnection } from "../solana"

export function createAgentInstance(id: string): BaseAgent {
  const keypair = getKeypair(id)
  if (!keypair) {
    throw new Error(`[registry] No keypair found for agent "${id}" — is agentStore initialized?`)
  }

  const wallet = new WalletEngine(keypair, getConnection())

  switch (id) {
    case "alpha-trader":
      return new TraderAgent(id, wallet)
    case "beta-hodler":
      return new TraderAgent(id, wallet)
    case "gamma-arbitrage":
      return new TraderAgent(id, wallet)
    default:
      throw new Error(`[registry] Unknown agent type: "${id}"`)
  }
}