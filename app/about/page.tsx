import type { Metadata } from "next"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"

export const metadata: Metadata = {
  title: "Deep Dive",
  description: "Wallet design, security model, and AI agent integration explained.",
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "4rem" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "0.75rem",
        marginBottom: "1.5rem", paddingBottom: "1rem",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
          fontWeight: 800, letterSpacing: "-0.03em",
          color: "#fff", margin: 0,
        }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      color: "rgba(255,255,255,0.6)",
      fontSize: "0.92rem", lineHeight: 1.9,
      marginBottom: "1rem",
      fontFamily: "'Space Mono', monospace",
    }}>
      {children}
    </p>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code style={{
      background: "rgba(153,69,255,0.12)",
      color: "#14F195",
      padding: "0.15rem 0.45rem", borderRadius: "5px",
      fontSize: "0.82em",
      fontFamily: "'Space Mono', monospace",
      border: "1px solid rgba(20,241,149,0.15)",
    }}>
      {children}
    </code>
  )
}

function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: "14px",
      marginBottom: "1.25rem",
      overflow: "hidden",
      boxShadow: "0 0 0 1px rgba(153,69,255,0.06)",
      position: "relative",
    }}>
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.65rem 1.1rem",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {["#f87171","#facc15","#4ade80"].map((c) => (
            <span key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, display: "inline-block" }} />
          ))}
        </div>
        {label && (
          <span style={{
            fontSize: "0.62rem", color: "rgba(255,255,255,0.2)",
            fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em",
          }}>
            {label}
          </span>
        )}
      </div>
      {/* Bottom glow */}
      <div aria-hidden style={{
        position: "absolute", bottom: 0, left: "10%", right: "10%", height: "1px",
        background: "linear-gradient(90deg, transparent, #9945FF 40%, #14F195 60%, transparent)",
        opacity: 0.4,
      }} />
      <pre style={{
        margin: 0,
        padding: "1.25rem 1.4rem",
        fontFamily: "'Space Mono', monospace",
        fontSize: "0.78rem",
        color: "rgba(255,255,255,0.55)",
        overflowX: "auto",
        lineHeight: 1.85,
      }}>
        <code>{children}</code>
      </pre>
    </div>
  )
}

