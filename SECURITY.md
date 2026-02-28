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
| Master wallet key exposure | High | Used only for initial funding transfers; never stored in agent state or logs |
| Agent overspending / drain | Medium | `MIN_BALANCE_SOL = 0.05` reserve enforced before every loop tick |
| LLM prompt injection | Medium | Structured JSON response parsing with strict type validation — unexpected values throw before execution |
| Unverifiable trade decisions | Medium | SELL decisions record full LLM reasoning on-chain via signed Memo tx — permanently auditable |
| Simulated / unverifiable trades | Medium | All BUY and SELL produce real on-chain signatures verifiable on Explorer |
| Serverless race conditions | Medium | Distributed Redis lock (`SET NX`) prevents duplicate agent initialization across concurrent cold starts |
| Redis credential exposure | Medium | `KV_REST_API_TOKEN` stored as environment secret — never hardcoded or logged |
| External API unavailability | Low | Pyth and Groq failures handled gracefully — price falls back to simulated range, decisions fall back to rule-based strategy |
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

### Master Wallet

A master wallet defined in `MASTER_WALLET` (`.env.local`) is used exclusively to
fund agent wallets on first boot. Its keypair is:

- Loaded once per boot cycle, used for funding transfers only
- Never stored in agent state, the agent store, or any runtime variable
- Never serialised or included in any API response or log output
- Validated to hold at least **1.05 SOL** before any transfer is attempted —
  failing fast with a clear error rather than silently under-funding agents

The master wallet is a short-lived operational credential, not a long-term secret.
It should be treated with the same care as `WALLET_ENCRYPTION_KEY`.

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

## 3. Persistent State — Upstash Redis

Agent runtime state (balances, trades, status, P&L) is persisted to **Upstash Redis**
via the `@upstash/redis` package. This replaces the previous in-memory `globalThis`
store, which was wiped on every Vercel serverless cold start.

### Distributed Initialization Lock

On first deployment, multiple serverless function instances may receive requests
simultaneously. A Redis atomic lock prevents duplicate agent initialization:

```ts
// SET NX — only the first instance proceeds; others wait up to 30s
const lock = await kv.set("agents:init:lock", "1", { nx: true, ex: 120 })
```

The lock expires after 120 seconds to prevent permanent deadlock if the initializing
instance crashes mid-flight.

### Credential Security

- `KV_REST_API_URL` and `KV_REST_API_TOKEN` are stored as Vercel environment secrets
- Credentials are never hardcoded, logged, or included in any API response
- The Redis token grants full read/write access — treat it with the same care as
  `MASTER_WALLET` and `WALLET_ENCRYPTION_KEY`

---

## 4. WalletEngine Isolation

All blockchain interactions are funnelled through `WalletEngine` — agents never access
the raw keypair or RPC connection directly.

