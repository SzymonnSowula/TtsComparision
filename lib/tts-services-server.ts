import type { TTSRequest, TTSResponse } from "./tts-services"

// Helper function to convert ArrayBuffer to base64 data URI
function arrayBufferToDataUri(buffer: ArrayBuffer, mimeType = "audio/mpeg"): string {
  const base64 = Buffer.from(buffer).toString("base64")
  return `data:${mimeType};base64,${base64}`
}

// Helper function to make HTTP requests with proper error handling
async function makeRequest(url: string, options: RequestInit): Promise<ArrayBuffer> {
  console.log(`Making request to: ${url}`)

  const response = await fetch(url, options)

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`

    try {
      const errorBody = await response.text()
      if (errorBody) {
        errorMessage += ` - ${errorBody}`
      }
    } catch {
      // Ignore error parsing error body
    }

    throw new Error(errorMessage)
  }

  return response.arrayBuffer()
}

/* ---------- 1. ElevenLabs TTS (Updated for proper API) ---------- */
export async function elevenlabs(request: TTSRequest): Promise<TTSResponse> {
  const startTime = Date.now()

  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error("ElevenLabs API key not configured")
    }

    // First, get available voices to select appropriate one
    const voicesResponse = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
    })

    if (!voicesResponse.ok) {
      throw new Error(`Failed to fetch voices: ${voicesResponse.status}`)
    }

    const voicesData = await voicesResponse.json()

    // Select voice based on gender preference
    let selectedVoice = voicesData.voices.find((voice: any) =>
      request.voiceGender === "female"
        ? voice.name.toLowerCase().includes("bella") || voice.labels?.gender === "female"
        : voice.name.toLowerCase().includes("adam") || voice.labels?.gender === "male",
    )

    // Fallback to first available voice if no match
    if (!selectedVoice && voicesData.voices.length > 0) {
      selectedVoice = voicesData.voices[0]
    }

    if (!selectedVoice) {
      throw new Error("No suitable voice found")
    }

    console.log(`Using ElevenLabs voice: ${selectedVoice.name} (${selectedVoice.voice_id})`)

    // Generate speech using the selected voice
    const audioBuffer = await makeRequest(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice.voice_id}`, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: request.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    })

    const audioUrl = arrayBufferToDataUri(audioBuffer)

    return {
      audioUrl,
      audioBlob: new Blob(),
      audioSize: audioBuffer.byteLength,
      generationTime: Date.now() - startTime,
      success: true,
      textLength: request.text.length,
    }
  } catch (error) {
    console.error("ElevenLabs error:", error)
    throw new Error(`ElevenLabs: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/* ---------- 2. Speechify TTS ---------- */
export async function speechify(request: TTSRequest): Promise<TTSResponse> {
  const startTime = Date.now()

  try {
    if (!process.env.SPEECHIFY_API_KEY) {
      throw new Error("Speechify API key not configured")
    }

    // Speechify voice selection
    const voice = request.voiceGender === "female" ? "mimi" : "henry"

    const response = await fetch("https://api.sws.speechify.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SPEECHIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: request.text,
        voice_id: voice,
        audio_format: "mp3",
        sample_rate: 22050,
        speed: 1.0,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Speechify API error ${response.status}: ${errorText}`)
    }

    const audioBuffer = await response.arrayBuffer()
    const audioUrl = arrayBufferToDataUri(audioBuffer)

    return {
      audioUrl,
      audioBlob: new Blob(),
      audioSize: audioBuffer.byteLength,
      generationTime: Date.now() - startTime,
      success: true,
      textLength: request.text.length,
    }
  } catch (error) {
    console.error("Speechify error:", error)
    throw new Error(`Speechify: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/* ---------- 3. Papla AI TTS ---------- */
export async function papla(request: TTSRequest): Promise<TTSResponse> {
  const startTime = Date.now()

  try {
    if (!process.env.PAPLA_API_KEY) {
      throw new Error("Papla API key not configured")
    }

    const response = await fetch("https://api.papla.media/v1/text-to-speech", {
      method: "POST",
      headers: {
        "papla-api-key": process.env.PAPLA_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: request.text,
        voice: {
          language: request.language,
          gender: request.voiceGender,
          style: "neutral",
        },
        audio_format: "mp3",
        sample_rate: 22050,
        quality: "high",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Papla API error ${response.status}: ${errorText}`)
    }

    const audioBuffer = await response.arrayBuffer()
    const audioUrl = arrayBufferToDataUri(audioBuffer)

    return {
      audioUrl,
      audioBlob: new Blob(),
      audioSize: audioBuffer.byteLength,
      generationTime: Date.now() - startTime,
      success: true,
      textLength: request.text.length,
    }
  } catch (error) {
    console.error("Papla error:", error)
    throw new Error(`Papla: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/* ---------- 4. PlayAI TTS ---------- */
export async function playai(request: TTSRequest): Promise<TTSResponse> {
  const startTime = Date.now()

  try {
    if (!process.env.PLAYAI_API_KEY) {
      throw new Error("PlayAI API key not configured")
    }

    // PlayAI voice selection based on gender and language
    let voiceId = "s3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json"

    if (request.voiceGender === "male") {
      voiceId = "s3://voice-cloning-zero-shot/820a3788-2b37-4d21-847a-b65d8a68c99a/male-cs/manifest.json"
    }

    // Create the TTS job
    const response = await fetch("https://api.play.ai/api/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PLAYAI_API_KEY}`,
        "Content-Type": "application/json",
        "X-USER-ID": "matrix-tts-comparison",
      },
      body: JSON.stringify({
        text: request.text,
        voice: voiceId,
        output_format: "mp3",
        sample_rate: 24000,
        speed: 1.0,
        emotion: "neutral",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`PlayAI API error ${response.status}: ${errorText}`)
    }

    const result = await response.json()

    // Handle different response formats
    let audioUrl: string

    if (result.output && result.output.url) {
      // Direct URL provided
      audioUrl = result.output.url
    } else if (result.id) {
      // Job ID provided, need to poll
      audioUrl = await pollPlayAIJob(result.id)
    } else {
      throw new Error("No audio URL or job ID received from PlayAI")
    }

    // Download the audio file
    const audioResponse = await fetch(audioUrl)
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio from PlayAI: ${audioResponse.status}`)
    }

    const audioBuffer = await audioResponse.arrayBuffer()
    const dataUri = arrayBufferToDataUri(audioBuffer)

    return {
      audioUrl: dataUri,
      audioBlob: new Blob(),
      audioSize: audioBuffer.byteLength,
      generationTime: Date.now() - startTime,
      success: true,
      textLength: request.text.length,
    }
  } catch (error) {
    console.error("PlayAI error:", error)
    throw new Error(`PlayAI: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Helper function to poll PlayAI job status
async function pollPlayAIJob(jobId: string, maxAttempts = 30): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`https://api.play.ai/api/v1/tts/${jobId}`, {
      headers: {
        Authorization: `Bearer ${process.env.PLAYAI_API_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to check PlayAI job status: ${response.status}`)
    }

    const job = await response.json()

    if (job.status === "completed" && job.output && job.output.url) {
      return job.output.url
    }

    if (job.status === "failed") {
      throw new Error(`PlayAI job failed: ${job.error || "Unknown error"}`)
    }

    // Wait 1 second before next attempt
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw new Error("PlayAI job timed out")
}

