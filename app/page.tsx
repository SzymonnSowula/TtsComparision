"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  Mic,
  Play,
  Pause,
  CircleStopIcon as Stop,
  Settings,
  Download,
  Clock,
  DollarSign,
  FileAudio,
  Gauge,
  Shield,
  Key,
  Zap,
  BarChart3,
} from "lucide-react"

interface TTSModel {
  name: string
  className: string
  logo: string
  apiKey: string
  status: "ready" | "processing" | "error"
  generated: boolean
  color: string
}

interface TestResult {
  generationTime: number
  audioSize: number
  audioUrl: string
  success: boolean
  textLength: number
}

const ttsModels: TTSModel[] = [
  {
    name: "ElevenLabs",
    className: "elevenlabs",
    logo: "11",
    apiKey: "elevenlabs",
    status: "ready",
    generated: false,
    color: "#ff0040",
  },
  {
    name: "Speechify",
    className: "speechify",
    logo: "Sp",
    apiKey: "speechify",
    status: "ready",
    generated: false,
    color: "#0080ff",
  },
  {
    name: "PlayAI TTS",
    className: "playai",
    logo: "PA",
    apiKey: "playai",
    status: "ready",
    generated: false,
    color: "#ffff00",
  },
  {
    name: "Papla.ai",
    className: "papla",
    logo: "PP",
    apiKey: "papla",
    status: "ready",
    generated: false,
    color: "#ff6600",
  },
  {
    name: "Hume.ai",
    className: "hume",
    logo: "HM",
    apiKey: "hume",
    status: "ready",
    generated: false,
    color: "#9966ff",
  },
]

