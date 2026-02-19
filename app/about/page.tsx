// import type { Metadata } from "next"
// import { Navbar } from "@/components/layout/Navbar"
// import { Footer } from "@/components/layout/Footer"

// export const metadata: Metadata = {
//   title: "Deep Dive",
//   description: "Wallet design, security model, and AI agent integration explained.",
// }

// function Section({ title, children }: { title: string; children: React.ReactNode }) {
//   return (
//     <section style={{ marginBottom: "3.5rem" }}>
//       <h2 style={{
//         fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)",
//         fontWeight: 400, letterSpacing: "-0.03em",
//         color: "var(--foreground)", marginBottom: "1.25rem",
//         paddingBottom: "0.75rem", borderBottom: "1px solid var(--border)",
//       }}>
//         {title}
//       </h2>
//       {children}
//     </section>
//   )
// }

// function P({ children }: { children: React.ReactNode }) {
//   return (
//     <p style={{ color: "var(--muted-foreground)", fontSize: "1rem", lineHeight: 1.85, marginBottom: "1rem" }}>
//       {children}
//     </p>
//   )
// }

// function Code({ children }: { children: React.ReactNode }) {
//   return (
//     <code style={{
//       background: "var(--muted)", color: "var(--primary)",
//       padding: "0.15rem 0.4rem", borderRadius: "4px",
//       fontSize: "0.85em", fontFamily: "var(--font-mono)",
//     }}>
//       {children}
//     </code>
//   )
// }

// function CodeBlock({ children }: { children: string }) {
//   return (
//     <pre style={{
//       background: "var(--card)", border: "1px solid var(--border)",
//       borderRadius: "12px", padding: "1.25rem 1.5rem",
//       fontFamily: "var(--font-mono)", fontSize: "0.82rem",
//       color: "var(--muted-foreground)", overflowX: "auto",
//       lineHeight: 1.7, marginBottom: "1.25rem",
//     }}>
//       <code>{children}</code>
//     </pre>
//   )
// }

// function ThreatRow({ threat, mitigation }: { threat: string; mitigation: string }) {
//   return (
//     <tr>
//       <td style={{
//         padding: "0.85rem 1rem", borderBottom: "1px solid var(--border)",
//         color: "var(--foreground)", fontSize: "0.9rem", fontFamily: "var(--font-mono)",
//       }}>
//         {threat}
//       </td>
//       <td style={{
//         padding: "0.85rem 1rem", borderBottom: "1px solid var(--border)",
//         color: "var(--muted-foreground)", fontSize: "0.875rem",
//       }}>
//         {mitigation}
//       </td>
//     </tr>
//   )
// }

// export default function AboutPage() {
//   return (
//     <>
//       <Navbar />
//       <main style={{ maxWidth: "780px", margin: "0 auto", padding: "8rem 1.5rem 6rem" }}>

//         {/* Page header */}
//         <div style={{ marginBottom: "4rem" }}>
//           <div style={{
//             display: "inline-flex", alignItems: "center", gap: "0.5rem",
//             padding: "0.3rem 0.9rem", borderRadius: "99px",
//             border: "1px solid var(--border)", background: "var(--muted)",
//             marginBottom: "1.5rem",
//           }}>
//             <span style={{ color: "var(--primary)", fontSize: "0.75rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>
//               Bounty Deep Dive
//             </span>
//           </div>
//           <h1 style={{
//             fontFamily: "var(--font-display)", fontSize: "clamp(2.5rem, 6vw, 4rem)",
//             fontWeight: 400, letterSpacing: "-0.03em", lineHeight: 1.1,
//             color: "var(--foreground)", marginBottom: "1.25rem",
//           }}>
//             Wallet design,<br />
//             <em style={{ color: "var(--primary)", fontStyle: "italic" }}>security & AI integration.</em>
//           </h1>
//           <p style={{ color: "var(--muted-foreground)", fontSize: "1.1rem", lineHeight: 1.8 }}>
//             A complete walkthrough of how autonomous AI agents own and operate Solana wallets —
//             from keypair generation to encrypted keystores to live devnet transactions.
//           </p>
//         </div>

//         {/* Why agentic wallets */}
//         <Section title="1. Why agents need their own wallets">
//           <P>
//             Traditional Solana wallets (Phantom, Backpack) are built for humans. Every transaction
//             requires a UI prompt, a manual review, and a button click. AI agents can&apos;t do any of that —
//             they operate at machine speed, 24/7, and need to sign in milliseconds without blocking on
//             human approval.
//           </P>
//           <P>
//             An agentic wallet is a wallet the agent fully controls: it holds the private key, decides
//             when to sign, and broadcasts transactions autonomously. No human is in the loop at runtime.
//           </P>
//         </Section>

