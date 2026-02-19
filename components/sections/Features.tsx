// const FEATURES = [
//   {
//     icon: "🔑",
//     title: "Programmatic wallet creation",
//     description:
//       "Each agent generates a fresh ed25519 keypair via Node.js crypto. No browser, no UI prompt — pure programmatic key generation.",
//   },
//   {
//     icon: "✍️",
//     title: "Autonomous transaction signing",
//     description:
//       "Agents sign and broadcast Solana transactions in milliseconds using their in-memory keypair — no human approval required at any step.",
//   },
//   {
//     icon: "🏦",
//     title: "SOL & SPL token support",
//     description:
//       "Wallets can hold, send, and receive native SOL and any SPL token. Token accounts are created automatically on first use.",
//   },
//   {
//     icon: "🔒",
//     title: "AES-256-GCM encrypted keystores",
//     description:
//       "Private keys are encrypted with AES-256-GCM + scrypt KDF before touching disk. The GCM auth tag detects any tampering.",
//   },
//   {
//     icon: "🤖",
//     title: "AI decision loop",
//     description:
//       "BaseAgent provides a gatherState → makeDecision → executeDecision loop. Swap in any model — rule-based, LLM, or RL agent.",
//   },
//   {
//     icon: "🌐",
//     title: "Multi-agent fleet",
//     description:
//       "WalletRegistry spins up N independent agents, each with its own keypair, keystore, and autonomous execution loop running concurrently.",
//   },
//   {
//     icon: "⚡",
//     title: "MockDex protocol interaction",
//     description:
//       "Agents trade against a simulated DEX that submits real Solana devnet transactions — proving actual signing and broadcasting works.",
//   },
//   {
//     icon: "📋",
//     title: "SKILLS.md for AI agents",
//     description:
//       "A machine-readable interface spec so other AI agents can discover and use the wallet API without reading human documentation.",
//   },
//   {
//     icon: "🛡️",
//     title: "Threat-modeled security",
//     description:
//       "Every threat — plaintext key leak, tampered keystore, replay attacks, cross-agent contamination — is documented and mitigated.",
//   },
// ]

// export function Features() {
//   return (
//     <section style={{ padding: "4rem 1.5rem 6rem", maxWidth: "1200px", margin: "0 auto" }}>
//       <div style={{ textAlign: "center", marginBottom: "4rem" }}>
//         <h2 style={{
//           fontFamily: "var(--font-display)",
//           fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 400,
//           letterSpacing: "-0.03em", marginBottom: "1rem",
//         }}>
//           Everything the bounty requires.
//         </h2>
//         <p style={{ color: "var(--muted-foreground)", fontSize: "1.05rem" }}>
//           Built and running on Solana devnet — not a mockup.
//         </p>
//       </div>

//       <div style={{
//         display: "grid",
//         gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
//         gap: "1px", background: "var(--border)",
//         border: "1px solid var(--border)", borderRadius: "24px",
//         overflow: "hidden",
//       }}>
//         {FEATURES.map(({ icon, title, description }) => (
//           <div key={title} style={{
//             background: "var(--card)", padding: "2rem",
//             transition: "background 0.2s",
//           }}>
//             <span style={{ fontSize: "1.75rem", display: "block", marginBottom: "1rem" }}>
//               {icon}
//             </span>
//             <h3 style={{
//               fontFamily: "var(--font-display)", fontSize: "1.15rem",
//               fontWeight: 400, letterSpacing: "-0.02em",
//               marginBottom: "0.5rem", color: "var(--foreground)",
//             }}>
//               {title}
//             </h3>
//             <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", lineHeight: 1.7 }}>
//               {description}
//             </p>
//           </div>
//         ))}
//       </div>
//     </section>
//   )
// }

import { Key, PenLine, Landmark, Lock, Bot, Globe, Zap, FileText, ShieldCheck } from "lucide-react"

