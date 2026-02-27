/**
 * app/api/agents/[id]/execute/route.ts
 * Triggers an autonomous LLM trade decision for an agent.
 * Called by the autonomous loop — hits the trade endpoint internally.
 */
import { NextResponse } from "next/server"
import { getAgent, getKeypair } from "@/lib/agentStore"

export const dynamic = "force-dynamic"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [agent, keypair] = await Promise.all([
    getAgent(id),
    Promise.resolve(getKeypair(id)),
  ])

  if (!agent || !keypair) {
    return NextResponse.json({ ok: false, error: `Agent ${id} not found` }, { status: 404 })
  }

  // Delegate to the trade route with no body — fully autonomous (LLM picks type)
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000"

  const res  = await fetch(`${baseUrl}/api/agents/${id}/trade`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({}),
  })
  const json = await res.json()

  return NextResponse.json(json)
}