//         {/* Keypair generation */}
//         <Section title="2. Keypair generation">
//           <P>
//             Every agent gets a fresh ed25519 keypair generated via <Code>Keypair.generate()</Code> from{" "}
//             <Code>@solana/web3.js</Code>, which internally calls Node.js <Code>crypto.randomBytes</Code> —
//             seeded by the OS CSPRNG (<Code>/dev/urandom</Code> on Linux). This gives 256 bits of entropy,
//             sufficient for real-world use.
//           </P>
//           <CodeBlock>{`const { Keypair } = require("@solana/web3.js")

// // Each agent runs this independently — no shared seeds
// const keypair = Keypair.generate()
// console.log(keypair.publicKey.toBase58()) // agent's on-chain address`}</CodeBlock>
//           <P>
//             Each agent gets an independent keypair. There is no shared master seed. Compromise of one
//             agent&apos;s key does not affect any other agent in the fleet.
//           </P>
//         </Section>

//         {/* Encrypted keystore */}
//         <Section title="3. Encrypted keystore format">
//           <P>
//             Private keys at rest are encrypted with <strong style={{ color: "var(--foreground)" }}>AES-256-GCM</strong>.
//             The encryption password is hardened through <Code>scrypt</Code> — a memory-hard KDF that makes
//             brute-force attacks orders of magnitude more expensive.
//           </P>
//           <CodeBlock>{`// Keystore saved to disk — private key never in plaintext
// {
//   "version": "1.0",
//   "agentId": "alpha-trader",
//   "publicKey": "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
//   "encryptedKey": "a1b2c3d4...",   // AES-256-GCM ciphertext
//   "iv":  "f3a1...",                 // random 12-byte IV per save
//   "authTag": "8c2d...",            // GCM tag — detects any tampering
//   "network": "devnet"
// }`}</CodeBlock>
//           <P>
//             The <strong style={{ color: "var(--foreground)" }}>GCM auth tag</strong> is critical — if anyone
//             modifies even a single byte of the encrypted key on disk, decryption throws before returning
//             any key material. The IV is regenerated on every <Code>saveKeystore()</Code> call so no two
//             keystores look alike.
//           </P>
//         </Section>

//         {/* Autonomous signing flow */}
//         <Section title="4. Autonomous transaction signing flow">
//           <P>
//             This is the core of what makes a wallet &quot;agentic&quot; — transactions are signed entirely
//             in-process with no external calls, no UI prompts, and no human waiting.
//           </P>
//           <CodeBlock>{`// Inside AgentWallet.sendSOL()
// const transaction = new Transaction().add(
//   SystemProgram.transfer({
//     fromPubkey: this._keypair.publicKey,
//     toPubkey:   new PublicKey(recipient),
//     lamports:   Math.floor(amountSOL * LAMPORTS_PER_SOL),
//   })
// )

// // Agent signs autonomously — keypair is in RAM, no prompt needed
// const signature = await sendAndConfirmTransaction(
//   this.connection,
//   transaction,
//   [this._keypair],       // ← this is the autonomous signing step
//   { commitment: "confirmed" }
// )

// return { signature }     // confirmed on-chain`}</CodeBlock>
//           <P>
//             Solana&apos;s <Code>recentBlockhash</Code> mechanism prevents replay attacks — each transaction
//             includes a recent blockhash and is rejected by the network after ~90 seconds. The agent
//             fetches a fresh blockhash before every transaction.
//           </P>
//         </Section>

//         {/* AI decision loop */}
//         <Section title="5. The AI decision loop">
//           <P>
//             <Code>BaseAgent</Code> provides a three-step autonomous loop that runs on a configurable timer.
//             Subclasses implement strategy logic while the wallet layer handles all signing.
//           </P>
//           <CodeBlock>{`// The autonomous loop — runs every N seconds
// while (this.isRunning) {
//   const state    = await this.gatherState()    // fetch balance, market data
//   const decision = await this.makeDecision(state) // AI logic: buy? sell? hold?

//   if (decision) {
//     const result = await this.executeDecision(decision) // wallet signs + sends
//     this.emit("action", { decision, result })
//   }

//   await sleep(this.loopIntervalMs)
// }`}</CodeBlock>
//           <P>
//             The current <Code>TradingAgent</Code> uses rule-based momentum logic. To plug in a real
//             language model, replace <Code>makeDecision</Code> with an LLM call — the wallet layer below
//             it stays identical.
//           </P>
//         </Section>

