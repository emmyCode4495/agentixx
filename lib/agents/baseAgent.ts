
import { WalletEngine } from "../wallet/engine"

export interface MarketState {
  price:      number
  volume?:    number
  timestamp?: string
}

export interface TradeDecision {
  type:   "BUY" | "SELL" | "HOLD"
  reason: string
}

export abstract class BaseAgent {
  readonly loopIntervalMs: number

  constructor(
    public    id:     string,
    protected wallet: WalletEngine,
    loopIntervalMs = 15_000
  ) {
    this.loopIntervalMs = loopIntervalMs
  }

  /**
   * Synchronous strategy — called by the loop each cycle.
   * Returns a trade decision based on market state and current balance.
   */
  abstract strategy(market: MarketState, balanceSOL: number): TradeDecision

  /**
   * Async hook kept for compatibility with the original decide() contract.
   * Override if your agent needs async work per cycle.
   */
  async decide(): Promise<void> {}
}