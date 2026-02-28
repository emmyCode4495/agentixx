import { WalletEngine } from "../wallet/engine"
import { BaseAgent, MarketState, TradeDecision } from "./baseAgent"

export class TraderAgent extends BaseAgent {
  constructor(id: string, wallet: WalletEngine) {
    super(id, wallet, 15_000)
  }

  strategy(market: MarketState, _balanceSOL: number): TradeDecision {
    const { price } = market

    if (price < 40) {
      return {
        type:   "BUY",
        reason: `Price ${price.toFixed(2)} below momentum threshold — entering position`,
      }
    }

    if (price > 70) {
      return {
        type:   "SELL",
        reason: `Price ${price.toFixed(2)} above target — taking profit`,
      }
    }

    return {
      type:   "HOLD",
      reason: `Price ${price.toFixed(2)} in neutral zone — holding position`,
    }
  }
}