//         {/* Multi-agent */}
//         <Section title="6. Multi-agent fleet architecture">
//           <P>
//             <Code>WalletRegistry</Code> manages a fleet of independent agents. Each agent has its own
//             keypair, its own encrypted keystore file, and its own autonomous loop running concurrently.
//             No state is shared between agents.
//           </P>
//           <CodeBlock>{`const registry = new WalletRegistry({
//   keystoreDir:   "./keystores",
//   encryptionKey: process.env.WALLET_ENCRYPTION_KEY,
// })

// // Spin up 3 agents — each gets an independent keypair
// await registry.createAgents(["alpha-trader", "beta-hodler", "gamma-arb"])

// // Aggregate balances across the fleet
// const balances = await registry.getAllBalances()
// // [{ agentId: "alpha-trader", balanceSOL: 0.95 }, ...]`}</CodeBlock>
//         </Section>

//         {/* Threat model */}
//         <Section title="7. Security threat model">
//           <table style={{
//             width: "100%", borderCollapse: "collapse",
//             border: "1px solid var(--border)", borderRadius: "12px",
//             overflow: "hidden",
//           }}>
//             <thead>
//               <tr style={{ background: "var(--muted)" }}>
//                 <th style={{ padding: "0.85rem 1rem", textAlign: "left", fontSize: "0.8rem", color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Threat</th>
//                 <th style={{ padding: "0.85rem 1rem", textAlign: "left", fontSize: "0.8rem", color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Mitigation</th>
//               </tr>
//             </thead>
//             <tbody>
//               <ThreatRow threat="Plaintext key on disk" mitigation="AES-256-GCM encryption — key never stored unencrypted" />
//               <ThreatRow threat="Tampered keystore file" mitigation="GCM auth tag — any modification detected on load" />
//               <ThreatRow threat="Weak encryption password" mitigation="scrypt KDF — brute force made computationally expensive" />
//               <ThreatRow threat="Transaction replay" mitigation="Solana blockhash expiry (~90 seconds)" />
//               <ThreatRow threat="Cross-agent key contamination" mitigation="Independent keypairs per agent — no shared material" />
//               <ThreatRow threat="Private key in logs" mitigation="toJSON() never exports key; logger redacts sensitive fields" />
//               <ThreatRow threat="Agent overspending" mitigation="MIN_BALANCE_SOL reserve + maxTradesPerSession cap enforced in strategy" />
//             </tbody>
//           </table>
//         </Section>

//         {/* Quick start */}
//         <Section title="8. Run it yourself">
//           <CodeBlock>{`git clone https://github.com/your-org/solana-agent-wallet
// cd solana-agent-wallet
// npm install
// cp .env.example .env.local

// # Single agent demo — creates wallet, airdrops SOL, signs tx
// npm run demo

// # 3 agents trading concurrently on devnet
// npm run multi-agent

// # Full test suite
// npm test`}</CodeBlock>
//           <P>
//             The demo runs entirely on Solana devnet — no real funds involved. Every transaction is
//             verifiable on{" "}
//             <a
//               href="https://explorer.solana.com/?cluster=devnet"
//               target="_blank"
//               rel="noopener noreferrer"
//               style={{ color: "var(--primary)", textDecoration: "underline" }}
//             >
//               Solana Explorer (devnet)
//             </a>.
//           </P>
//         </Section>

//       </main>
//       <Footer />
//     </>
//   )
// }

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

function CodeBlock({ children }: { children: string }) {
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
        display: "flex", alignItems: "center", gap: 6,
        padding: "0.65rem 1.1rem",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(255,255,255,0.02)",
      }}>
        {["#f87171","#facc15","#4ade80"].map((c) => (
          <span key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, display: "inline-block" }} />
        ))}
      </div>
      {/* Bottom glow line */}
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
      `}</style>

      <Navbar />

      {/* Page wrapper — full dark bg matching all sections */}
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

        {/* Ambient blob — top */}
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

        <main style={{
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

            <h1 style={{
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

            <p style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "0.95rem", lineHeight: 1.85,
              fontFamily: "'Space Mono', monospace",
              maxWidth: "58ch",
            }}>
              A complete walkthrough of how autonomous AI agents own and operate Solana wallets —
              from keypair generation to encrypted keystores to live devnet transactions.
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
            </P>
          </Section>

          <Section title="2. Keypair generation">
            <P>
              Every agent gets a fresh ed25519 keypair generated via <Code>Keypair.generate()</Code> from{" "}
              <Code>@solana/web3.js</Code>, which internally calls Node.js <Code>crypto.randomBytes</Code> —
              seeded by the OS CSPRNG (<Code>/dev/urandom</Code> on Linux). This gives 256 bits of entropy,
              sufficient for real-world use.
            </P>
            <CodeBlock>{`const { Keypair } = require("@solana/web3.js")

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
            <CodeBlock>{`// Keystore saved to disk — private key never in plaintext
{
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

          <Section title="4. Autonomous transaction signing flow">
            <P>
              This is the core of what makes a wallet &quot;agentic&quot; — transactions are signed entirely
              in-process with no external calls, no UI prompts, and no human waiting.
            </P>
            <CodeBlock>{`// Inside AgentWallet.sendSOL()
const transaction = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: this._keypair.publicKey,
    toPubkey:   new PublicKey(recipient),
    lamports:   Math.floor(amountSOL * LAMPORTS_PER_SOL),
  })
)

