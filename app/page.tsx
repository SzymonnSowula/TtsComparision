"use client"

import { useState, useRef } from "react"
import { Play, Pause, Square, Download, Settings, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import { generateTTSAudio, TTS_SERVICES, type TTSRequest, type TTSResult } from "@/lib/tts-services"

export default function MatrixTTSComparison() {
  const { theme, setTheme } = useTheme()
  const [text, setText] = useState("Hello, this is a test of text-to-speech synthesis.")
  const [language, setLanguage] = useState("en")
  const [voiceGender, setVoiceGender] = useState<"male" | "female">("female")
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<TTSResult[]>([])
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({})

  const handleGenerate = async () => {
    if (!text.trim()) return

    setIsGenerating(true)
    setResults([])

    const request: TTSRequest = {
      text: text.trim(),
      language,
      voiceGender,
    }

    const newResults: TTSResult[] = []

    for (const service of TTS_SERVICES) {
      try {
        console.log(`Generating audio for ${service.name}...`)
        const result = await generateTTSAudio(service.id, request)
        newResults.push({
          ...result,
          service: service.name,
        })
      } catch (error) {
        console.error(`Error generating audio for ${service.name}:`, error)
        newResults.push({
          audioUrl: "",
          audioBlob: new Blob(),
          generationTime: 0,
          audioSize: 0,
          success: false,
          textLength: request.text.length,
          service: service.name,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    setResults(newResults)
    setIsGenerating(false)
  }

  const handlePlayPause = (serviceId: string, audioUrl: string) => {
    if (!audioUrl) return

    const audioKey = `${serviceId}-audio`

    if (playingAudio === audioKey) {
      // Pause current audio
      if (audioRefs.current[audioKey]) {
        audioRefs.current[audioKey].pause()
      }
      setPlayingAudio(null)
    } else {
      // Stop any currently playing audio
      if (playingAudio && audioRefs.current[playingAudio]) {
        audioRefs.current[playingAudio].pause()
        audioRefs.current[playingAudio].currentTime = 0
      }

      // Create or get audio element
      if (!audioRefs.current[audioKey]) {
        audioRefs.current[audioKey] = new Audio(audioUrl)
        audioRefs.current[audioKey].addEventListener("ended", () => {
          setPlayingAudio(null)
        })
      }

      // Play new audio
      audioRefs.current[audioKey].play()
      setPlayingAudio(audioKey)
    }
  }

  const handleStop = (serviceId: string) => {
    const audioKey = `${serviceId}-audio`
    if (audioRefs.current[audioKey]) {
      audioRefs.current[audioKey].pause()
      audioRefs.current[audioKey].currentTime = 0
    }
    if (playingAudio === audioKey) {
      setPlayingAudio(null)
    }
  }

  const handleDownload = (result: TTSResult) => {
    if (!result.audioUrl) return

    const link = document.createElement("a")
    link.href = result.audioUrl
    link.download = `${result.service.toLowerCase()}-tts-${Date.now()}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatTime = (ms: number) => {
    return `${(ms / 1000).toFixed(2)}s`
  }

  return (
    <div className="matrix-bg min-h-screen">
      <div className="matrix-rain"></div>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold matrix-text mb-2">Matrix TTS Comparison</h1>
            <p className="text-gray-400">Compare text-to-speech quality across multiple providers</p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="theme-toggle"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <Card className="card-matrix">
              <CardHeader>
                <CardTitle className="matrix-text">Input Configuration</CardTitle>
                <CardDescription>Configure your text-to-speech parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="text" className="matrix-text">
                    Text to Synthesize
                  </Label>
                  <Textarea
                    id="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter the text you want to convert to speech..."
                    className="input-matrix mt-2"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="language" className="matrix-text">
                    Language
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="input-matrix mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="voice" className="matrix-text">
                    Voice Gender
                  </Label>
                  <Select value={voiceGender} onValueChange={(value: "male" | "female") => setVoiceGender(value)}>
                    <SelectTrigger className="input-matrix mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleGenerate} disabled={isGenerating || !text.trim()} className="btn-matrix w-full">
                  {isGenerating ? (
                    <>
                      <div className="spinner mr-2" />
                      Generating...
                    </>
                  ) : (
                    "Generate All"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <Card className="card-matrix">
              <CardHeader>
                <CardTitle className="matrix-text">Comparison Results</CardTitle>
                <CardDescription>Audio samples and performance metrics from each TTS provider</CardDescription>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Configure your settings and click "Generate All" to start comparison</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.map((result, index) => {
                      const service = TTS_SERVICES.find((s) => s.name === result.service)
                      const audioKey = `${service?.id}-audio`
                      const isPlaying = playingAudio === audioKey

                      return (
                        <div key={result.service} className="results-table border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Badge className={`${service?.color} text-white`}>{result.service}</Badge>
                              {result.success ? (
                                <Badge variant="outline" className="text-green-400 border-green-400">
                                  Success
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-400 border-red-400">
                                  Failed
                                </Badge>
                              )}
                            </div>

                            {result.success && result.audioUrl && (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handlePlayPause(service?.id || "", result.audioUrl)}
                                  className="play-button w-8 h-8 p-0"
                                >
                                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStop(service?.id || "")}
                                  className="w-8 h-8 p-0"
                                >
                                  <Square className="h-4 w-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownload(result)}
                                  className="w-8 h-8 p-0"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {result.success ? (
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Generation Time:</span>
                                <div className="matrix-text font-mono">{formatTime(result.generationTime)}</div>
                              </div>
                              <div>
                                <span className="text-gray-400">File Size:</span>
                                <div className="matrix-text font-mono">{formatFileSize(result.audioSize)}</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Characters:</span>
                                <div className="matrix-text font-mono">{result.textLength}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-red-400 text-sm">
                              <strong>Error:</strong> {result.error}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
