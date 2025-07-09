import type { TTSRequest, TTSResponse } from "@/lib/tts-services" // reuse the shared types

/****************  LOW-LEVEL PROVIDERS  ****************/

async function fetchAudioAsDataUri(input: RequestInfo, init?: RequestInit): Promise<{ dataUri: string; size: number }> {
  const res = await fetch(input, init)
  if (!res.ok) {
    throw new Error(`Upstream error ${res.status}`)
  }
  const arrayBuf = await res.arrayBuffer()
  const size = arrayBuf.byteLength
  const base64 = Buffer.from(arrayBuf).toString("base64")
  return {
    dataUri: `data:audio/mpeg;base64,${base64}`,
    size,
  }
}

/* ---------- 1. ElevenLabs ---------- */
export async function elevenlabs(request: TTSRequest): Promise<TTSResponse> {
  const t0 = Date.now()
  const voiceId = request.voiceGender === "female" ? "EXAVITQu4vr4xnSDxMaL" : "pNInz6obpgDQGcFmaJgB"

  const { dataUri, size } = await fetchAudioAsDataUri(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      accept: "audio/mpeg",
      "content-type": "application/json",
      "xi-api-key": process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY!,
    },
    body: JSON.stringify({
      text: request.text,
      model_id: "eleven_multilingual_v2",
    }),
  })

  return {
    audioUrl: dataUri,
    audioBlob: new Blob(), // not used on client
    audioSize: size,
    generationTime: Date.now() - t0,
    success: true,
    textLength: request.text.length,
  }
}

/* ---------- 2. Speechify ---------- */
export async function speechify(request: TTSRequest): Promise<TTSResponse> {
  const t0 = Date.now()
  const { dataUri, size } = await fetchAudioAsDataUri("https://api.speechify.com/v1/audio/speech", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.NEXT_PUBLIC_SPEECHIFY_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      input: request.text,
      voice_id: request.voiceGender === "female" ? "mimi" : "henry",
      audio_format: "mp3",
    }),
  })

  return {
    audioUrl: dataUri,
    audioBlob: new Blob(),
    audioSize: size,
    generationTime: Date.now() - t0,
    success: true,
    textLength: request.text.length,
  }
}

/* ---------- 3. PlayAI ---------- */
export async function playai(request: TTSRequest): Promise<TTSResponse> {
  const t0 = Date.now()
  const up = await fetch("https://api.play.ai/api/v1/tts", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.NEXT_PUBLIC_PLAYAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text: request.text,
      voice:
        request.voiceGender === "female"
          ? "s3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json"
          : "s3://voice-cloning-zero-shot/820a3788-2b37-4d21-847a-b65d8a68c99a/male-cs/manifest.json",
      output_format: "mp3",
    }),
  })
  if (!up.ok) throw new Error(`PlayAI ${up.status}`)
  const { output } = await up.json()

  const { dataUri, size } = await fetchAudioAsDataUri(output.url)

  return {
    audioUrl: dataUri,
    audioBlob: new Blob(),
    audioSize: size,
    generationTime: Date.now() - t0,
    success: true,
    textLength: request.text.length,
  }
}

/* ---------- 4. Papla ---------- */
export async function papla(request: TTSRequest): Promise<TTSResponse> {
  const t0 = Date.now()
  const { dataUri, size } = await fetchAudioAsDataUri("https://api.papla.ai/v1/tts", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.NEXT_PUBLIC_PAPLA_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text: request.text,
      language: request.language,
      voice_type: request.voiceGender,
      format: "mp3",
    }),
  })

  return {
    audioUrl: dataUri,
    audioBlob: new Blob(),
    audioSize: size,
    generationTime: Date.now() - t0,
    success: true,
    textLength: request.text.length,
  }
}

/* ---------- 5. Hume ---------- */
export async function hume(request: TTSRequest): Promise<TTSResponse> {
  const t0 = Date.now()
  const { dataUri, size } = await fetchAudioAsDataUri("https://api.hume.ai/v0/tts/inference", {
    method: "POST",
    headers: {
      "x-hume-api-key": process.env.NEXT_PUBLIC_HUME_API_KEY!,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      text: request.text,
      format: "mp3",
      voice: request.voiceGender === "female" ? "female_1" : "male_1",
    }),
  })

  return {
    audioUrl: dataUri,
    audioBlob: new Blob(),
    audioSize: size,
    generationTime: Date.now() - t0,
    success: true,
    textLength: request.text.length,
  }
}

/****************  ENTRY POINT (server only)  ****************/
export async function generateServerTTSAudio(service: string, req: TTSRequest): Promise<TTSResponse> {
  switch (service) {
    case "elevenlabs":
      return elevenlabs(req)
    case "speechify":
      return speechify(req)
    case "playai":
      return playai(req)
    case "papla":
      return papla(req)
    case "hume":
      return hume(req)
    default:
      throw new Error(`Unknown service ${service}`)
  }
}
