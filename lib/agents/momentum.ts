/**
 * alpha-trader strategy: Momentum
 * Follows price trends — buys into upward momentum, sells into downturns.
 * Moderate trade frequency, medium-sized positions.
 */

import type { MarketState } from "./market"
import type { TradeType } from "../agentStore"

export interface Decision {
  type: TradeType
  reason: string
  confidence: number  // 0–1
}

export function momentumStrategy(market: MarketState, balanceSOL: number): Decision {
  const { priceChange1m, priceChange5m, trend, volatility } = market

  // Don't trade if balance too low
  if (balanceSOL < 0.05) {
    return { type: "HOLD", reason: "Balance too low to trade safely", confidence: 1 }
  }

  // Strong uptrend — BUY
  if (trend === "UP" && priceChange1m > 0.8 && priceChange5m > 1.5) {
    return {
      type: "BUY",
      reason: `Strong upward momentum — 1m: +${priceChange1m.toFixed(2)}%, 5m: +${priceChange5m.toFixed(2)}%`,
      confidence: Math.min(0.9, 0.5 + priceChange5m / 10),
    }
  }

  // Trend up but weaker signal
  if (trend === "UP" && priceChange1m > 0.3) {
    return {
      type: "BUY",
      reason: `Moderate uptrend detected — price rising ${priceChange1m.toFixed(2)}% over 1m`,
      confidence: 0.55,
    }
  }

  // Strong downtrend — SELL
  if (trend === "DOWN" && priceChange1m < -0.8 && priceChange5m < -1.5) {
    return {
      type: "SELL",
      reason: `Downtrend accelerating — 1m: ${priceChange1m.toFixed(2)}%, 5m: ${priceChange5m.toFixed(2)}%`,
      confidence: Math.min(0.9, 0.5 + Math.abs(priceChange5m) / 10),
    }
  }

  // High volatility — sit out
  if (volatility === "HIGH") {
    return {
      type: "HOLD",
      reason: `High volatility detected — waiting for cleaner signal (stdDev elevated)`,
      confidence: 0.7,
    }
  }

  return {
    type: "HOLD",
    reason: `Sideways market — no clear momentum signal (trend: ${trend}, 1m: ${priceChange1m.toFixed(2)}%)`,
    confidence: 0.6,
  }
}