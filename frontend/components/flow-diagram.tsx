"use client"

import * as React from "react"
import { motion } from "framer-motion"

export function FlowDiagram() {
  return (
    <div className="relative max-w-3xl mx-auto py-12">
      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <motion.path
          d="M 150 60 L 400 60"
          stroke="url(#line-gradient)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }}
        />
        <motion.path
          d="M 500 60 L 750 60"
          stroke="url(#line-gradient)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, delay: 1, ease: "easeInOut" }}
        />
        
        <defs>
          <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: "#10b981", stopOpacity: 0.3 }} />
            <stop offset="100%" style={{ stopColor: "#10b981", stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>

      {/* Flow Nodes */}
      <div className="relative grid grid-cols-3 gap-8 items-center" style={{ zIndex: 1 }}>
        {/* User Node */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border-2 border-blue-500/30 mb-3">
            <span className="text-3xl">👤</span>
          </div>
          <div className="text-sm font-semibold text-foreground">User Query</div>
          <div className="text-xs text-muted-foreground mt-1">Natural language input</div>
        </motion.div>

        {/* Syntra Router Node */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <motion.div
            className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border-2 border-emerald-500/30 ring-4 ring-emerald-500/10 mb-3"
            animate={{
              boxShadow: [
                "0 0 20px rgba(16, 185, 129, 0.2)",
                "0 0 40px rgba(16, 185, 129, 0.4)",
                "0 0 20px rgba(16, 185, 129, 0.2)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-3xl font-bold text-emerald-400">Syntra</span>
          </motion.div>
          <div className="text-sm font-semibold text-foreground">Smart Router</div>
          <div className="text-xs text-muted-foreground mt-1">Intent analysis + provider selection</div>
        </motion.div>

        {/* LLM Providers Node */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center"
        >
          <div className="grid grid-cols-2 gap-2 mx-auto w-fit mb-3">
            {["🤖", "🧠", "💎", "⚡"].map((emoji, idx) => (
              <motion.div
                key={idx}
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500/20 to-purple-500/20 flex items-center justify-center border border-green-500/30"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="text-xl">{emoji}</span>
              </motion.div>
            ))}
          </div>
          <div className="text-sm font-semibold text-foreground">LLM Providers</div>
          <div className="text-xs text-muted-foreground mt-1">GPT-4, Claude, Gemini, etc.</div>
        </motion.div>
      </div>

      {/* Flowing Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-emerald-400/60"
          style={{ top: "55px", left: "150px" }}
          animate={{
            x: [0, 250, 500, 600],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 3,
            delay: i * 0.5,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  )
}

