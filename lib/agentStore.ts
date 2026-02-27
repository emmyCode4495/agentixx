// import { getBalanceSOL } from "./solana"
// import { createAgentWallet } from "./wallet/factory"
// import { WalletEngine } from "./wallet/engine"
// import { createAgentInstance } from "./agents/registry"

// import {
//   Connection,
//   PublicKey,
//   SystemProgram,
//   Transaction,
//   sendAndConfirmTransaction,
//   Keypair,
//   LAMPORTS_PER_SOL,
// } from "@solana/web3.js"

// // ── Master wallet funding helper ──────────────────────────────────
// async function fundFromMasterWallet(recipientPubKey: string): Promise<void> {
//   const raw = process.env.MASTER_WALLET
//   if (!raw) throw new Error("MASTER_WALLET not set in .env.local")

//   const bytes = JSON.parse(raw) as number[]
//   if (!Array.isArray(bytes) || bytes.length !== 64) {
//     throw new Error("MASTER_WALLET must be a JSON array of 64 numbers")
//   }

//   const masterKeypair = Keypair.fromSecretKey(Uint8Array.from(bytes))
//   const connection = new Connection("https://api.devnet.solana.com", "confirmed")

//   const masterBalance = await connection.getBalance(masterKeypair.publicKey)
//   if (masterBalance < 1.05 * LAMPORTS_PER_SOL) {
//     throw new Error(
//       `Master wallet low on funds (${(masterBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL). ` +
//       `Fund it at faucet.solana.com: ${masterKeypair.publicKey.toBase58()}`
//     )
//   }

//   const recipientBalance = await connection.getBalance(new PublicKey(recipientPubKey))
//   if (recipientBalance >= 1 * LAMPORTS_PER_SOL) return

//   const tx = new Transaction().add(
//     SystemProgram.transfer({
//       fromPubkey: masterKeypair.publicKey,
//       toPubkey: new PublicKey(recipientPubKey),
//       lamports: 1 * LAMPORTS_PER_SOL,
//     })
//   )

//   await sendAndConfirmTransaction(connection, tx, [masterKeypair], { commitment: "confirmed" })
// }

// // ── Types ─────────────────────────────────────────────────────────

// export type AgentStatus =
//   | "initializing"
//   | "funded"
//   | "running"
//   | "idle"
//   | "error"

// export type TradeType = "BUY" | "SELL" | "HOLD"

// export interface TradeRecord {
//   id: string
//   type: "BUY" | "SELL" | "HOLD"
//   amountSOL: number
//   price: number
//   signature?: string
//   timestamp: string
//   reason: string
// }

// export interface AgentRecord {
//   id: string
//   publicKey: string
//   status: AgentStatus
//   balanceSOL: number
//   pnl: number
//   lastUpdated: string
//   trades: TradeRecord[]
//   error?: string
// }

// // ── Agent IDs ─────────────────────────────────────────────────────

// const AGENT_IDS = ["alpha-trader", "beta-hodler", "gamma-arbitrage"]

// // ── Store Shape ───────────────────────────────────────────────────

// interface Store {
//   agents:       Map<string, AgentRecord>
//   engines:      Map<string, WalletEngine>
//   initialized:  boolean
//   initializing: boolean
// }

// const g = globalThis as typeof globalThis & { __agentStore?: Store }

// if (!g.__agentStore) {
//   g.__agentStore = {
//     agents:       new Map(),
//     engines:      new Map(),
//     initialized:  false,
//     initializing: false,
//   }
// }

// const store = g.__agentStore

// // ── Initialization ────────────────────────────────────────────────

// export async function ensureAgentsInitialized(): Promise<void> {
//   if (store.initialized || store.initializing) return
//   store.initializing = true

//   console.log("[AgentStore] Booting agents...")

//   for (const id of AGENT_IDS) {
//     const { keypair, stored } = createAgentWallet(id)

//     const engine = new WalletEngine(keypair)
//     store.engines.set(id, engine)

