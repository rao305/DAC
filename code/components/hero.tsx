"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-32">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
            <span className="text-xs font-medium text-accent">v0 for Enterprise</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground text-balance">
            AI Agents
            <br />
            at Enterprise Scale
          </h1>

          {/* Subheadline */}
          <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground text-balance">
            Empower your entire organization to deploy autonomous agents with confidence, ensuring security and
            reliability remain at the forefront.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/demo">
              <Button size="lg" className="gap-2">
                Book a Demo
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-accent/20 hover:border-accent/40 bg-transparent"
              >
                <Play size={18} />
                Try Live Agent
              </Button>
            </Link>
          </div>

          <div className="pt-2">
            <Link href="/docs" className="text-sm text-accent hover:underline">
              View docs →
            </Link>
          </div>
        </div>

        {/* Stats section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-4 gap-8 border-t border-border pt-12">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">20 days</div>
            <p className="text-sm text-muted-foreground">saved on daily builds</p>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">98%</div>
            <p className="text-sm text-muted-foreground">faster time to market</p>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">300%</div>
            <p className="text-sm text-muted-foreground">increase in SEO</p>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">6x</div>
            <p className="text-sm text-muted-foreground">faster to build + deploy</p>
          </div>
        </div>
      </div>
    </section>
  )
}