function Callout({ type, children }: { type: "info" | "warn" | "success"; children: React.ReactNode }) {
  const styles = {
    info:    { bg: "rgba(147,197,253,0.06)", border: "rgba(147,197,253,0.2)", color: "#93c5fd", icon: "ℹ" },
    warn:    { bg: "rgba(252,211,77,0.06)",  border: "rgba(252,211,77,0.2)",  color: "#fcd34d", icon: "⚠" },
    success: { bg: "rgba(20,241,149,0.06)",  border: "rgba(20,241,149,0.2)",  color: "#14F195", icon: "✓" },
  }[type]
  return (
    <div style={{
      background: styles.bg, border: `1px solid ${styles.border}`,
      borderRadius: 10, padding: "0.85rem 1.1rem", marginBottom: "1.25rem",
      display: "flex", gap: 10, alignItems: "flex-start",
    }}>
      <span style={{ color: styles.color, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{styles.icon}</span>
      <p style={{
        color: "rgba(255,255,255,0.55)", fontSize: "0.82rem", lineHeight: 1.75,
        margin: 0, fontFamily: "'Space Mono', monospace",
      }}>
        {children}
      </p>
    </div>
  )
}

function ThreatRow({ threat, mitigation }: { threat: string; mitigation: string }) {
  return (
    <tr className="aw-threat-row" style={{ transition: "background 0.2s" }}>
      <td style={{
        padding: "0.9rem 1.1rem",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        color: "#fff", fontSize: "0.8rem",
        fontFamily: "'Space Mono', monospace",
        whiteSpace: "nowrap",
      }}>
        {threat}
      </td>
      <td style={{
        padding: "0.9rem 1.1rem",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        color: "rgba(255,255,255,0.45)", fontSize: "0.8rem",
        fontFamily: "'Space Mono', monospace",
        lineHeight: 1.7,
      }}>
        {mitigation}
      </td>
    </tr>
  )
}

export default function AboutPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');

        body { background: rgb(6,6,10); }

        .aw-threat-row:hover td {
          background: rgba(153,69,255,0.05);
        }
        .aw-about-link {
          color: #14F195 !important;
          text-decoration: none !important;
          border-bottom: 1px solid rgba(20,241,149,0.3);
          transition: border-color 0.2s, color 0.2s;
        }
        .aw-about-link:hover {
          border-color: #14F195;
          color: #fff !important;
        }
        @keyframes aw-about-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(20,241,149,0.9); }
          50%       { opacity: 0.5; box-shadow: 0 0 14px rgba(20,241,149,0.4); }
        }

        /* mobile */
        @media (max-width: 640px) {
          .aw-about-main { padding: 5.5rem 1rem 5rem !important; }
          .aw-about-h1   { font-size: 2rem !important; }
          .aw-about-sub  { font-size: 0.82rem !important; }
          .aw-threat-td-nowrap { white-space: normal !important; }
        }
      `}</style>

      <Navbar />

      <div style={{
        background: "rgb(6,6,10)",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Scanline */}
        <div aria-hidden style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          background: `repeating-linear-gradient(
            0deg, transparent, transparent 2px,
            rgba(255,255,255,0.013) 2px, rgba(255,255,255,0.013) 4px
          )`,
        }} />

        {/* Ambient blobs */}
        <div aria-hidden style={{
          position: "absolute", top: "5%", right: "5%",
          width: 360, height: 360, borderRadius: "50%", pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(circle, rgba(153,69,255,0.07) 0%, transparent 70%)",
          filter: "blur(70px)",
        }} />
        <div aria-hidden style={{
          position: "absolute", top: "40%", left: "-5%",
          width: 300, height: 300, borderRadius: "50%", pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(circle, rgba(20,241,149,0.05) 0%, transparent 70%)",
          filter: "blur(70px)",
        }} />

        <main className="aw-about-main" style={{
          maxWidth: "760px",
          margin: "0 auto",
          padding: "8rem 1.5rem 6rem",
          position: "relative", zIndex: 1,
        }}>

          {/* ── PAGE HEADER ── */}
          <div style={{ marginBottom: "5rem" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.3rem 0.9rem", borderRadius: "99px",
              border: "1px solid rgba(20,241,149,0.3)",
              background: "rgba(20,241,149,0.07)",
              marginBottom: "1.5rem",
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#14F195",
                boxShadow: "0 0 6px rgba(20,241,149,0.9)",
                display: "inline-block",
                animation: "aw-about-pulse 2s ease-in-out infinite",
              }} />
              <span style={{ color: "#14F195", fontSize: "0.7rem", letterSpacing: "0.12em", fontWeight: 700, textTransform: "uppercase" }}>
                Bounty Deep Dive
              </span>
            </div>

            <h1 className="aw-about-h1" style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.08,
              color: "#fff", marginBottom: "1.25rem",
            }}>
              Wallet design,{" "}
              <br />
              <span style={{
                background: "linear-gradient(90deg, #9945FF 0%, #14F195 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 20px rgba(20,241,149,0.3))",
                fontStyle: "italic",
              }}>
                security &amp; AI integration.
              </span>
            </h1>

            <p className="aw-about-sub" style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "0.95rem", lineHeight: 1.85,
              fontFamily: "'Space Mono', monospace",
              maxWidth: "58ch",
            }}>
              A complete walkthrough of how autonomous AI agents own and operate Solana wallets —
              from keypair generation to encrypted keystores to live devnet transactions.
              Every BUY and SELL in this prototype produces a real, verifiable on-chain signature.
            </p>
          </div>

          {/* ── SECTIONS ── */}

          <Section title="1. Why agents need their own wallets">
            <P>
              Traditional Solana wallets (Phantom, Backpack) are built for humans. Every transaction
              requires a UI prompt, a manual review, and a button click. AI agents can&apos;t do any of that —
              they operate at machine speed, 24/7, and need to sign in milliseconds without blocking on
              human approval.
            </P>
            <P>
              An agentic wallet is a wallet the agent fully controls: it holds the private key, decides
              when to sign, and broadcasts transactions autonomously. No human is in the loop at runtime.
              Agentixx runs a fleet of these wallets concurrently, each with independent state, independent
              balances, and independent on-chain history.
            </P>
          </Section>

          <Section title="2. Keypair generation">
            <P>
              Every agent gets a fresh ed25519 keypair generated via <Code>Keypair.generate()</Code> from{" "}
              <Code>@solana/web3.js</Code>, which internally calls Node.js <Code>crypto.randomBytes</Code> —
              seeded by the OS CSPRNG (<Code>/dev/urandom</Code> on Linux). This gives 256 bits of entropy,
              sufficient for real-world use.
            </P>
            <CodeBlock label="lib/agentStore.ts">{`const { Keypair } = require("@solana/web3.js")