//     const record: AgentRecord = {
//       id,
//       publicKey:   stored.publicKey,
//       status:      "initializing",
//       balanceSOL:  0,
//       pnl:         0,
//       trades:      [],
//       lastUpdated: new Date().toISOString(),
//     }

//     store.agents.set(id, record)

//     try {
//       console.log(`[AgentStore] Funding ${id} from master wallet...`)
//       await fundFromMasterWallet(stored.publicKey)
//       const balance = await getBalanceSOL(stored.publicKey)
//       record.balanceSOL = balance
//       record.status     = "funded"
//       console.log(`[AgentStore] ${id} funded: ${balance} SOL`)
//     } catch (err) {
//       record.status = "idle"
//       record.error  = err instanceof Error ? err.message : "Funding failed"
//       console.warn(`[AgentStore] Could not auto-fund ${id}:`, record.error)
//     }

//     record.lastUpdated = new Date().toISOString()
//     store.agents.set(id, record)
//   }

//   store.initialized  = true
//   store.initializing = false

//   console.log("[AgentStore] All agents initialized.")
// }

// // ── Execution (Autonomous Call) ───────────────────────────────────

// export async function executeAgent(id: string) {
//   const record = store.agents.get(id)
//   if (!record) throw new Error(`Agent ${id} not found`)

//   // registry.ts builds the WalletEngine internally from the stored keypair
//   const agent = createAgentInstance(id)

//   record.status = "running"
//   store.agents.set(id, record)

//   try {
//     await agent.decide()

//     // Refresh balance via the engine the registry wired up
//     const engine = store.engines.get(id)
//     if (engine) {
//       record.balanceSOL = await engine.getBalance()
//     }
//     record.status = "idle"
//   } catch (err) {
//     record.status = "error"
//     record.error  = err instanceof Error ? err.message : "Execution failed"
//   }

//   record.lastUpdated = new Date().toISOString()
//   store.agents.set(id, record)
// }

// // ── Getters ───────────────────────────────────────────────────────

// export function getAllAgents(): AgentRecord[] {
//   return Array.from(store.agents.values())
// }

// export function getAgent(id: string): AgentRecord | undefined {
//   return store.agents.get(id)
// }

// export function getEngine(id: string): WalletEngine | undefined {
//   return store.engines.get(id)
// }

// export function getKeypair(id: string) {
//   return store.engines.get(id)?.keypair
// }

// export function isInitialized(): boolean {
//   return store.initialized
// }

// export function isInitializing(): boolean {
//   return store.initializing
// }

// // ── State / Wallet Helpers ────────────────────────────────────────

// export function setAgentStatus(id: string, status: AgentStatus): void {
//   const agent = store.agents.get(id)
//   if (!agent) return
//   agent.status      = status
//   agent.lastUpdated = new Date().toISOString()
//   store.agents.set(id, agent)
// }

// export async function refreshBalance(id: string): Promise<number> {
//   const engine = store.engines.get(id)
//   const agent  = store.agents.get(id)
//   if (!engine || !agent) throw new Error(`Agent ${id} not found`)
//   const balance     = await engine.getBalance()
//   agent.balanceSOL  = balance
//   agent.lastUpdated = new Date().toISOString()
//   store.agents.set(id, agent)
//   return balance
// }

// export function recordTrade(id: string, trade: TradeRecord): void {
//   const agent = store.agents.get(id)
//   if (!agent) return
//   if (!agent.trades) agent.trades = []

//   agent.trades.unshift(trade)
//   if (agent.trades.length > 50) agent.trades = agent.trades.slice(0, 50)

//   const delta =
//     trade.type === "SELL" ?  trade.amountSOL * 0.8 :
//     trade.type === "BUY"  ? -trade.amountSOL        : 0

//   agent.pnl         = +(agent.pnl + delta).toFixed(6)
//   agent.lastUpdated = new Date().toISOString()
//   store.agents.set(id, agent)
// }