/* ---------- 5. Hume AI TTS ---------- */
export async function hume(request: TTSRequest): Promise<TTSResponse> {
  const startTime = Date.now()

  try {
    if (!process.env.HUME_API_KEY) {
      throw new Error("Hume API key not configured")
    }

    const response = await fetch("https://api.hume.ai/v0/tts/inference", {
      method: "POST",
      headers: {
        "X-Hume-Api-Key": process.env.HUME_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: request.text,
        format: "mp3",
        sample_rate: 22050,
        voice: {
          description:
            request.voiceGender === "female"
              ? "A warm, clear female voice with natural intonation and professional delivery"
              : "A confident, clear male voice with natural intonation and professional delivery",
          language: request.language,
        },
        prosody: {
          speed: 1.0,
          pitch: 0.0,
          energy: 0.5,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Hume API error ${response.status}: ${errorText}`)
    }

    // Check if response is JSON (with base64 audio) or direct audio
    const contentType = response.headers.get("content-type")

    if (contentType?.includes("application/json")) {
      const result = await response.json()

      if (result.audio) {
        // Base64 encoded audio
        const buffer = Buffer.from(result.audio, "base64")
        const dataUri = `data:audio/mpeg;base64,${result.audio}`

        return {
          audioUrl: dataUri,
          audioBlob: new Blob(),
          audioSize: buffer.byteLength,
          generationTime: Date.now() - startTime,
          success: true,
          textLength: request.text.length,
        }
      } else {
        throw new Error("No audio data received from Hume API")
      }
    } else {
      // Direct audio response
      const audioBuffer = await response.arrayBuffer()
      const audioUrl = arrayBufferToDataUri(audioBuffer)

      return {
        audioUrl,
        audioBlob: new Blob(),
        audioSize: audioBuffer.byteLength,
        generationTime: Date.now() - startTime,
        success: true,
        textLength: request.text.length,
      }
    }
  } catch (error) {
    console.error("Hume error:", error)
    throw new Error(`Hume: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/* ---------- Demo/Fallback TTS ---------- */
export async function demo(request: TTSRequest): Promise<TTSResponse> {
  const startTime = Date.now()

  try {
    // Create a simple beep sound as demo audio
    const sampleRate = 22050
    const duration = Math.min(request.text.length * 0.1, 3) // Max 3 seconds
    const samples = Math.floor(sampleRate * duration)

    // Create a simple sine wave with varying frequency based on text
    const audioData = new Float32Array(samples)
    const baseFreq = request.voiceGender === "female" ? 440 : 220

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate
      const freq = baseFreq + Math.sin(t * 2) * 50 // Slight frequency modulation
      audioData[i] = Math.sin(2 * Math.PI * freq * t) * 0.3 * Math.exp(-t * 0.5) // Decay
    }

    // Convert to WAV format
    const buffer = new ArrayBuffer(44 + samples * 2)
    const view = new DataView(buffer)

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, "RIFF")
    view.setUint32(4, 36 + samples * 2, true)
    writeString(8, "WAVE")
    writeString(12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, "data")
    view.setUint32(40, samples * 2, true)

    // Audio data
    let offset = 44
    for (let i = 0; i < samples; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]))
      view.setInt16(offset, sample * 0x7fff, true)
      offset += 2
    }

    const audioUrl = arrayBufferToDataUri(buffer, "audio/wav")

    return {
      audioUrl,
      audioBlob: new Blob(),
      audioSize: buffer.byteLength,
      generationTime: Date.now() - startTime,
      success: true,
      textLength: request.text.length,
    }
  } catch (error) {
    console.error("Demo TTS error:", error)
    throw new Error(`Demo TTS: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/* ---------- Main Entry Point ---------- */
export async function generateServerTTSAudio(service: string, request: TTSRequest): Promise<TTSResponse> {
  console.log(`Generating TTS audio for service: ${service}`, {
    textLength: request.text.length,
    language: request.language,
    voiceGender: request.voiceGender,
  })

  switch (service) {
    case "elevenlabs":
      return elevenlabs(request)
    case "speechify":
      return speechify(request)
    case "papla":
      return papla(request)
    case "playai":
      return playai(request)
    case "hume":
      return hume(request)
    case "demo":
      return demo(request)
    default:
      throw new Error(`Unknown TTS service: ${service}`)
  }
}
