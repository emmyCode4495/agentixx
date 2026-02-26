

import type { MarketState } from "./market"
import type { Decision } from "./momentum"

export function conservativeStrategy(market: MarketState, balanceSOL: number): Decision {
  const { priceChange1m, priceChange5m, trend, volatility } = market

  if (balanceSOL < 0.05) {
    return { type: "HOLD", reason: "Preserving remaining balance", confidence: 1 }
  }

  // Never trade in high volatility — beta-hodler is risk-averse
  if (volatility === "HIGH") {
    return {
      type: "HOLD",
      reason: `High volatility — beta-hodler sits out risky conditions`,
      confidence: 0.95,
    }
  }

  // Only buys on very strong confirmed uptrend across both timeframes
  if (trend === "UP" && priceChange1m > 1.5 && priceChange5m > 3.0) {
    return {
      type: "BUY",
      reason: `Strong confirmed uptrend — 1m: +${priceChange1m.toFixed(2)}%, 5m: +${priceChange5m.toFixed(2)}% — conviction buy`,
      confidence: 0.85,
    }
  }

  // Sells only on confirmed crash signal
  if (trend === "DOWN" && priceChange1m < -1.5 && priceChange5m < -3.0) {
    return {
      type: "SELL",
      reason: `Confirmed downtrend — cutting losses (1m: ${priceChange1m.toFixed(2)}%, 5m: ${priceChange5m.toFixed(2)}%)`,
      confidence: 0.8,
    }
  }

  // Everything else — HOLD
  return {
    type: "HOLD",
    reason: `Signal not strong enough for beta-hodler (needs >1.5% 1m + >3% 5m move)`,
    confidence: 0.9,
  }
}