/**
 * lib/agentStore.ts
 * Server-side in-memory store for agent wallets and their state.
 * In production, replace with a database (Redis, Postgres, etc.)
 *
 * The store is a global singleton — persists across API route calls
 * within the same Next.js server process.
 */

import { Keypair } from "@solana/web3.js"
import {
  createAgentWallet,
  getBalanceSOL,
  requestAirdrop,
  type StoredWallet,
} from "./solana"

// ── Types ─────────────────────────────────────────────────────────
export type AgentStatus = "initializing" | "funded" | "running" | "idle" | "error"
export type TradeType = "BUY" | "SELL" | "HOLD"

export interface TradeRecord {
  id: string
  type: TradeType
  amountSOL: number
  price: number
  signature?: string
  timestamp: string
  reason: string
}

export interface AgentRecord {
  id: string
  publicKey: string
  stored: StoredWallet
  status: AgentStatus
  balanceSOL: number
  trades: TradeRecord[]
  lastUpdated: string
  pnl: number
  error?: string
}

// ── In-memory store ───────────────────────────────────────────────
const AGENT_IDS = ["alpha-trader", "beta-hodler", "gamma-arbitrage"]

interface Store {
  agents: Map<string, AgentRecord>
  keypairs: Map<string, Keypair>
  initialized: boolean
  initializing: boolean
}

// Attach to globalThis so it survives Next.js hot reloads in dev
const g = globalThis as typeof globalThis & { __agentStore?: Store }
if (!g.__agentStore) {
  g.__agentStore = {
    agents: new Map(),
    keypairs: new Map(),
    initialized: false,
    initializing: false,
  }
}
const store = g.__agentStore

// ── Initialize agents ─────────────────────────────────────────────
export async function ensureAgentsInitialized(): Promise<void> {
  if (store.initialized || store.initializing) return
  store.initializing = true

  console.log("[AgentStore] Initializing agents on Solana devnet...")

  const results = await Promise.allSettled(
    AGENT_IDS.map(async (id) => {
      const { keypair, stored } = createAgentWallet(id)

      const record: AgentRecord = {
        id,
        publicKey: stored.publicKey,
        stored,
        status: "initializing",
        balanceSOL: 0,
        trades: [],
        lastUpdated: new Date().toISOString(),
        pnl: 0,
      }

      store.agents.set(id, record)
      store.keypairs.set(id, keypair)

      // Request devnet airdrop — non-fatal if rate-limited
      // If this fails, fund the wallet manually at https://faucet.solana.com
      try {
        // Stagger requests (2s apart) to reduce rate-limit hits
        const idx = AGENT_IDS.indexOf(id)
        if (idx > 0) await new Promise((r) => setTimeout(r, idx * 2500))
        console.log(`[AgentStore] Requesting airdrop for ${id} (${stored.publicKey})`)
        await requestAirdrop(stored.publicKey, 1)
        const balance = await getBalanceSOL(stored.publicKey)
        record.balanceSOL = balance
        record.status = "funded"
        console.log(`[AgentStore] ${id} funded: ${balance} SOL`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Airdrop failed"
        const isRateLimit =
          msg.includes("429") ||
          msg.includes("Too Many") ||
          msg.includes("airdrop limit") ||
          msg.includes("Internal error")
        // Agent keypair and wallet are fully ready — just needs SOL to trade
        record.status = "idle"
        record.error = isRateLimit
          ? `Faucet rate-limited — visit faucet.solana.com and paste this key: ${stored.publicKey}`
          : msg
        console.warn(`[AgentStore] Airdrop skipped for ${id}:`, msg)
      }

      record.lastUpdated = new Date().toISOString()
      store.agents.set(id, record)
    })
  )

  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[AgentStore] Failed to init agent ${AGENT_IDS[i]}:`, r.reason)
    }
  })

  store.initialized = true
  store.initializing = false
  console.log("[AgentStore] All agents initialized.")
}

// ── Getters ───────────────────────────────────────────────────────
export function getAllAgents(): AgentRecord[] {
  return Array.from(store.agents.values())
}

export function getAgent(id: string): AgentRecord | undefined {
  return store.agents.get(id)
}

export function getKeypair(id: string): Keypair | undefined {
  return store.keypairs.get(id)
}

// ── Refresh balance from chain ────────────────────────────────────
export async function refreshBalance(id: string): Promise<number> {
  const agent = store.agents.get(id)
  if (!agent) throw new Error(`Agent ${id} not found`)
  const balance = await getBalanceSOL(agent.publicKey)
  agent.balanceSOL = balance
  agent.lastUpdated = new Date().toISOString()
  store.agents.set(id, agent)
  return balance
}

// ── Record a trade ────────────────────────────────────────────────
export function recordTrade(id: string, trade: TradeRecord): void {
  const agent = store.agents.get(id)
  if (!agent) return
  agent.trades.unshift(trade) // newest first
  if (agent.trades.length > 50) agent.trades = agent.trades.slice(0, 50)

  // Update P&L (simplified: SELL = gain, BUY = cost)
  const delta =
    trade.type === "SELL"
      ? trade.amountSOL * 0.8
      : trade.type === "BUY"
      ? -trade.amountSOL
      : 0
  agent.pnl = +(agent.pnl + delta).toFixed(6)
  agent.status = "running"
  agent.lastUpdated = new Date().toISOString()
  store.agents.set(id, agent)
}

export function setAgentStatus(id: string, status: AgentStatus): void {
  const agent = store.agents.get(id)
  if (!agent) return
  agent.status = status
  agent.lastUpdated = new Date().toISOString()
  store.agents.set(id, agent)
}

export function isInitialized(): boolean {
  return store.initialized
}

export function isInitializing(): boolean {
  return store.initializing
}