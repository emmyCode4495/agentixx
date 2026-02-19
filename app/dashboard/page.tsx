
/**
 * app/dashboard/page.tsx
 * Real-time agent dashboard — polls /api/agents every 8s,
 * executes real on-chain trades, shows live devnet data.
 */
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Zap, CircleDot, TrendingUp, TrendingDown, Minus, Fuel,
  ClipboardList, ExternalLink, Copy, Check, RefreshCw, Key,
  Wifi, BookOpen, AlertTriangle, CheckCircle, X, Loader,
  Activity, Wallet, ArrowUpRight, ArrowDownRight, Clock, Info,
} from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"

// ── Types ─────────────────────────────────────────────────────────
interface TradeRecord {
  id: string; type: "BUY" | "SELL" | "HOLD"; amountSOL: number
  price: number; signature?: string; timestamp: string; reason: string
}
interface Agent {
  id: string; publicKey: string
  status: "initializing" | "funded" | "running" | "idle" | "error"
  balanceSOL: number; tradeCount: number; lastTrade: TradeRecord | null
  pnl: number; lastUpdated: string; error?: string; explorerUrl: string
}
interface AgentsResponse {
  ok: boolean; initialized: boolean; initializing: boolean; agents: Agent[]; error?: string
}
interface TxRecord {
  signature: string; slot: number; blockTime: number | null; err: unknown; explorerUrl: string
}
interface Toast {
  id: number; message: string; type: "success" | "error" | "info"; url?: string
}

// ── Helpers ───────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 5000) return "just now"
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return `${Math.floor(diff / 3600000)}h ago`
}
function shortKey(key: string): string { return `${key.slice(0, 6)}…${key.slice(-6)}` }

// ── CopyButton ────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handle = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={handle} title="Copy address" style={{
      background: "none", border: "none", cursor: "pointer",
      color: copied ? "#14F195" : "rgba(255,255,255,0.3)",
      display: "inline-flex", alignItems: "center", padding: 2,
      transition: "color 0.2s",
    }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  )
}

// ── StatusPill ────────────────────────────────────────────────────
function StatusPill({ status }: { status: Agent["status"] }) {
  const map: Record<Agent["status"], { color: string; bg: string; border: string; label: string; Icon: React.FC<{ size?: number }> }> = {
    initializing: { color: "#93c5fd", bg: "rgba(147,197,253,0.08)", border: "rgba(147,197,253,0.2)", label: "Initializing", Icon: ({ size }) => <Loader size={size} style={{ animation: "aw-spin 1s linear infinite" }} /> },
    funded:       { color: "#fcd34d", bg: "rgba(252,211,77,0.08)",  border: "rgba(252,211,77,0.2)",  label: "Funded",       Icon: ({ size }) => <Wallet size={size} /> },
    running:      { color: "#14F195", bg: "rgba(20,241,149,0.08)",  border: "rgba(20,241,149,0.25)", label: "Running",      Icon: ({ size }) => <Activity size={size} /> },
    idle:         { color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)", label: "Idle", Icon: ({ size }) => <Minus size={size} /> },
    error:        { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)", label: "Error",        Icon: ({ size }) => <AlertTriangle size={size} /> },
  }
  const { color, bg, border, label, Icon } = map[status]
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "0.2rem 0.6rem", borderRadius: 99,
      background: bg, border: `1px solid ${border}`, color,
      fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", fontFamily: "'Space Mono', monospace",
    }}>
      <Icon size={10} />
      {label}
    </span>
  )
}

// ── TradeBadge ────────────────────────────────────────────────────
function TradeBadge({ type }: { type: TradeRecord["type"] }) {
  const map = {
    BUY:  { bg: "rgba(20,241,149,0.1)",   color: "#14F195", border: "rgba(20,241,149,0.25)",  Icon: ArrowUpRight },
    SELL: { bg: "rgba(248,113,113,0.1)",  color: "#f87171", border: "rgba(248,113,113,0.25)", Icon: ArrowDownRight },
    HOLD: { bg: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)", border: "rgba(255,255,255,0.08)", Icon: Minus },
  }
  const { bg, color, border, Icon } = map[type]
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "0.2rem 0.6rem", borderRadius: 99,
      background: bg, border: `1px solid ${border}`, color,
      fontSize: "0.7rem", fontWeight: 700, fontFamily: "'Space Mono', monospace",
      letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0,
    }}>
      <Icon size={10} />
      {type}
    </span>
  )
}

