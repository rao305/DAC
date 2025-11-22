"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Brain, Zap, TrendingUp, Shield } from "lucide-react"

const useCases = [
  {
    icon: Brain,
    title: "Customer Support Automation",
    description: "Deploy AI agents to handle support tickets, routing complex issues to specialists.",
    cta: "support",
  },
  {
    icon: TrendingUp,
    title: "Sales Intelligence",
    description: "Autonomous lead scoring, follow-up automation, and sales analytics.",
    cta: "sales",
  },
  {
    icon: Shield,
    title: "Compliance & Risk",
    description: "Monitor transactions, detect anomalies, and ensure regulatory compliance.",
    cta: "compliance",
  },
  {
    icon: Zap,
    title: "Content Generation",
    description: "Create, optimize, and distribute content at scale with AI agents.",
    cta: "content",
  },
]

export function UseCases() {
  return (
    <section className="py-20 md:py-32 border-t border-border" id="use-cases">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">Real-World Use Cases</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">See how leading enterprises leverage Syntra</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, idx) => {
            const Icon = useCase.icon
            return (
              <div
                key={idx}
                className="p-8 rounded-lg border border-border hover:border-accent/50 bg-card/30 transition-all duration-300 hover:bg-card/60 flex flex-col"
              >
                <div className="flex-1">
                  <Icon className="text-accent mb-4" size={32} />
                  <h3 className="text-xl font-semibold text-foreground mb-3">{useCase.title}</h3>
                  <p className="text-muted-foreground mb-6">{useCase.description}</p>
                </div>
                <div className="flex gap-3">
                  <Link href={`/demo?useCase=${useCase.cta}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      See This in Action
                    </Button>
                  </Link>
                  <Link href="/demo" className="flex-1">
                    <Button size="sm" className="w-full">
                      Book Demo
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
