"use client"

import { Shield, Zap, BarChart3, Lock, Gauge, Settings } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Built-in compliance, encryption, and audit trails for regulated industries.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Deploy and scale agents instantly with zero-downtime deployments.",
  },
  {
    icon: BarChart3,
    title: "Full Observability",
    description: "Real-time monitoring, analytics, and performance insights for every agent.",
  },
  {
    icon: Lock,
    title: "Access Control",
    description: "Granular permission management and role-based access controls.",
  },
  {
    icon: Gauge,
    title: "Cost Optimization",
    description: "Intelligent scaling and resource allocation to minimize operational costs.",
  },
  {
    icon: Settings,
    title: "Easy Integration",
    description: "Seamless integration with your existing tools and workflows.",
  },
]

export function Features() {
  return (
    <section className="py-20 md:py-32 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">Everything You Need</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete platform built for enterprise AI agent deployment
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={idx}
                className="group p-6 rounded-lg border border-border hover:border-accent/50 hover:bg-card/50 transition-all duration-300"
              >
                <Icon className="text-accent mb-4 group-hover:scale-110 transition-transform" size={28} />
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
