import { type NextRequest, NextResponse } from "next/server"
import { generateServerTTSAudio } from "@/lib/tts-services-server"
import type { TTSRequest } from "@/lib/tts-services"

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const service = url.searchParams.get("service")

    if (!service) {
      return NextResponse.json({ error: "Service parameter is required" }, { status: 400 })
    }

    const body: TTSRequest = await request.json()

    if (!body.text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const result = await generateServerTTSAudio(service, body)
    return NextResponse.json(result)
  } catch (error) {
    console.error("TTS API Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
