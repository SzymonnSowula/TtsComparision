import { type NextRequest, NextResponse } from "next/server"
import { generateServerTTSAudio } from "@/lib/tts-services-server"
import type { TTSRequest } from "@/lib/tts-services"

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const url = new URL(request.url)
    const service = url.searchParams.get("service")

    if (!service) {
      return NextResponse.json({ error: "Service parameter is required" }, { status: 400 })
    }

    const body: TTSRequest = await request.json()

    // Validate required fields
    if (!body.text?.trim()) {
      return NextResponse.json({ error: "Text field is required and cannot be empty" }, { status: 400 })
    }

    if (!body.language) {
      return NextResponse.json({ error: "Language field is required" }, { status: 400 })
    }

    if (!body.voiceGender || !["male", "female"].includes(body.voiceGender)) {
      return NextResponse.json({ error: "voiceGender must be 'male' or 'female'" }, { status: 400 })
    }

    // Limit text length to prevent abuse
    if (body.text.length > 5000) {
      return NextResponse.json({ error: "Text too long. Maximum 5000 characters allowed." }, { status: 400 })
    }

    console.log(`Processing TTS request for ${service}:`, {
      textLength: body.text.length,
      language: body.language,
      voiceGender: body.voiceGender,
    })

    const result = await generateServerTTSAudio(service, body)

    console.log(`TTS generation completed for ${service}:`, {
      success: result.success,
      audioSize: result.audioSize,
      generationTime: result.generationTime,
      totalRequestTime: Date.now() - startTime,
    })

    return NextResponse.json(result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    const totalTime = Date.now() - startTime

    console.error("TTS API Error:", {
      error: errorMessage,
      service: new URL(request.url).searchParams.get("service"),
      totalTime,
    })

    return NextResponse.json(
      {
        error: errorMessage,
        success: false,
        generationTime: totalTime,
        audioUrl: "",
        audioBlob: new Blob(),
        audioSize: 0,
        textLength: 0,
      },
      { status: 500 },
    )
  }
}

// Add OPTIONS handler for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
