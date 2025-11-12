"use client"

import * as React from "react"
import { motion } from "framer-motion"

const providers = [
  { name: "OpenAI", logo: "/providers/openai.png", color: "emerald" },
  { name: "Kimi", logo: "/providers/kimi.png", color: "cyan" },
  { name: "Google", logo: "/providers/gemini.webp", color: "purple" },
  { name: "Perplexity", logo: "/providers/perplexity.png", color: "orange" },
]

interface LLMProvidersProps {
  variant?: "grid" | "inline"
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
  maxProviders?: number
}

export function LLMProviders({ variant = "grid", showLabel = true, size = "md", maxProviders }: LLMProvidersProps) {
  const sizeMap = {
    sm: { container: "w-12 h-12", logo: 24 },
    md: { container: "w-16 h-16", logo: 32 },
    lg: { container: "w-20 h-20", logo: 40 },
  }

  const currentSize = sizeMap[size]
  const displayProviders = maxProviders ? providers.slice(0, maxProviders) : providers

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-3 flex-wrap">
        {displayProviders.map((provider, idx) => (
          <motion.div
            key={provider.name}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.1 }}
            className={`${currentSize.container} rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-md flex items-center justify-center transition-all hover:shadow-lg hover:shadow-emerald-500/20 hover:border-emerald-500/30`}
          >
            <img
              src={provider.logo}
              alt={provider.name}
              width={currentSize.logo}
              height={currentSize.logo}
              className="object-contain w-full h-full p-1"
              loading="lazy"
              onError={(e) => {
                console.error(`Failed to load logo for ${provider.name}:`, provider.logo)
              }}
            />
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <motion.div
        className="grid grid-cols-2 gap-3 max-w-fit mx-auto"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
      >
        {displayProviders.map((provider, idx) => (
          <motion.div
            key={provider.name}
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0 },
            }}
            whileHover={{ scale: 1.05, rotate: 2 }}
            className={`${currentSize.container} rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 backdrop-blur-md flex items-center justify-center transition-all hover:shadow-lg hover:shadow-emerald-500/20 hover:border-emerald-500/30 ${
              displayProviders.length % 2 === 1 && idx === displayProviders.length - 1 ? "col-span-2 justify-self-center" : ""
            }`}
          >
            <img
              src={provider.logo}
              alt={provider.name}
              width={currentSize.logo}
              height={currentSize.logo}
              className="object-contain w-full h-full p-1"
              loading="lazy"
              onError={(e) => {
                console.error(`Failed to load logo for ${provider.name}:`, provider.logo)
              }}
            />
          </motion.div>
        ))}
      </motion.div>
      {showLabel && (
        <p className="text-sm text-muted-foreground mt-3 font-medium">LLM Providers</p>
      )}
    </div>
  )
}

