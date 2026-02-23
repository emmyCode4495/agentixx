# SKILLS.md — Agentixx Agent Skills Specification

This file defines the operational abilities, constraints, and execution contract
for autonomous AI agents in the Agentixx framework.

Agents **MUST** read this file to understand:
- What actions they can perform
- How to call the wallet API
- Security rules and spending constraints
- The full execution lifecycle
- How to interpret agent state

---

## Core Agent Capabilities

### 1. Wallet Management

Each agent owns exactly one Solana keypair. Agents can:

- Generate a new ed25519 keypair via `Keypair.generate()` (256-bit entropy, OS CSPRNG)
- Load their encrypted keystore from `.agent-keystore/{id}.json`
- Sign transactions autonomously — no UI prompt, no human approval
- Expose their public key for on-chain lookups

Private keys are **never** accessible outside `WalletEngine`. Agents interact with
their wallet exclusively through the API endpoints below.

### 2. Network Interaction

Agents connect to **Solana Devnet** via a shared RPC connection singleton.

Agents can:
- Fetch their live SOL balance from devnet RPC
- Fetch recent transaction signatures (up to 15)
- Request a 1 SOL devnet airdrop
- Broadcast signed transactions with `confirmed` commitment

### 3. Trade Execution

Agents can execute three action types:

| Action | On-chain behaviour | Explorer link |
|--------|--------------------|---------------|
| `BUY`  | Real `SystemProgram.transfer` — agent → DEX treasury (0.01 SOL) | ✅ Verifiable signature |
| `SELL` | Real `TransactionInstruction` via Memo program — signs JSON trade record with full LLM reasoning | ✅ Verifiable signature |
| `HOLD` | No transaction — decision recorded in agent history only | — |

### 4. Price Oracle

Agents fetch a **live SOL/USD price** from the **Pyth Network Hermes REST API**
before every trade decision. No API key is required.

- Feed ID: `0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d`
- Endpoint: `https://hermes.pyth.network/v2/updates/price/latest`
- Timeout: 5 seconds
- Fallback: simulated price in the `$130–$210` range if Pyth is unreachable

The price source (`"pyth"` or `"simulated"`) is recorded on every trade and
included in the API response as `priceSource`.

### 5. LLM Autonomous Decision Engine

Each trade decision is made by **Groq's `llama-3.1-8b-instant`** model using
live market context. The LLM receives:

- Live SOL/USD price and confidence interval (from Pyth)
- Agent's current SOL balance and tradeable amount (after fee reserve)
- Total trade count and cumulative P&L
- Price source (`pyth` or `simulated`)

The model returns a structured JSON decision:

```json
{ "decision": "BUY" | "SELL" | "HOLD", "reason": "<1-2 sentences>" }
```

If `GROQ_API_KEY` is not set, or if the Groq endpoint fails, the agent
automatically falls back to the **rule-based strategy** (see below). The
`decisionSource` field in the trade response indicates which path was taken:
`"llm"` or `"rule-based"`.

### 6. Rule-Based Fallback Strategy

When the LLM is unavailable, agents fall back to a deterministic momentum strategy:

```
price < $150  AND balance ≥ 0.06 SOL  →  BUY   (undervalued signal)
price > $200                           →  SELL  (take-profit signal)
otherwise                              →  HOLD
```

This fallback is also used as the baseline to verify LLM behaviour — if the
agent consistently HOLDs near current SOL prices (~$170–$190), the LLM and
fallback are in agreement, not broken.

---

## Wallet Funding

Agents are funded automatically on first boot from a **master wallet** defined
in `.env.local` as `MASTER_WALLET` (a JSON array of 64 bytes).

- Each agent receives **1 SOL** from the master wallet if its balance is below 1 SOL
- The master wallet must hold at least **1.05 SOL** before boot or initialization will fail
- If auto-funding fails, the agent falls back to `"idle"` status and logs the reason
- Manual top-up is available via `POST /api/agents/:id/airdrop`

---

## API Contract

All agent actions are exposed as HTTP endpoints under `/api/agents/:id/`.

### Get fleet status

```
GET /api/agents
```

Response:

