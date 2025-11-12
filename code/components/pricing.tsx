"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Check, ChevronDown } from "lucide-react"
import { useState } from "react"

const plans = [
  {
    name: "Starter",
    description: "For small teams getting started",
    price: "Custom",
    features: ["Up to 5 agents", "100K API calls/month", "Basic monitoring", "Email support", "Community access"],
    cta: "Contact Sales",
  },
  {
    name: "Professional",
    description: "For growing businesses",
    price: "Custom",
    popular: true,
    features: [
      "Unlimited agents",
      "1M API calls/month",
      "Advanced monitoring & alerts",
      "Priority support",
      "Custom integrations",
      "Team management",
      "Advanced security",
    ],
    cta: "Talk to Sales",
  },
  {
    name: "Enterprise",
    description: "For large-scale deployments",
    price: "Custom",
    features: [
      "Everything in Professional",
      "Unlimited API calls",
      "Dedicated account manager",
      "Custom SLA",
      "On-premise deployment",
      "Advanced compliance",
      "Custom pricing",
    ],
    cta: "Contact Sales",
  },
]

export function Pricing() {
  const [showComparison, setShowComparison] = useState(false)

  return (
    <section className="py-20 md:py-32 border-t border-border" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that works for your organization
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-6 mb-12">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative rounded-lg border transition-all duration-300 ${
                plan.popular
                  ? "border-accent/50 bg-card/50 ring-1 ring-accent/20 lg:scale-105"
                  : "border-border bg-card/30 hover:border-border/80"
              } p-8`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-primary text-sm font-medium rounded-full">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                <p className="text-muted-foreground text-sm mt-1">Contact for details</p>
              </div>

              <Link href="/contact">
                <Button variant={plan.popular ? "default" : "outline"} className="w-full mb-8">
                  {plan.cta}
                </Button>
              </Link>

              <div className="space-y-3">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-3">
                    <Check size={18} className="text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mb-12">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="flex items-center gap-2 text-accent hover:text-accent/80 transition"
          >
            <span className="font-medium">Compare Plans</span>
            <ChevronDown size={18} className={`transition-transform ${showComparison ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Comparison details (placeholder) */}
        {showComparison && (
          <div className="bg-card/30 border border-border rounded-lg p-8">
            <p className="text-muted-foreground text-center">Detailed comparison table coming soon</p>
          </div>
        )}
      </div>
    </section>
  )
}
