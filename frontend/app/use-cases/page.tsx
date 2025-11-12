'use client'

import * as React from 'react'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowRight, Headphones, Database, TrendingUp, Code, MessageSquare, Activity } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Reveal from '@/components/motion/Reveal'
import Stagger, { item } from '@/components/motion/Stagger'
import { TrustMarquee } from '@/components/trust-marquee'
import { StickyCTABar } from '@/components/sticky-cta-bar'
import { APIPlayground } from '@/components/api-playground'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

// Mock data for mini dashboards
const mockMetrics = {
  support: [
    { time: '00:00', resolved: 45, pending: 12 },
    { time: '04:00', resolved: 52, pending: 8 },
    { time: '08:00', resolved: 78, pending: 15 },
    { time: '12:00', resolved: 92, pending: 7 },
    { time: '16:00', resolved: 85, pending: 10 },
    { time: '20:00', resolved: 67, pending: 9 },
  ],
  knowledge: [
    { time: 'Mon', queries: 234 },
    { time: 'Tue', queries: 287 },
    { time: 'Wed', queries: 312 },
    { time: 'Thu', queries: 298 },
    { time: 'Fri', queries: 276 },
  ],
}

const useCases = [
  {
    id: 'support',
    label: 'Support Automation',
    icon: Headphones,
    title: 'Resolve tickets faster with AI',
    description: 'Automatically categorize inquiries, route to specialists, and provide instant responses to common questions.',
    benefits: [
      {
        title: '80% faster response time',
        description: 'Instant answers to common questions reduce ticket volume',
      },
      {
        title: '24/7 availability',
        description: 'AI agents handle inquiries around the clock',
      },
      {
        title: 'Intelligent routing',
        description: 'Complex issues automatically escalated to human agents',
      },
    ],
    color: 'emerald',
  },
  {
    id: 'knowledge',
    label: 'Internal Knowledge',
    icon: Database,
    title: 'Secure enterprise chat across docs',
    description: 'Enable teams to query internal documentation, wikis, and knowledge bases with natural language.',
    benefits: [
      {
        title: 'Unified search',
        description: 'Query across all your internal documentation',
      },
      {
        title: 'Context-aware answers',
        description: 'AI understands your company-specific terminology with seamless context continuity across providers',
      },
      {
        title: 'Access control',
        description: 'Respects existing permissions and security policies',
      },
    ],
    color: 'blue',
  },
  {
    id: 'analytics',
    label: 'Analytics & Insights',
    icon: TrendingUp,
    title: 'Natural language dashboards',
    description: 'Ask questions about your data and get instant insights without writing SQL or building reports.',
    benefits: [
      {
        title: 'Query in plain English',
        description: 'No SQL knowledge required to analyze data',
      },
      {
        title: 'Real-time insights',
        description: 'Get answers from live data sources',
      },
      {
        title: 'Visual summaries',
        description: 'Automatically generate charts and visualizations',
      },
    ],
    color: 'purple',
  },
  {
    id: 'code',
    label: 'Code Assistance',
    icon: Code,
    title: 'In-IDE LLM routing',
    description: 'Integrate DAC into your development workflow for code generation, debugging, and documentation.',
    benefits: [
      {
        title: 'Multi-provider support',
        description: 'Use the best model for each coding task',
      },
      {
        title: 'Context-aware suggestions',
        description: 'AI understands your codebase and patterns, maintaining context across all interactions',
      },
      {
        title: 'Fast iteration',
        description: 'Low latency responses for real-time assistance',
      },
    ],
    color: 'orange',
  },
]

