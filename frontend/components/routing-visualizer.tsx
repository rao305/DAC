"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Brain, Code2, Image as ImageIcon, Sparkles, MessageSquare } from "lucide-react"

interface Node {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  position: { x: number; y: number }
}

const nodes: Node[] = [
  {
    id: "user",
    label: "User",
    icon: MessageSquare,
    color: "text-blue-400",
    position: { x: 50, y: 20 },
  },
  {
    id: "dac",
    label: "Syntra",
    icon: Sparkles,
    color: "text-emerald-400",
    position: { x: 50, y: 50 },
  },
  {
    id: "claude",
    label: "Claude",
    icon: Brain,
    color: "text-orange-400",
    position: { x: 20, y: 80 },
  },
  {
    id: "openai",
    label: "OpenAI",
    icon: Code2,
    color: "text-green-400",
    position: { x: 50, y: 80 },
  },
  {
    id: "gemini",
    label: "Gemini",
    icon: ImageIcon,
    color: "text-blue-400",
    position: { x: 80, y: 80 },
  },
]

const routes = [
  { from: "user", to: "dac", delay: 0 },
  { from: "dac", to: "claude", delay: 0.5 },
  { from: "dac", to: "openai", delay: 1 },
  { from: "dac", to: "gemini", delay: 1.5 },
  { from: "claude", to: "dac", delay: 2 },
  { from: "openai", to: "dac", delay: 2.5 },
  { from: "gemini", to: "dac", delay: 3 },
]

export function RoutingVisualizer() {
  const [activeRoute, setActiveRoute] = useState<number | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRoute((prev) => {
        if (prev === null || prev >= routes.length - 1) return 0
        return prev + 1
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const getLinePath = (from: Node, to: Node) => {
    const fromX = from.position.x
    const fromY = from.position.y
    const toX = to.position.x
    const toY = to.position.y
    return `M ${fromX} ${fromY} L ${toX} ${toY}`
  }

  return (
    <Card className="border-white/10 bg-zinc-900/80 backdrop-blur-xl rounded-xl overflow-hidden">
      <div className="bg-zinc-950/50 border-b border-white/5 px-4 py-3">
        <span className="text-xs text-muted-foreground">Routing Visualizer</span>
      </div>
      <div className="p-6 relative" style={{ height: "300px" }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          {/* Grid Background */}
          <defs>
            <pattern
              id="grid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
              opacity="0.1"
            >
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" className="text-emerald-400" />

          {/* Routes */}
          {routes.map((route, index) => {
            const fromNode = nodes.find((n) => n.id === route.from)!
            const toNode = nodes.find((n) => n.id === route.to)!
            const isActive = activeRoute === index

            return (
              <motion.line
                key={index}
                x1={fromNode.position.x}
                y1={fromNode.position.y}
                x2={toNode.position.x}
                y2={toNode.position.y}
                stroke={isActive ? "#22c55e" : "rgba(255, 255, 255, 0.1)"}
                strokeWidth={isActive ? "0.5" : "0.3"}
                strokeDasharray={isActive ? "2,1" : "1,2"}
                initial={{ pathLength: 0 }}
                animate={{
                  pathLength: isActive ? 1 : 0,
                  opacity: isActive ? [0.5, 1, 0.5] : 0.2,
                }}
                transition={{
                  pathLength: { duration: 0.8 },
                  opacity: { duration: 1, repeat: isActive ? Infinity : 0 },
                }}
              />
            )
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const Icon = node.icon
            const isActive = routes[activeRoute || 0]?.to === node.id || routes[activeRoute || 0]?.from === node.id

            return (
              <g key={node.id}>
                <motion.circle
                  cx={node.position.x}
                  cy={node.position.y}
                  r="4"
                  fill={isActive ? "#22c55e" : "rgba(255, 255, 255, 0.2)"}
                  animate={{
                    scale: isActive ? [1, 1.3, 1] : 1,
                    opacity: isActive ? [0.8, 1, 0.8] : 0.6,
                  }}
                  transition={{
                    duration: 1,
                    repeat: isActive ? Infinity : 0,
                  }}
                />
                <foreignObject
                  x={node.position.x - 15}
                  y={node.position.y + 8}
                  width="30"
                  height="10"
                >
                  <div className="flex items-center justify-center">
                    <Icon
                      className={`w-4 h-4 ${isActive ? node.color : "text-muted-foreground"}`}
                    />
                  </div>
                </foreignObject>
                <foreignObject
                  x={node.position.x - 20}
                  y={node.position.y - 12}
                  width="40"
                  height="8"
                >
                  <div className="text-center">
                    <span
                      className={`text-[6px] ${
                        isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      {node.label}
                    </span>
                  </div>
                </foreignObject>
              </g>
            )
          })}
        </svg>
      </div>
    </Card>
  )
}

