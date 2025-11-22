"use client"

import * as React from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "Can I change plans later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express, Discover). Enterprise customers can also pay via invoice with NET-30 terms.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes, Pro plans include a 14-day free trial with full access to all features. No credit card required to start.",
  },
  {
    question: "How does usage-based pricing work?",
    answer:
      "You only pay for what you use. We track tokens, requests, and API calls, and bill you monthly based on actual usage. Starter plan has a 1,000 requests/month limit.",
  },
  {
    question: "What's included in support?",
    answer:
      "Starter includes community support via Discord. Pro includes priority email support with 24-hour response time. Enterprise includes SLA-backed support with dedicated account manager and 99.9% uptime guarantee.",
  },
  {
    question: "Can I use my own API keys?",
    answer:
      "Yes! Syntra lets you bring your own API keys for OpenAI, Anthropic, Google, and other providers. We handle routing and fallbacks while you maintain full cost control.",
  },
]

export function FAQAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="text-left text-foreground hover:text-emerald-400">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

