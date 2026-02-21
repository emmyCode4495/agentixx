# SECURITY.md — Agentixx Security Model

This document describes the security architecture for Agentixx autonomous agent wallets.
It covers key management, transaction isolation, network safety, threat mitigations,
and production hardening recommendations.

---

## 1. Threat Model Summary

| Threat | Severity | Mitigation |
|--------|----------|------------|
| Plaintext private key on disk | Critical | AES-256-GCM encryption — key never written unencrypted |
| Tampered keystore file | Critical | GCM auth tag — any byte modification detected before decryption |
| Weak encryption password | High | scrypt KDF (N=32768, r=8, p=1) — brute force made computationally expensive |
| Transaction replay | High | Solana blockhash expiry (~90 seconds per transaction) |
| Cross-agent key contamination | High | Independent keypairs, isolated keystore files — no shared material |
| Private key exposure in logs | High | `toJSON()` never exports key; all log calls exclude keypair fields |
| Agent overspending / drain | Medium | `MIN_BALANCE_SOL = 0.05` reserve enforced before every loop tick |
| Simulated / unverifiable trades | Medium | All BUY and SELL produce real on-chain signatures verifiable on Explorer |
| RPC request flooding | Low | Singleton connection, staggered loop starts, graceful error handling |
| Mainnet fund exposure | Low | Hardcoded devnet RPC — no mainnet interaction possible |

---

## 2. Key Management

### Keypair Generation

Each agent generates an independent ed25519 keypair on first initialisation:

```ts
const keypair = Keypair.generate()
// Internally: crypto.randomBytes(32) seeded by OS CSPRNG (/dev/urandom on Linux)
// 256 bits of entropy — no shared seeds, no deterministic derivation paths
```

Compromise of one agent's key does **not** affect any other agent in the fleet.

### Encryption at Rest

Private keys are encrypted immediately after generation and never written to disk in plaintext:

```
Algorithm : AES-256-GCM
KDF       : scrypt  (N=32768, r=8, p=1, keylen=32)
Salt      : "agentw-salt-v1"
IV        : 12 random bytes — regenerated on every keystore write
Auth tag  : 16 bytes — integrity-checked before any decryption attempt
```

The GCM auth tag is critical: if any byte of the ciphertext or IV is modified on disk,
`decipher.final()` throws before returning any key material. Tampered keystores are
rejected entirely.

### Keystore Format

```json
{
  "version": "1.0",
  "agentId": "alpha-trader",
  "publicKey": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "enc": "a1b2c3d4...",
  "iv":  "f3a1b2c3d4e5f6a7b8c9d0e1",
  "tag": "8c2d4e6f...",
  "network": "devnet",
  "createdAt": "2026-02-19T12:00:00Z"
}
```

Keystore files are stored in `.agent-keystore/` and are excluded from version control
via `.gitignore`. Each file is scoped to one agent ID — no file contains material for
more than one keypair.

### Encryption Key Source

```env
WALLET_ENCRYPTION_KEY=your-32-character-secret-here!!
```

- Must be exactly 32 characters in production
- Never commit to Git — use environment secrets or a secrets manager
- In development, a fallback string is used and logged as a warning

---

## 3. WalletEngine Isolation

All blockchain interactions are funnelled through `WalletEngine` — agents never access
the raw keypair or RPC connection directly.

```
Agent strategy()
    ↓
WalletEngine.execute(tx)
    ↓  validateTransaction(tx)   ← policy check (spending limits, address rules)
    ↓  simulate(tx)              ← devnet dry-run before committing
    ↓  sendAndConfirmTransaction ← broadcast with `confirmed` commitment
    ↓
confirmed signature
```

`WalletEngine` is the only place in the codebase where:
- The keypair is used to sign
- SOL transfers are constructed
- Memo transactions are sent

Agents cannot bypass this layer. The keypair is a private class field (`private _keypair`)
and is only exposed via a getter for read-only public key access.

---

## 4. Agent Sandbox Rules

Each agent is strictly isolated:

- **No cross-agent key access** — keystore files are loaded per agent ID; no agent
  reads another's file
- **No raw RPC access** — agents call `WalletEngine` methods, not `Connection` directly
- **No key export** — `toJSON()` and all serialisation methods exclude the keypair
- **No arbitrary transactions** — all transactions pass `validateTransaction()` before
  signing; policy violations throw before any signing occurs
