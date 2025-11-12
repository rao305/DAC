'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Route, Shield, Zap, BarChart3, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Reveal from '@/components/motion/Reveal'
import Stagger, { item } from '@/components/motion/Stagger'
import { TrustMarquee } from '@/components/trust-marquee'
import { StickyCTABar } from '@/components/sticky-cta-bar'
import { LLMProviders } from '@/components/llm-providers'

export default function ProductPage() {
  return (
    <div className="min-h-screen bg-background">
      <StickyCTABar />

      {/* Hero Section */}
      <section className="border-b border-border bg-zinc-900/60 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <Reveal>
            <div className="text-center space-y-6">
              <motion.div
                animate={{ opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="inline-block"
              >
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/30 to-blue-500/30 flex items-center justify-center border-2 border-emerald-500/40 ring-4 ring-emerald-500/20">
                  <span className="text-4xl font-bold text-emerald-400">D</span>
                </div>
              </motion.div>
              <h1 className="text-5xl font-bold text-foreground tracking-tight">
                Operate across LLMs.
                <br />
                <span className="text-emerald-400">One unified assistant.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                DAC routes your queries intelligently across OpenAI, Anthropic, Gemini, and more.
                <br />
                <span className="text-emerald-400/90 font-medium">Get the best response, every time—in the same context window.</span>
              </p>
              <div className="flex items-center justify-center gap-4 pt-4">
                <Link href="/conversations">
                  <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Open Chat
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button size="lg" variant="outline">
                    See Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Trust Marquee */}
      <TrustMarquee />

      {/* Architecture Diagram - Animated 3-Step Flow */}
      <section className="py-16 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Your queries flow through DAC's intelligent routing layer to the optimal provider
              </p>
            </div>
          </Reveal>
          
          <Stagger>
            <div className="relative max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                {/* User */}
                <motion.div variants={item} className="text-center space-y-3">
                  <motion.div 
                    className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border-2 border-blue-500/30"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <span className="text-2xl">👤</span>
                  </motion.div>
                  <div className="font-semibold text-foreground">User</div>
                </motion.div>

                {/* Arrow */}
                <motion.div variants={item} className="hidden md:block">
                  <ArrowRight className="w-8 h-8 text-emerald-400 mx-auto" />
                </motion.div>

                {/* DAC */}
                <motion.div variants={item} className="text-center space-y-3">
                  <motion.div 
                    className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center border-2 border-emerald-500/30 ring-4 ring-emerald-500/10"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <span className="text-3xl font-bold text-emerald-400">DAC</span>
                  </motion.div>
                  <div className="font-semibold text-foreground">Smart Router</div>
                  <div className="text-xs text-muted-foreground">Intent-based selection</div>
                </motion.div>

                {/* Arrow */}
                <motion.div variants={item} className="hidden md:block">
                  <ArrowRight className="w-8 h-8 text-emerald-400 mx-auto" />
                </motion.div>

                {/* Providers */}
                <motion.div variants={item} className="text-center">
                  <LLMProviders variant="grid" size="md" showLabel={false} maxProviders={4} />
                  <div className="font-semibold text-foreground mt-3">LLM Providers</div>
                </motion.div>
              </div>

              {/* CTA Chips */}
              <div className="flex items-center justify-center gap-3 mt-8">
                <Link href="/docs">
                  <Button variant="outline" size="sm">
                    See routing policies
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button variant="outline" size="sm">
                    Latency demo
                  </Button>
                </Link>
              </div>
            </div>
          </Stagger>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Core Features</h2>
              <p className="text-muted-foreground">
                Everything you need to operate AI at scale
              </p>
            </div>
          </Reveal>

          <Stagger>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Smart Routing */}
              <motion.div variants={item}>
                <Card className="border-border bg-zinc-900/40 backdrop-blur-sm hover:bg-zinc-900/60 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 h-full">
                  <CardHeader>
                    <motion.div 
                      className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4"
                      animate={{ scale: [0.98, 1, 0.98] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Route className="w-6 h-6 text-emerald-400" />
                    </motion.div>
                    <CardTitle className="text-xl">Smart Routing</CardTitle>
                    <CardDescription>
                      Automatically selects the best LLM provider based on query intent, latency requirements, and cost optimization—all while maintaining context continuity across providers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Intent-based provider selection</li>
                      <li>• Context window continuity across providers</li>
                      <li>• Real-time performance monitoring</li>
                      <li>• Automatic fallback chains</li>
                      <li>• Cost-aware routing policies</li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Unified API */}
              <motion.div variants={item}>
                <Card className="border-border bg-zinc-900/40 backdrop-blur-sm hover:bg-zinc-900/60 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 h-full">
                  <CardHeader>
                    <motion.div 
                      className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4"
                      animate={{ scale: [0.98, 1, 0.98] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    >
                      <Zap className="w-6 h-6 text-blue-400" />
                    </motion.div>
                    <CardTitle className="text-xl">Unified API</CardTitle>
                    <CardDescription>
                      One consistent interface across all providers. No more vendor lock-in or API fragmentation.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Single API endpoint</li>
                      <li>• Standardized request/response format</li>
                      <li>• Streaming support</li>
                      <li>• Type-safe SDKs</li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Secure Vault */}
              <motion.div variants={item}>
                <Card className="border-border bg-zinc-900/40 backdrop-blur-sm hover:bg-zinc-900/60 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 h-full">
                  <CardHeader>
                    <motion.div 
                      className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4"
                      animate={{ scale: [0.98, 1, 0.98] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    >
                      <Shield className="w-6 h-6 text-purple-400" />
                    </motion.div>
                    <CardTitle className="text-xl">Secure Vault</CardTitle>
                    <CardDescription>
                      Enterprise-grade security for API keys, with encryption at rest and in transit.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Encrypted key storage</li>
                      <li>• Per-organization isolation</li>
                      <li>• Audit logs</li>
                      <li>• SOC 2 compliant</li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Observability Dashboard */}
              <motion.div variants={item}>
                <Card className="border-border bg-zinc-900/40 backdrop-blur-sm hover:bg-zinc-900/60 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10 h-full">
                  <CardHeader>
                    <motion.div 
                      className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center mb-4"
                      animate={{ scale: [0.98, 1, 0.98] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                    >
                      <BarChart3 className="w-6 h-6 text-orange-400" />
                    </motion.div>
                    <CardTitle className="text-xl">Observability Dashboard</CardTitle>
                    <CardDescription>
                      Real-time metrics, cost tracking, and performance analytics across all providers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Token usage tracking</li>
                      <li>• Latency & TTFT metrics</li>
                      <li>• Cost per query analysis</li>
                      <li>• Provider health monitoring</li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </Stagger>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 border-t border-border bg-zinc-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start chatting with DAC today. No credit card required.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/conversations">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Open Chat
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline">
                  View Pricing
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