```json
{
  "ok": true,
  "initialized": true,
  "initializing": false,
  "agents": [
    {
      "id": "alpha-trader",
      "publicKey": "9WzDXwBb...",
      "status": "idle",
      "balanceSOL": 0.9412,
      "tradeCount": 7,
      "pnl": -0.02,
      "lastTrade": { ... },
      "lastUpdated": "2026-02-19T12:00:00Z",
      "error": null,
      "explorerUrl": "https://explorer.solana.com/address/9WzDXwBb...?cluster=devnet"
    }
  ]
}
```

Notes:
- `initialized` and `initializing` flags indicate boot state
- `lastTrade` is the most recent `TradeRecord` or `null`
- Balances are refreshed from devnet RPC on every GET call

### Execute a trade

```
POST /api/agents/:id/trade
Content-Type: application/json

{}                         ← fully autonomous: LLM picks type + reason
{ "type": "BUY" }         ← manual override: forces type, LLM still writes reason
{ "type": "SELL" }
{ "type": "HOLD" }
```

Response:

```json
{
  "ok": true,
  "trade": {
    "id": "alpha-trader-1708340400000",
    "type": "BUY",
    "amountSOL": 0.01,
    "price": 172.45,
    "signature": "4xK9mP2...zW2p",
    "timestamp": "2026-02-19T12:00:00Z",
    "reason": "SOL is trading below recent averages with moderate confidence — entering small position"
  },
  "newBalanceSOL": 0.9312,
  "priceSource": "pyth",
  "decisionSource": "llm",
  "explorerUrl": "https://explorer.solana.com/tx/4xK9mP2...zW2p?cluster=devnet"
}
```

Key response fields:

| Field | Values | Meaning |
|-------|--------|---------|
| `priceSource` | `"pyth"` \| `"simulated"` | Whether live Pyth data was used |
| `decisionSource` | `"llm"` \| `"rule-based"` | Whether Groq LLM made the call |
| `explorerUrl` | URL or `null` | Present for BUY and SELL; null for HOLD |

For **manual overrides**, the `reason` field is prefixed with `[Manual BUY/SELL/HOLD]`
followed by the LLM's contextual reasoning for that market state.

For **SELL** trades, the full decision context is recorded on-chain via a signed
Memo instruction in this format:

```json
{
  "action": "SELL",
  "agent": "alpha-trader",
  "price": "172.45",
  "amt": 0.01,
  "src": "pyth",
  "decision": "llm",
  "reason": "...",
  "ts": "2026-02-19T12:00:00Z"
}
```

### Start / stop autonomous loop

```
POST /api/agents/:id/loop
Content-Type: application/json

{ "action": "start" | "stop" }
```

When started, the loop fires every **15 seconds**. Each tick:
1. Checks live balance — halts if below `MIN_BALANCE_SOL = 0.05`
2. Fetches live SOL/USD price from Pyth Network
3. Calls `getLLMDecision()` with full market + agent context
4. Falls back to `getRuleBasedDecision()` if Groq is unavailable
5. Executes the resulting BUY / SELL / HOLD via the trade route

### Request airdrop

```
POST /api/agents/:id/airdrop
```

Requests 1 SOL from Solana devnet faucet. Rate-limited by the network —
stagger requests across agents to avoid 429 errors.

### Get transaction history

```
GET /api/agents/:id/history
```

Returns up to 15 recent confirmed transaction signatures fetched directly
from devnet RPC — not from local cache.

---

## Execution Lifecycle

```
initialize → fund → idle → running → idle → ...
                                   ↘ error (on RPC failure or insufficient funds)
```

| Status | Meaning |
|--------|---------|
| `initializing` | Keypair being generated, keystore being written, master wallet funding in progress |
| `funded` | Master wallet transfer confirmed, agent ready to trade |
| `running` | Currently executing a trade cycle |
| `idle` | Loop paused — balance too low, loop stopped manually, or funding failed gracefully |
| `error` | Unrecoverable failure — check `agent.error` field |

Agents transition automatically between `running` and `idle`.
Only `error` requires manual intervention (airdrop + loop restart).

---

## Strategy Interface

All agents extend `BaseAgent` and implement `decide()`:

