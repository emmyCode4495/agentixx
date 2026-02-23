

import type { MarketState } from "./market"
import type { TradeType } from "../agentStore"
import type { Decision } from "./momentum"

export function aggressiveStrategy(market: MarketState, balanceSOL: number): Decision {
  const { price, priceChange1m, priceChange5m, trend, volatility } = market

  if (balanceSOL < 0.03) {
    return { type: "HOLD", reason: "Balance critically low — gamma-arbitrage pausing", confidence: 1 }
  }

  // Aggressive buys even on weak upward signals
  if (priceChange1m > 0.2 && trend !== "DOWN") {
    return {
      type: "BUY",
      reason: `Quick entry on upward tick — price ${price.toFixed(2)}, 1m momentum: +${priceChange1m.toFixed(2)}%`,
      confidence: 0.6,
    }
  }

  // Sells into any downward move
  if (priceChange1m < -0.2 && trend !== "UP") {
    return {
      type: "SELL",
      reason: `Fast exit on downward tick — 1m: ${priceChange1m.toFixed(2)}%, trend: ${trend}`,
      confidence: 0.6,
    }
  }

  // In high volatility — gamma still trades, looking for reversals
  if (volatility === "HIGH" && Math.abs(priceChange1m) > 0.5) {
    const isReversal = (trend === "UP" && priceChange1m < 0) || (trend === "DOWN" && priceChange1m > 0)
    if (isReversal) {
      const type: TradeType = priceChange1m > 0 ? "BUY" : "SELL"
      return {
        type,
        reason: `Volatility reversal play — trend: ${trend}, 1m flip: ${priceChange1m.toFixed(2)}%`,
        confidence: 0.65,
      }
    }
  }

  // Even in sideways — gamma looks for micro-moves
  if (Math.abs(priceChange1m) > 0.1) {
    const type: TradeType = priceChange1m > 0 ? "BUY" : "SELL"
    return {
      type,
      reason: `Micro-move scalp — ${priceChange1m.toFixed(3)}% tick at price ${price.toFixed(2)}`,
      confidence: 0.5,
    }
  }

  return {
    type: "HOLD",
    reason: `No tick movement detected — gamma-arbitrage waiting for entry`,
    confidence: 0.4,
  }
}