import { WalletEngine } from "../wallet/engine"
import { TraderAgent } from "./traderAgent"
import { BaseAgent } from "./baseAgent"

export function createAgentInstance(
  id: string,
  engine: WalletEngine
): BaseAgent {
  switch (id) {
    case "alpha-trader":
      return new TraderAgent(id, engine)

    case "beta-hodler":
      return new TraderAgent(id, engine)

    case "gamma-arbitrage":
      return new TraderAgent(id, engine)

    default:
      throw new Error("Unknown agent type")
  }
}