```ts
export interface MarketState {
  price:      number    // live SOL/USD from Pyth, or simulated fallback
  confidence: number    // Pyth confidence interval in USD
  source:     "pyth" | "simulated"
  timestamp?: string
}

export interface TradeDecision {
  type:   "BUY" | "SELL" | "HOLD"
  reason: string        // written by LLM or rule engine; logged on-chain for SELL
  source: "llm" | "rule-based"
}

export abstract class BaseAgent {
  abstract decide(): Promise<void>
}
```

### LLM strategy (default — all agents)

The default strategy sends live market context to Groq and parses a structured
JSON response. Key constraints enforced in the prompt:

```
BUY costs exactly 0.01 SOL
Agent cannot BUY if (balance - 0.05 reserve) < 0.01
Agent reasons only from provided data — no hallucinated trends
```

### Rule-based fallback strategy

```
price < $150  AND balance ≥ 0.06 SOL  →  BUY
price > $200                           →  SELL
otherwise                              →  HOLD
```

Activated automatically when `GROQ_API_KEY` is absent or Groq returns an error.

---

## Security Constraints

Agents operate within strict boundaries enforced by `WalletEngine`:

- **No raw key access** — private keys never leave `WalletEngine`
- **Policy check** — every transaction passes `validateTransaction(tx)` before signing
- **Simulation first** — all transactions are dry-run on devnet before broadcast
- **Minimum reserve** — agents halt when balance drops below `0.05 SOL`
- **Per-agent isolation** — no agent can read or modify another agent's keystore
- **No plaintext logging** — keypairs are excluded from all log output and JSON serialisation
- **Master wallet isolation** — master keypair is used only for initial funding transfers and is never stored in agent state

Encryption spec:

```
Algorithm : AES-256-GCM
KDF       : scrypt  (N=32768, r=8, p=1)
Salt      : "agentw-salt-v1"  (static — rotate in production)
IV        : 12 random bytes, regenerated on every keystore write
Auth tag  : 16 bytes — detects any tampering before decryption
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MASTER_WALLET` | ✅ | JSON array of 64 bytes — master Solana keypair for agent funding |
| `GROQ_API_KEY` | ⚠️ | Groq API key for LLM decisions. Falls back to rule-based if absent |

Without `MASTER_WALLET`, agents cannot be funded on boot and will start in `"idle"` state.
Without `GROQ_API_KEY`, agents still trade but use the rule-based fallback exclusively.

---

## Agent IDs

The following agent IDs are registered in the current fleet:

| ID | Strategy |
|----|----------|
| `alpha-trader` | LLM (Groq llama-3.1-8b-instant) + rule-based fallback |
| `beta-hodler` | LLM (Groq llama-3.1-8b-instant) + rule-based fallback |
| `gamma-arbitrage` | LLM (Groq llama-3.1-8b-instant) + rule-based fallback |

To add a new agent, register its ID in `lib/agentStore.ts` and add a
`case` to `lib/agents/registry.ts`.

---

## Verifying LLM Communication

To confirm Groq is being reached and not falling back silently, check the following:

**Server logs** — one of these lines will appear on every trade:
```
[Groq] alpha-trader → BUY: <reason>        ← LLM reached successfully
[LLM] GROQ_API_KEY not set — rule-based fallback
[Groq] Failed (Groq HTTP 401: ...) — rule-based fallback
```

**Trade response** — the `decisionSource` field confirms the path taken:
```json
{ "decisionSource": "llm" }       ← Groq responded
{ "decisionSource": "rule-based" } ← fallback was used
```

**Why HOLD is the most common decision** — SOL currently trades around $170–$190,
which sits between the rule-based BUY threshold ($150) and SELL threshold ($200).
The LLM mirrors this neutral stance. This is expected behaviour, not a bug.

---

## Devnet Notes

- RPC endpoint: `https://api.devnet.solana.com`
- Airdrop limit: 1 SOL per request, rate-limited by the network
- Blockhash expiry: ~90 seconds — agents fetch a fresh blockhash per transaction
- Master wallet top-up: `https://faucet.solana.com` (use master wallet public key)
- All signatures verifiable at: `https://explorer.solana.com/?cluster=devnet`