```
Agent decide()
    ↓
getLLMDecision() / getRuleBasedDecision()   ← AI or deterministic trade decision
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

## 5. Agent Sandbox Rules

Each agent is strictly isolated:

- **No cross-agent key access** — keystore files are loaded per agent ID; no agent
  reads another's file
- **No raw RPC access** — agents call `WalletEngine` methods, not `Connection` directly
- **No key export** — `toJSON()` and all serialisation methods exclude the keypair
- **No arbitrary transactions** — all transactions pass `validateTransaction()` before
  signing; policy violations throw before any signing occurs
- **Stateless between restarts** — the only persistent state is the encrypted keystore
  and the Redis store; runtime state (balance, trades, PnL) is rebuilt from devnet
  and Redis on initialisation

Compromise or misbehaviour of one agent does not affect any other agent's keys,
funds, or execution loop.

---

## 6. Transaction Security

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
| SELL | `TransactionInstruction` via Memo program — signed JSON record including LLM reasoning, price source, and decision source | ✅ Real signature |
| HOLD | No transaction | — |

All signatures link directly to Solana Explorer (devnet). SELL memos make the agent's
full AI reasoning permanently auditable on-chain — not just in local logs.

---

## 7. External API Security

### Pyth Network Price Oracle

The live SOL/USD price is fetched from Pyth Network's public Hermes REST API:

- No API key required — no credential exposure risk
- Timeout enforced at **5 seconds** — hangs do not block the trade loop
- Failed or invalid responses fall back to a simulated price range (`$130–$210`)
- The `priceSource` field (`"pyth"` or `"simulated"`) is recorded on every trade,
  making it auditable whether live data was used

### Groq LLM Decision Engine

Trade decisions are made by Groq's `llama-3.1-8b-instant` via its OpenAI-compatible API:

- API key stored in `GROQ_API_KEY` environment variable — never hardcoded or logged
- Timeout enforced at **12 seconds** — LLM hangs do not stall the agent
- All LLM responses are strictly parsed — only `"BUY"`, `"SELL"`, or `"HOLD"` are
  accepted; unexpected values throw before any trade is executed
- Markdown code fences in responses are stripped before JSON parsing to prevent
  format injection from influencing trade execution
- On any Groq failure, the agent falls back to `getRuleBasedDecision()` —
  LLM unavailability never results in a hung or errored agent
- The `decisionSource` field (`"llm"` or `"rule-based"`) is recorded on every trade

---

## 8. Network Safety

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

## 9. Logging & Auditing

Every agent logs:
- Keypair initialisation (public key only — never private key)
- Master wallet funding transfer (recipient public key and amount only)
- Airdrop request and confirmation
- Live price fetch result from Pyth, including source and confidence interval
- LLM decision from Groq, including decision type and reason
- Fallback activation when Groq or Pyth is unavailable
- Each cycle decision (type, price, reason, decision source, price source)
- Transaction signature on BUY and SELL
- Balance after each trade
- Errors with descriptive messages

No log call anywhere in the codebase includes the secret key, the master wallet key,
the encryption password, the Groq API key, the Redis token, or the raw keystore bytes.
The `Keypair` object is never passed to `JSON.stringify()` or any logger.

On-chain history provides a permanent, tamper-proof audit trail. Every SELL decision
is recorded as a signed Memo transaction containing the agent ID, live price, price
source, decision source, and LLM reasoning — making the agent's decision-making fully
verifiable on-chain, not just in local logs.

---

## 10. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `WALLET_ENCRYPTION_KEY` | Yes | 32-character secret for AES-256-GCM encryption. Never commit. |
| `MASTER_WALLET` | Yes | JSON array of 64 bytes — master Solana keypair for agent funding on boot. Never commit. |
| `GROQ_API_KEY` | Recommended | Groq API key for LLM trade decisions. Agents fall back to rule-based strategy if absent. |
| `KV_REST_API_URL` | Yes | Upstash Redis REST URL for persistent agent state. Never commit. |
| `KV_REST_API_TOKEN` | Yes | Upstash Redis REST token. Grants full read/write access. Never commit. |
| `SOLANA_RPC_URL` | No | Override devnet RPC endpoint. Defaults to `https://api.devnet.solana.com`. |

---

## 11. Production Hardening Recommendations

These mitigations are out of scope for a devnet prototype but should be applied
before any mainnet or production deployment:

- **Replace file-based keystores** with a secrets manager (AWS Secrets Manager,
  HashiCorp Vault) or HSM for private key operations
- **Rotate `WALLET_ENCRYPTION_KEY`** periodically; re-encrypt all keystores on rotation
- **Rotate `MASTER_WALLET`** after initial fleet funding — it serves no further purpose
  and should be decommissioned to reduce the attack surface
- **Rotate Redis credentials** periodically via the Upstash dashboard
- **Run agents in isolated containers** (Docker, Kubernetes pods) with no shared
  filesystem access between agent processes
- **Add spending limits** to `validateTransaction()` — maximum SOL per transaction,
  maximum trades per hour, address whitelist
- **Implement LLM output validation** beyond type checking — rate-limit BUY decisions,
  flag unusual reasoning patterns, and alert on repeated identical reasons
- **Implement structured logging** (JSON logs → SIEM) for real-time anomaly detection
- **Add circuit breakers** — halt all loops automatically if aggregate PnL drops
  below a configurable threshold
- **Validate Pyth price bounds** — reject prices outside a reasonable range (e.g. < $10
  or > $10,000) before passing to the LLM to prevent outlier data driving bad decisions
- **Use mainnet-beta** with real funds only after a full security audit

---

## 12. Security Goals

| Goal | Status |
|------|--------|
| **Autonomy** — agents operate without human intervention at runtime | ✅ |
| **Isolation** — private keys never leave `WalletEngine` | ✅ |
| **Integrity** — keystore tampering detected before decryption | ✅ |
| **Resilience** — per-agent failures do not cascade to the fleet | ✅ |
| **Auditability** — every trade decision produces a verifiable on-chain record | ✅ |
| **Transparency** — threat model documented and mitigated | ✅ |
| **LLM safety** — invalid or injected LLM outputs rejected before execution | ✅ |
| **Oracle safety** — price feed failures handled gracefully with auditable fallback | ✅ |
| **Master wallet isolation** — funding credential never persisted in agent state | ✅ |
| **Serverless safety** — distributed Redis lock prevents duplicate initialization | ✅ |
| **Persistence security** — Redis credentials stored as environment secrets, never logged | ✅ |