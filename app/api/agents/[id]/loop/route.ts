import { NextRequest, NextResponse } from "next/server"
import { getAgent, isInitialized } from "@/lib/agentStore"
import { startAgentLoop, stopAgentLoop, getRunningLoops } from "@/lib/agents/loop"

export const dynamic = "force-dynamic"

const MIN_BALANCE_SOL = 0.05

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isInitialized()) {
    return NextResponse.json({ ok: false, error: "Agents still initializing" }, { status: 503 })
  }

  const agent = getAgent(id)
  if (!agent) {
    return NextResponse.json({ ok: false, error: `Agent ${id} not found` }, { status: 404 })
  }

  const body   = await req.json().catch(() => ({})) as { action?: string }
  const action = body.action

  if (action === "start") {
    if (agent.balanceSOL < MIN_BALANCE_SOL) {
      return NextResponse.json({
        ok:    false,
        error: `Agent ${id} needs at least ${MIN_BALANCE_SOL} SOL before starting. Click ⛽ to fund first.`,
      }, { status: 400 })
    }

    // startAgentLoop(id) handles everything internally:
    // reads market state via getMarketState(), applies the agent's strategy(),
    // executes the real on-chain tx (BUY=SOL transfer, SELL=Memo tx), records trade
    startAgentLoop(id)

    return NextResponse.json({
      ok:      true,
      message: `${id} autonomous loop started`,
      running: getRunningLoops(),
    })
  }

  if (action === "stop") {
    stopAgentLoop(id)
    return NextResponse.json({
      ok:      true,
      message: `${id} loop stopped`,
      running: getRunningLoops(),
    })
  }

  return NextResponse.json({ ok: false, error: 'action must be "start" or "stop"' }, { status: 400 })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const running = getRunningLoops()
  return NextResponse.json({
    ok:            true,
    agentId:       id,
    loopRunning:   running.includes(id),
    allRunning:    running,
    minBalanceSOL: MIN_BALANCE_SOL,
  })
}