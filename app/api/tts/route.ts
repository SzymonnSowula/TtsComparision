import { type NextRequest, NextResponse } from "next/server"
import { generateServerTTSAudio } from "@/lib/tts-services-server"
import type { TTSRequest } from "@/lib/tts-services"

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const service = searchParams.get("service")
  if (!service) {
    return NextResponse.json({ error: "Missing service" }, { status: 400 })
  }

  const body = (await req.json()) as TTSRequest

  try {
    const result = await generateServerTTSAudio(service, body)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 })
  }
}
