"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Code2, Image as ImageIcon, Brain, Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"

interface Message {
  id: number
  role: "user" | "assistant"
  content: string
  model?: string
  modelTag?: string
  codeBlock?: string
  imagePreview?: boolean
}

interface ModelChip {
  id: string
  name: string
  tag: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  iconColor: string
}

const models: ModelChip[] = [
  {
    id: "claude",
    name: "Claude",
    tag: "Planning & Strategy",
    icon: Brain,
    color: "bg-gradient-to-r from-orange-500/20 to-orange-600/20 border-orange-500/40 text-orange-400",
    iconColor: "text-orange-400",
  },
  {
    id: "openai",
    name: "OpenAI",
    tag: "Code Generation",
    icon: Code2,
    color: "bg-gradient-to-r from-green-500/20 to-green-600/20 border-green-500/40 text-green-400",
    iconColor: "text-green-400",
  },
  {
    id: "gemini",
    name: "Gemini",
    tag: "Image & Vision",
    icon: ImageIcon,
    color: "bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-500/40 text-blue-400",
    iconColor: "text-blue-400",
  },
  {
    id: "ensemble",
    name: "Syntra Ensemble",
    tag: "Multi-Model",
    icon: Sparkles,
    color: "bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400",
    iconColor: "text-emerald-400",
  },
]

const conversationSteps: {
  step: number
  activeModel: string
  messages: Message[]
  routingNote?: string
}[] = [
  {
    step: 1,
    activeModel: "claude",
    messages: [
      {
        id: 1,
        role: "user",
        content: "We're launching a new AI support bot. Help me outline the core features and flows.",
      },
      {
        id: 2,
        role: "assistant",
        content: "Here's a high-level plan for your support bot:\n\n• Ticket creation & routing\n• Automated responses with escalation\n• Knowledge base integration\n• Multi-channel support (chat, email)\n• Analytics dashboard",
        model: "Claude",
        modelTag: "Planning & Strategy",
      },
    ],
    routingNote: "Task: Product strategy → Model: Reasoning",
  },
  {
    step: 2,
    activeModel: "openai",
    messages: [
      {
        id: 1,
        role: "user",
        content: "We're launching a new AI support bot. Help me outline the core features and flows.",
      },
      {
        id: 2,
        role: "assistant",
        content: "Here's a high-level plan for your support bot:\n\n• Ticket creation & routing\n• Automated responses with escalation\n• Knowledge base integration\n• Multi-channel support (chat, email)\n• Analytics dashboard",
        model: "Claude",
        modelTag: "Planning & Strategy",
      },
      {
        id: 3,
        role: "user",
        content: "Great. Generate a TypeScript API handler for the 'Create Ticket' flow.",
      },
      {
        id: 4,
        role: "assistant",
        content: "Here's a TypeScript handler for Create Ticket:",
        model: "OpenAI",
        modelTag: "Code Generation",
        codeBlock: `async function createTicket(\n  data: TicketData\n): Promise<Ticket> {\n  // Validation & processing\n  const ticket = await db.tickets.create(data)\n  return ticket\n}`,
      },
    ],
    routingNote: "Task: Code → Model: OpenAI (Code)",
  },
  {
    step: 3,
    activeModel: "gemini",
    messages: [
      {
        id: 1,
        role: "user",
        content: "We're launching a new AI support bot. Help me outline the core features and flows.",
      },
      {
        id: 2,
        role: "assistant",
        content: "Here's a high-level plan for your support bot:\n\n• Ticket creation & routing\n• Automated responses with escalation\n• Knowledge base integration\n• Multi-channel support (chat, email)\n• Analytics dashboard",
        model: "Claude",
        modelTag: "Planning & Strategy",
      },
      {
        id: 3,
        role: "user",
        content: "Great. Generate a TypeScript API handler for the 'Create Ticket' flow.",
      },
      {
        id: 4,
        role: "assistant",
        content: "Here's a TypeScript handler for Create Ticket:",
        model: "OpenAI",
        codeBlock: `async function createTicket(\n  data: TicketData\n): Promise<Ticket> {\n  // Validation & processing\n  const ticket = await db.tickets.create(data)\n  return ticket\n}`,
      },
      {
        id: 5,
        role: "user",
        content: "Now design a hero illustration idea for the marketing site. Generate an image prompt.",
      },
      {
        id: 6,
        role: "assistant",
        content: "Here's an image prompt you can use:\n\n'A futuristic AI assistant interface with glowing neural networks, floating UI elements, and a sleek dark theme with emerald accents'",
        model: "Gemini",
        modelTag: "Image & Vision",
        imagePreview: true,
      },
    ],
    routingNote: "Task: Image → Model: Gemini",
  },
  {
    step: 4,
    activeModel: "ensemble",
    messages: [
      {
        id: 1,
        role: "user",
        content: "We're launching a new AI support bot. Help me outline the core features and flows.",
      },
      {
        id: 2,
        role: "assistant",
        content: "Here's a high-level plan for your support bot:\n\n• Ticket creation & routing\n• Automated responses with escalation\n• Knowledge base integration\n• Multi-channel support (chat, email)\n• Analytics dashboard",
        model: "Claude",
        modelTag: "Planning & Strategy",
      },
      {
        id: 3,
        role: "user",
        content: "Great. Generate a TypeScript API handler for the 'Create Ticket' flow.",
      },
      {
        id: 4,
        role: "assistant",
        content: "Here's a TypeScript handler for Create Ticket:",
        model: "OpenAI",
        modelTag: "Code Generation",
        codeBlock: `async function createTicket(\n  data: TicketData\n): Promise<Ticket> {\n  // Validation & processing\n  const ticket = await db.tickets.create(data)\n  return ticket\n}`,
      },
      {
        id: 5,
        role: "user",
        content: "Now design a hero illustration idea for the marketing site. Generate an image prompt.",
      },
      {
        id: 6,
        role: "assistant",
        content: "Here's an image prompt you can use:\n\n'A futuristic AI assistant interface with glowing neural networks, floating UI elements, and a sleek dark theme with emerald accents'",
        model: "Gemini",
        modelTag: "Image & Vision",
        imagePreview: true,
      },
      {
        id: 7,
        role: "user",
        content: "Summarize everything into a short launch brief.",
      },
      {
        id: 8,
        role: "assistant",
        content: "**Launch Brief: AI Support Bot**\n\n**Core Features:** Ticket creation & routing, automated responses with escalation, knowledge base integration, multi-channel support (chat, email), and analytics dashboard.\n\n**Technical Implementation:** TypeScript API handler for ticket creation with validation and database integration.\n\n**Marketing Assets:** Hero illustration featuring futuristic AI interface with neural networks and emerald accents.\n\n**Next Steps:** Deploy API, integrate frontend, and launch marketing campaign.",
        model: "Syntra Ensemble",
        modelTag: "Multi-Model",
      },
    ],
    routingNote: "Task: Summary → Model: Syntra Ensemble (Uses outputs from Claude, OpenAI, Gemini)",
  },
]

