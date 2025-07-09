"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ThemeToggle } from "@/components/theme-toggle"
import { useMatrixTheme } from "@/components/theme-provider"
import {
  Mic,
  Play,
  Pause,
  CircleStopIcon as Stop,
  Settings,
  Clock,
  DollarSign,
  FileAudio,
  Gauge,
  Zap,
  BarChart3,
  AlertTriangle,
} from "lucide-react"
import { generateTTSAudio, type TTSRequest } from "@/lib/tts-services"

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
  error?: string
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
  const { theme } = useMatrixTheme()
  const [text, setText] = useState(
    "Witaj! To jest przykładowy tekst do testowania jakości syntez mowy. Czy głos brzmi naturalnie? Jak radzi sobie z polskimi znakami diakrytycznymi? Czy intonacja jest odpowiednia dla tego zdania? Testujemy teraz pięć różnych systemów TTS.",
  )
  const [language, setLanguage] = useState("pl")
  const [voiceGender, setVoiceGender] = useState("female")
  const [models, setModels] = useState<TTSModel[]>(ttsModels)
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [currentModel, setCurrentModel] = useState<number | null>(null)
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([])

  const checkApiKeysAvailability = () => {
    const keys = {
      elevenlabs: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
      speechify: process.env.NEXT_PUBLIC_SPEECHIFY_API_KEY,
      playai: process.env.NEXT_PUBLIC_PLAYAI_API_KEY,
      papla: process.env.NEXT_PUBLIC_PAPLA_API_KEY,
      hume: process.env.NEXT_PUBLIC_HUME_API_KEY,
    }

    return Object.values(keys).filter(Boolean).length
  }

  const generateForModel = async (index: number) => {
    if (!text.trim()) {
      showNotification("⚠️ BŁĄD: BRAK DANYCH WEJŚCIOWYCH!", "error")
      return
    }

    const model = models[index]

    setModels((prev) => prev.map((m, i) => (i === index ? { ...m, status: "processing" as const } : m)))

    try {
      const request: TTSRequest = {
        text,
        language,
        voiceGender,
      }

      const result = await generateTTSAudio(model.className, request)

      if (result.success) {
        setTestResults((prev) => ({
          ...prev,
          [model.name]: {
            generationTime: result.generationTime,
            audioSize: result.audioSize,
            audioUrl: result.audioUrl,
            success: true,
            textLength: text.length,
          },
        }))

        setModels((prev) => prev.map((m, i) => (i === index ? { ...m, status: "ready" as const, generated: true } : m)))

        showNotification(
          `✅ ${model.name.toUpperCase()}: SYNTEZA UKOŃCZONA W ${(result.generationTime / 1000).toFixed(1)}S`,
        )
      } else {
        throw new Error(result.error || "Nieznany błąd")
      }
    } catch (error) {
      console.error(`Błąd generacji dla ${model.name}:`, error)
      setModels((prev) => prev.map((m, i) => (i === index ? { ...m, status: "error" as const } : m)))
      showNotification(
        `❌ ${model.name.toUpperCase()}: ${error instanceof Error ? error.message : "BŁĄD SYSTEMU"}`,
        "error",
      )
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
      }, index * 1000)
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
  const availableApiKeys = checkApiKeysAvailability()

  return (
    <div className="min-h-screen bg-matrix-bg text-matrix-text font-mono transition-all duration-300">
      {/* Matrix background effect */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div
          className={`absolute inset-0 ${
            theme === "dark"
              ? "bg-gradient-to-br from-black via-green-900/20 to-black"
              : "bg-gradient-to-br from-white via-green-50 to-white"
          }`}
        ></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Theme Toggle */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1"></div>
            <div className="flex items-center justify-center gap-4">
              <Mic className="w-10 h-10 text-matrix-green animate-pulse" />
              <h1 className="text-4xl md:text-5xl font-bold text-matrix-green tracking-wider animate-matrix-glow">
                MATRIX TTS COMPARISON
              </h1>
            </div>
            <div className="flex-1 flex justify-end">
              <ThemeToggle />
            </div>
          </div>
          <div className="text-lg text-matrix-text-secondary tracking-[4px] uppercase">
            ELEVENLABS • SPEECHIFY • PLAYAI • PAPLA.AI • HUME.AI
          </div>
        </header>

        {/* API Keys Status Alert */}
        {availableApiKeys < 5 && (
          <Alert
            className={`mb-8 ${
              theme === "dark" ? "border-yellow-500 bg-yellow-900/20" : "border-yellow-400 bg-yellow-50"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className={theme === "dark" ? "text-yellow-300" : "text-yellow-800"}>
              <strong>UWAGA:</strong> Skonfigurowano {availableApiKeys}/5 kluczy API. Niektóre serwisy mogą nie działać
              poprawnie. Sprawdź plik .env.local
            </AlertDescription>
          </Alert>
        )}

        {/* Control Panel */}
        <Card className="bg-matrix-card-bg border-matrix-border mb-8 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${availableApiKeys === 5 ? "bg-green-500" : "bg-red-500"} animate-pulse`}
                ></div>
                <span className="text-sm text-matrix-text-secondary">
                  {availableApiKeys === 5
                    ? "WSZYSTKIE PROTOKOŁY SKONFIGUROWANE"
                    : `PROTOKOŁY: ${availableApiKeys}/5 AKTYWNE`}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-matrix-green mb-2">DANE WEJŚCIOWE DO ANALIZY:</label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="bg-matrix-bg border-matrix-border text-matrix-text min-h-[120px] focus:border-matrix-green"
                placeholder="Wprowadź tekst do procesowania..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-matrix-green mb-2">PROTOKÓŁ JĘZYKOWY:</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-matrix-bg border-matrix-border text-matrix-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-matrix-card-bg border-matrix-border">
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
                <label className="block text-sm font-medium text-matrix-green mb-2">PROFIL GŁOSU:</label>
                <Select value={voiceGender} onValueChange={setVoiceGender}>
                  <SelectTrigger className="bg-matrix-bg border-matrix-border text-matrix-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-matrix-card-bg border-matrix-border">
                    <SelectItem value="female">Kobieta [F]</SelectItem>
                    <SelectItem value="male">Mężczyzna [M]</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                onClick={generateForAllModels}
                className="bg-matrix-green hover:bg-matrix-dark-green text-matrix-bg font-bold"
              >
                <Play className="w-4 h-4 mr-2" />
                URUCHOM WSZYSTKIE SYSTEMY
              </Button>
              <Button
                onClick={stopAllAudio}
                variant="outline"
                className="border-matrix-border text-matrix-text hover:bg-matrix-dark-bg bg-transparent"
              >
                <Stop className="w-4 h-4 mr-2" />
                ZATRZYMAJ WSZYSTKIE
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
                className="bg-matrix-card-bg border-matrix-border hover:border-matrix-green transition-all shadow-lg hover:shadow-xl"
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
                      <span className="text-matrix-green font-bold text-lg">{model.name.toUpperCase()}</span>
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
                      model.generated
                        ? "bg-matrix-green hover:bg-matrix-dark-green"
                        : "bg-matrix-green/80 hover:bg-matrix-green"
                    } text-matrix-bg font-bold`}
                  >
                    {model.status === "processing" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-matrix-bg border-t-transparent rounded-full animate-spin mr-2" />
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
                        className="w-12 h-12 rounded-full bg-matrix-green hover:bg-matrix-dark-green text-matrix-bg"
                      >
                        {currentModel === index && currentAudio && !currentAudio.paused ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <div className="text-matrix-green font-medium">
                          {result ? "GOTOWE DO ODTWORZENIA" : "NAJPIERW URUCHOM SYNTEZĘ"}
                        </div>
                        <div className="text-matrix-text-secondary text-sm">
                          JAKOŚĆ: {getQualityRating(model.className)}
                        </div>
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
                    <div className="flex items-center gap-2 text-matrix-text-secondary">
                      <Clock className="w-3 h-3" />
                      <span>CZAS: {result ? `${(result.generationTime / 1000).toFixed(1)}S` : "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-matrix-text-secondary">
                      <DollarSign className="w-3 h-3" />
                      <span>KOSZT: -</span>
                    </div>
                    <div className="flex items-center gap-2 text-matrix-text-secondary">
                      <FileAudio className="w-3 h-3" />
                      <span>ROZMIAR: {result ? `${(result.audioSize / 1024).toFixed(1)}KB` : "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-matrix-text-secondary">
                      <Gauge className="w-3 h-3" />
                      <span>
                        PRĘDKOŚĆ:{" "}
                        {result ? `${((result.textLength / result.generationTime) * 1000).toFixed(0)} ZN/S` : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Error display */}
                  {model.status === "error" && (
                    <Alert
                      className={`${theme === "dark" ? "border-red-500 bg-red-900/20" : "border-red-400 bg-red-50"}`}
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className={theme === "dark" ? "text-red-300" : "text-red-800"}>
                        Błąd podczas generacji audio. Sprawdź klucz API i połączenie internetowe.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Real-time Statistics */}
        <Card className="bg-matrix-card-bg border-matrix-border mb-8 shadow-lg">
          <CardHeader>
            <h2 className="text-2xl font-bold text-matrix-green text-center tracking-wider">
              <BarChart3 className="w-6 h-6 inline mr-2" />
              ANALIZA 5 SYSTEMÓW W CZASIE RZECZYWISTYM
            </h2>
          </CardHeader>
          <CardContent>
            {generatedCount === 0 ? (
              <p className="text-center text-matrix-text-secondary">
                Uruchom generację w poszczególnych systemach aby zobaczyć analizę
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-matrix-dark-bg rounded-lg border border-matrix-border">
                  <h3 className="text-matrix-green font-bold mb-2">📊 SYSTEMÓW PRZETESTOWANYCH</h3>
                  <div className="text-3xl font-bold text-matrix-green">{generatedCount}/5</div>
                  <div className="text-matrix-text-secondary text-sm">PROTOKOŁÓW</div>
                </div>
                <div className="text-center p-4 bg-matrix-dark-bg rounded-lg border border-matrix-border">
                  <h3 className="text-matrix-green font-bold mb-2">⚡ NAJSZYBSZY SYSTEM</h3>
                  <div className="text-3xl font-bold text-matrix-green">
                    {generatedCount > 0
                      ? Object.keys(testResults)
                          .reduce((a, b) => (testResults[a].generationTime < testResults[b].generationTime ? a : b))
                          .toUpperCase()
                      : "-"}
                  </div>
                  <div className="text-matrix-text-secondary text-sm">
                    {generatedCount > 0
                      ? `${(Math.min(...Object.values(testResults).map((r) => r.generationTime)) / 1000).toFixed(1)}S`
                      : "-"}
                  </div>
                </div>
                <div className="text-center p-4 bg-matrix-dark-bg rounded-lg border border-matrix-border">
                  <h3 className="text-matrix-green font-bold mb-2">⏱️ ŚREDNI CZAS</h3>
                  <div className="text-3xl font-bold text-matrix-green">{(avgTime / 1000).toFixed(1)}S</div>
                  <div className="text-matrix-text-secondary text-sm">GENERACJA</div>
                </div>
                <div className="text-center p-4 bg-matrix-dark-bg rounded-lg border border-matrix-border">
                  <h3 className="text-matrix-green font-bold mb-2">💾 ŁĄCZNY ROZMIAR</h3>
                  <div className="text-3xl font-bold text-matrix-green">
                    {(Object.values(testResults).reduce((sum, r) => sum + r.audioSize, 0) / 1024).toFixed(1)}KB
                  </div>
                  <div className="text-matrix-text-secondary text-sm">WSZYSTKICH PLIKÓW</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendation */}
        <Card className="bg-matrix-card-bg border-matrix-border shadow-lg">
          <CardHeader>
            <h2 className="text-2xl font-bold text-matrix-green text-center tracking-wider">
              REKOMENDACJA SYSTEMU DOCELOWEGO
            </h2>
          </CardHeader>
          <CardContent>
            <p className="text-center text-matrix-text-secondary">
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
