"use client"

import * as React from "react"
import { motion } from "framer-motion"
import Counter from "@/components/motion/Counter"
import { Shield, Zap, CheckCircle } from "lucide-react"

const trustMetrics = [
  { icon: CheckCircle, label: "Uptime", value: 99.9, suffix: "%" },
  { icon: Zap, label: "p95 TTFT", value: 200, suffix: "ms" },
  { icon: Shield, label: "SOC 2 Ready", value: null, suffix: "" },
]

const clientLogos = [
  "Acme Corp",
  "TechStart",
  "DataFlow",
  "CloudScale",
  "AI Labs",
  "SecureOps",
]

export function TrustMarquee() {
  return (
    <section className="border-b border-border bg-zinc-900/30 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Trust Metrics */}
          <div className="flex items-center gap-8">
            {trustMetrics.map((metric, idx) => {
              const Icon = metric.icon
              return (
                <div key={idx} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-emerald-400" />
                  {metric.value !== null ? (
                    <span className="text-sm font-semibold text-foreground">
                      <Counter to={metric.value} suffix={metric.suffix} />
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-foreground">
                      SOC 2 Ready
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground hidden lg:inline">
                    {metric.label !== "SOC 2 Ready" && metric.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Client Logos Marquee */}
          <div className="relative overflow-hidden w-full md:w-auto md:flex-1 max-w-xl">
            <div className="flex gap-8 animate-marquee">
              {[...clientLogos, ...clientLogos].map((client, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 text-sm font-medium text-muted-foreground/60"
                >
                  {client}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

