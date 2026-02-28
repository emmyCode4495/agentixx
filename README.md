# Agentixx — Autonomous AI Agent Wallets on Solana

> A production-grade prototype demonstrating autonomous AI agents that own, manage, and transact with real Solana wallets on devnet — no human intervention required at runtime.

[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet-9945FF?style=flat&logo=solana)](https://explorer.solana.com/?cluster=devnet)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat)](./LICENSE)

---

## What is Agentixx?

Agentixx is a framework for **agentic wallets** — wallets designed specifically for AI agents rather than humans. Each agent in the fleet:

- Generates its own **real ed25519 keypair** on startup
- Stores its private key in an **AES-256-GCM encrypted keystore**
- Is funded automatically from a **master wallet** on first boot
- Fetches a **live SOL/USD price** from the **Pyth Network** oracle before every trade
- Makes **real AI trading decisions** via **Groq's `llama-3.1-8b-instant`** model
- Runs an **autonomous decision loop** that signs and broadcasts real on-chain transactions every 15 seconds
- Persists all agent state to **Upstash Redis** — fully compatible with Vercel's serverless architecture
- Maintains **fully isolated state** — no agent can access another's keys or balance

Every BUY produces a real SOL transfer. Every SELL produces a signed Memo program transaction with the full LLM reasoning recorded on-chain. Every signature is verifiable on [Solana Explorer (devnet)](https://explorer.solana.com/?cluster=devnet).

---

## Live Demo

| Route | Description |
|---|---|
| `/` | Landing page — feature overview |
| `/dashboard` | Live agent dashboard — real-time balances, trades, and on-chain signatures |
| `/about` | Deep dive — wallet design, security model, and AI integration |

---

## Architecture

```
agentixx/
├── app/
│   ├── api/
│   │   └── agents/
│   │       ├── route.ts                  # GET  — agent state + initialization
│   │       └── [id]/
│   │           ├── trade/route.ts        # POST — LLM decision + BUY / SELL / HOLD
│   │           ├── loop/route.ts         # POST — start / stop autonomous loop
│   │           ├── airdrop/route.ts      # POST — master wallet funding
│   │           ├── faucet/route.ts       # POST — devnet faucet airdrop
│   │           ├── execute/route.ts      # POST — trigger autonomous cycle
│   │           └── history/route.ts      # GET  — on-chain tx history
│   ├── dashboard/page.tsx                # Live dashboard UI
│   ├── about/page.tsx                    # Deep dive writeup
│   └── page.tsx                          # Landing page
├── components/
│   └── layout/
│       ├── Navbar.tsx
│       └── Footer.tsx
├── lib/
│   ├── agentStore.ts                     # Persistent agent state via Upstash Redis (KV)
│   ├── solana.ts                         # Connection, sendSOL, sendMemoTransaction
│   └── agents/
│       ├── baseAgent.ts                  # Abstract agent — decide() interface
│       ├── traderAgent.ts                # LLM + rule-based fallback strategy
│       ├── registry.ts                   # Agent factory — wires keypair → WalletEngine
│       ├── loop.ts                       # Autonomous loop manager (globalThis singleton)
│       └── market.ts                     # Pyth Network price oracle + simulated fallback
├── wallet/
│   └── engine.ts                         # WalletEngine — validate → simulate → execute
├── SKILLS.md                             # Machine-readable API + agent spec
├── SECURITY.md                           # Threat model and key management policy
└── .agent-keystore/                      # Auto-generated encrypted wallet files
```

---

## How It Works

### 1. Wallet Creation & Funding

Each agent independently generates a keypair with no shared seed material:

```ts
const keypair = Keypair.generate() // ed25519, 256-bit entropy from OS CSPRNG
```

The private key is immediately encrypted and never stored in plaintext:

```ts
// AES-256-GCM + scrypt KDF — GCM auth tag detects any tampering
const { enc, iv, tag } = encryptKey(secretKeyHex, WALLET_ENCRYPTION_KEY)
```

On first boot, each agent is automatically funded with **1 SOL** transferred from a
master wallet defined in `MASTER_WALLET` in `.env.local`. The master wallet must hold
at least **1.05 SOL** or initialization will fail with a clear error message pointing
to the devnet faucet.

### 2. Persistent State — Upstash Redis

Agent state (balances, trade history, status, P&L) is persisted to **Upstash Redis** via the `@upstash/redis` package. This makes Agentixx fully compatible with **Vercel's serverless architecture** — state survives across cold starts, re-deployments, and concurrent function invocations.

A distributed lock (`SET NX`) prevents race conditions when multiple serverless instances try to initialize agents simultaneously.

```ts
// Only the first function instance proceeds — others wait
const lock = await kv.set("agents:init:lock", "1", { nx: true, ex: 120 })
```

### 3. Live Price Oracle — Pyth Network

Before every trade decision, agents fetch the live SOL/USD price from the
**Pyth Network Hermes REST API** — no API key required:

```ts
// Feed: SOL/USD — same ID on mainnet and devnet via Hermes
const url = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${PYTH_SOL_FEED_ID}`
```

If Pyth is unreachable (timeout or error), agents fall back to a realistic simulated
price in the `$130–$210` range. The `priceSource` field in every trade response
indicates whether live (`"pyth"`) or simulated data was used.

### 4. LLM Autonomous Decision Engine — Groq

Every trade decision is made by **Groq's `llama-3.1-8b-instant`** model via the
OpenAI-compatible API. The agent sends full market context to Groq and receives a
structured JSON decision:

```ts
// Context sent to the LLM on every tick:
{
  price,        // live SOL/USD from Pyth
  confidence,   // Pyth ± interval in USD
  balanceSOL,   // current agent balance
  tradeable,    // balance minus 0.05 SOL fee reserve
  tradeCount,   // total trades executed
  pnl           // cumulative profit/loss in SOL
}

// LLM responds with:
{ "decision": "BUY" | "SELL" | "HOLD", "reason": "<1-2 sentences>" }
```

If `GROQ_API_KEY` is absent or Groq returns an error, agents automatically fall back
to a deterministic rule-based strategy. The `decisionSource` field (`"llm"` or
`"rule-based"`) in every trade response tells you which path was taken.

### 5. Rule-Based Fallback Strategy

```
price < $150  AND balance ≥ 0.06 SOL  →  BUY
price > $200                           →  SELL
otherwise                              →  HOLD
```

### 6. Autonomous Decision Loop

Every 15 seconds, each agent:

1. Checks its live devnet balance — halts if below `0.05 SOL` reserve
2. Fetches live SOL/USD price from Pyth Network
3. Calls `getLLMDecision()` with full market and agent context
4. Falls back to `getRuleBasedDecision()` if Groq is unavailable
5. Executes the decision on-chain via `WalletEngine`
6. Persists the updated trade record and balance to Upstash Redis

### 7. On-Chain Execution

| Action | Transaction type | Explorer link |
|--------|-----------------|---------------|
| BUY | `SystemProgram.transfer` — agent → DEX treasury (0.01 SOL) | ✅ Real signature |
| SELL | `TransactionInstruction` via Memo program — full LLM decision signed on-chain | ✅ Real signature |
| HOLD | No transaction | — |

For SELL trades, the complete decision context is written permanently on-chain:

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

### 8. WalletEngine Safety Layer

Every transaction passes through `WalletEngine.execute()`:

```
validateTransaction(tx)   →  policy check (spending limits, address whitelist)
simulate(tx)              →  dry-run against devnet before committing
sendAndConfirmTransaction →  broadcast with `confirmed` commitment
```

---

## Prerequisites

- **Node.js ≥ 20**
- **npm**, **pnpm**, or **yarn**
- A funded Solana devnet master wallet (for agent auto-funding on boot)
- A [Groq API key](https://console.groq.com) (free — for LLM trade decisions)
- An [Upstash Redis](https://upstash.com) database (free tier — for persistent state)

---

## Installation

```bash
# 1. Clone
git clone https://github.com/emmyCode4495/agentixx.git
cd agentixx

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required — 32-character secret for AES-256-GCM wallet encryption
# Never commit this value to Git
WALLET_ENCRYPTION_KEY=your-32-character-secret-here!!

# Required — JSON array of 64 bytes representing your master Solana keypair
# Used to auto-fund agent wallets on first boot (must hold ≥ 1.05 SOL on devnet)
# Generate with: node -e "const {Keypair}=require('@solana/web3.js');console.log(JSON.stringify(Array.from(Keypair.generate().secretKey)))"
# Fund at: https://faucet.solana.com
MASTER_WALLET=[12,34,56,...]

# Required — Groq API key for LLM trade decisions (free at console.groq.com)
# Without this, agents fall back to the rule-based strategy
GROQ_API_KEY=gsk_...

# Required — Upstash Redis REST credentials for persistent agent state
# Get these from your Upstash dashboard → your database → REST API
KV_REST_API_URL=https://your-db.upstash.io
KV_REST_API_TOKEN=your-upstash-token

# Optional — override the default Solana devnet RPC
SOLANA_RPC_URL=https://api.devnet.solana.com
```

---

## Deploying to Vercel

Agentixx is designed for Vercel. Agent state persists across serverless cold starts via Upstash Redis.

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Link your project
vercel link

# 3. Add env vars in Vercel dashboard:
#    Settings → Environment Variables → add all vars from .env.local
#    Make sure KV_REST_API_URL and KV_REST_API_TOKEN are set for Production

# 4. Deploy
git push  # Vercel auto-deploys on push to main
```

> **Note:** After adding env vars in the Vercel dashboard, you must redeploy for them to take effect. Either push a new commit or click **Redeploy** in the dashboard.

---

## Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

On the first request to `/api/agents`, the server will:

1. Generate keypairs for all configured agents
2. Encrypt and persist keystores to `.agent-keystore/`
3. Transfer 1 SOL to each agent from the master wallet
4. Persist agent records to Upstash Redis
5. Mark agents as `funded` and ready

> **Note:** The master wallet must hold at least 1.05 SOL on devnet before starting.
> Top it up at [faucet.solana.com](https://faucet.solana.com) using its public key.
> If agents show 0 SOL balance after boot, use the ⛽ button in the dashboard to trigger a manual airdrop.

---

## API Reference

### Agents

```
GET  /api/agents                    → fleet status, balances, last trades, decision sources
POST /api/agents/:id/trade          → { type: "BUY" | "SELL" | "HOLD" } or {} for autonomous
POST /api/agents/:id/loop           → { action: "start" | "stop" }
GET  /api/agents/:id/loop           → loop status for agent
POST /api/agents/:id/airdrop        → fund agent from master wallet (1 SOL)
POST /api/agents/:id/faucet         → request 1 SOL from devnet faucet
POST /api/agents/:id/execute        → trigger one autonomous trade cycle
GET  /api/agents/:id/history        → on-chain transaction history
```

### Example — Start the autonomous loop

```bash
curl -X POST http://localhost:3000/api/agents/alpha-trader/loop \
  -H "Content-Type: application/json" \
  -d '{ "action": "start" }'
```

```json
{
  "ok": true,
  "message": "alpha-trader autonomous loop started",
  "running": ["alpha-trader"]
}
```

### Example — Autonomous trade (LLM decides)

```bash
curl -X POST http://localhost:3000/api/agents/alpha-trader/trade \
  -H "Content-Type: application/json" \
  -d '{}'
```

```json
{
  "ok": true,
  "trade": {
    "type": "BUY",
    "amountSOL": 0.01,
    "price": 172.45,
    "signature": "4xK9...zW2p",
    "reason": "SOL is trading below recent averages with moderate confidence — entering small position"
  },
  "newBalanceSOL": 0.9312,
  "priceSource": "pyth",
  "decisionSource": "llm",
  "explorerUrl": "https://explorer.solana.com/tx/4xK9...zW2p?cluster=devnet"
}
```

### Example — Manual trade override

```bash
curl -X POST http://localhost:3000/api/agents/alpha-trader/trade \
  -H "Content-Type: application/json" \
  -d '{ "type": "BUY" }'
```

The trade type is forced to BUY, but the LLM still generates the contextual reason.
The `reason` field will be prefixed with `[Manual BUY]`.

---

## Adding a New Agent

1. Add the agent ID to the `AGENT_IDS` array in `lib/agentStore.ts`
2. Register it in `lib/agents/registry.ts`:

```ts
case "delta-scalper":
  return new TraderAgent(id, wallet)
```

3. Optionally create a new strategy by extending `BaseAgent`:

```ts
export class ScalperAgent extends BaseAgent {
  async decide(): Promise<void> {
    // fetch price, call LLM or custom logic, execute trade
  }
}
```

The LLM decision engine and wallet execution layer beneath it stay identical across all agents.

---

## Verifying LLM Communication

Check your server terminal for these log lines on every trade:

```
[Pyth] SOL/USD = $172.45 ± $0.32          ← live price fetched
[Groq] alpha-trader → HOLD: <reason>       ← LLM reached successfully
```

Or fallback indicators:

```
[LLM] GROQ_API_KEY not set — rule-based fallback
[Groq] Failed (Groq HTTP 401) — rule-based fallback
```

The trade API response also exposes `decisionSource: "llm" | "rule-based"` so
you can confirm the decision path without reading server logs.

> **Why do agents often HOLD?** SOL currently trades around $170–$190, which sits
> between the rule-based BUY threshold ($150) and SELL threshold ($200). The LLM
> mirrors this neutral stance. This is expected behaviour — adjust thresholds in
> the Groq prompt or rule-based fallback if you want more frequent activity.

---

## Security

| Threat | Mitigation |
|---|---|
| Plaintext key on disk | AES-256-GCM encryption — key never stored unencrypted |
| Tampered keystore file | GCM auth tag — any byte modification detected on load |
| Weak encryption password | scrypt KDF — brute force made computationally expensive |
| Transaction replay | Solana blockhash expiry (~90 seconds per tx) |
| Cross-agent contamination | Independent keypairs — no shared key material |
| Private key in logs | `toJSON()` never exports key; logger redacts sensitive fields |
| Agent overspending | `MIN_BALANCE_SOL = 0.05` reserve enforced before every loop tick |
| Master wallet exposure | Used only for initial funding transfers; never stored in agent state |
| Simulated signatures | All BUY and SELL actions produce real, verifiable on-chain signatures |
| Serverless race conditions | Distributed Redis lock (`SET NX`) prevents duplicate initialization |

See [SECURITY.md](./SECURITY.md) for the full threat model.

---

## Bounty Checklist

| Requirement | Implementation |
|---|---|
| ✅ Create a wallet programmatically | `Keypair.generate()` in `lib/agentStore.ts` |
| ✅ Sign transactions automatically | `WalletEngine.execute()` in `lib/wallet/engine.ts` |
| ✅ Hold SOL or SPL tokens | Live devnet balances tracked per agent |
| ✅ Interact with a test dApp or protocol | BUY → SOL transfer; SELL → Memo program tx with on-chain LLM reasoning |
| ✅ Deep dive (written) | [`/about`](https://agentixx.vercel.app/about) — wallet design, security, AI integration |
| ✅ Open-source with README | This file + [github.com/emmyCode4495/agentixx](https://github.com/emmyCode4495/agentixx) |
| ✅ Working prototype on devnet | Live dashboard at `/dashboard` |
| ✅ Safe key management | AES-256-GCM + scrypt, GCM auth tag tamper detection, master wallet isolation |
| ✅ Automated transaction signing | No human input at runtime — loop fires every 15s |
| ✅ Real AI decision-making | Groq `llama-3.1-8b-instant` with live Pyth price context |
| ✅ Live price oracle | Pyth Network Hermes REST API — real SOL/USD feed, no API key required |
| ✅ Multiple independent agents | `alpha-trader`, `beta-hodler`, `gamma-arbitrage` |
| ✅ Serverless-compatible persistence | Upstash Redis — agent state survives Vercel cold starts |
| ✅ SKILLS.md | [`SKILLS.md`](./SKILLS.md) — machine-readable API + agent spec |

---

## Useful Links

- [Solana Devnet Explorer](https://explorer.solana.com/?cluster=devnet)
- [Solana Devnet Faucet](https://faucet.solana.com)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [Pyth Network Price Feeds](https://pyth.network/developers/price-feed-ids)
- [Groq Console](https://console.groq.com)
- [Upstash Redis](https://upstash.com)

---

## License

MIT — see [LICENSE](./LICENSE)