export default function UseCasesPage() {
  const [activeTab, setActiveTab] = useState('support')

  const activeUseCase = useCases.find((uc) => uc.id === activeTab) || useCases[0]
  const Icon = activeUseCase.icon

  return (
    <div className="min-h-screen bg-background">
      <StickyCTABar />

      {/* Hero Section */}
      <section className="border-b border-border bg-zinc-900/60 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <Reveal>
            <div className="text-center space-y-6">
              <h1 className="text-5xl font-bold text-foreground tracking-tight">
                Built for every team
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                See how DAC powers AI workflows across different industries and use cases
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Trust Marquee */}
      <TrustMarquee />

      {/* Use Cases Tabs */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-12 bg-zinc-900/40">
              {useCases.map((useCase) => {
                const UseCaseIcon = useCase.icon
                return (
                  <TabsTrigger
                    key={useCase.id}
                    value={useCase.id}
                    className="flex items-center gap-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                  >
                    <UseCaseIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{useCase.label}</span>
                    <span className="sm:hidden">{useCase.label.split(' ')[0]}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>

            {useCases.map((useCase) => {
              const UseCaseIcon = useCase.icon
              return (
                <TabsContent key={useCase.id} value={useCase.id} className="space-y-8">
                  <Reveal>
                    {/* Hero for this use case */}
                    <div className="text-center space-y-4">
                      <div className="flex justify-center">
                        <motion.div
                          className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 ${
                            useCase.color === 'emerald'
                              ? 'bg-emerald-500/20 border-emerald-500/30'
                              : useCase.color === 'blue'
                              ? 'bg-blue-500/20 border-blue-500/30'
                              : useCase.color === 'purple'
                              ? 'bg-purple-500/20 border-purple-500/30'
                              : 'bg-orange-500/20 border-orange-500/30'
                          }`}
                          animate={{ scale: [0.98, 1, 0.98] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <UseCaseIcon
                            className={`w-10 h-10 ${
                              useCase.color === 'emerald'
                                ? 'text-emerald-400'
                                : useCase.color === 'blue'
                                ? 'text-blue-400'
                                : useCase.color === 'purple'
                                ? 'text-purple-400'
                                : 'text-orange-400'
                            }`}
                          />
                        </motion.div>
                      </div>
                      <h2 className="text-4xl font-bold text-foreground">{useCase.title}</h2>
                      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        {useCase.description}
                      </p>
                    </div>
                  </Reveal>

                  {/* Mini Dashboard */}
                  {useCase.id === 'support' && (
                    <Reveal delay={0.2}>
                      <Card className="border-border bg-zinc-900/40 backdrop-blur-sm max-w-3xl mx-auto">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Activity className="w-5 h-5 text-emerald-400" />
                              <CardTitle className="text-lg">Live Ticket Resolution</CardTitle>
                            </div>
                            <span className="text-xs text-muted-foreground">Last 24 hours</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={mockMetrics.support}>
                              <XAxis dataKey="time" stroke="#71717a" style={{ fontSize: '12px' }} />
                              <YAxis stroke="#71717a" style={{ fontSize: '12px' }} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}
                                labelStyle={{ color: '#fafafa' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="resolved" 
                                stroke="#10b981" 
                                strokeWidth={2}
                                dot={{ fill: '#10b981' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="pending" 
                                stroke="#f59e0b" 
                                strokeWidth={2}
                                dot={{ fill: '#f59e0b' }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                          <div className="flex items-center justify-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-emerald-500" />
                              <span className="text-sm text-muted-foreground">Resolved</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-orange-500" />
                              <span className="text-sm text-muted-foreground">Pending</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Reveal>
                  )}

                  {/* Benefits Grid */}
                  <Stagger>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                      {useCase.benefits.map((benefit, index) => (
                        <motion.div key={index} variants={item}>
                          <Card
                            className="border-border bg-zinc-900/40 backdrop-blur-sm hover:bg-zinc-900/60 transition-all hover:-translate-y-1 h-full"
                          >
                            <CardHeader>
                              <CardTitle className="text-lg">{benefit.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <CardDescription>{benefit.description}</CardDescription>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </Stagger>

                  {/* API Playground CTA */}
                  <Reveal delay={0.4}>
                    <div className="flex justify-center mt-8">
                      <APIPlayground
                        trigger={
                          <Button variant="outline" size="lg" className="gap-2">
                            <Code className="w-4 h-4" />
                            See a live example
                          </Button>
                        }
                      />
                    </div>
                  </Reveal>
                </TabsContent>
              )
            })}
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 border-t border-border bg-zinc-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <div className="flex justify-center mb-6">
              <motion.div 
                className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/30"
                animate={{ scale: [0.98, 1, 0.98] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <MessageSquare className="w-8 h-8 text-emerald-400" />
              </motion.div>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to transform your workflow?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start using DAC today and see how intelligent routing can improve your team's productivity.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/conversations">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Get Started
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
