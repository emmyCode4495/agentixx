/**
 * lib/agents/market.ts
 * Simulated market price feed.
 * In production, replace with Pyth or Switchboard oracle.
 *
 * Generates a realistic price series with trend, volatility,
 * and mean-reversion so agent strategies have something to react to.
 */

export interface MarketState {
  price: number          // current simulated token price (USD)
  priceChange1m: number  // % change over last minute
  priceChange5m: number  // % change over last 5 minutes
  trend: "UP" | "DOWN" | "SIDEWAYS"
  volatility: "LOW" | "MEDIUM" | "HIGH"
  volume: number         // simulated volume
  timestamp: string
}

// ── Shared price history (server singleton) ───────────────────────
const g = globalThis as typeof globalThis & {
  __marketHistory?: number[]
  __marketTrend?: number  // -1 to 1 drift
  __marketTrendTtl?: number
}

if (!g.__marketHistory) {
  g.__marketHistory = Array.from({ length: 60 }, () => 40 + Math.random() * 20)
  g.__marketTrend = (Math.random() - 0.5) * 0.4
  g.__marketTrendTtl = 20
}

function tick(): number {
  const history = g.__marketHistory!

  // Refresh trend direction every ~20 ticks
  g.__marketTrendTtl! -= 1
  if (g.__marketTrendTtl! <= 0) {
    g.__marketTrend = (Math.random() - 0.5) * 0.6
    g.__marketTrendTtl = 15 + Math.floor(Math.random() * 20)
  }

  const last = history[history.length - 1]!
  const drift = g.__marketTrend! * 0.3
  const noise = (Math.random() - 0.5) * 2.5
  const meanReversion = (50 - last) * 0.02  // pull toward 50

  const next = Math.max(5, Math.min(120, last + drift + noise + meanReversion))
  history.push(next)

  // Keep last 300 ticks (~5 minutes at 1s intervals)
  if (history.length > 300) history.shift()

  return next
}

export function getMarketState(): MarketState {
  const price = tick()
  const history = g.__marketHistory!

  // 1-minute change (last 12 ticks if called every ~5s)
  const price1mAgo = history[Math.max(0, history.length - 12)] ?? price
  const price5mAgo = history[Math.max(0, history.length - 60)] ?? price

  const priceChange1m = ((price - price1mAgo) / price1mAgo) * 100
  const priceChange5m = ((price - price5mAgo) / price5mAgo) * 100

  // Trend
  let trend: MarketState["trend"] = "SIDEWAYS"
  if (priceChange5m > 1.5) trend = "UP"
  else if (priceChange5m < -1.5) trend = "DOWN"

  // Volatility — standard deviation of last 20 ticks
  const recent = history.slice(-20)
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length
  const variance = recent.reduce((a, b) => a + (b - mean) ** 2, 0) / recent.length
  const stdDev = Math.sqrt(variance)
  let volatility: MarketState["volatility"] = "LOW"
  if (stdDev > 4) volatility = "HIGH"
  else if (stdDev > 2) volatility = "MEDIUM"

  return {
    price: +price.toFixed(4),
    priceChange1m: +priceChange1m.toFixed(4),
    priceChange5m: +priceChange5m.toFixed(4),
    trend,
    volatility,
    volume: +(500 + Math.random() * 2000).toFixed(0),
    timestamp: new Date().toISOString(),
  }
}