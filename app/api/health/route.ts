import { NextResponse } from "next/server"

export async function GET() {
  const healthCheck = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      elevenlabs: {
        configured: !!process.env.ELEVENLABS_API_KEY,
        endpoint: "https://api.elevenlabs.io/v1/text-to-speech",
      },
      speechify: {
        configured: !!process.env.SPEECHIFY_API_KEY,
        endpoint: "https://api.sws.speechify.com/v1/audio/speech",
      },
      papla: {
        configured: !!process.env.PAPLA_API_KEY,
        endpoint: "https://api.papla.media/v1/text-to-speech",
      },
      playai: {
        configured: !!process.env.PLAYAI_API_KEY,
        endpoint: "https://api.play.ai/api/v1/tts",
      },
      hume: {
        configured: !!process.env.HUME_API_KEY,
        endpoint: "https://api.hume.ai/v0/tts/inference",
      },
      demo: {
        configured: true,
        endpoint: "internal",
      },
    },
    developmentMode: process.env.DEVELOPMENT_MODE === "true",
    configuredServices: [
      process.env.ELEVENLABS_API_KEY && "elevenlabs",
      process.env.SPEECHIFY_API_KEY && "speechify",
      process.env.PAPLA_API_KEY && "papla",
      process.env.PLAYAI_API_KEY && "playai",
      process.env.HUME_API_KEY && "hume",
      "demo",
    ].filter(Boolean),
  }

  return NextResponse.json(healthCheck)
}