// Agent signs autonomously — keypair is in RAM, no prompt needed
const signature = await sendAndConfirmTransaction(
  this.connection,
  transaction,
  [this._keypair],       // ← this is the autonomous signing step
  { commitment: "confirmed" }
)

return { signature }     // confirmed on-chain`}</CodeBlock>
            <P>
              Solana&apos;s <Code>recentBlockhash</Code> mechanism prevents replay attacks — each transaction
              includes a recent blockhash and is rejected by the network after ~90 seconds. The agent
              fetches a fresh blockhash before every transaction.
            </P>
          </Section>

          <Section title="5. The AI decision loop">
            <P>
              <Code>BaseAgent</Code> provides a three-step autonomous loop that runs on a configurable timer.
              Subclasses implement strategy logic while the wallet layer handles all signing.
            </P>
            <CodeBlock>{`// The autonomous loop — runs every N seconds
while (this.isRunning) {
  const state    = await this.gatherState()    // fetch balance, market data
  const decision = await this.makeDecision(state) // AI logic: buy? sell? hold?

  if (decision) {
    const result = await this.executeDecision(decision) // wallet signs + sends
    this.emit("action", { decision, result })
  }

  await sleep(this.loopIntervalMs)
}`}</CodeBlock>
            <P>
              The current <Code>TradingAgent</Code> uses rule-based momentum logic. To plug in a real
              language model, replace <Code>makeDecision</Code> with an LLM call — the wallet layer below
              it stays identical.
            </P>
          </Section>

          <Section title="6. Multi-agent fleet architecture">
            <P>
              <Code>WalletRegistry</Code> manages a fleet of independent agents. Each agent has its own
              keypair, its own encrypted keystore file, and its own autonomous loop running concurrently.
              No state is shared between agents.
            </P>
            <CodeBlock>{`const registry = new WalletRegistry({
  keystoreDir:   "./keystores",
  encryptionKey: process.env.WALLET_ENCRYPTION_KEY,
})

// Spin up 3 agents — each gets an independent keypair
await registry.createAgents(["alpha-trader", "beta-hodler", "gamma-arb"])

// Aggregate balances across the fleet
const balances = await registry.getAllBalances()
// [{ agentId: "alpha-trader", balanceSOL: 0.95 }, ...]`}</CodeBlock>
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
                  <ThreatRow threat="Plaintext key on disk"       mitigation="AES-256-GCM encryption — key never stored unencrypted" />
                  <ThreatRow threat="Tampered keystore file"      mitigation="GCM auth tag — any modification detected on load" />
                  <ThreatRow threat="Weak encryption password"    mitigation="scrypt KDF — brute force made computationally expensive" />
                  <ThreatRow threat="Transaction replay"          mitigation="Solana blockhash expiry (~90 seconds)" />
                  <ThreatRow threat="Cross-agent contamination"   mitigation="Independent keypairs per agent — no shared material" />
                  <ThreatRow threat="Private key in logs"         mitigation="toJSON() never exports key; logger redacts sensitive fields" />
                  <ThreatRow threat="Agent overspending"          mitigation="MIN_BALANCE_SOL reserve + maxTradesPerSession cap enforced" />
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="8. Run it yourself">
            <CodeBlock>{`git clone https://github.com/your-org/solana-agent-wallet
cd solana-agent-wallet
npm install
cp .env.example .env.local

# Single agent demo — creates wallet, airdrops SOL, signs tx
npm run demo

# 3 agents trading concurrently on devnet
npm run multi-agent

# Full test suite
npm test`}</CodeBlock>
            <P>
              The demo runs entirely on Solana devnet — no real funds involved. Every transaction is
              verifiable on{" "}
              <a
                href="https://explorer.solana.com/?cluster=devnet"
                target="_blank"
                rel="noopener noreferrer"
                className="aw-about-link"
              >
                Solana Explorer (devnet)
              </a>.
            </P>
          </Section>

        </main>
      </div>

      <Footer />
    </>
  )
}