"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { House, BookOpen, LayoutDashboard } from "lucide-react"

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "Deep Dive" },
  { href: "/dashboard", label: "Live Dashboard" },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');

        .agw-navbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          height: 68px;
          padding: 0 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(6, 6, 10, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          font-family: 'Space Mono', monospace;
        }

        /* scanline overlay */
        .agw-navbar::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.015) 2px,
            rgba(255,255,255,0.015) 4px
          );
          pointer-events: none;
        }

        /* bottom glow line */
        .agw-navbar::after {
          content: '';
          position: absolute;
          bottom: -1px; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            #9945FF 20%,
            #14F195 50%,
            #9945FF 80%,
            transparent 100%
          );
          opacity: 0.7;
        }

        /* ── LOGO ── */
        .agw-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          position: relative;
        }

        .agw-logo-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #9945FF 0%, #14F195 100%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
          box-shadow: 0 0 16px rgba(153, 69, 255, 0.5), 0 0 32px rgba(20, 241, 149, 0.2);
          position: relative;
        }

        .agw-logo-icon::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 12px;
          background: linear-gradient(135deg, #9945FF, #14F195);
          z-index: -1;
          opacity: 0.3;
          filter: blur(6px);
        }

        .agw-logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
          gap: 2px;
        }

        .agw-logo-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1.35rem;
          letter-spacing: -0.04em;
          background: linear-gradient(90deg, #fff 0%, #14F195 60%, #9945FF 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          white-space: nowrap;
          text-shadow: none;
          filter: drop-shadow(0 0 12px rgba(20, 241, 149, 0.4));
        }

        .agw-logo-tag {
          font-family: 'Space Mono', monospace;
          font-size: 0.55rem;
          color: #14F195;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          opacity: 0.75;
        }

        /* ── NAV LINKS (desktop) ── */
        .agw-nav {
          display: flex;
          align-items: center;
          gap: 0.15rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 0.25rem;
        }

        .agw-link {
          padding: 0.45rem 1rem;
          border-radius: 9px;
          font-size: 0.8rem;
          font-weight: 400;
          color: rgba(255,255,255,0.45);
          background: transparent;
          text-decoration: none;
          transition: color 0.2s, background 0.2s;
          letter-spacing: 0.02em;
          position: relative;
          white-space: nowrap;
        }

        .agw-link:hover {
          color: rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.05);
        }

        .agw-link.active {
          color: #fff;
          background: linear-gradient(135deg, rgba(153,69,255,0.25) 0%, rgba(20,241,149,0.15) 100%);
          border: 1px solid rgba(153,69,255,0.3);
          font-weight: 700;
        }

        .agw-link.active::before {
          content: '';
          position: absolute;
          bottom: -1px; left: 20%; right: 20%;
          height: 2px;
          background: linear-gradient(90deg, #9945FF, #14F195);
          border-radius: 2px;
        }

        /* ── CTA BUTTON ── */
        .agw-cta {
          padding: 0.5rem 1.25rem;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 700;
          font-family: 'Space Mono', monospace;
          letter-spacing: 0.03em;
          text-decoration: none;
          position: relative;
          background: linear-gradient(135deg, #9945FF 0%, #14F195 100%);
          color: #000;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.15s;
          white-space: nowrap;
          box-shadow: 0 0 20px rgba(153, 69, 255, 0.35), 0 0 40px rgba(20, 241, 149, 0.15);
        }

        .agw-cta:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 0 28px rgba(153, 69, 255, 0.5), 0 0 56px rgba(20, 241, 149, 0.25);
        }

        .agw-cta:active {
          transform: translateY(0);
        }

        /* pulse dot on live dashboard link */
        .agw-pulse {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #14F195;
          border-radius: 50%;
          margin-right: 5px;
          vertical-align: middle;
          position: relative;
          top: -1px;
          box-shadow: 0 0 6px #14F195;
          animation: agw-blink 1.8s ease-in-out infinite;
        }

        @keyframes agw-blink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }

        /* ── MOBILE BOTTOM TAB BAR ── */
        .agw-mobile-tabs {
          display: none;
        }

        @media (max-width: 640px) {
          /* Hide desktop nav and CTA */
          .agw-nav {
            display: none;
          }
          .agw-cta {
            display: none;
          }

          /* Show mobile bottom tab bar */
          .agw-mobile-tabs {
            display: flex;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            z-index: 50;
            height: 64px;
            background: rgba(6, 6, 10, 0.92);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-top: 1px solid rgba(255,255,255,0.06);
            align-items: stretch;
            font-family: 'Space Mono', monospace;
          }

          /* top glow line on tab bar */
          .agw-mobile-tabs::before {
            content: '';
            position: absolute;
            top: -1px; left: 0; right: 0;
            height: 1px;
            background: linear-gradient(
              90deg,
              transparent 0%,
              #9945FF 20%,
              #14F195 50%,
              #9945FF 80%,
              transparent 100%
            );
            opacity: 0.7;
          }

          .agw-tab-link {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            text-decoration: none;
            color: rgba(255,255,255,0.4);
            font-size: 0.6rem;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            transition: color 0.2s;
            position: relative;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }

          .agw-tab-link:hover {
            color: rgba(255,255,255,0.75);
          }

          .agw-tab-link.active {
            color: #14F195;
          }

          /* active indicator line at top of tab */
          .agw-tab-link.active::after {
            content: '';
            position: absolute;
            top: 0; left: 20%; right: 20%;
            height: 2px;
            background: linear-gradient(90deg, #9945FF, #14F195);
            border-radius: 0 0 2px 2px;
          }

          .agw-tab-icon {
            font-size: 1.1rem;
            line-height: 1;
          }

          .agw-tab-label {
            font-size: 0.55rem;
            letter-spacing: 0.05em;
          }

          /* pulse dot inside tab */
          .agw-tab-link .agw-pulse {
            position: absolute;
            top: 10px;
            right: calc(50% - 18px);
            margin: 0;
          }
        }
      `}</style>

      {/* ── DESKTOP / TABLET HEADER ── */}
      <header className="agw-navbar">
        {/* LOGO */}
        <Link href="/" className="agw-logo">
          <span className="agw-logo-icon">⚡</span>
          <span className="agw-logo-text">
            <span className="agw-logo-name">Agentixx</span>
            <span className="agw-logo-tag">on Solana</span>
          </span>
        </Link>

        {/* NAV (hidden on mobile) */}
        <nav className="agw-nav">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive = pathname === href
            const isLive = label === "Live Dashboard"
            return (
              <Link
                key={href}
                href={href}
                className={`agw-link${isActive ? " active" : ""}`}
              >
                {isLive && <span className="agw-pulse" />}
                {label}
              </Link>
            )
          })}
        </nav>

        {/* CTA (hidden on mobile) */}
        <a
          href="https://github.com/emmyCode4495/agentixx"
          target="_blank"
          rel="noopener noreferrer"
          className="agw-cta"
        >
          GitHub →
        </a>
      </header>

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      <nav className="agw-mobile-tabs">
        {NAV_LINKS.map(({ href, label }) => {
          const isActive = pathname === href
          const isLive = label === "Live Dashboard"
          const Icon =
            label === "Home" ? House :
            label === "Deep Dive" ? BookOpen :
            LayoutDashboard
          return (
            <Link
              key={href}
              href={href}
              className={`agw-tab-link${isActive ? " active" : ""}`}
            >
              {isLive && <span className="agw-pulse" />}
              <span className="agw-tab-icon"><Icon size={20} strokeWidth={1.75} /></span>
              <span className="agw-tab-label">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}