// ── StatCard ──────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, loading, icon: Icon }: {
  label: string; value: string; sub?: string; accent?: boolean; loading?: boolean
  icon: React.FC<{ size?: number; color?: string }>
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, padding: "1.4rem 1.5rem",
      position: "relative", overflow: "hidden",
      boxShadow: accent ? "0 0 0 1px rgba(153,69,255,0.1)" : "none",
      fontFamily: "'Space Mono', monospace",
    }}>
      {accent && (
        <div aria-hidden style={{
          position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
          background: "linear-gradient(90deg, transparent, #9945FF 40%, #14F195 60%, transparent)",
          opacity: 0.6,
        }} />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {label}
        </p>
        <Icon size={14} color={accent ? "#9945FF" : "rgba(255,255,255,0.2)"} />
      </div>
      <p style={{
        fontFamily: "'Syne', sans-serif", fontSize: "1.85rem", fontWeight: 800,
        letterSpacing: "-0.04em",
        color: loading ? "rgba(255,255,255,0.1)" : accent
          ? "transparent"
          : "#fff",
        background: (!loading && accent)
          ? "linear-gradient(90deg, #9945FF, #14F195)"
          : "none",
        WebkitBackgroundClip: (!loading && accent) ? "text" : "unset",
        WebkitTextFillColor: (!loading && accent) ? "transparent" : "unset",
        backgroundClip: (!loading && accent) ? "text" : "unset",
        lineHeight: 1, transition: "color 0.3s",
      }}>
        {loading ? "—" : value}
      </p>
      {sub && <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.7rem", marginTop: 5, letterSpacing: "0.04em" }}>{sub}</p>}
    </div>
  )
}

// ── AgentCard ─────────────────────────────────────────────────────
function AgentCard({ agent, onTrade, onAirdrop, onViewHistory, trading, dropping }: {
  agent: Agent
  onTrade: (id: string, type: "BUY" | "SELL" | "HOLD") => void
  onAirdrop: (id: string) => void
  onViewHistory: (id: string) => void
  trading: boolean; dropping: boolean
}) {
  const isRunning = agent.status === "running"
  const accentColor = isRunning ? "#14F195" : "rgba(255,255,255,0.06)"

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: `1px solid ${isRunning ? "rgba(20,241,149,0.2)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 20, padding: "1.75rem",
      display: "flex", flexDirection: "column", gap: "1.25rem",
      transition: "border-color 0.3s",
      position: "relative", overflow: "hidden",
      fontFamily: "'Space Mono', monospace",
    }}>
      {/* Top glow if running */}
      {isRunning && (
        <div aria-hidden style={{
          position: "absolute", top: 0, left: "5%", right: "5%", height: "1px",
          background: "linear-gradient(90deg, transparent, #14F195 40%, #9945FF 60%, transparent)",
          opacity: 0.7,
        }} />
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Zap size={12} color="#9945FF" />
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.75rem", color: "#9945FF", letterSpacing: "0.04em" }}>
              {agent.id}
            </p>
          </div>
          <StatusPill status={agent.status} />
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{
            fontFamily: "'Syne', sans-serif", fontSize: "1.9rem", fontWeight: 800,
            letterSpacing: "-0.04em",
            background: "linear-gradient(90deg, #fff 0%, #14F195 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            lineHeight: 1,
          }}>
            {agent.balanceSOL.toFixed(4)}
          </p>
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>SOL</p>
        </div>
      </div>

      {/* Public key */}
      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 10, padding: "0.6rem 0.85rem",
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Key size={10} color="rgba(255,255,255,0.2)" />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>
            {shortKey(agent.publicKey)}
          </span>
          <CopyButton text={agent.publicKey} />
        </div>
        <a href={agent.explorerUrl} target="_blank" rel="noopener noreferrer" style={{
          display: "inline-flex", alignItems: "center", gap: 3,
          color: "#14F195", fontSize: "0.68rem", textDecoration: "none",
          letterSpacing: "0.04em",
        }}>
          Explorer <ExternalLink size={9} />
        </a>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "Trades", value: String(agent.tradeCount), color: "#fff", Icon: <Activity size={10} color="rgba(255,255,255,0.2)" /> },
          {
            label: "P&L",
            value: `${agent.pnl >= 0 ? "+" : ""}${agent.pnl.toFixed(4)}`,
            color: agent.pnl >= 0 ? "#14F195" : "#f87171",
            Icon: agent.pnl >= 0
              ? <TrendingUp size={10} color="#14F195" />
              : <TrendingDown size={10} color="#f87171" />,
          },
          { label: "Updated", value: timeAgo(agent.lastUpdated), color: "rgba(255,255,255,0.3)", Icon: <Clock size={10} color="rgba(255,255,255,0.2)" /> },
        ].map(({ label, value, color, Icon }) => (
          <div key={label} style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 10, padding: "0.65rem 0.5rem", textAlign: "center",
          }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>{Icon}</div>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{label}</p>
            <p style={{ color, fontSize: "0.78rem", fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Last trade */}
      {agent.lastTrade && (
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1rem",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <TradeBadge type={agent.lastTrade.type} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.73rem", lineHeight: 1.6 }}>
              {agent.lastTrade.reason}
            </p>
            {agent.lastTrade.signature && !agent.lastTrade.signature.startsWith("simulated") && (
              <a
                href={`https://explorer.solana.com/tx/${agent.lastTrade.signature}?cluster=devnet`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 3,
                  color: "#14F195", fontSize: "0.68rem",
                  fontFamily: "'Space Mono', monospace", textDecoration: "none", marginTop: 4,
                }}
              >
                {agent.lastTrade.signature.slice(0, 16)}… <ExternalLink size={9} />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {agent.error && (
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 8,
          background: "rgba(248,113,113,0.07)", padding: "0.65rem 0.85rem",
          borderRadius: 10, border: "1px solid rgba(248,113,113,0.2)",
        }}>
          <AlertTriangle size={12} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ color: "#f87171", fontSize: "0.73rem", lineHeight: 1.5 }}>{agent.error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(["BUY", "SELL", "HOLD"] as const).map((type) => {
          const IconMap = { BUY: ArrowUpRight, SELL: ArrowDownRight, HOLD: Minus }
          const BtnIcon = IconMap[type]
          const colors = {
            BUY:  { bg: "rgba(20,241,149,0.08)",   color: "#14F195", border: "rgba(20,241,149,0.25)",  hover: "rgba(20,241,149,0.15)" },
            SELL: { bg: "rgba(248,113,113,0.08)",  color: "#f87171", border: "rgba(248,113,113,0.25)", hover: "rgba(248,113,113,0.15)" },
            HOLD: { bg: "rgba(255,255,255,0.03)",  color: "rgba(255,255,255,0.35)", border: "rgba(255,255,255,0.08)", hover: "rgba(255,255,255,0.06)" },
          }
          const c = colors[type]
          return (
            <button key={type} onClick={() => onTrade(agent.id, type)}
              disabled={trading || agent.status === "initializing"}
              className={`aw-action-btn aw-action-btn--${type.toLowerCase()}`}
              style={{
                flex: 1, padding: "0.6rem 0",
                background: c.bg, color: c.color,
                border: `1px solid ${c.border}`,
                borderRadius: 10, cursor: "pointer",
                fontSize: "0.72rem", fontWeight: 700,
                fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em",
                opacity: trading ? 0.4 : 1, transition: "opacity 0.2s, background 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}
            >
              {trading
                ? <Loader size={11} style={{ animation: "aw-spin 0.8s linear infinite" }} />
                : <><BtnIcon size={11} />{type}</>
              }
            </button>
          )
        })}

        <button onClick={() => onAirdrop(agent.id)} disabled={dropping}
          title="Request 1 SOL devnet airdrop"
          style={{
            padding: "0.6rem 0.85rem",
            background: "rgba(147,197,253,0.07)", color: "#93c5fd",
            border: "1px solid rgba(147,197,253,0.18)",
            borderRadius: 10, cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            opacity: dropping ? 0.4 : 1, transition: "opacity 0.2s",
          }}>
          {dropping
            ? <Loader size={13} style={{ animation: "aw-spin 0.8s linear infinite" }} />
            : <Fuel size={13} />
          }
        </button>

        <button onClick={() => onViewHistory(agent.id)} title="View on-chain tx history"
          style={{
            padding: "0.6rem 0.85rem",
            background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.3)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10, cursor: "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
          <ClipboardList size={13} />
        </button>
      </div>
    </div>
  )
}

// ── HistoryModal ──────────────────────────────────────────────────
function HistoryModal({ agentId, txs, loading, onClose }: {
  agentId: string; txs: TxRecord[]; loading: boolean; onClose: () => void
}) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(6,6,10,0.9)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20, width: "100%", maxWidth: 640,
        maxHeight: "80vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 0 0 1px rgba(153,69,255,0.1), 0 40px 80px rgba(0,0,0,0.6)",
        position: "relative",
      }}>
        {/* Top glow */}
        <div aria-hidden style={{
          position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
          background: "linear-gradient(90deg, transparent, #9945FF 40%, #14F195 60%, transparent)",
          opacity: 0.7,
        }} />

        {/* Header */}
        <div style={{
          padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "rgba(153,69,255,0.1)", border: "1px solid rgba(153,69,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <BookOpen size={15} color="#9945FF" />
            </div>
            <div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: "1rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                On-chain History
              </p>
              <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>
                {agentId} · Solana devnet
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.4)", width: 32, height: 32, borderRadius: "50%",
            cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            <X size={13} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.3)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, fontFamily: "'Space Mono', monospace", fontSize: "0.8rem" }}>
              <Loader size={20} style={{ animation: "aw-spin 0.8s linear infinite" }} color="#9945FF" />
              Fetching from devnet…
            </div>
          ) : txs.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "rgba(255,255,255,0.25)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, fontFamily: "'Space Mono', monospace", fontSize: "0.8rem" }}>
              <Activity size={20} color="rgba(255,255,255,0.15)" />
              No transactions yet. Run a trade first.
            </div>
          ) : txs.map((tx) => (
            <div key={tx.signature} style={{
              padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.04)",
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
              transition: "background 0.2s",
            }} className="aw-history-row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <a href={tx.explorerUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  fontFamily: "'Space Mono', monospace", fontSize: "0.72rem",
                  color: tx.err ? "#f87171" : "#14F195", textDecoration: "none",
                }}>
                  {tx.signature.slice(0, 20)}…{tx.signature.slice(-6)}
                  <ExternalLink size={9} />
                </a>
                {Boolean(tx.err) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
                    <AlertTriangle size={9} color="#f87171" />
                    <p style={{ color: "#f87171", fontSize: "0.65rem", fontFamily: "'Space Mono', monospace" }}>Failed</p>
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.68rem", fontFamily: "'Space Mono', monospace" }}>
                  Slot {tx.slot.toLocaleString()}
                </p>
                {tx.blockTime && (
                  <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end", marginTop: 2 }}>
                    <Clock size={9} color="rgba(255,255,255,0.15)" />
                    <p style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.65rem", fontFamily: "'Space Mono', monospace" }}>
                      {timeAgo(new Date(tx.blockTime * 1000).toISOString())}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function DashboardPage() {
  const [data, setData] = useState<AgentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [tradingAgent, setTradingAgent] = useState<string | null>(null)
  const [droppingAgent, setDroppingAgent] = useState<string | null>(null)
  const [historyAgent, setHistoryAgent] = useState<string | null>(null)
  const [historyTxs, setHistoryTxs] = useState<TxRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  const addToast = useCallback((message: string, type: Toast["type"], url?: string) => {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, message, type, url }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000)
  }, [])

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/agents", { cache: "no-store" })
      const json = (await res.json()) as AgentsResponse
      setData(json); setLastRefresh(new Date())
    } catch {
      addToast("Failed to reach API — is the server running?", "error")
    } finally { setLoading(false) }
  }, [addToast])

  useEffect(() => {
    fetchAgents()
    const interval = setInterval(fetchAgents, 8000)
    return () => clearInterval(interval)
  }, [fetchAgents])

  const handleTrade = useCallback(async (agentId: string, type: "BUY" | "SELL" | "HOLD") => {
    setTradingAgent(agentId)
    try {
      const res = await fetch(`/api/agents/${agentId}/trade`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })
      const json = await res.json() as { ok: boolean; trade?: TradeRecord; newBalanceSOL?: number; explorerUrl?: string; error?: string }
      if (!json.ok) throw new Error(json.error ?? "Trade failed")
      addToast(`${type} executed — ${json.newBalanceSOL?.toFixed(4)} SOL remaining`, "success", json.explorerUrl ?? undefined)
      await fetchAgents()
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Trade failed", "error")
    } finally { setTradingAgent(null) }
  }, [addToast, fetchAgents])

  const handleAirdrop = useCallback(async (agentId: string) => {
    setDroppingAgent(agentId)
    try {
      const res = await fetch(`/api/agents/${agentId}/airdrop`, { method: "POST" })
      const json = await res.json() as { ok: boolean; newBalanceSOL?: number; explorerUrl?: string; error?: string }
      if (!json.ok) throw new Error(json.error ?? "Airdrop failed")
      addToast(`Airdrop confirmed — ${json.newBalanceSOL?.toFixed(4)} SOL`, "success", json.explorerUrl)
      await fetchAgents()
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Airdrop failed", "error")
    } finally { setDroppingAgent(null) }
  }, [addToast, fetchAgents])

  const handleViewHistory = useCallback(async (agentId: string) => {
    setHistoryAgent(agentId); setHistoryLoading(true); setHistoryTxs([])
    try {
      const res = await fetch(`/api/agents/${agentId}/history`)
      const json = await res.json() as { ok: boolean; transactions?: TxRecord[]; error?: string }
      if (!json.ok) throw new Error(json.error)
      setHistoryTxs(json.transactions ?? [])
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed to load history", "error")
      setHistoryAgent(null)
    } finally { setHistoryLoading(false) }
  }, [addToast])

  const agents = data?.agents ?? []
  const totalSOL = agents.reduce((s, a) => s + a.balanceSOL, 0)
  const totalTrades = agents.reduce((s, a) => s + a.tradeCount, 0)
  const running = agents.filter((a) => a.status === "running").length
  const isInit = data?.initialized ?? false
  const isIniting = data?.initializing ?? false

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');

        body { background: rgb(6,6,10); }

        @keyframes aw-spin { to { transform: rotate(360deg); } }
        @keyframes aw-slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes aw-pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(20,241,149,0.9); }
          50%       { opacity: 0.5; box-shadow: 0 0 14px rgba(20,241,149,0.4); }
        }

        .aw-history-row:hover { background: rgba(255,255,255,0.02); }
        .aw-action-btn--buy:hover:not(:disabled)  { background: rgba(20,241,149,0.15) !important; }
        .aw-action-btn--sell:hover:not(:disabled) { background: rgba(248,113,113,0.15) !important; }
        .aw-action-btn--hold:hover:not(:disabled) { background: rgba(255,255,255,0.06) !important; }
      `}</style>

      <Navbar />

      {/* Full-page dark background with scanline */}
      <div style={{ background: "rgb(6,6,10)", minHeight: "100vh", position: "relative" }}>
        {/* Scanline */}
        <div aria-hidden style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          background: `repeating-linear-gradient(
            0deg, transparent, transparent 2px,
            rgba(255,255,255,0.013) 2px, rgba(255,255,255,0.013) 4px
          )`,
        }} />
        {/* Grid */}
        <div aria-hidden style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 100% 60% at 50% 0%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 100% 60% at 50% 0%, black, transparent)",
        }} />
        {/* Blobs */}
        <div aria-hidden style={{
          position: "absolute", top: "5%", right: "5%", width: 400, height: 400,
          borderRadius: "50%", pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(circle, rgba(153,69,255,0.07) 0%, transparent 70%)",
          filter: "blur(70px)",
        }} />
        <div aria-hidden style={{
          position: "absolute", top: "40%", left: "0%", width: 320, height: 320,
          borderRadius: "50%", pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(circle, rgba(20,241,149,0.05) 0%, transparent 70%)",
          filter: "blur(70px)",
        }} />

        {/* Toasts */}
        <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 200, display: "flex", flexDirection: "column", gap: 8 }}>
          {toasts.map((t) => (
            <div key={t.id} style={{
              background: t.type === "success" ? "rgba(20,241,149,0.08)" : t.type === "error" ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${t.type === "success" ? "rgba(20,241,149,0.25)" : t.type === "error" ? "rgba(248,113,113,0.25)" : "rgba(255,255,255,0.1)"}`,
              color: t.type === "success" ? "#14F195" : t.type === "error" ? "#f87171" : "#fff",
              borderRadius: 12, padding: "0.75rem 1rem",
              fontSize: "0.78rem", fontFamily: "'Space Mono', monospace",
              maxWidth: 340, display: "flex", flexDirection: "column", gap: 4,
              animation: "aw-slideUp 0.3s ease forwards",
              backdropFilter: "blur(12px)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                {t.type === "success" && <CheckCircle size={12} />}
                {t.type === "error"   && <AlertTriangle size={12} />}
                {t.type === "info"    && <Info size={12} />}
                {t.message}
              </div>
              {t.url && (
                <a href={t.url} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  color: "#14F195", fontSize: "0.68rem", textDecoration: "none", marginLeft: 19,
                }}>
                  View on Explorer <ExternalLink size={9} />
                </a>
              )}
            </div>
          ))}
        </div>

        {/* History modal */}
        {historyAgent && (
          <HistoryModal
            agentId={historyAgent} txs={historyTxs}
            loading={historyLoading} onClose={() => setHistoryAgent(null)}
          />
        )}

        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "7rem 1.5rem 5rem", position: "relative", zIndex: 1 }}>

          {/* ── PAGE HEADER ── */}
          <div style={{ marginBottom: "2.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              {/* Eyebrow */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.3rem 0.9rem", borderRadius: "99px",
                border: "1px solid rgba(20,241,149,0.3)",
                background: "rgba(20,241,149,0.07)",
                marginBottom: "1rem",
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#14F195", boxShadow: "0 0 6px rgba(20,241,149,0.9)",
                  display: "inline-block", animation: "aw-pulse 2s ease-in-out infinite",
                }} />
                <span style={{ color: "#14F195", fontSize: "0.7rem", letterSpacing: "0.12em", fontWeight: 700, textTransform: "uppercase" }}>
                  Live on Solana Devnet
                </span>
              </div>
              <h1 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800,
                letterSpacing: "-0.04em",
                color: "#fff", marginBottom: "0.5rem",
              }}>
                Live Agent{" "}
                <span style={{
                  background: "linear-gradient(90deg, #9945FF, #14F195)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                  filter: "drop-shadow(0 0 16px rgba(20,241,149,0.25))",
                }}>Dashboard</span>
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", fontFamily: "'Space Mono', monospace", letterSpacing: "0.04em" }}>
                <Wifi size={11} />
                Real wallets · Real transactions · Solana devnet
                {lastRefresh && (
                  <span style={{ marginLeft: 6, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    · <Clock size={10} /> {timeAgo(lastRefresh.toISOString())}
                  </span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={fetchAgents} title="Refresh now" style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.4)", borderRadius: 10, cursor: "pointer",
                padding: "0.5rem 0.75rem",
                display: "inline-flex", alignItems: "center",
                transition: "color 0.2s, background 0.2s",
              }}>
                <RefreshCw size={13} />
              </button>
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "0.45rem 1rem", borderRadius: 99,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                fontFamily: "'Space Mono', monospace",
              }}>
                <CircleDot size={11}
                  color={isInit ? "#14F195" : isIniting ? "#fcd34d" : "rgba(255,255,255,0.2)"}
                  style={{ filter: isInit ? "drop-shadow(0 0 4px #14F195)" : "none" }}
                />
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", letterSpacing: "0.04em" }}>
                  {loading ? "Connecting…" : isIniting ? "Initializing wallets…" : isInit ? `${running}/${agents.length} agents live` : "Starting up…"}
                </span>
              </div>
            </div>
          </div>

          {/* ── INIT BANNER ── */}
          {(loading || isIniting) && !isInit && (
            <div style={{
              background: "rgba(252,211,77,0.06)", border: "1px solid rgba(252,211,77,0.15)",
              borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1.5rem",
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <Loader size={14} color="#fcd34d" style={{ animation: "aw-spin 0.8s linear infinite", flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ color: "#fcd34d", fontWeight: 700, fontSize: "0.82rem", fontFamily: "'Space Mono', monospace", marginBottom: 3 }}>
                  Setting up agent wallets on Solana devnet…
                </p>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem", fontFamily: "'Space Mono', monospace" }}>
                  Creating keypairs and connecting to devnet RPC. Takes ~10–30s on first load.
                </p>
              </div>
            </div>
          )}

          {/* ── ALL UNFUNDED BANNER ── */}
          {isInit && agents.length > 0 && agents.every((a) => a.balanceSOL === 0) && (
            <div style={{
              background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.18)",
              borderRadius: 14, padding: "1.25rem", marginBottom: "1.5rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem" }}>
                <AlertTriangle size={14} color="#f87171" />
                <p style={{ color: "#f87171", fontWeight: 700, fontSize: "0.82rem", fontFamily: "'Space Mono', monospace" }}>
                  Devnet faucet rate-limited — agents need manual funding
                </p>
              </div>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem", fontFamily: "'Space Mono', monospace", marginBottom: "0.85rem", lineHeight: 1.7 }}>
                Wallets are created and ready — they just need SOL. Copy an address below:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: "1rem" }}>
                {agents.map((a) => (
                  <div key={a.id} style={{
                    display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10, padding: "0.55rem 0.9rem",
                  }}>
                    <Zap size={10} color="#9945FF" />
                    <span style={{ color: "#9945FF", fontFamily: "'Space Mono', monospace", fontSize: "0.7rem", minWidth: 120 }}>{a.id}</span>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Space Mono', monospace", fontSize: "0.7rem", flex: 1 }}>{a.publicKey}</span>
                    <CopyButton text={a.publicKey} />
                  </div>
                ))}
              </div>
              <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "0.5rem 1.1rem", borderRadius: 10,
                background: "rgba(248,113,113,0.1)", color: "#f87171",
                border: "1px solid rgba(248,113,113,0.2)",
                fontSize: "0.78rem", fontWeight: 700, fontFamily: "'Space Mono', monospace",
                textDecoration: "none", letterSpacing: "0.04em",
              }}>
                <ExternalLink size={11} /> Open faucet.solana.com
              </a>
            </div>
          )}

          {/* ── PARTIAL UNFUNDED ── */}
          {isInit && agents.some((a) => a.balanceSOL === 0) && agents.some((a) => a.balanceSOL > 0) && (
            <div style={{
              background: "rgba(252,211,77,0.05)", border: "1px solid rgba(252,211,77,0.15)",
              borderRadius: 14, padding: "0.85rem 1.25rem", marginBottom: "1.5rem",
              display: "flex", alignItems: "center", gap: 8,
              color: "#fcd34d", fontSize: "0.78rem", fontFamily: "'Space Mono', monospace",
            }}>
              <Info size={12} style={{ flexShrink: 0 }} />
              Some agents are unfunded. Press <Fuel size={10} style={{ margin: "0 3px" }} /> to retry, or visit{" "}
              <a href="https://faucet.solana.com" target="_blank" rel="noopener noreferrer"
                style={{ color: "#14F195", textDecoration: "none", marginLeft: 4 }}>
                faucet.solana.com
              </a>.
            </div>
          )}

          {/* ── STAT CARDS ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
            <StatCard label="Agents"        value={String(agents.length)}        sub="independent wallets"     loading={loading} icon={Wallet} />
            <StatCard label="Total Balance" value={`${totalSOL.toFixed(4)} SOL`} sub="combined devnet balance" loading={loading} icon={TrendingUp} accent />
            <StatCard label="Trades"        value={String(totalTrades)}           sub="on-chain transactions"   loading={loading} icon={Activity} />
            <StatCard label="Network"       value="Devnet"                        sub="api.devnet.solana.com"   icon={Wifi} />
          </div>

          {/* ── AGENT CARDS ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.25rem" }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "rgba(153,69,255,0.1)", border: "1px solid rgba(153,69,255,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Wallet size={15} color="#9945FF" />
            </div>
            <h2 style={{
              fontFamily: "'Syne', sans-serif", fontSize: "1.2rem", fontWeight: 800,
              letterSpacing: "-0.03em", color: "#fff",
            }}>
              Agent Wallets
            </h2>
          </div>

          {loading && agents.length === 0 ? (
            <div style={{
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20, padding: "4rem", textAlign: "center",
              color: "rgba(255,255,255,0.3)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              fontFamily: "'Space Mono', monospace", fontSize: "0.8rem",
            }}>
              <Loader size={22} style={{ animation: "aw-spin 0.8s linear infinite" }} color="#9945FF" />
              Connecting to Solana devnet…
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent}
                  onTrade={handleTrade} onAirdrop={handleAirdrop} onViewHistory={handleViewHistory}
                  trading={tradingAgent === agent.id} dropping={droppingAgent === agent.id}
                />
              ))}
            </div>
          )}

          {/* ── HOW IT WORKS ── */}
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20, padding: "1.75rem",
            position: "relative", overflow: "hidden",
          }}>
            <div aria-hidden style={{
              position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
              background: "linear-gradient(90deg, transparent, #9945FF 40%, #14F195 60%, transparent)",
              opacity: 0.4,
            }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: "rgba(20,241,149,0.08)", border: "1px solid rgba(20,241,149,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Info size={14} color="#14F195" />
              </div>
              <h2 style={{
                fontFamily: "'Syne', sans-serif", fontSize: "1.1rem", fontWeight: 800,
                letterSpacing: "-0.03em", color: "#fff",
              }}>
                How this works
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
              {[
                { Icon: Key,          accent: "#9945FF", rgb: "153,69,255", title: "Real keypairs",     body: "Each agent generates a real ed25519 keypair on startup. Private keys are AES-256-GCM encrypted in the server store." },
                { Icon: Fuel,         accent: "#14F195", rgb: "20,241,149", title: "Real airdrops",     body: "The fuel button hits Solana's devnet faucet and requests 1 SOL for that agent's wallet — confirmed on-chain." },
                { Icon: ArrowUpRight, accent: "#9945FF", rgb: "153,69,255", title: "Real transactions", body: "BUY sends a real SOL transfer from the agent wallet to a devnet program. Every signature is verifiable on Explorer." },
                { Icon: Wifi,         accent: "#14F195", rgb: "20,241,149", title: "Live from RPC",     body: "Balances and tx history are fetched directly from api.devnet.solana.com — not cached or simulated." },
              ].map(({ Icon, accent, rgb, title, body }) => (
                <div key={title}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: `rgba(${rgb},0.08)`, border: `1px solid rgba(${rgb},0.2)`,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "0.85rem",
                  }}>
                    <Icon size={15} color={accent} />
                  </div>
                  <p style={{ color: "#fff", fontSize: "0.85rem", fontWeight: 700, fontFamily: "'Syne', sans-serif", marginBottom: 5 }}>{title}</p>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem", lineHeight: 1.75, fontFamily: "'Space Mono', monospace" }}>{body}</p>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </>
  )
}