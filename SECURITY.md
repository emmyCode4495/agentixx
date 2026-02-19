🔐 Agentixx Security Guidelines
1. Overview

This document describes the security model for Agentixx autonomous agents and their wallets.
It explains key management, transaction handling, network safety, and limitations enforced to protect both funds and agents.

All agents operate sandboxed, interacting with Solana Devnet exclusively through WalletEngine abstractions.

2. Key Management

Each agent has a unique Solana keypair stored in an encrypted keystore.

Private keys are never exposed in plaintext outside WalletEngine.

Encryption uses AES-256-GCM with a password derived from a secure environment variable WALLET_ENCRYPTION_KEY.

Keystore files are stored in .agent-keystore directory and are agent-isolated.

In production, keystore storage should be replaced with secure DBs (Postgres, Redis, or HSM).

3. WalletEngine Isolation

All blockchain interactions are funneled through WalletEngine.

Agents cannot access raw RPC connections, preventing unauthorized transactions.

Only WalletEngine can:

Sign transactions

Send SOL

Request airdrops

Query balance or transaction history

4. Network Safety

Agents operate on Solana Devnet, isolating testing from mainnet funds.

RPC requests use a singleton connection with confirmed commitment.

Rate-limiting safeguards prevent excessive airdrops or transaction spamming.

Failed network requests are gracefully handled, updating agent status without crashing the process.

5. Agent Sandbox Rules

Agents cannot:

Access other agents’ wallets or keystore files

Modify encryption settings

Export private keys

Execute raw transactions outside WalletEngine

Agents are stateless between executions except for AgentStore state (balanceSOL, pnl, status, etc.)

Compromise of one agent does not affect others.

6. Transaction Security

SOL transfers are confirmed automatically.

Transaction history is retrieved to validate execution.

PnL calculations are updated only via the agent lifecycle, preventing double-spending in simulations.

Optional future SPL token and multi-instruction transactions will follow the same isolation model.

7. Logging & Auditing

Each agent logs:

Initialization

Airdrop requests

Transaction signatures

Errors or rate-limit events

Logs are local and non-sensitive, no private keys are logged.

History enables auditing and replay of agent decisions.

8. Environment Variables

WALLET_ENCRYPTION_KEY

Must be 32-character secure string in production.

Used for AES-256-GCM encryption of private keys.

DEVNET_RPC (optional)

Custom Solana Devnet RPC endpoint.

9. Recommended Hardening

Use environment isolation (Docker, VMs) for agent runtime.

Rotate WALLET_ENCRYPTION_KEY periodically.

Monitor agent logs for errors and network issues.

Consider using HSM or Vault for storing encryption secrets in production.

Limit concurrency for airdrop requests to avoid Devnet rate-limiting.

10. Security Goals

Autonomy: Agents can operate independently without human intervention.

Isolation: Private keys never leave WalletEngine.

Resilience: Failures are localized, no single point of failure.

Auditability: All actions are logged and verifiable.