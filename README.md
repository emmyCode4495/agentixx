🦾 Agentixx — Autonomous AI Agent Wallets on Solana Devnet

Agentixx is a prototype framework demonstrating autonomous AI agents that manage their own wallets on Solana Devnet.
Agents can generate wallets, request airdrops, sign transactions, and execute strategy decisions without human intervention.

This project was built to explore agentic wallets for AI-driven interactions with DeFi protocols and dApps.

🚀 Features

Autonomous wallets: Each agent has a unique Solana keypair stored in an encrypted keystore.

WalletEngine abstraction: Agents never access raw keys; all blockchain actions go through a secure API.

Devnet-ready: Test SOL airdrops, transfers, and autonomous strategies safely on Solana Devnet.

Multi-agent support: Run multiple agents independently with isolated state.

Strategy abstraction: Agents implement decide() cycles to simulate trades, liquidity provision, or arbitrary decision logic.

Secure key management: AES-256-GCM encryption ensures private keys are never exposed.


🗂 Project Structure

agentixx/
├── README.md
├── SECURITY.md
├── SKILLS.md
├── app/
│   ├── api/
│   │   └── agents/
│   │       └── route.ts      # Exposes agent state API
│   ├── dashboard/page.tsx    # Agent dashboard UI
│   └── about/page.tsx
├── components/               # React UI components
├── lib/
│   ├── agentStore.ts         # Central agent runtime state
│   ├── solana/utils.ts       # Blockchain helpers
│   └── wallet/               # WalletEngine & keystore management
├── hooks/
├── types/
├── public/
├── tsconfig.json
├── package.json
└── .agent-keystore/          # Encrypted wallets (auto-generated)


⚡ Prerequisites

Node.js ≥ 20

pnpm, npm, or yarn

Solana Devnet account (for optional manual funding)

Optional: VS Code with TypeScript support

🛠 Installation

Clone the repository:

git clone https://github.com/emmyCode4495/agentixx.git
cd agentixx


Install dependencies:

npm install
# or pnpm install
# or yarn install


Create a .env.local file with:

# 32-character secret for wallet encryption
WALLET_ENCRYPTION_KEY=dev-only-change-me-32-chars!!

# Optional: Custom Solana Devnet RPC
DEVNET_RPC=https://api.devnet.solana.com


Note: In production, use a secure 32-character key. Never commit secrets to Git.

🏗 Running Locally
1. Start the Next.js Dev Server
npm run dev


Open http://localhost:3000
 to view the dashboard.

 Initialize Agents

On first API call, agents will auto-generate wallets and request devnet airdrops.

Each agent wallet is stored encrypted in .agent-keystore.

You can check agent state via:

GET http://localhost:3000/api/agents

Sample response:

{
  "ok": true,
  "initialized": true,
  "agents": [
    {
      "id": "alpha-trader",
      "publicKey": "...",
      "status": "funded",
      "balanceSOL": 1,
      "pnl": 0,
      "lastUpdated": "2026-02-19T12:00:00Z"
    }
  ]
}


3. Execute Agent Strategies

Agents implement a decide() cycle. Run:

import { executeAgent } from "@/lib/agentStore"

await executeAgent("alpha-trader")


This will:

Evaluate strategy

Sign and send transactions via WalletEngine

Update agent state and PnL


🔒 Security

All wallet operations are isolated:

Private keys never leave WalletEngine.

Each agent is sandboxed: no access to other agents’ wallets.

Encrypted keystore files are stored locally in .agent-keystore.

Agents cannot override encryption or send arbitrary transactions outside WalletEngine.

For detailed security guidelines, see SECURITY.md
.

🧠 Agent Capabilities

Agents read SKILLS.md to understand:

Wallet operations (sign, send, airdrop, fetch balance)

Execution lifecycle (initialize → fund → decide → execute → update)

Strategy rules (thresholds, periodic execution, arbitrage simulation)

Security constraints (sandbox, encryption, isolated state)

📊 Strategy Examples

Threshold Strategy: Send SOL if balance exceeds a limit

Periodic Strategy: Execute simulated trades every N seconds

Arbitrage Simulation: Evaluate mock prices and transfer if delta > threshold

Randomized Simulation: Stochastic decision-making for testing

Extend agents/registry.ts to add new agent logic.


🏗 Development Notes

WalletEngine separates blockchain execution from agent logic.

AgentStore maintains agent state across executions.

Devnet airdrops are rate-limited — stagger requests to avoid 429 errors.

Add new agents by updating AGENT_IDS array.

📦 Production Considerations

Use secure DB / HSM for storing encrypted wallets.

Rotate WALLET_ENCRYPTION_KEY periodically.

Implement rate-limit handling and retries.

Consider logging and monitoring for multi-agent systems.


🏆 Bounty Readiness Checklist

✅ Fully autonomous wallets

✅ Multi-agent support

✅ Secure key management (AES-256-GCM)

✅ Transaction execution and logging

✅ Devnet demonstration ready

✅ SKILLS.md for AI agents

✅ SECURITY.md for reviewers


🔗 Useful Links

Solana Devnet Faucet

Solana Explorer

This README, together with
