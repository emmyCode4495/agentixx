# Agentixx Agent Skills Specification

This file defines the operational abilities, constraints, and execution contract
for autonomous AI agents in the Agentixx framework.

Agents MUST read this file to understand:

- What actions they can perform
- How to interact with their wallet
- Security rules
- Execution lifecycle
- State tracking

---

## 🧠 Core Agent Capabilities

### 1. Wallet Management
Agents can:

- Generate a new Solana keypair
- Encrypt and store the private key securely
- Load their encrypted wallet
- Sign transactions (SOL & SPL tokens)

### 2. Network Interaction
Agents can:

- Connect to Solana Devnet via WalletEngine
- Fetch their SOL balance
- Fetch transaction history (limited)
- Request devnet airdrops

### 3. Value Transfer
Agents can:

- Send SOL to another address
- Estimate available balance before transfer
- Confirm that transactions succeeded

---

## 🔄 Execution Lifecycle

Each agent must follow this lifecycle:

1. **Initialize**
   - Wallet creation or loading
   - Verify encrypted key integrity
2. **Fund**
   - Request devnet airdrop
   - Confirm balance
3. **Idle**
   - Wait for execution trigger
4. **Decide**
   - Evaluate strategy
   - Execute transaction if conditions met
5. **Complete**
   - Update balance
   - Log PnL and status

---

## 📊 Strategy Abstraction

Agents implement:

```ts
interface Agent {
  id: string
  decide(): Promise<void>
}