const FEATURES = [
  {
    Icon: Key,
    accent: "#9945FF",
    rgb: "153,69,255",
    title: "Programmatic wallet creation",
    description:
      "Each agent generates a fresh ed25519 keypair via Node.js crypto. No browser, no UI prompt — pure programmatic key generation.",
  },
  {
    Icon: PenLine,
    accent: "#14F195",
    rgb: "20,241,149",
    title: "Autonomous transaction signing",
    description:
      "Agents sign and broadcast Solana transactions in milliseconds using their in-memory keypair — no human approval required at any step.",
  },
  {
    Icon: Landmark,
    accent: "#9945FF",
    rgb: "153,69,255",
    title: "SOL & SPL token support",
    description:
      "Wallets can hold, send, and receive native SOL and any SPL token. Token accounts are created automatically on first use.",
  },
  {
    Icon: Lock,
    accent: "#14F195",
    rgb: "20,241,149",
    title: "AES-256-GCM encrypted keystores",
    description:
      "Private keys are encrypted with AES-256-GCM + scrypt KDF before touching disk. The GCM auth tag detects any tampering.",
  },
  {
    Icon: Bot,
    accent: "#9945FF",
    rgb: "153,69,255",
    title: "AI decision loop",
    description:
      "BaseAgent provides a gatherState → makeDecision → executeDecision loop. Swap in any model — rule-based, LLM, or RL agent.",
  },
  {
    Icon: Globe,
    accent: "#14F195",
    rgb: "20,241,149",
    title: "Multi-agent fleet",
    description:
      "WalletRegistry spins up N independent agents, each with its own keypair, keystore, and autonomous execution loop running concurrently.",
  },
  {
    Icon: Zap,
    accent: "#9945FF",
    rgb: "153,69,255",
    title: "MockDex protocol interaction",
    description:
      "Agents trade against a simulated DEX that submits real Solana devnet transactions — proving actual signing and broadcasting works.",
  },
  {
    Icon: FileText,
    accent: "#14F195",
    rgb: "20,241,149",
    title: "SKILLS.md for AI agents",
    description:
      "A machine-readable interface spec so other AI agents can discover and use the wallet API without reading human documentation.",
  },
  {
    Icon: ShieldCheck,
    accent: "#9945FF",
    rgb: "153,69,255",
    title: "Threat-modeled security",
    description:
      "Every threat — plaintext key leak, tampered keystore, replay attacks, cross-agent contamination — is documented and mitigated.",
  },
]

