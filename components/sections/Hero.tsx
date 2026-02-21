import Link from "next/link"
import {
  Zap,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Cpu,
  ShieldCheck,
} from "lucide-react"

export function Hero() {
  return (
    <section style={{
      minHeight: "100dvh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "5rem 1.5rem 3rem", textAlign: "center",
      position: "relative", overflow: "hidden",
      background: "rgb(6, 6, 10)",
      fontFamily: "'Space Mono', monospace",
    }}>

      {/* ── BACKGROUND LAYERS ── */}

      {/* Scanline texture — matches navbar */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          rgba(255,255,255,0.013) 2px,
          rgba(255,255,255,0.013) 4px
        )`,
        zIndex: 0,
      }} />

      {/* Center radial glow */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(153,69,255,0.09) 0%, transparent 70%)",
        zIndex: 0,
      }} />

      {/* Purple blob — top right */}
      <div aria-hidden style={{
        position: "absolute", top: "12%", right: "5%",
        width: 320, height: 320, borderRadius: "50%",
        pointerEvents: "none",
        background: "radial-gradient(circle, rgba(153,69,255,0.12) 0%, transparent 70%)",
        filter: "blur(50px)", zIndex: 0,
      }} />

      {/* Green blob — bottom left */}
      <div aria-hidden style={{
        position: "absolute", bottom: "18%", left: "4%",
        width: 260, height: 260, borderRadius: "50%",
        pointerEvents: "none",
        background: "radial-gradient(circle, rgba(20,241,149,0.08) 0%, transparent 70%)",
        filter: "blur(50px)", zIndex: 0,
      }} />

      {/* Subtle grid overlay */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: "64px 64px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 30%, transparent 100%)",
        zIndex: 0,
      }} />

      {/* ── CONTENT ── */}
      <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* Eyebrow badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          padding: "0.3rem 0.9rem", borderRadius: "99px",
          border: "1px solid rgba(20,241,149,0.3)",
          background: "rgba(20,241,149,0.07)",
          marginBottom: "1.5rem",
          animation: "aw-fadeIn 0.5s ease forwards",
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#14f195",
            boxShadow: "0 0 8px rgba(20,241,149,0.9)",
            display: "inline-block",
            animation: "aw-pulse 2s ease-in-out infinite",
          }} />
          <span style={{
            color: "#14f195", fontSize: "0.72rem",
            letterSpacing: "0.12em", fontWeight: 700,
            textTransform: "uppercase",
          }}>
            Live on Solana Devnet
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "clamp(2.75rem, 9vw, 6.5rem)", fontWeight: 800,
          lineHeight: 1.05, letterSpacing: "-0.04em",
          color: "#fff", maxWidth: "14ch",
          marginBottom: "1.25rem",
          animation: "aw-slideUp 0.65s ease forwards",
          animationDelay: "0.08s", opacity: 0,
        }}>
          AI agents that own{" "}
          <em style={{
            fontStyle: "italic",
            background: "linear-gradient(90deg, #9945FF 0%, #14F195 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 20px rgba(20,241,149,0.3))",
          }}>their own wallets.</em>
        </h1>

        {/* Subheadline */}
        <p style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: "clamp(0.9rem, 1.8vw, 1.05rem)", lineHeight: 1.8,
          maxWidth: "48ch", marginBottom: "2rem",
          fontFamily: "'Space Mono', monospace",
          animation: "aw-slideUp 0.65s ease forwards",
          animationDelay: "0.16s", opacity: 0,
        }}>
          Autonomous Solana wallets for AI agents — create keypairs, sign transactions,
          hold SOL &amp; SPL tokens, and trade on-chain with zero human intervention.
        </p>

        {/* Code snippet */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "14px", padding: "1rem 1.35rem",
          fontFamily: "'Space Mono', monospace", fontSize: "0.78rem",
          color: "rgba(255,255,255,0.45)", marginBottom: "2.25rem",
          textAlign: "left", maxWidth: "460px", width: "100%",
          animation: "aw-slideUp 0.65s ease forwards",
          animationDelay: "0.22s", opacity: 0,
          position: "relative",
          boxShadow: "0 0 0 1px rgba(153,69,255,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}>
          {/* Top bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            marginBottom: "0.75rem", paddingBottom: "0.75rem",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            {["#f87171","#facc15","#4ade80"].map((c) => (
              <span key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, display: "inline-block" }} />
            ))}
            <span style={{ marginLeft: 6, fontSize: "0.65rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.08em" }}>
              AgentWallet.ts
            </span>
          </div>
          {/* Code lines */}
          <div style={{ lineHeight: 1.9 }}>
            <span style={{ color: "rgba(255,255,255,0.25)" }}>{"// autonomous — no human needed"}</span>
            <br />
            <span style={{ color: "#7dd3fc" }}>const</span>
            {" "}<span style={{ color: "#fff" }}>{"{ signature }"}</span>
            {" "}<span style={{ color: "#7dd3fc" }}>=</span>
            {" "}<span style={{ color: "#86efac" }}>await</span>
            {" "}<span style={{ color: "#fff" }}>wallet</span>
            <span style={{ color: "#fcd34d" }}>.sendSOL</span>
            <span style={{ color: "#fff" }}>(to, </span>
            <span style={{ color: "#f9a8d4" }}>0.1</span>
            <span style={{ color: "#fff" }}>)</span>
            <br />
            <span style={{ color: "#7dd3fc" }}>const</span>
            {" "}<span style={{ color: "#fff" }}>decision</span>
            {" "}<span style={{ color: "#7dd3fc" }}>=</span>
            {" "}<span style={{ color: "#86efac" }}>await</span>
            {" "}<span style={{ color: "#fff" }}>agent</span>
            <span style={{ color: "#fcd34d" }}>.makeDecision</span>
            <span style={{ color: "#fff" }}>(state)</span>
          </div>
          {/* Glow accent on code block */}
          <div aria-hidden style={{
            position: "absolute", bottom: -1, left: "10%", right: "10%", height: 1,
            background: "linear-gradient(90deg, transparent, #9945FF 40%, #14F195 60%, transparent)",
            opacity: 0.5,
          }} />
        </div>

        {/* CTAs */}
        <div style={{
          display: "flex", gap: "0.65rem", flexWrap: "wrap", justifyContent: "center",
          animation: "aw-slideUp 0.65s ease forwards",
          animationDelay: "0.28s", opacity: 0,
          marginBottom: "2.75rem",
        }}>
          {/* Primary CTA — matches navbar button */}
          <Link href="/dashboard" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "0.75rem 1.75rem",
            background: "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
            color: "#000", borderRadius: "10px",
            fontWeight: 700, fontSize: "0.82rem",
            fontFamily: "'Space Mono', monospace",
            letterSpacing: "0.02em",
            textDecoration: "none",
            boxShadow: "0 0 20px rgba(153,69,255,0.35), 0 0 40px rgba(20,241,149,0.15)",
            transition: "opacity 0.2s, transform 0.15s",
          }}>
            <Zap size={14} />
            Watch agents live
            <ArrowRight size={13} />
          </Link>

          {/* Secondary CTA */}
          <Link href="/about" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "0.75rem 1.75rem",
            background: "rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.55)", borderRadius: "10px",
            fontSize: "0.82rem",
            fontFamily: "'Space Mono', monospace",
            border: "1px solid rgba(255,255,255,0.1)",
            textDecoration: "none",
            transition: "color 0.2s, border-color 0.2s, background 0.2s",
          }}>
            <BookOpen size={13} />
            Read the deep dive
          </Link>
        </div>

        {/* Trust strip */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem 2rem", flexWrap: "wrap",
          justifyContent: "center",
          animation: "aw-fadeIn 0.6s ease forwards",
          animationDelay: "0.4s", opacity: 0,
        }}>
          {[
            { Icon: ShieldCheck, label: "AES-256-GCM encrypted keys" },
            { Icon: Cpu,         label: "Autonomous decision loop" },
            { Icon: CheckCircle, label: "Real devnet transactions" },
          ].map(({ Icon, label }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 7,
              color: "rgba(255,255,255,0.3)", fontSize: "0.72rem",
              letterSpacing: "0.04em", textTransform: "uppercase",
            }}>
              <Icon size={13} color="#14F195" style={{ flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');

        @keyframes aw-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(20,241,149,0.9); }
          50%       { opacity: 0.5; box-shadow: 0 0 16px rgba(20,241,149,0.4); }
        }
        @keyframes aw-fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes aw-slideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}