import Link from "next/link"

const LINKS = [
  { label: "Deep Dive", href: "/about" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Health", href: "/api/health" },
  { label: "GitHub", href: "https://github.com/emmyCode4495/agentixx", external: true },
]

const STATS = [
  { value: "ed25519", label: "Key Algorithm" },
  { value: "AES-256", label: "Encryption" },
  { value: "Devnet", label: "Network" },
]

export function Footer() {
  return (
    <footer style={{
      position: "relative",
      overflow: "hidden",
      background: "rgb(6, 6, 10)",
      fontFamily: "'Space Mono', monospace",
    }}>

      {/* Scanline */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `repeating-linear-gradient(
          0deg, transparent, transparent 2px,
          rgba(255,255,255,0.013) 2px, rgba(255,255,255,0.013) 4px
        )`,
      }} />

      {/* Top separator — same glowing gradient as navbar bottom border */}
      <div aria-hidden style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent 0%, #9945FF 20%, #14F195 50%, #9945FF 80%, transparent 100%)",
        opacity: 0.6,
        zIndex: 1,
      }} />

      {/* Ambient blob — top center */}
      <div aria-hidden style={{
        position: "absolute", top: "-60%", left: "50%",
        transform: "translateX(-50%)",
        width: 500, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(153,69,255,0.07) 0%, transparent 70%)",
        filter: "blur(60px)", pointerEvents: "none", zIndex: 0,
      }} />

      {/* ── MAIN CONTENT ── */}
      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: "1200px", margin: "0 auto",
        padding: "4rem 2rem 0",
      }}>

        {/* Top row */}
        <div style={{
          display: "flex", flexWrap: "wrap",
          justifyContent: "space-between", alignItems: "flex-start",
          gap: "2.5rem", marginBottom: "3rem",
        }}>

          {/* Brand block */}
          <div style={{ maxWidth: "320px" }}>
            <Link href="/" style={{
              display: "inline-flex", alignItems: "center", gap: "0.75rem",
              textDecoration: "none", marginBottom: "1rem",
            }}>
              <span style={{
                width: 36, height: 36, borderRadius: "10px",
                background: "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: "1rem",
                boxShadow: "0 0 16px rgba(153,69,255,0.4), 0 0 32px rgba(20,241,149,0.15)",
              }}>⚡</span>
              <span style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800, fontSize: "1.2rem",
                letterSpacing: "-0.04em",
                background: "linear-gradient(90deg, #fff 0%, #14F195 60%, #9945FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 10px rgba(20,241,149,0.3))",
              }}>Agentixx</span>
            </Link>
            <p style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: "0.78rem", lineHeight: 1.8,
              letterSpacing: "0.01em",
            }}>
              Autonomous AI agent wallets on Solana devnet. Programmatic keypairs, on-chain signing, zero human intervention.
            </p>

            {/* Status pill */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.3rem 0.8rem", borderRadius: "99px",
              border: "1px solid rgba(20,241,149,0.25)",
              background: "rgba(20,241,149,0.06)",
              marginTop: "1.25rem",
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#14F195",
                boxShadow: "0 0 6px rgba(20,241,149,0.9)",
                display: "inline-block",
                animation: "aw-ft-pulse 2s ease-in-out infinite",
              }} />
              <span style={{ color: "#14F195", fontSize: "0.65rem", letterSpacing: "0.1em", fontWeight: 700, textTransform: "uppercase" }}>
                All systems operational
              </span>
            </div>
          </div>

          {/* Stats + Links */}
          <div style={{ display: "flex", gap: "4rem", flexWrap: "wrap" }}>

            {/* Tech stats */}
            <div>
              <p style={{
                color: "rgba(255,255,255,0.2)", fontSize: "0.65rem",
                letterSpacing: "0.12em", textTransform: "uppercase",
                marginBottom: "1rem",
              }}>Tech Stack</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {STATS.map(({ value, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 800, fontSize: "0.9rem",
                      background: "linear-gradient(90deg, #9945FF, #14F195)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}>{value}</span>
                    <span style={{
                      width: 1, height: 12,
                      background: "rgba(255,255,255,0.1)",
                      display: "inline-block",
                    }} />
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", letterSpacing: "0.04em" }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nav links */}
            <div>
              <p style={{
                color: "rgba(255,255,255,0.2)", fontSize: "0.65rem",
                letterSpacing: "0.12em", textTransform: "uppercase",
                marginBottom: "1rem",
              }}>Navigate</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {LINKS.map(({ label, href, external }) => (
                  <a
                    key={label}
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="aw-footer-link"
                    style={{
                      color: "rgba(255,255,255,0.35)",
                      fontSize: "0.82rem", textDecoration: "none",
                      display: "inline-flex", alignItems: "center", gap: "0.4rem",
                      transition: "color 0.2s",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {external && (
                      <span style={{ fontSize: "0.65rem", opacity: 0.5 }}>↗</span>
                    )}
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 20%, rgba(255,255,255,0.07) 80%, transparent)",
          marginBottom: "1.5rem",
        }} />

        {/* Bottom row */}
        <div style={{
          display: "flex", flexWrap: "wrap",
          justifyContent: "space-between", alignItems: "center",
          gap: "1rem", paddingBottom: "2rem",
        }}>
          <p style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.7rem", letterSpacing: "0.06em" }}>
            © {new Date().getFullYear()} Agentixx — Built on Solana
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Powered by
            </span>
            <span style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 800,
              fontSize: "0.75rem", letterSpacing: "0.02em",
              background: "linear-gradient(90deg, #9945FF, #14F195)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>Solana</span>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');

        @keyframes aw-ft-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(20,241,149,0.9); }
          50%       { opacity: 0.5; box-shadow: 0 0 14px rgba(20,241,149,0.4); }
        }

        .aw-footer-link:hover {
          color: rgba(255,255,255,0.75) !important;
        }
      `}</style>
    </footer>
  )
}