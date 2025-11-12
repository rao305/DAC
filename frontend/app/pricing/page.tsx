'use client'

import * as React from 'react'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, ArrowRight, X } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Reveal from '@/components/motion/Reveal'
import Stagger, { item } from '@/components/motion/Stagger'
import { TrustMarquee } from '@/components/trust-marquee'
import { StickyCTABar } from '@/components/sticky-cta-bar'
import { PricingToggle } from '@/components/pricing-toggle'
import { FAQAccordion } from '@/components/faq-accordion'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const plans = [
  {
    name: 'Starter',
    price: { monthly: 0, annual: 0 },
    description: 'Perfect for individuals and small teams getting started',
    features: [
      '1 LLM Provider',
      '1 Team Seat',
      'Community Support',
      'Basic Routing',
      'Up to 1,000 requests/month',
    ],
    cta: 'Get Started',
    popular: false,
    color: 'border-border',
  },
  {
    name: 'Pro',
    price: { monthly: 49, annual: 490 },
    description: 'For growing teams that need more power and flexibility',
    features: [
      '4+ LLM Providers',
      '5 Team Seats',
      'Priority Support',
      'Advanced Routing',
      'Unlimited Requests',
      'Usage Analytics',
      'Custom Policies',
    ],
    cta: 'Start Free Trial',
    popular: true,
    color: 'border-emerald-500',
  },
  {
    name: 'Enterprise',
    price: { monthly: null, annual: null },
    description: 'Custom solutions for large organizations',
    features: [
      'Unlimited Providers',
      'Unlimited Team Seats',
      'SLA & Dedicated Support',
      'SSO & Advanced Security',
      'Custom Integrations',
      'On-premise Options',
      'Dedicated Account Manager',
    ],
    cta: 'Contact Sales',
    popular: false,
    color: 'border-border',
  },
]

// Comparison data
const comparisonFeatures = [
  { feature: 'LLM Providers', starter: '1', pro: '4+', enterprise: 'Unlimited' },
  { feature: 'Team Seats', starter: '1', pro: '5', enterprise: 'Unlimited' },
  { feature: 'Monthly Requests', starter: '1,000', pro: 'Unlimited', enterprise: 'Unlimited' },
  { feature: 'Smart Routing', starter: 'Basic', pro: 'Advanced', enterprise: 'Custom' },
  { feature: 'SSO', starter: false, pro: false, enterprise: true },
  { feature: 'Routing Policies', starter: false, pro: 'Custom', enterprise: 'Custom' },
  { feature: 'Webhooks', starter: false, pro: true, enterprise: true },
  { feature: 'API Rate Limits', starter: '100/min', pro: '1000/min', enterprise: 'Custom' },
  { feature: 'Support', starter: 'Community', pro: 'Priority Email', enterprise: 'SLA + Dedicated' },
]

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true)

  return (
    <div className="min-h-screen bg-background">
      <StickyCTABar />

      {/* Hero Section */}
      <section className="border-b border-border bg-zinc-900/60 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <Reveal>
            <div className="text-center space-y-6">
              <h1 className="text-5xl font-bold text-foreground tracking-tight">
                Simple, transparent pricing
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Choose the plan that fits your team. Upgrade or downgrade at any time.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center pt-4">
                <PricingToggle onChange={setIsAnnual} />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Trust Marquee */}
      <TrustMarquee />

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Stagger>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <motion.div key={plan.name} variants={item}>
                  <Card
                    className={`relative border-2 ${plan.color} ${
                      plan.popular
                        ? 'bg-zinc-900/60 backdrop-blur-sm scale-105 shadow-xl shadow-emerald-500/10'
                        : 'bg-zinc-900/40 backdrop-blur-sm'
                    } transition-all hover:-translate-y-1 h-full flex flex-col`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription className="mt-2">{plan.description}</CardDescription>
                      <div className="mt-6">
                        {plan.price.monthly === null ? (
                          <div className="text-3xl font-bold text-foreground">Custom</div>
                        ) : (
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-foreground">
                              ${isAnnual ? plan.price.annual : plan.price.monthly}
                            </span>
                            <span className="text-muted-foreground">
                              /{isAnnual ? 'year' : 'month'}
                            </span>
                          </div>
                        )}
                        {plan.price.monthly === 0 && (
                          <p className="text-sm text-muted-foreground mt-2">Forever free</p>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6 flex-1 flex flex-col">
                      <ul className="space-y-3 flex-1">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href={plan.name === 'Enterprise' ? '/contact' : '/conversations'} className="block">
                        <Button
                          className={`w-full ${
                            plan.popular
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-background hover:bg-accent'
                          }`}
                          variant={plan.popular ? 'default' : 'outline'}
                        >
                          {plan.cta}
                          {plan.name !== 'Enterprise' && (
                            <ArrowRight className="ml-2 w-4 h-4" />
                          )}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </Stagger>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 border-t border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              Compare Plans
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="comparison">
                <AccordionTrigger className="text-lg font-semibold hover:text-emerald-400">
                  View detailed feature comparison
                </AccordionTrigger>
                <AccordionContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-4 px-4 text-sm font-semibold text-foreground">
                            Feature
                          </th>
                          <th className="text-center py-4 px-4 text-sm font-semibold text-foreground">
                            Starter
                          </th>
                          <th className="text-center py-4 px-4 text-sm font-semibold text-emerald-400">
                            Pro
                          </th>
                          <th className="text-center py-4 px-4 text-sm font-semibold text-foreground">
                            Enterprise
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonFeatures.map((row, idx) => (
                          <tr key={idx} className="border-b border-border/50">
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {row.feature}
                            </td>
                            <td className="py-3 px-4 text-sm text-center text-foreground">
                              {typeof row.starter === 'boolean' ? (
                                row.starter ? (
                                  <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                                ) : (
                                  <X className="w-4 h-4 text-muted-foreground mx-auto" />
                                )
                              ) : (
                                row.starter
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-center text-foreground font-medium">
                              {typeof row.pro === 'boolean' ? (
                                row.pro ? (
                                  <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                                ) : (
                                  <X className="w-4 h-4 text-muted-foreground mx-auto" />
                                )
                              ) : (
                                row.pro
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-center text-foreground">
                              {typeof row.enterprise === 'boolean' ? (
                                row.enterprise ? (
                                  <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                                ) : (
                                  <X className="w-4 h-4 text-muted-foreground mx-auto" />
                                )
                              ) : (
                                row.enterprise
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Reveal>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 border-t border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="text-3xl font-bold text-foreground text-center mb-12">
              Frequently Asked Questions
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <FAQAccordion />
          </Reveal>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 border-t border-border bg-zinc-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Still have questions?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Our team is here to help you choose the right plan for your needs.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/conversations">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
