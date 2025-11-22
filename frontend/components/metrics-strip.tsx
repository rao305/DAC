"use client"

import { CheckCircle2, Zap, Shield } from "lucide-react"
import { motion } from "framer-motion"

export function MetricsStrip() {
  const metrics = [
    {
      icon: CheckCircle2,
      value: "100%",
      label: "Uptime",
      color: "text-emerald-400",
    },
    {
      icon: Zap,
      value: "200ms",
      label: "p95 TTFT",
      color: "text-blue-400",
    },
    {
      icon: Shield,
      value: "SOC 2",
      label: "Ready",
      color: "text-purple-400",
    },
  ]

  return (
    <div className="w-full py-8 border-y border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-8 md:gap-12"
        >
          {metrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${metric.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{metric.value}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    {metric.label}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}

