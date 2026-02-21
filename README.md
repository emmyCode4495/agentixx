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
- Funds itself via **Solana devnet airdrops**
- Runs an **autonomous decision loop** that signs and broadcasts real on-chain transactions every 15 seconds
- Maintains **fully isolated state** — no agent can access another's keys or balance

Every BUY produces a real SOL transfer. Every SELL produces a signed Memo program transaction. Every signature is verifiable on [Solana Explorer (devnet)](https://explorer.solana.com/?cluster=devnet).

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
│   │           ├── trade/route.ts        # POST — execute BUY / SELL / HOLD
│   │           ├── loop/route.ts         # POST — start / stop autonomous loop
│   │           ├── airdrop/route.ts      # POST — request devnet SOL
│   │           └── history/route.ts      # GET  — on-chain tx history
│   ├── dashboard/page.tsx                # Live dashboard UI
│   ├── about/page.tsx                    # Deep dive writeup
│   └── page.tsx                          # Landing page
├── components/
│   └── layout/
│       ├── Navbar.tsx
│       └── Footer.tsx
├── lib/
│   ├── agentStore.ts                     # Runtime state — balances, trades, status
│   ├── solana.ts                         # Connection, sendSOL, sendMemoTransaction
│   └── agents/
│       ├── baseAgent.ts                  # Abstract agent — strategy() interface
│       ├── traderAgent.ts                # Momentum-based trading strategy
│       ├── registry.ts                   # Agent factory — wires keypair → WalletEngine
│       ├── loop.ts                       # Autonomous loop manager (globalThis singleton)
│       └── market.ts                     # Simulated price oracle
├── wallet/
│   └── engine.ts                         # WalletEngine — validate → simulate → execute
├── SKILLS.md                             # Machine-readable API spec for AI agents
├── SECURITY.md                           # Threat model and key management policy
└── .agent-keystore/                      # Auto-generated encrypted wallet files
```

---

## How It Works

### 1. Wallet Creation

Each agent independently generates a keypair with no shared seed material:

```ts
const keypair = Keypair.generate() // ed25519, 256-bit entropy from OS CSPRNG
```

The private key is immediately encrypted and never stored in plaintext:

```ts
// AES-256-GCM + scrypt KDF — GCM auth tag detects any tampering
const { enc, iv, tag } = encryptKey(secretKeyHex, WALLET_ENCRYPTION_KEY)
```

### 2. Autonomous Decision Loop

Every 15 seconds, each agent:

1. Checks its live devnet balance (halts if below `0.05 SOL` reserve)
2. Reads the price oracle via `getMarketState()`
3. Runs `strategy(market, balance)` — the AI decision layer
4. Executes the decision on-chain via `WalletEngine`

```
price < 40  →  BUY  (real SOL transfer to DEX treasury)
price > 70  →  SELL (real Memo program tx — JSON trade record signed on-chain)
otherwise   →  HOLD (decision recorded, no transaction)
```

### 3. On-Chain Execution

| Action | Transaction type | Explorer link |
|--------|-----------------|---------------|
| BUY | `SystemProgram.transfer` — agent → DEX treasury | ✅ Real signature |
| SELL | `TransactionInstruction` via Memo program — signs JSON metadata | ✅ Real signature |
| HOLD | No transaction | — |

### 4. WalletEngine Safety Layer

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
- A Solana devnet wallet (optional — agents self-fund via airdrop)

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

# Optional — override the default Solana devnet RPC
SOLANA_RPC_URL=https://api.devnet.solana.com

# Required for the autonomous loop route to call the trade API internally
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

On the first request to `/api/agents`, the server will:

1. Generate keypairs for all configured agents
2. Encrypt and persist keystores to `.agent-keystore/`
3. Request devnet SOL airdrops for each agent
4. Mark agents as `funded` and ready

> **Note:** Devnet airdrops are rate-limited. If agents show 0 SOL balance, use the ⛽ button in the dashboard or fund manually via [faucet.solana.com](https://faucet.solana.com).

---

## API Reference

### Agents

```
GET  /api/agents                    → fleet status, balances, last trades
POST /api/agents/:id/trade          → { type: "BUY" | "SELL" | "HOLD" }
POST /api/agents/:id/loop           → { action: "start" | "stop" }
GET  /api/agents/:id/loop           → loop status for agent
POST /api/agents/:id/airdrop        → request 1 SOL devnet airdrop
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

### Example — Manual trade

```bash
curl -X POST http://localhost:3000/api/agents/alpha-trader/trade \
  -H "Content-Type: application/json" \
  -d '{ "type": "BUY" }'
```

```json
{
  "ok": true,
  "trade": {
    "type": "BUY",
    "amountSOL": 0.01,
    "price": 34.72,
    "signature": "4xK9...zW2p"
  },
  "newBalanceSOL": 0.9821,
  "explorerUrl": "https://explorer.solana.com/tx/4xK9...zW2p?cluster=devnet"
}
```

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
  strategy(market: MarketState, balanceSOL: number): TradeDecision {
    // implement your logic here
  }
}
```

To plug in an LLM, replace the body of `strategy()` with an OpenAI or Anthropic API call. The wallet layer beneath it stays identical.

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
| Simulated signatures | All BUY and SELL actions produce real, verifiable on-chain signatures |

See [SECURITY.md](./SECURITY.md) for the full threat model.

---

## Bounty Checklist

| Requirement | Implementation |
|---|---|
| ✅ Create a wallet programmatically | `Keypair.generate()` in `lib/agentStore.ts` |
| ✅ Sign transactions automatically | `WalletEngine.execute()` in `lib/wallet/engine.ts` |
| ✅ Hold SOL or SPL tokens | Live devnet balances tracked per agent |
| ✅ Interact with a test dApp or protocol | BUY → SOL transfer; SELL → Memo program tx |
| ✅ Deep dive (written) | [`/about`](/about) — wallet design, security, AI integration |
| ✅ Open-source with README | This file + [github.com/emmyCode4495/agentixx](https://github.com/emmyCode4495/agentixx) |
| ✅ Working prototype on devnet | Live dashboard at `/dashboard` |
| ✅ Safe key management | AES-256-GCM + scrypt, GCM auth tag tamper detection |
| ✅ Automated transaction signing | No human input at runtime — loop fires every 15s |
| ✅ AI decision-making simulation | Momentum strategy in `TraderAgent.strategy()` |
| ✅ Multiple independent agents | `alpha-trader`, `beta-hodler`, `gamma-arbitrage` |
| ✅ SKILLS.md | [`SKILLS.md`](./SKILLS.md) — machine-readable API spec |

---

## Useful Links

- [Solana Devnet Explorer](https://explorer.solana.com/?cluster=devnet)
- [Solana Devnet Faucet](https://faucet.solana.com)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [Project Deep Dive](/about)

---

## License

MIT — see [LICENSE](./LICENSE)