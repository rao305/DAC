"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, Brain, Code2, Image as ImageIcon, Sparkles } from "lucide-react"

interface ModelChip {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const models: ModelChip[] = [
  { id: "claude", name: "Claude", icon: Brain, color: "text-orange-400" },
  { id: "openai", name: "OpenAI", icon: Code2, color: "text-green-400" },
  { id: "gemini", name: "Gemini", icon: ImageIcon, color: "text-blue-400" },
  { id: "dac", name: "Syntra", icon: Sparkles, color: "text-emerald-400" },
]

const codeSnippets = {
  typescript: `import { Syntra } from '@multa/sdk'

const client = new Syntra({
  apiKey: process.env.MULTA_API_KEY
})

// One conversation, multiple models
const response = await client.chat({
  messages: [
    {
      role: 'user',
      content: 'Explain this bug and generate a fix'
    }
  ]
})

// Syntra automatically routes:
// - Reasoning → Claude
// - Code → OpenAI
// - All in same context`,
  python: `from multa import Syntra

client = Syntra(api_key=os.getenv("MULTA_API_KEY"))

# One conversation, multiple models
response = client.chat(
    messages=[
        {"role": "user", "content": "Explain this bug and generate a fix"}
    ]
)

# Syntra automatically routes:
# - Reasoning → Claude
# - Code → OpenAI
# - All in same context`,
}

const simulationSteps = [
  {
    step: "routing",
    message: "Routing to Claude...",
    model: "claude",
    status: "processing",
  },
  {
    step: "reasoning",
    message: "Claude analyzing request...",
    model: "claude",
    status: "processing",
  },
  {
    step: "done",
    message: "Done.",
    model: "claude",
    status: "complete",
  },
  {
    step: "routing",
    message: "Routing to OpenAI...",
    model: "openai",
    status: "processing",
  },
  {
    step: "code",
    message: "OpenAI generating code...",
    model: "openai",
    status: "processing",
  },
  {
    step: "done",
    message: "Done.",
    model: "openai",
    status: "complete",
  },
  {
    step: "ensemble",
    message: "Syntra combining responses...",
    model: "dac",
    status: "processing",
  },
  {
    step: "complete",
    message: "Response ready.",
    model: "dac",
    status: "complete",
  },
]

export function LiveAPISimulation() {
  const [language, setLanguage] = useState<"typescript" | "python">("typescript")
  const [currentStep, setCurrentStep] = useState(0)
  const [copied, setCopied] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!isPlaying) return

    const timer = setTimeout(() => {
      setCurrentStep((prev) => (prev + 1) % simulationSteps.length)
    }, 2000)

    return () => clearTimeout(timer)
  }, [currentStep, isPlaying])

  const currentSim = simulationSteps[currentStep]
  const currentModel = models.find((m) => m.id === currentSim.model) || models[0]
  const ModelIcon = currentModel.icon

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[language])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left: Code Snippet */}
      <Card className="border-white/10 bg-zinc-900/80 backdrop-blur-xl rounded-xl overflow-hidden">
        <div className="bg-zinc-950/50 border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs text-muted-foreground ml-2">terminal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-lg bg-zinc-800/50 p-0.5">
              <button
                onClick={() => setLanguage("typescript")}
                className={`px-3 py-1 text-xs rounded transition-all ${
                  language === "typescript"
                    ? "bg-emerald-600 text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                TS
              </button>
              <button
                onClick={() => setLanguage("python")}
                className={`px-3 py-1 text-xs rounded transition-all ${
                  language === "python"
                    ? "bg-emerald-600 text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                PY
              </button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2 text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="p-4 font-mono text-xs text-emerald-300/90 overflow-x-auto">
          <pre className="whitespace-pre-wrap">{codeSnippets[language]}</pre>
        </div>
      </Card>

      {/* Right: Response Stream */}
      <Card className="border-white/10 bg-zinc-900/80 backdrop-blur-xl rounded-xl overflow-hidden">
        <div className="bg-zinc-950/50 border-b border-white/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Response Stream</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400">Live</span>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3 min-h-[200px]">
          {/* Model Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {models.map((model) => {
              const Icon = model.icon
              const isActive = model.id === currentSim.model
              return (
                <motion.div
                  key={model.id}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    opacity: isActive ? 1 : 0.5,
                  }}
                  transition={{ duration: 0.3 }}
                  className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${
                    isActive
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? currentModel.color : ""}`} />
                  <span>{model.name}</span>
                </motion.div>
              )
            })}
          </div>

          {/* Status Messages */}
          <div className="space-y-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <motion.div
                  animate={{
                    scale: currentSim.status === "processing" ? [1, 1.2, 1] : 1,
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className={`w-1.5 h-1.5 rounded-full ${
                    currentSim.status === "processing"
                      ? "bg-emerald-400"
                      : "bg-emerald-400"
                  }`}
                />
                <span className="text-sm text-muted-foreground">{currentSim.message}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Final Response Preview */}
          {currentSim.step === "complete" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
            >
              <div className="text-xs text-emerald-400 mb-2">Combined Response:</div>
              <div className="text-sm text-foreground">
                Bug analysis from Claude + Code fix from OpenAI, all in one response.
              </div>
            </motion.div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

