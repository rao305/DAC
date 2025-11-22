"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Configure Your Agent",
    description: "Define your agent's capabilities, constraints, and security policies using our intuitive interface.",
  },
  {
    number: "02",
    title: "Deploy to Production",
    description: "Deploy instantly with our one-click deployment or CI/CD integration in seconds.",
  },
  {
    number: "03",
    title: "Monitor & Optimize",
    description: "Track performance metrics, costs, and agent behavior with real-time dashboards.",
  },
  {
    number: "04",
    title: "Scale Confidently",
    description: "Automatically scale as demand grows with built-in redundancy and failover.",
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 md:py-32 border-t border-border" id="product">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From configuration to scale in four simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {steps.map((step, idx) => (
            <div key={idx} className="relative">
              <div className="bg-card border border-border rounded-lg p-6 h-full">
                <div className="text-4xl font-bold text-accent/30 mb-4">{step.number}</div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
              {idx < steps.length - 1 && (
                <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight size={24} className="text-border" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/docs#getting-started">
            <Button variant="outline" className="gap-2 bg-transparent">
              See Full Workflow
              <ArrowRight size={18} />
            </Button>
          </Link>
          <Button variant="ghost" onClick={() => window.open("mailto:sales@dac.ai?subject=Discuss%20Stack")}>
            Talk to Us About Your Stack
          </Button>
        </div>
      </div>
    </section>
  )
}
