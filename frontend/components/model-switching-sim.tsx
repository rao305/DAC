"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Brain, Code2, Image as ImageIcon, Sparkles } from "lucide-react"

interface Message {
  id: number
  content: string
  model: string
  modelIcon: React.ComponentType<{ className?: string }>
  modelColor: string
}

const messages: Message[] = [
  {
    id: 1,
    content: "Explain this complex algorithm",
    model: "Claude",
    modelIcon: Brain,
    modelColor: "text-orange-400",
  },
  {
    id: 2,
    content: "Generate TypeScript implementation",
    model: "OpenAI",
    modelIcon: Code2,
    modelColor: "text-green-400",
  },
  {
    id: 3,
    content: "Create a diagram visualization",
    model: "Gemini",
    modelIcon: ImageIcon,
    modelColor: "text-blue-400",
  },
  {
    id: 4,
    content: "Combine all outputs into summary",
    model: "Syntra Ensemble",
    modelIcon: Sparkles,
    modelColor: "text-emerald-400",
  },
]

export function ModelSwitchingSim() {
  const [currentMessage, setCurrentMessage] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    if (!isPlaying) return

    const timer = setTimeout(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length)
    }, 3000)

    return () => clearTimeout(timer)
  }, [currentMessage, isPlaying])

  const message = messages[currentMessage]
  const Icon = message.modelIcon

  return (
    <Card className="border-white/10 bg-zinc-900/80 backdrop-blur-xl rounded-xl overflow-hidden">
      <div className="bg-zinc-950/50 border-b border-white/5 px-4 py-3">
        <span className="text-xs text-muted-foreground">Model Switching Simulation</span>
      </div>
      <div className="p-4 space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className={`w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center`}
              >
                <Icon className={`w-5 h-5 ${message.modelColor}`} />
              </motion.div>
              <div>
                <div className="text-sm font-semibold text-foreground">{message.model}</div>
                <div className="text-xs text-muted-foreground">{message.content}</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
            />
            <span className="text-xs text-emerald-400">Same context window</span>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-1.5">
          {messages.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentMessage(index)
                setIsPlaying(false)
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentMessage
                  ? "bg-emerald-400 w-6"
                  : "bg-white/20 hover:bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

