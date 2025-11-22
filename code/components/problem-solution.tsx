"use client"

import { CheckCircle, AlertCircle, Zap } from "lucide-react"

export function ProblemSolution() {
  return (
    <section className="py-20 md:py-32 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Problem */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="text-destructive flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">The Challenge</h3>
                <p className="text-muted-foreground">
                  Most teams struggle to deploy AI agents reliably at scale. Security gaps, inconsistent behavior, and
                  integration nightmares plague enterprise deployments.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <AlertCircle className="text-destructive flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">The Risk</h3>
                <p className="text-muted-foreground">
                  Without proper infrastructure, autonomous agents can cause operational disruptions, security breaches,
                  or unexpected costs.
                </p>
              </div>
            </div>
          </div>

          {/* Solution */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="text-accent flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Our Solution</h3>
                <p className="text-muted-foreground">
                  DAC provides enterprise-grade infrastructure for deploying AI agents with built-in security,
                  monitoring, and compliance controls.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Zap className="text-accent flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">The Benefit</h3>
                <p className="text-muted-foreground">
                  Deploy with confidence. Our platform handles security, scalability, and monitoring so your team can
                  focus on innovation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