export function Features() {
  return (
    <section style={{
      padding: "5rem 1.5rem 7rem",
      fontFamily: "'Space Mono', monospace",
      position: "relative",
      overflow: "hidden",
      background: "rgb(6, 6, 10)",
    }}>

      {/* Scanline texture — same as hero */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `repeating-linear-gradient(
          0deg,
          transparent, transparent 2px,
          rgba(255,255,255,0.013) 2px,
          rgba(255,255,255,0.013) 4px
        )`,
      }} />

      {/* Dot grid — same as hero */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: "64px 64px",
        maskImage: "radial-gradient(ellipse 90% 80% at 50% 50%, black 20%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 50% 50%, black 20%, transparent 100%)",
      }} />

      {/* Ambient blobs */}
      <div aria-hidden style={{
        position: "absolute", top: "5%", left: "0%",
        width: 400, height: 400, borderRadius: "50%", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle, rgba(153,69,255,0.08) 0%, transparent 70%)",
        filter: "blur(70px)",
      }} />
      <div aria-hidden style={{
        position: "absolute", bottom: "5%", right: "0%",
        width: 350, height: 350, borderRadius: "50%", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(circle, rgba(20,241,149,0.07) 0%, transparent 70%)",
        filter: "blur(70px)",
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto" }}>

        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.3rem 0.9rem", borderRadius: "99px",
            border: "1px solid rgba(153,69,255,0.3)",
            background: "rgba(153,69,255,0.07)",
            marginBottom: "1.25rem",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#9945FF",
              boxShadow: "0 0 8px rgba(153,69,255,0.9)",
              display: "inline-block",
            }} />
            <span style={{
              color: "#9945FF", fontSize: "0.7rem",
              letterSpacing: "0.12em", fontWeight: 700,
              textTransform: "uppercase",
            }}>
              Full Feature Set
            </span>
          </div>

          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800,
            letterSpacing: "-0.04em", marginBottom: "1rem",
            color: "#fff", lineHeight: 1.1,
          }}>
            Everything the bounty{" "}
            <span style={{
              background: "linear-gradient(90deg, #9945FF 0%, #14F195 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 16px rgba(20,241,149,0.25))",
            }}>requires.</span>
          </h2>
          <p style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: "0.8rem", letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            Built and running on Solana devnet — not a mockup.
          </p>
        </div>

        {/* Feature grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "20px",
          overflow: "hidden",
        }}>
          {FEATURES.map(({ Icon, accent, rgb, title, description }) => {
            const isPurple = rgb === "153,69,255"
            return (
              <div
                key={title}
                className={`aw-card ${isPurple ? "aw-card--purple" : "aw-card--green"}`}
                style={{
                  background: "rgb(6,6,10)",
                  padding: "2rem",
                  position: "relative",
                  overflow: "hidden",
                  cursor: "default",
                  transition: "background 0.3s ease",
                }}
              >
                {/* Radial spotlight — floods in from top on hover */}
                <div className="aw-card__radial" aria-hidden style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  background: `radial-gradient(circle 200px at 50% -20%, rgba(${rgb},0.22) 0%, transparent 70%)`,
                  opacity: 0,
                  transition: "opacity 0.4s ease",
                }} />

                {/* Top border laser line */}
                <div className="aw-card__topline" aria-hidden style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, height: "1px",
                  background: `linear-gradient(90deg, transparent, ${accent} 30%, ${accent} 70%, transparent)`,
                  opacity: 0,
                  transition: "opacity 0.35s ease",
                }} />

                {/* Corner spark — top left */}
                <div className="aw-card__spark" aria-hidden style={{
                  position: "absolute",
                  top: -5, left: -5,
                  width: 10, height: 10,
                  borderRadius: "50%",
                  background: accent,
                  boxShadow: `0 0 16px 6px ${accent}`,
                  opacity: 0,
                  transition: "opacity 0.35s ease",
                }} />

                {/* Icon tile */}
                <div className="aw-card__icon" style={{
                  width: 44, height: 44, borderRadius: "11px",
                  background: `rgba(${rgb}, 0.08)`,
                  border: `1px solid rgba(${rgb}, 0.18)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "1.25rem",
                  transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s",
                }}>
                  <Icon size={18} color={accent} strokeWidth={1.5} />
                </div>

                {/* Title */}
                <h3 style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "1rem", fontWeight: 700,
                  letterSpacing: "-0.02em",
                  marginBottom: "0.6rem",
                  color: "#fff",
                }}>
                  {title}
                </h3>

                {/* Description */}
                <p style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: "0.78rem",
                  lineHeight: 1.85,
                }}>
                  {description}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');

        .aw-card--purple:hover {
          background: rgba(153,69,255,0.05) !important;
        }
        .aw-card--purple:hover .aw-card__radial {
          opacity: 1 !important;
        }
        .aw-card--purple:hover .aw-card__topline {
          opacity: 1 !important;
        }
        .aw-card--purple:hover .aw-card__spark {
          opacity: 0.85 !important;
        }
        .aw-card--purple:hover .aw-card__icon {
          background: rgba(153,69,255,0.18) !important;
          border-color: rgba(153,69,255,0.5) !important;
          box-shadow: 0 0 24px rgba(153,69,255,0.35), inset 0 0 14px rgba(153,69,255,0.12) !important;
        }

        .aw-card--green:hover {
          background: rgba(20,241,149,0.03) !important;
        }
        .aw-card--green:hover .aw-card__radial {
          opacity: 1 !important;
        }
        .aw-card--green:hover .aw-card__topline {
          opacity: 1 !important;
        }
        .aw-card--green:hover .aw-card__spark {
          opacity: 0.85 !important;
        }
        .aw-card--green:hover .aw-card__icon {
          background: rgba(20,241,149,0.15) !important;
          border-color: rgba(20,241,149,0.45) !important;
          box-shadow: 0 0 24px rgba(20,241,149,0.28), inset 0 0 14px rgba(20,241,149,0.1) !important;
        }
      `}</style>
    </section>
  )
}