- **Stateless between restarts** — the only persistent state is the encrypted keystore;
  runtime state (balance, trades, PnL) is rebuilt from devnet on initialisation

Compromise or misbehaviour of one agent does not affect any other agent's keys,
funds, or execution loop.

---

## 5. Transaction Security

### Replay Protection

Every Solana transaction includes a `recentBlockhash` fetched immediately before signing.
The network rejects any transaction with a blockhash older than ~90 seconds, making
replayed transactions impossible.

### Confirmation Level

All transactions use `commitment: "confirmed"` — the transaction has been voted on by
a supermajority of the cluster before the signature is returned to the agent.

### Simulation Before Broadcast

`WalletEngine.execute()` runs `connection.simulateTransaction(tx)` before broadcasting.
If simulation returns an error, the transaction is never signed or sent — preventing
wasted fees on transactions that would fail on-chain.

### On-Chain Verifiability

| Action | Transaction | Verifiable |
|--------|-------------|------------|
| BUY | `SystemProgram.transfer` — 0.01 SOL, agent → DEX treasury | ✅ Real signature |
| SELL | `TransactionInstruction` via Memo program — signed JSON record | ✅ Real signature |
| HOLD | No transaction | — |

All signatures link directly to Solana Explorer (devnet).

---

## 6. Network Safety

- **Devnet only** — the RPC URL is `https://api.devnet.solana.com`. There is no code
  path that connects to mainnet.
- **Singleton connection** — one `Connection` instance is shared across all agents,
  preventing connection pool exhaustion.
- **Staggered loop starts** — `startAllLoops()` adds a 3-second delay between each
  agent to avoid simultaneous RPC bursts.
- **Graceful error handling** — transient RPC failures log an error and skip the cycle;
  they do not crash the process or mark the agent as permanently errored.
- **Airdrop rate limiting** — devnet faucet imposes its own rate limits; the dashboard
  surfaces funding failures clearly rather than silently retrying.

---

## 7. Logging & Auditing

Every agent logs:
- Keypair initialisation (public key only — never private key)
- Airdrop request and confirmation
- Each cycle decision (type, price, reason)
- Transaction signature on BUY and SELL
- Balance after each trade
- Errors with descriptive messages

No log call anywhere in the codebase includes the secret key, the encryption password,
or the raw keystore bytes. The `Keypair` object is never passed to `JSON.stringify()`
or any logger.

On-chain history provides a permanent, tamper-proof audit trail. Every SELL decision
is recorded as a signed Memo transaction, making the agent's reasoning verifiable
on-chain — not just in local logs.

---

## 8. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `WALLET_ENCRYPTION_KEY` | Yes | 32-character secret for AES-256-GCM encryption. Never commit. |
| `SOLANA_RPC_URL` | No | Override devnet RPC endpoint. Defaults to `https://api.devnet.solana.com`. |
| `NEXT_PUBLIC_BASE_URL` | Yes | Base URL for internal API calls from the loop route. |

---

## 9. Production Hardening Recommendations

These mitigations are out of scope for a devnet prototype but should be applied
before any mainnet or production deployment:

- **Replace file-based keystores** with a secrets manager (AWS Secrets Manager,
  HashiCorp Vault) or HSM for private key operations
- **Rotate `WALLET_ENCRYPTION_KEY`** periodically; re-encrypt all keystores on rotation
- **Run agents in isolated containers** (Docker, Kubernetes pods) with no shared
  filesystem access between agent processes
- **Add spending limits** to `validateTransaction()` — maximum SOL per transaction,
  maximum trades per hour, address whitelist
- **Implement structured logging** (JSON logs → SIEM) for real-time anomaly detection
- **Add circuit breakers** — halt all loops automatically if aggregate PnL drops
  below a configurable threshold
- **Use mainnet-beta** with real funds only after a full security audit

---

## 10. Security Goals

| Goal | Status |
|------|--------|
| **Autonomy** — agents operate without human intervention at runtime | ✅ |
| **Isolation** — private keys never leave `WalletEngine` | ✅ |
| **Integrity** — keystore tampering detected before decryption | ✅ |
| **Resilience** — per-agent failures do not cascade to the fleet | ✅ |
| **Auditability** — every trade decision produces a verifiable on-chain record | ✅ |
| **Transparency** — threat model documented and mitigated | ✅ |