export function HeroMultiModelDemo() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  const currentData = conversationSteps[currentStep]

  useEffect(() => {
    if (!isPlaying) return

    const timer = setTimeout(() => {
      setCurrentStep((prev) => (prev + 1) % conversationSteps.length)
    }, 5000) // 5 seconds per step

    return () => clearTimeout(timer)
  }, [currentStep, isPlaying])

  const activeModelData = models.find((m) => m.id === currentData.activeModel) || models[0]
  const ActiveIcon = activeModelData.icon

  return (
    <div className="relative w-full">
      {/* Gradient Halo */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-blue-500/20 rounded-3xl blur-3xl -z-10" />

      <Card className="border-white/10 bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 relative overflow-hidden">
        {/* Model Chips Strip */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {models.map((model) => {
            const Icon = model.icon
            const isActive = model.id === currentData.activeModel
            return (
              <motion.div
                key={model.id}
                animate={{
                  scale: isActive ? 1.05 : 1,
                  opacity: isActive ? 1 : 0.6,
                }}
                transition={{ duration: 0.3 }}
                className={`relative px-4 py-2 rounded-full border-2 transition-all ${
                  isActive
                    ? `${model.color} shadow-lg`
                    : "bg-white/5 border-white/10 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? activeModelData.iconColor : ""}`} />
                  <span className="text-sm font-medium">{model.name}</span>
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
        <div className="bg-zinc-950/50 rounded-2xl border border-white/5 p-4 md:p-6 min-h-[400px] max-h-[500px] overflow-y-auto">
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
                  className={`max-w-[80%] rounded-2xl p-4 ${
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
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Routing Timeline */}
        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-emerald-400"
              />
              <span className="text-xs text-muted-foreground">{currentData.routingNote}</span>
            </div>
            {currentData.activeModel === "ensemble" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-400"
              >
                Uses outputs from Claude, OpenAI, Gemini
              </motion.div>
            )}
          </div>
        </div>

        {/* Step Controls */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {conversationSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentStep(index)
                setIsPlaying(false)
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep
                  ? "bg-emerald-400 w-8"
                  : "bg-white/20 hover:bg-white/30"
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
            className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-400 backdrop-blur-sm"
          >
            Same conversation, new model
          </motion.div>
        )}
      </Card>
    </div>
  )
}