/**
 * lib/agentStore.ts
 * Vercel-compatible persistent agent store backed by Vercel KV (Redis).
 *
 * WHY: Vercel serverless functions are stateless — globalThis is wiped on
 * every cold start. Vercel KV persists data across all function invocations.
 *
 * SETUP (one-time):
 *   1. vercel.com → your project → Storage tab → Create KV database → Connect
 *   2. `vercel env pull .env.local`  (adds KV_URL, KV_REST_API_URL, etc.)
 *   3. `npm install @vercel/kv`
 *   That's it — no other changes needed.
 *
 * Place at: lib/agentStore.ts  (replaces your existing file)
 */

import { kv } from "@vercel/kv"
import { getBalanceSOL } from "./solana"
import { createAgentWallet } from "./wallet/factory"

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js"

// ── Types ─────────────────────────────────────────────────────────

export type AgentStatus =
  | "initializing"
  | "funded"
  | "running"
  | "idle"
  | "error"

export type TradeType = "BUY" | "SELL" | "HOLD"

export interface TradeRecord {
  id: string
  type: "BUY" | "SELL" | "HOLD"
  amountSOL: number
  price: number
  signature?: string
  timestamp: string
  reason: string
}

export interface AgentRecord {
  id: string
  publicKey: string
  status: AgentStatus
  balanceSOL: number
  pnl: number
  trades: TradeRecord[]
  lastUpdated: string
  error?: string
}

// ── KV key helpers ────────────────────────────────────────────────

const KEY_AGENT     = (id: string) => `agent:${id}`
const KEY_INIT_DONE = "agents:initialized"
const KEY_ALL_IDS   = "agents:ids"

const AGENT_IDS = ["alpha-trader", "beta-hodler", "gamma-arbitrage"]

// ── Master wallet funding ─────────────────────────────────────────

async function fundFromMasterWallet(recipientPubKey: string): Promise<void> {
  const raw = process.env.MASTER_WALLET
  if (!raw) throw new Error("MASTER_WALLET not set in .env.local")

  const bytes = JSON.parse(raw) as number[]
  if (!Array.isArray(bytes) || bytes.length !== 64) {
    throw new Error("MASTER_WALLET must be a JSON array of 64 numbers")
  }

  const masterKeypair = Keypair.fromSecretKey(Uint8Array.from(bytes))
  const connection    = new Connection("https://api.devnet.solana.com", "confirmed")

  const masterBalance = await connection.getBalance(masterKeypair.publicKey)
  if (masterBalance < 1.05 * LAMPORTS_PER_SOL) {
    throw new Error(
      `Master wallet low on funds (${(masterBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL). ` +
      `Fund at faucet.solana.com: ${masterKeypair.publicKey.toBase58()}`
    )
  }

  const recipientBalance = await connection.getBalance(new PublicKey(recipientPubKey))
  if (recipientBalance >= 1 * LAMPORTS_PER_SOL) return   // already funded

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: masterKeypair.publicKey,
      toPubkey:   new PublicKey(recipientPubKey),
      lamports:   1 * LAMPORTS_PER_SOL,
    })
  )

  await sendAndConfirmTransaction(connection, tx, [masterKeypair], { commitment: "confirmed" })
}

// ── Initialization ────────────────────────────────────────────────
//
// On Vercel, multiple requests can race to initialize simultaneously.
// We use a KV atomic SET NX ("set if not exists") as a distributed lock.

