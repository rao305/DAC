"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Brain, Code2, Image as ImageIcon, Database, Sparkles, Zap } from "lucide-react"

interface Message {
  id: number
  role: "user" | "assistant"
  content: string
  model?: string
  modelTag?: string
  codeBlock?: string
  imagePreview?: boolean
  dataPreview?: boolean
}

interface ModelChip {
  id: string
  name: string
  tag: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  iconColor: string
}

interface UseCaseDemoProps {
  steps: {
    step: number
    activeModel: string
    messages: Message[]
    routingNote?: string
  }[]
  models: ModelChip[]
}

export function UseCaseDemo({ steps, models }: UseCaseDemoProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  const currentData = steps[currentStep]

  useEffect(() => {
    if (!isPlaying) return

    const timer = setTimeout(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length)
    }, 4000) // 4 seconds per step

    return () => clearTimeout(timer)
  }, [currentStep, isPlaying, steps.length])

  const activeModelData = models.find((m) => m.id === currentData.activeModel) || models[0]
  const ActiveIcon = activeModelData.icon

  return (
    <div className="relative w-full">
      {/* Gradient Halo */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-blue-500/20 rounded-3xl blur-3xl -z-10" />

      <Card className="border-white/10 bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-5 md:p-6 relative overflow-hidden">
        {/* Model Chips Strip */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {models.map((model) => {
            const Icon = model.icon
            const isActive = model.id === currentData.activeModel
            return (
              <motion.div
                key={model.id}
                animate={{
                  scale: isActive ? 1.05 : 1,
                  opacity: isActive ? 1 : 0.5,
                }}
                transition={{ duration: 0.3 }}
                className={`relative px-3 py-1.5 rounded-full border transition-all text-xs ${
                  isActive
                    ? `${model.color} shadow-lg`
                    : "bg-white/5 border-white/10 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? activeModelData.iconColor : ""}`} />
                  <span className="text-xs font-medium">{model.name}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                  />
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Chat Window */}
        <div className="bg-zinc-950/50 rounded-xl border border-white/5 p-4 md:p-5 min-h-[320px] max-h-[400px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {currentData.messages.map((message, index) => (
              <motion.div
                key={`${currentStep}-${message.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 ${
                    message.role === "user"
                      ? "bg-emerald-500/20 border border-emerald-500/30 text-foreground"
                      : "bg-zinc-800/50 border border-white/5 text-foreground"
                  }`}
                >
                  {message.role === "assistant" && message.model && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-emerald-400">{message.model}</span>
                      {message.modelTag && (
                        <span className="text-xs text-muted-foreground">• {message.modelTag}</span>
                      )}
                    </div>
                  )}
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  {message.codeBlock && (
                    <div className="mt-3 p-3 bg-zinc-900/80 rounded-lg border border-white/5 font-mono text-xs text-emerald-300/90 overflow-x-auto">
                      <pre>{message.codeBlock}</pre>
                    </div>
                  )}
                  {message.imagePreview && (
                    <div className="mt-3 p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-blue-400" />
                      <span className="ml-2 text-xs text-muted-foreground">Image Preview</span>
                    </div>
                  )}
                  {message.dataPreview && (
                    <div className="mt-3 p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20 flex items-center justify-center">
                      <Database className="w-8 h-8 text-purple-400" />
                      <span className="ml-2 text-xs text-muted-foreground">Data Visualization</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Routing Timeline */}
        {currentData.routingNote && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              />
              <span className="text-xs text-muted-foreground">{currentData.routingNote}</span>
            </div>
          </div>
        )}

        {/* Step Controls */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentStep(index)
                setIsPlaying(false)
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep ? "bg-emerald-400 w-8" : "bg-white/20 hover:bg-white/30"
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="ml-4 text-xs text-muted-foreground hover:text-foreground"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>

        {/* Same Conversation Badge */}
        {currentStep > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] text-emerald-400 backdrop-blur-sm"
          >
            Same conversation, new model
          </motion.div>
        )}
      </Card>
    </div>
  )
}