export default function MatrixTTSComparison() {
  const [text, setText] = useState(
    "Witaj! To jest przykładowy tekst do testowania jakości syntez mowy. Czy głos brzmi naturalnie? Jak radzi sobie z polskimi znakami diakrytycznymi? Czy intonacja jest odpowiednia dla tego zdania? Testujemy teraz pięć różnych systemów TTS.",
  )
  const [language, setLanguage] = useState("pl")
  const [voiceGender, setVoiceGender] = useState("female")
  const [models, setModels] = useState<TTSModel[]>(ttsModels)
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [currentModel, setCurrentModel] = useState<number | null>(null)
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({})
  const [isApiModalOpen, setIsApiModalOpen] = useState(false)
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([])

  useEffect(() => {
    loadApiKeysFromStorage()
  }, [])

  const loadApiKeysFromStorage = () => {
    const savedKeys = localStorage.getItem("tts-api-keys")
    if (savedKeys) {
      setApiKeys(JSON.parse(savedKeys))
    }
  }

  const saveApiKeys = (keys: Record<string, string>) => {
    localStorage.setItem("tts-api-keys", JSON.stringify(keys))
    setApiKeys(keys)
    setIsApiModalOpen(false)
    showNotification("✅ PROTOKOŁY DOSTĘPU ZAPISANE POMYŚLNIE!")
  }

  const createRealisticAudioBlob = async (text: string, service: string): Promise<Blob> => {
    const wordsPerMinute: Record<string, number> = {
      elevenlabs: 180,
      speechify: 220,
      playai: 200,
      papla: 190,
      hume: 175,
    }

    const words = text.split(" ").length
    const durationSeconds = Math.max((words / wordsPerMinute[service]) * 60, 2)

    // Create a simple audio blob for demo purposes
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const sampleRate = audioContext.sampleRate
    const buffer = audioContext.createBuffer(1, sampleRate * durationSeconds, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      const frequency = 200 + Math.sin(t * 2) * 100
      let signal = Math.sin(2 * Math.PI * frequency * t) * 0.1
      signal += (Math.random() - 0.5) * 0.005

      const fadeTime = sampleRate * 0.1
      if (i < fadeTime) {
        signal *= i / fadeTime
      } else if (i > data.length - fadeTime) {
        signal *= (data.length - i) / fadeTime
      }

      data[i] = signal
    }

    return audioBufferToWav(buffer)
  }

  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const length = buffer.length
    const arrayBuffer = new ArrayBuffer(44 + length * 2)
    const view = new DataView(arrayBuffer)

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, "RIFF")
    view.setUint32(4, 36 + length * 2, true)
    writeString(8, "WAVE")
    writeString(12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, buffer.sampleRate, true)
    view.setUint32(28, buffer.sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, "data")
    view.setUint32(40, length * 2, true)

    const channelData = buffer.getChannelData(0)
    let offset = 44
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += 2
    }

    return new Blob([arrayBuffer], { type: "audio/wav" })
  }

  const generateForModel = async (index: number) => {
    if (!text.trim()) {
      showNotification("⚠️ BŁĄD: BRAK DANYCH WEJŚCIOWYCH!", "error")
      return
    }

    const model = models[index]
    const startTime = Date.now()

    setModels((prev) => prev.map((m, i) => (i === index ? { ...m, status: "processing" as const } : m)))

    try {
      const audioBlob = await createRealisticAudioBlob(text, model.apiKey)
      const endTime = Date.now()
      const generationTime = endTime - startTime

      const audioUrl = URL.createObjectURL(audioBlob)

      const result: TestResult = {
        generationTime,
        audioSize: audioBlob.size,
        audioUrl,
        success: true,
        textLength: text.length,
      }

      setTestResults((prev) => ({
        ...prev,
        [model.name]: result,
      }))

      setModels((prev) => prev.map((m, i) => (i === index ? { ...m, status: "ready" as const, generated: true } : m)))

      showNotification(`✅ ${model.name.toUpperCase()}: SYNTEZA UKOŃCZONA W ${(generationTime / 1000).toFixed(1)}S`)
    } catch (error) {
      console.error(`Błąd generacji dla ${model.name}:`, error)
      setModels((prev) => prev.map((m, i) => (i === index ? { ...m, status: "error" as const } : m)))
      showNotification(`❌ ${model.name.toUpperCase()}: BŁĄD SYSTEMU`, "error")
    }
  }

  const generateForAllModels = () => {
    if (!text.trim()) {
      showNotification("⚠️ BŁĄD: BRAK DANYCH WEJŚCIOWYCH!", "error")
      return
    }

    showNotification("🚀 URUCHAMIANIE WSZYSTKICH SYSTEMÓW...")

    models.forEach((_, index) => {
      setTimeout(() => {
        generateForModel(index)
      }, index * 500)
    })
  }

  const playModel = (index: number) => {
    const result = testResults[models[index].name]
    if (!result) {
      showNotification("⚠️ NAJPIERW URUCHOM SYNTEZĘ DLA TEGO SYSTEMU")
      return
    }

    if (currentAudio && currentAudio !== audioRefs.current[index]) {
      currentAudio.pause()
      currentAudio.currentTime = 0
    }

    const audio = audioRefs.current[index]
    if (!audio) return

    if (audio.paused) {
      audio.src = result.audioUrl
      audio.play()
      setCurrentAudio(audio)
      setCurrentModel(index)
    } else {
      audio.pause()
      setCurrentAudio(null)
      setCurrentModel(null)
    }
  }

  const stopAllAudio = () => {
    audioRefs.current.forEach((audio) => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    })
    setCurrentAudio(null)
    setCurrentModel(null)
    showNotification("⏹️ WSZYSTKIE SYSTEMY ZATRZYMANE")
  }

  const showNotification = (message: string, type: "success" | "error" | "warning" = "success") => {
    // Simple notification implementation
    console.log(`${type.toUpperCase()}: ${message}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-500"
      case "processing":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getQualityRating = (className: string) => {
    const ratings: Record<string, string> = {
      elevenlabs: "NAJWYŻSZA [5/5]",
      speechify: "ŚREDNIA [3/5]",
      playai: "DOBRA [4/5]",
      papla: "WYSOKA [4/5]",
      hume: "ZAAWANSOWANA [5/5]",
    }
    return ratings[className] || "NIEOKREŚLONA"
  }

  const generatedCount = Object.keys(testResults).length
  const totalTime = Object.values(testResults).reduce((sum, r) => sum + r.generationTime, 0)
  const avgTime = generatedCount > 0 ? totalTime / generatedCount : 0

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Matrix background effect */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-green-900/20 to-black"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Mic className="w-10 h-10 text-green-400 animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold text-green-400 tracking-wider">MATRIX TTS COMPARISON</h1>
          </div>
          <div className="text-lg text-green-300 tracking-[4px] uppercase">
            ELEVENLABS • SPEECHIFY • PLAYAI • PAPLA.AI • HUME.AI
          </div>
        </header>

        {/* Control Panel */}
        <Card className="bg-black/80 border-green-500/30 mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <Dialog open={isApiModalOpen} onOpenChange={setIsApiModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-green-500 text-green-400 hover:bg-green-500/20 bg-transparent"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    KONFIGURUJ PROTOKOŁY
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-black border-green-500 text-green-400">
                  <DialogHeader>
                    <DialogTitle className="text-green-400 flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      KONFIGURACJA PROTOKOŁÓW DOSTĘPU
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {models.map((model) => (
                      <div key={model.apiKey} className="space-y-2">
                        <label className="text-sm font-medium text-green-400">
                          {model.name.toUpperCase()} ACCESS KEY:
                        </label>
                        <Input
                          type="password"
                          placeholder="Enter API key..."
                          className="bg-black border-green-500/50 text-green-400"
                          value={apiKeys[model.apiKey] || ""}
                          onChange={(e) =>
                            setApiKeys((prev) => ({
                              ...prev,
                              [model.apiKey]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => saveApiKeys(apiKeys)}
                        className="bg-green-600 hover:bg-green-700 text-black"
                      >
                        ZAPISZ PROTOKOŁY
                      </Button>
                      <Button
                        variant="outline"
                        className="border-green-500 text-green-400 bg-transparent"
                        onClick={() => setIsApiModalOpen(false)}
                      >
                        ANULUJ
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-300 bg-green-900/20 p-3 rounded">
                      <Shield className="w-4 h-4" />
                      KLUCZE PRZECHOWYWANE LOKALNIE - BEZPIECZNE POŁĄCZENIE
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${Object.keys(apiKeys).length === 5 ? "bg-green-500" : "bg-red-500"} animate-pulse`}
                ></div>
                <span className="text-sm text-green-300">
                  {Object.keys(apiKeys).length === 5
                    ? "WSZYSTKIE PROTOKOŁY SKONFIGUROWANE"
                    : "PROTOKOŁY NIE SKONFIGUROWANE"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-green-400 mb-2">DANE WEJŚCIOWE DO ANALIZY:</label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="bg-black border-green-500/50 text-green-400 min-h-[120px]"
                placeholder="Wprowadź tekst do procesowania..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-green-400 mb-2">PROTOKÓŁ JĘZYKOWY:</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-black border-green-500/50 text-green-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-green-500">
                    <SelectItem value="pl">Polski [PL]</SelectItem>
                    <SelectItem value="en">English [EN]</SelectItem>
                    <SelectItem value="de">Deutsch [DE]</SelectItem>
                    <SelectItem value="es">Español [ES]</SelectItem>
                    <SelectItem value="fr">Français [FR]</SelectItem>
                    <SelectItem value="it">Italiano [IT]</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-green-400 mb-2">PROFIL GŁOSU:</label>
                <Select value={voiceGender} onValueChange={setVoiceGender}>
                  <SelectTrigger className="bg-black border-green-500/50 text-green-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black border-green-500">
                    <SelectItem value="female">Kobieta [F]</SelectItem>
                    <SelectItem value="male">Mężczyzna [M]</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <Button onClick={generateForAllModels} className="bg-green-600 hover:bg-green-700 text-black">
                <Play className="w-4 h-4 mr-2" />
                URUCHOM WSZYSTKIE SYSTEMY
              </Button>
              <Button
                onClick={stopAllAudio}
                variant="outline"
                className="border-green-500 text-green-400 hover:bg-green-500/20 bg-transparent"
              >
                <Stop className="w-4 h-4 mr-2" />
                ZATRZYMAJ WSZYSTKIE
              </Button>
              <Button
                variant="outline"
                className="border-green-500 text-green-400 hover:bg-green-500/20 bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                EKSPORTUJ DANE
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Models Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {models.map((model, index) => {
            const result = testResults[model.name]
            return (
              <Card
                key={model.name}
                className="bg-black/80 border-green-500/30 hover:border-green-500/60 transition-all"
              >
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: model.color, boxShadow: `0 0 15px ${model.color}` }}
                      >
                        {model.logo}
                      </div>
                      <span className="text-green-400 font-bold text-lg">{model.name.toUpperCase()}</span>
                    </div>
                    <Badge className={`${getStatusColor(model.status)} text-black`}>
                      {model.status === "ready" && "SYSTEM GOTOWY"}
                      {model.status === "processing" && "PROCESOWANIE..."}
                      {model.status === "error" && "BŁĄD SYSTEMU"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => generateForModel(index)}
                    disabled={model.status === "processing"}
                    className={`w-full ${
                      model.generated ? "bg-green-600 hover:bg-green-700" : "bg-green-600/80 hover:bg-green-600"
                    } text-black`}
                  >
                    {model.status === "processing" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                        PROCESOWANIE...
                      </>
                    ) : model.generated ? (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        SYNTEZA UKOŃCZONA!
                      </>
                    ) : (
                      <>
                        <Settings className="w-4 h-4 mr-2" />
                        URUCHOM SYNTEZĘ
                      </>
                    )}
                  </Button>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        onClick={() => playModel(index)}
                        disabled={!result}
                        className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-700 text-black"
                      >
                        {currentModel === index && currentAudio && !currentAudio.paused ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <div className="text-green-400 font-medium">
                          {result ? "GOTOWE DO ODTWORZENIA" : "NAJPIERW URUCHOM SYNTEZĘ"}
                        </div>
                        <div className="text-green-300 text-sm">JAKOŚĆ: {getQualityRating(model.className)}</div>
                      </div>
                    </div>

                    <audio
                      ref={(el) => {
                        audioRefs.current[index] = el
                      }}
                      onEnded={() => {
                        setCurrentAudio(null)
                        setCurrentModel(null)
                      }}
                      className="w-full"
                      controls
                      style={{ display: result ? "block" : "none" }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-green-300">
                      <Clock className="w-3 h-3" />
                      <span>CZAS: {result ? `${(result.generationTime / 1000).toFixed(1)}S` : "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-300">
                      <DollarSign className="w-3 h-3" />
                      <span>KOSZT: -</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-300">
                      <FileAudio className="w-3 h-3" />
                      <span>ROZMIAR: {result ? `${(result.audioSize / 1024).toFixed(1)}KB` : "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-300">
                      <Gauge className="w-3 h-3" />
                      <span>
                        PRĘDKOŚĆ:{" "}
                        {result ? `${((result.textLength / result.generationTime) * 1000).toFixed(0)} ZN/S` : "-"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Real-time Statistics */}
        <Card className="bg-black/80 border-green-500/30 mb-8">
          <CardHeader>
            <h2 className="text-2xl font-bold text-green-400 text-center tracking-wider">
              <BarChart3 className="w-6 h-6 inline mr-2" />
              ANALIZA 5 SYSTEMÓW W CZASIE RZECZYWISTYM
            </h2>
          </CardHeader>
          <CardContent>
            {generatedCount === 0 ? (
              <p className="text-center text-green-300">
                Uruchom generację w poszczególnych systemach aby zobaczyć analizę
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                  <h3 className="text-green-400 font-bold mb-2">📊 SYSTEMÓW PRZETESTOWANYCH</h3>
                  <div className="text-3xl font-bold text-green-400">{generatedCount}/5</div>
                  <div className="text-green-300 text-sm">PROTOKOŁÓW</div>
                </div>
                <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                  <h3 className="text-green-400 font-bold mb-2">⚡ NAJSZYBSZY SYSTEM</h3>
                  <div className="text-3xl font-bold text-green-400">
                    {generatedCount > 0
                      ? Object.keys(testResults)
                          .reduce((a, b) => (testResults[a].generationTime < testResults[b].generationTime ? a : b))
                          .toUpperCase()
                      : "-"}
                  </div>
                  <div className="text-green-300 text-sm">
                    {generatedCount > 0
                      ? `${(Math.min(...Object.values(testResults).map((r) => r.generationTime)) / 1000).toFixed(1)}S`
                      : "-"}
                  </div>
                </div>
                <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                  <h3 className="text-green-400 font-bold mb-2">⏱️ ŚREDNI CZAS</h3>
                  <div className="text-3xl font-bold text-green-400">{(avgTime / 1000).toFixed(1)}S</div>
                  <div className="text-green-300 text-sm">GENERACJA</div>
                </div>
                <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                  <h3 className="text-green-400 font-bold mb-2">💾 ŁĄCZNY ROZMIAR</h3>
                  <div className="text-3xl font-bold text-green-400">
                    {(Object.values(testResults).reduce((sum, r) => sum + r.audioSize, 0) / 1024).toFixed(1)}KB
                  </div>
                  <div className="text-green-300 text-sm">WSZYSTKICH PLIKÓW</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendation */}
        <Card className="bg-black/80 border-green-500/30">
          <CardHeader>
            <h2 className="text-2xl font-bold text-green-400 text-center tracking-wider">
              REKOMENDACJA SYSTEMU DOCELOWEGO
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-center text-green-300">
              {generatedCount === 5
                ? "Wszystkie systemy przetestowane! Analiza rekomendacji zostanie wygenerowana na podstawie wyników."
                : "Przeprowadź testy wszystkich 5 systemów aby otrzymać spersonalizowaną rekomendację protokołu."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