export async function ensureAgentsInitialized(): Promise<void> {
  // Fast path: already initialized
  const done = await kv.get<boolean>(KEY_INIT_DONE)
  if (done) return

  // Distributed lock: only the first function instance proceeds.
  // `set` with NX returns "OK" if the key was set, null if it already existed.
  const lock = await kv.set("agents:init:lock", "1", { nx: true, ex: 120 })
  if (!lock) {
    // Another instance is initializing — wait for it to finish (up to 30s)
    for (let i = 0; i < 30; i++) {
      await sleep(1000)
      const ready = await kv.get<boolean>(KEY_INIT_DONE)
      if (ready) return
    }
    return  // Give up waiting; agents will initialize on the next request
  }

  try {
    console.log("[AgentStore] Initializing agents in KV...")

    await kv.set(KEY_ALL_IDS, AGENT_IDS)

    for (const id of AGENT_IDS) {
      // Check if agent already exists in KV (e.g. re-deploy without clearing KV)
      const existing = await kv.get<AgentRecord>(KEY_AGENT(id))
      if (existing) {
        console.log(`[AgentStore] ${id} already in KV, skipping creation`)
        continue
      }

      const { stored } = createAgentWallet(id)

      const record: AgentRecord = {
        id,
        publicKey:   stored.publicKey,
        status:      "initializing",
        balanceSOL:  0,
        pnl:         0,
        trades:      [],
        lastUpdated: new Date().toISOString(),
      }

      await kv.set(KEY_AGENT(id), record)

      try {
        console.log(`[AgentStore] Funding ${id}...`)
        await fundFromMasterWallet(stored.publicKey)
        const balance = await getBalanceSOL(stored.publicKey)
        record.balanceSOL = balance
        record.status     = "funded"
        console.log(`[AgentStore] ${id} funded: ${balance} SOL`)
      } catch (err) {
        record.status = "idle"
        record.error  = err instanceof Error ? err.message : "Funding failed"
        console.warn(`[AgentStore] Could not fund ${id}:`, record.error)
      }

      record.lastUpdated = new Date().toISOString()
      await kv.set(KEY_AGENT(id), record)
    }

    await kv.set(KEY_INIT_DONE, true)
    console.log("[AgentStore] All agents initialized and persisted to KV.")
  } finally {
    await kv.del("agents:init:lock")
  }
}

// ── Getters ───────────────────────────────────────────────────────

export async function getAllAgents(): Promise<AgentRecord[]> {
  const ids = (await kv.get<string[]>(KEY_ALL_IDS)) ?? AGENT_IDS
  const records = await Promise.all(ids.map((id) => kv.get<AgentRecord>(KEY_AGENT(id))))
  return records.filter((r): r is AgentRecord => r !== null)
}

export async function getAgent(id: string): Promise<AgentRecord | null> {
  return kv.get<AgentRecord>(KEY_AGENT(id))
}

export function isInitialized(): Promise<boolean> {
  return kv.get<boolean>(KEY_INIT_DONE).then(Boolean)
}

export function isInitializing(): Promise<boolean> {
  return kv.get<string>("agents:init:lock").then(Boolean)
}

// ── Keypair helper ────────────────────────────────────────────────
// Keypairs are derived deterministically from the agent ID + WALLET_SECRET,
// so we never need to store the private key in KV.

export function getKeypair(id: string) {
  const { keypair } = createAgentWallet(id)
  return keypair
}

// ── Mutators ──────────────────────────────────────────────────────

export async function setAgentStatus(id: string, status: AgentStatus): Promise<void> {
  const agent = await getAgent(id)
  if (!agent) return
  agent.status      = status
  agent.lastUpdated = new Date().toISOString()
  await kv.set(KEY_AGENT(id), agent)
}

export async function refreshBalance(id: string): Promise<number> {
  const agent = await getAgent(id)
  if (!agent) throw new Error(`Agent ${id} not found`)
  const balance     = await getBalanceSOL(agent.publicKey)
  agent.balanceSOL  = balance
  agent.lastUpdated = new Date().toISOString()
  await kv.set(KEY_AGENT(id), agent)
  return balance
}

export async function recordTrade(id: string, trade: TradeRecord): Promise<void> {
  const agent = await getAgent(id)
  if (!agent) return

  agent.trades = agent.trades ?? []
  agent.trades.unshift(trade)
  if (agent.trades.length > 50) agent.trades = agent.trades.slice(0, 50)

  const delta =
    trade.type === "SELL" ?  trade.amountSOL * 0.8 :
    trade.type === "BUY"  ? -trade.amountSOL        : 0

  agent.pnl         = +(agent.pnl + delta).toFixed(6)
  agent.lastUpdated = new Date().toISOString()
  await kv.set(KEY_AGENT(id), agent)
}

// ── Utility ───────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}