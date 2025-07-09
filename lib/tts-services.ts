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

// ElevenLabs API
export async function generateElevenLabsAudio(request: TTSRequest): Promise<TTSResponse> {
  const startTime = Date.now()

  try {
    const voiceId = request.voiceGender === "female" ? "EXAVITQu4vr4xnSDxMaL" : "pNInz6obpgDQGcFmaJgB"

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text: request.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)
    const generationTime = Date.now() - startTime

    return {
      audioUrl,
      audioBlob,
      generationTime,
      audioSize: audioBlob.size,
      success: true,
      textLength: request.text.length,
    }
  } catch (error) {
    return {
      audioUrl: "",
      audioBlob: new Blob(),
      generationTime: Date.now() - startTime,
      audioSize: 0,
      success: false,
      textLength: request.text.length,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Speechify API
export async function generateSpeechifyAudio(request: TTSRequest): Promise<TTSResponse> {
  const startTime = Date.now()

  try {
    const response = await fetch("https://api.speechify.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SPEECHIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: request.text,
        voice_id: request.voiceGender === "female" ? "mimi" : "henry",
        audio_format: "mp3",
        sample_rate: 22050,
      }),
    })

    if (!response.ok) {
      throw new Error(`Speechify API error: ${response.status}`)
    }

    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)
    const generationTime = Date.now() - startTime

    return {
      audioUrl,
      audioBlob,
      generationTime,
      audioSize: audioBlob.size,
      success: true,
      textLength: request.text.length,
    }
  } catch (error) {
    return {
      audioUrl: "",
      audioBlob: new Blob(),
      generationTime: Date.now() - startTime,
      audioSize: 0,
      success: false,
      textLength: request.text.length,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// PlayAI API
export async function generatePlayAIAudio(request: TTSRequest): Promise<TTSResponse> {
  const startTime = Date.now()

  try {
    const response = await fetch("https://api.play.ai/api/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_PLAYAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: request.text,
        voice:
          request.voiceGender === "female"
            ? "s3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json"
            : "s3://voice-cloning-zero-shot/820a3788-2b37-4d21-847a-b65d8a68c99a/male-cs/manifest.json",
        output_format: "mp3",
        sample_rate: 24000,
      }),
    })

    if (!response.ok) {
      throw new Error(`PlayAI API error: ${response.status}`)
    }

    const result = await response.json()

    // PlayAI zwraca URL do pliku audio
    const audioResponse = await fetch(result.output.url)
    const audioBlob = await audioResponse.blob()
    const audioUrl = URL.createObjectURL(audioBlob)
    const generationTime = Date.now() - startTime

    return {
      audioUrl,
      audioBlob,
      generationTime,
      audioSize: audioBlob.size,
      success: true,
      textLength: request.text.length,
    }
  } catch (error) {
    return {
      audioUrl: "",
      audioBlob: new Blob(),
      generationTime: Date.now() - startTime,
      audioSize: 0,
      success: false,
      textLength: request.text.length,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Papla.ai API
export async function generatePaplaAudio(request: TTSRequest): Promise<TTSResponse> {
  const startTime = Date.now()

  try {
    const response = await fetch("https://api.papla.ai/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_PAPLA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: request.text,
        language: request.language,
        voice_type: request.voiceGender,
        format: "mp3",
        quality: "high",
      }),
    })

    if (!response.ok) {
      throw new Error(`Papla.ai API error: ${response.status}`)
    }

    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)
    const generationTime = Date.now() - startTime

    return {
      audioUrl,
      audioBlob,
      generationTime,
      audioSize: audioBlob.size,
      success: true,
      textLength: request.text.length,
    }
  } catch (error) {
    return {
      audioUrl: "",
      audioBlob: new Blob(),
      generationTime: Date.now() - startTime,
      audioSize: 0,
      success: false,
      textLength: request.text.length,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// Hume.ai API
export async function generateHumeAudio(request: TTSRequest): Promise<TTSResponse> {
  const startTime = Date.now()

  try {
    const response = await fetch("https://api.hume.ai/v0/tts/inference", {
      method: "POST",
      headers: {
        "X-Hume-Api-Key": process.env.NEXT_PUBLIC_HUME_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: request.text,
        format: "mp3",
        sample_rate: 22050,
        voice: request.voiceGender === "female" ? "female_1" : "male_1",
      }),
    })

    if (!response.ok) {
      throw new Error(`Hume.ai API error: ${response.status}`)
    }

    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)
    const generationTime = Date.now() - startTime

    return {
      audioUrl,
      audioBlob,
      generationTime,
      audioSize: audioBlob.size,
      success: true,
      textLength: request.text.length,
    }
  } catch (error) {
    return {
      audioUrl: "",
      audioBlob: new Blob(),
      generationTime: Date.now() - startTime,
      audioSize: 0,
      success: false,
      textLength: request.text.length,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Client-side proxy that calls our secure /api/tts route.
 * All secrets stay on the server; the browser sees no keys.
 */
export async function generateTTSAudio(service: string, request: TTSRequest): Promise<TTSResponse> {
  const res = await fetch(`/api/tts?service=${service}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    const { error } = await res.json()
    throw new Error(error ?? `HTTP ${res.status}`)
  }

  return res.json()
}

export const TTS_SERVICES = [
  { id: "elevenlabs", name: "ElevenLabs", color: "bg-purple-500" },
  { id: "speechify", name: "Speechify", color: "bg-blue-500" },
  { id: "playai", name: "PlayAI", color: "bg-green-500" },
  { id: "papla", name: "Papla", color: "bg-orange-500" },
  { id: "hume", name: "Hume AI", color: "bg-red-500" },
] as const

export type TTSServiceId = (typeof TTS_SERVICES)[number]["id"]