// Each agent runs this independently — no shared seeds
const keypair = Keypair.generate()
console.log(keypair.publicKey.toBase58()) // agent's on-chain address`}</CodeBlock>
            <P>
              Each agent gets an independent keypair. There is no shared master seed. Compromise of one
              agent&apos;s key does not affect any other agent in the fleet.
            </P>
          </Section>

          <Section title="3. Encrypted keystore format">
            <P>
              Private keys at rest are encrypted with{" "}
              <strong style={{ color: "#fff", fontWeight: 700 }}>AES-256-GCM</strong>.
              The encryption password is hardened through <Code>scrypt</Code> — a memory-hard KDF that makes
              brute-force attacks orders of magnitude more expensive.
            </P>
            <CodeBlock label="keystores/alpha-trader.json">{`{
  "version": "1.0",
  "agentId": "alpha-trader",
  "publicKey": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  "encryptedKey": "a1b2c3d4...",   // AES-256-GCM ciphertext
  "iv":  "f3a1...",                 // random 12-byte IV per save
  "authTag": "8c2d...",            // GCM tag — detects any tampering
  "network": "devnet"
}`}</CodeBlock>
            <P>
              The <strong style={{ color: "#fff", fontWeight: 700 }}>GCM auth tag</strong> is critical — if anyone
              modifies even a single byte of the encrypted key on disk, decryption throws before returning
              any key material. The IV is regenerated on every <Code>saveKeystore()</Code> call so no two
              keystores look alike.
            </P>
          </Section>

          <Section title="4. Autonomous transaction signing — all three actions">
            <P>
              Every trade action in this prototype produces a real, verifiable transaction on Solana devnet.
              There are no simulated signatures. Here is exactly what each action does on-chain:
            </P>

            <P>
              <strong style={{ color: "#14F195" }}>BUY</strong> — a real SOL transfer from the agent wallet
              to the DEX treasury address. The agent signs with its own keypair autonomously, with no human
              prompt. The resulting signature is linked directly from the dashboard.
            </P>
            <CodeBlock label="api/agents/[id]/trade/route.ts — BUY">{`// Agent wallet → DEX treasury: 0.01 SOL on-chain
signature = await sendSOL(keypair, DEX_TREASURY, 0.01)

// Returns a real, confirmed devnet signature:
// "4xK9...zW2p" — verifiable at explorer.solana.com/?cluster=devnet`}</CodeBlock>

            <P>
              <strong style={{ color: "#f87171" }}>SELL</strong> — a Memo program transaction. The agent
              signs a zero-lamport transaction that permanently records the sell decision as UTF-8 metadata
              on-chain. This is the standard pattern for audit-logging decisions when no counterparty
              transfer is possible without a deployed program.
            </P>
            <CodeBlock label="lib/solana.ts — sendMemoTransaction()">{`const memoInstruction = new TransactionInstruction({
  keys:      [{ pubkey: keypair.publicKey, isSigner: true, isWritable: false }],
  programId: MEMO_PROGRAM_ID, // MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr
  data:      Buffer.from(JSON.stringify({
    action:    "SELL",
    agent:     "alpha-trader",
    price:     "72.45",
    amountSOL: 0.01,
    ts:        "2024-01-15T10:23:41Z",
  }), "utf-8"),
})

// Agent signs — confirmed on-chain, readable on Explorer
const signature = await sendAndConfirmTransaction(connection, tx, [keypair])`}</CodeBlock>

            <Callout type="success">
              Both BUY and SELL now produce verifiable on-chain signatures. Click any signature link
              in the dashboard to inspect the full transaction on Solana Explorer (devnet).
            </Callout>

            <P>
              <strong style={{ color: "rgba(255,255,255,0.5)" }}>HOLD</strong> — no transaction. The
              decision is recorded in the agent&apos;s local trade history. The autonomous loop uses HOLD
              to signal &quot;market neutral&quot; without burning transaction fees unnecessarily.
            </P>

            <P>
              Solana&apos;s <Code>recentBlockhash</Code> mechanism prevents replay attacks — each transaction
              includes a recent blockhash and is rejected by the network after ~90 seconds. The agent
              fetches a fresh blockhash before every transaction.
            </P>
          </Section>

          <Section title="5. The autonomous decision loop">
            <P>
              <Code>startAgentLoop(id, callback, intervalMs)</Code> runs the agent&apos;s decision
              callback on a fixed timer — every 15 seconds by default. The loop is started automatically
              for all funded agents on page load, and can be stopped per-agent from the dashboard.
            </P>
            <P>
              The decision function <Code>autonomousDecision(price)</Code> implements momentum-based
              rules. It is the same function called by both the manual trade button and the autonomous
              loop, ensuring behavioral consistency regardless of how a trade is triggered.
            </P>
            <CodeBlock label="api/agents/[id]/loop/route.ts — loop callback">{`startAgentLoop(id, async () => {
  // 1. Safety guard — stop loop if balance too low
  const balance = await refreshBalance(id)
  if (balance < MIN_BALANCE_SOL) {
    stopAgentLoop(id)
    return
  }

  // 2. Simulated price oracle (replace with Pyth in production)
  const price = +(20 + Math.random() * 80).toFixed(2)

  // 3. AI decision layer — pure function, easily swappable
  //    price < 40  → BUY  (undervalued signal)
  //    price > 70  → SELL (take-profit signal)
  //    otherwise   → HOLD
  const decision = autonomousDecision(price)

  // 4. Execute — calls the same trade route as a manual click
  await fetch(\`/api/agents/\${id}/trade\`, {
    method: "POST",
    body:   JSON.stringify({ type: decision, auto: true }),
  })
}, 15_000)`}</CodeBlock>

            <Callout type="info">
              To upgrade to an LLM-driven agent, replace <Code>autonomousDecision(price)</Code> with
              an OpenAI or Anthropic API call. Pass the agent&apos;s balance, recent trade history, and
              price signal as context. The wallet layer below it stays identical — only the decision
              function changes.
            </Callout>

            <P>
              The loop enforces a <Code>MIN_BALANCE_SOL = 0.05</Code> reserve. If an agent&apos;s balance
              drops below this threshold, the loop halts automatically and logs a warning — preventing
              an agent from spending itself into dust and becoming unable to pay transaction fees.
            </P>
          </Section>

          <Section title="6. Multi-agent fleet architecture">
            <P>
              <Code>WalletRegistry</Code> manages a fleet of independent agents. Each agent has its own
              keypair, its own encrypted keystore file, and its own autonomous loop running concurrently.
              No state is shared between agents. A <Code>Map&lt;string, NodeJS.Timeout&gt;</Code> in
              <Code>loop.ts</Code> tracks which agents are running without any shared mutable state.
            </P>
            <CodeBlock label="lib/agents/loop.ts">{`const runningLoops = new Map<string, NodeJS.Timeout>()

export function startAgentLoop(
  id: string,
  callback: () => Promise<void>,
  intervalMs: number
) {
  if (runningLoops.has(id)) return // already running — idempotent

  const tick = async () => {
    await callback()
    // Reschedule only if still running (stop() clears the map)
    if (runningLoops.has(id)) {
      runningLoops.set(id, setTimeout(tick, intervalMs))
    }
  }

  runningLoops.set(id, setTimeout(tick, intervalMs))
}

export function stopAgentLoop(id: string) {
  const timer = runningLoops.get(id)
  if (timer) { clearTimeout(timer); runningLoops.delete(id) }
}

export const getRunningLoops = () => [...runningLoops.keys()]`}</CodeBlock>
          </Section>

          <Section title="7. Security threat model">
            <div style={{
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "14px", overflow: "hidden",
              boxShadow: "0 0 0 1px rgba(153,69,255,0.06)",
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    <th style={{
                      padding: "0.85rem 1.1rem", textAlign: "left",
                      fontSize: "0.65rem", color: "rgba(255,255,255,0.3)",
                      letterSpacing: "0.12em", textTransform: "uppercase",
                      fontFamily: "'Space Mono', monospace", fontWeight: 700,
                      borderBottom: "1px solid rgba(255,255,255,0.07)",
                    }}>Threat</th>
                    <th style={{
                      padding: "0.85rem 1.1rem", textAlign: "left",
                      fontSize: "0.65rem", color: "rgba(255,255,255,0.3)",
                      letterSpacing: "0.12em", textTransform: "uppercase",
                      fontFamily: "'Space Mono', monospace", fontWeight: 700,
                      borderBottom: "1px solid rgba(255,255,255,0.07)",
                    }}>Mitigation</th>
                  </tr>
                </thead>
                <tbody>
                  <ThreatRow threat="Plaintext key on disk"     mitigation="AES-256-GCM encryption — key never stored unencrypted" />
                  <ThreatRow threat="Tampered keystore file"    mitigation="GCM auth tag — any byte modification detected on load" />
                  <ThreatRow threat="Weak encryption password"  mitigation="scrypt KDF — brute force made computationally expensive" />
                  <ThreatRow threat="Transaction replay"        mitigation="Solana blockhash expiry (~90 seconds per tx)" />
                  <ThreatRow threat="Cross-agent contamination" mitigation="Independent keypairs per agent — no shared key material" />
                  <ThreatRow threat="Private key in logs"       mitigation="toJSON() never exports key; logger redacts sensitive fields" />
                  <ThreatRow threat="Agent overspending"        mitigation="MIN_BALANCE_SOL = 0.05 reserve enforced before every loop tick" />
                  <ThreatRow threat="Simulated SELL signatures" mitigation="All SELLs are real Memo program txs — fully verifiable on Explorer" />
                  <ThreatRow threat="Loop runaway / crash"      mitigation="Uncaught errors logged and swallowed per tick — loop continues" />
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="8. Run it yourself">
            <CodeBlock label="terminal">{`git clone https://github.com/emmyCode4495/agentixx
cd agentixx
npm install
cp .env.example .env.local

# Single agent demo — creates wallet, airdrops SOL, signs tx
npm run demo

# 3 agents trading concurrently on devnet
npm run multi-agent

# Full test suite
npm test`}</CodeBlock>
            <P>
              The demo runs entirely on Solana devnet — no real funds involved. Every BUY transaction
              and every SELL memo is verifiable on{" "}
              <a
                href="https://explorer.solana.com/?cluster=devnet"
                target="_blank"
                rel="noopener noreferrer"
                className="aw-about-link"
              >
                Solana Explorer (devnet)
              </a>.
              The autonomous loop fires every 15 seconds — open the dashboard and watch the trade
              count tick up in real time.
            </P>
          </Section>

        </main>
      </div>

      <Footer />
    </>
  )
}