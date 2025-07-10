export interface TTSRequest {
  text: string
  language: string
  voiceGender: "male" | "female"
}

export interface TTSResponse {
  audioUrl: string
  audioBlob: Blob
  generationTime: number
  audioSize: number
  success: boolean
  textLength: number
}

export interface TTSResult extends TTSResponse {
  service: string
  error?: string
}

/**
 * Client-side proxy that calls our secure /api/tts route.
 * All secrets stay on the server; the browser sees no keys.
 */
export async function generateTTSAudio(service: string, request: TTSRequest): Promise<TTSResponse> {
  console.log(`Requesting TTS for service: ${service}`, {
    textLength: request.text.length,
    language: request.language,
    voiceGender: request.voiceGender,
  })

  const response = await fetch(`/api/tts?service=${service}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`

    try {
      const errorData = await response.json()
      if (errorData.error) {
        errorMessage = errorData.error
      }
    } catch {
      // If we can't parse the error response, use the status text
    }

    throw new Error(errorMessage)
  }

  const result = await response.json()
  console.log(`TTS response for ${service}:`, {
    success: result.success,
    audioSize: result.audioSize,
    generationTime: result.generationTime,
  })

  return result
}

export const TTS_SERVICES = [
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    color: "bg-purple-500",
    description: "High-quality AI voices with emotional range",
  },
  {
    id: "speechify",
    name: "Speechify",
    color: "bg-blue-500",
    description: "Natural-sounding voices for accessibility",
  },
  {
    id: "papla",
    name: "Papla AI",
    color: "bg-orange-500",
    description: "Advanced neural text-to-speech",
  },
  {
    id: "playai",
    name: "PlayAI TTS",
    color: "bg-green-500",
    description: "Real-time voice synthesis",
  },
  {
    id: "hume",
    name: "Hume AI",
    color: "bg-red-500",
    description: "Emotionally intelligent speech synthesis",
  },
  {
    id: "demo",
    name: "Demo TTS",
    color: "bg-gray-500",
    description: "Fallback demo audio (no API key required)",
  },
] as const

export type TTSServiceId = (typeof TTS_SERVICES)[number]["id"]
