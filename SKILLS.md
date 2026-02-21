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
| `SELL` | Real `TransactionInstruction` via Memo program — signs JSON trade record | ✅ Verifiable signature |
| `HOLD` | No transaction — decision recorded in agent history only | — |

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
  "agents": [
    {
      "id": "alpha-trader",
      "publicKey": "9WzDXwBb...",
      "status": "running",
      "balanceSOL": 0.9412,
      "tradeCount": 7,
      "pnl": -0.02,
      "lastUpdated": "2026-02-19T12:00:00Z",
      "explorerUrl": "https://explorer.solana.com/address/9WzDXwBb...?cluster=devnet"
    }
  ]
}
```

### Execute a trade

```
POST /api/agents/:id/trade
Content-Type: application/json

{ "type": "BUY" | "SELL" | "HOLD" }
```

Response:

```json
{
  "ok": true,
  "trade": {
    "id": "alpha-trader-1708340400000",
    "type": "BUY",
    "amountSOL": 0.01,
    "price": 34.72,
    "signature": "4xK9mP2...zW2p",
    "timestamp": "2026-02-19T12:00:00Z",
    "reason": "Price 34.72 below momentum threshold — entering position"
  },
  "newBalanceSOL": 0.9312,
  "explorerUrl": "https://explorer.solana.com/tx/4xK9mP2...zW2p?cluster=devnet"
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
2. Reads price from `getMarketState()`
3. Calls `agent.strategy(market, balance)` — the AI decision layer
4. Executes the resulting BUY / SELL / HOLD via the trade route

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
| `initializing` | Keypair being generated, keystore being written |
| `funded` | Airdrop confirmed, agent ready to trade |
| `running` | Currently executing a trade cycle |
| `idle` | Loop paused — balance too low or loop stopped manually |
| `error` | Unrecoverable failure — check `agent.error` field |

Agents transition automatically between `running` and `idle`.
Only `error` requires manual intervention (airdrop + loop restart).

---

## Strategy Interface

All agents extend `BaseAgent` and implement `strategy()`:

```ts
export interface MarketState {
  price:      number   // simulated asset price (20–100 range)
  volume?:    number
  timestamp?: string
}

export interface TradeDecision {
  type:   "BUY" | "SELL" | "HOLD"
  reason: string       // human-readable explanation logged on-chain for SELL
}

export abstract class BaseAgent {
  abstract strategy(market: MarketState, balanceSOL: number): TradeDecision
}
```

### Default strategy (TraderAgent — momentum rules)

```
price < 40  →  BUY   (undervalued signal)
price > 70  →  SELL  (take-profit signal)
otherwise   →  HOLD
```

To replace with an LLM-driven strategy, implement `strategy()` with an
API call to OpenAI, Anthropic, or any inference endpoint. The wallet
execution layer beneath it stays identical.

---

## Security Constraints

Agents operate within strict boundaries enforced by `WalletEngine`:

- **No raw key access** — private keys never leave `WalletEngine`
- **Policy check** — every transaction passes `validateTransaction(tx)` before signing
- **Simulation first** — all transactions are dry-run on devnet before broadcast
- **Minimum reserve** — agents halt when balance drops below `0.05 SOL`
- **Per-agent isolation** — no agent can read or modify another agent's keystore
- **No plaintext logging** — keypairs are excluded from all log output and JSON serialisation

Encryption spec:

```
Algorithm : AES-256-GCM
KDF       : scrypt  (N=32768, r=8, p=1)
Salt      : "agentw-salt-v1"  (static — rotate in production)
IV        : 12 random bytes, regenerated on every keystore write
Auth tag  : 16 bytes — detects any tampering before decryption
```

---

## Agent IDs

The following agent IDs are registered in the current fleet:

| ID | Strategy |
|----|----------|
| `alpha-trader` | Momentum (TraderAgent) |
| `beta-hodler` | Momentum (TraderAgent) |
| `gamma-arbitrage` | Momentum (TraderAgent) |

To add a new agent, register its ID in `lib/agentStore.ts` and add a
`case` to `lib/agents/registry.ts`.

---

## Devnet Notes

- RPC endpoint: `https://api.devnet.solana.com`
- Airdrop limit: 1 SOL per request, rate-limited by the network
- Blockhash expiry: ~90 seconds — agents fetch a fresh blockhash per transaction
- All signatures verifiable at: `https://explorer.solana.com/?cluster=devnet`