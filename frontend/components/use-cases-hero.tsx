"use client"

import { motion } from "framer-motion"
import { Brain, Code2, Image as ImageIcon, Sparkles } from "lucide-react"
import { useState, useEffect } from "react"

const modelChips = [
  { name: "OpenAI", icon: Code2, color: "text-green-400" },
  { name: "Claude", icon: Brain, color: "text-orange-400" },
  { name: "Gemini", icon: ImageIcon, color: "text-blue-400" },
  { name: "Syntra", icon: Sparkles, color: "text-emerald-400" },
]

export function UseCasesHero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative border-b border-white/10 bg-gradient-to-b from-[#020409] via-[#050810] to-[#020409] overflow-hidden py-24 md:py-32">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.15),transparent_50%)]" />

      {/* Subtle Background Elements - Only render on client to avoid hydration mismatch */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden opacity-30">
          {modelChips.slice(0, 3).map((chip, index) => {
            const Icon = chip.icon
            const angle = (index * 360) / 3
            const radius = 150
            const x = Math.cos((angle * Math.PI) / 180) * radius
            const y = Math.sin((angle * Math.PI) / 180) * radius

            return (
              <motion.div
                key={chip.name}
                className="absolute"
                style={{
                  left: "50%",
                  top: "50%",
                  x: x - 16,
                  y: y - 16,
                }}
                animate={{
                  opacity: [0.2, 0.4, 0.2],
                  scale: [0.9, 1, 0.9],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.5,
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-900/60 border border-white/5 flex items-center justify-center backdrop-blur-sm">
                  <Icon className={`w-4 h-4 ${chip.color}`} />
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-100 tracking-tight">
            Built for Every Workflow.
            <br />
            <span className="text-emerald-400">Powered by Every Model.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto">
            Support, analytics, engineering, marketing — Syntra lets multiple models collaborate in the
            same context window.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

