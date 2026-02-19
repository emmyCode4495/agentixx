import { NextResponse } from "next/server"
import { executeAgent } from "@/lib/agentStore"

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  await executeAgent(params.id)
  return NextResponse.json({ ok: true })
}
