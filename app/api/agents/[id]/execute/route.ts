import { NextResponse } from "next/server"
import { executeAgent } from "@/lib/agentStore"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await executeAgent(id)
  return NextResponse.json({ ok: true })
}
