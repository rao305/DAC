"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"

const faqItems = [
  {
    question: "What is Syntra?",
    answer:
      "Syntra is an enterprise-grade platform for deploying and managing autonomous AI agents at scale. It provides security, monitoring, compliance controls, and seamless integration with your existing tools.",
  },
  {
    question: "How is Syntra different from other AI agent platforms?",
    answer:
      "Syntra is built specifically for enterprise deployments with built-in security, compliance, and observability. We handle infrastructure complexity so you can focus on your agents' logic and outcomes.",
  },
  {
    question: "What kind of agents can I build?",
    answer:
      "You can build agents for customer support, sales automation, content generation, data analysis, compliance monitoring, and more. Our platform supports any use case that requires autonomous decision-making.",
  },
  {
    question: "Is my data secure on Syntra?",
    answer:
      "Yes. Syntra includes end-to-end encryption, audit trails, role-based access controls, and compliance certifications (SOC 2, HIPAA, GDPR ready). Security is built into every layer.",
  },
  {
    question: "How does pricing work?",
    answer:
      "Pricing is based on API calls and number of agents deployed. We offer transparent, flexible plans starting with Starter, Professional, and Enterprise tiers. Contact sales for custom pricing.",
  },
  {
    question: "Can I deploy agents on-premise?",
    answer:
      "Yes, our Enterprise plan includes on-premise deployment options. We also support hybrid deployments for maximum flexibility.",
  },
  {
    question: "What support do you provide?",
    answer:
      "We offer email support for all plans, priority support for Professional, and dedicated account managers for Enterprise customers. Join our community for peer support.",
  },
  {
    question: "How quickly can I get started?",
    answer:
      "You can deploy your first agent in minutes using our dashboard or CI/CD integration. Most teams see production deployments within hours.",
  },
]

export function FAQ() {
  const [openItem, setOpenItem] = useState<number | null>(0)

  return (
    <section className="py-20 md:py-32 border-t border-border">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground">Everything you need to know about Syntra</p>
        </div>

        <div className="space-y-2 mb-12">
          {faqItems.map((item, idx) => (
            <div
              key={idx}
              className="border border-border rounded-lg overflow-hidden hover:border-accent/30 transition-colors"
            >
              <button
                onClick={() => setOpenItem(openItem === idx ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-card/50 transition-colors text-left"
              >
                <span className="font-semibold text-foreground">{item.question}</span>
                <ChevronDown
                  size={20}
                  className={`text-accent transition-transform duration-300 flex-shrink-0 ${
                    openItem === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openItem === idx && (
                <div className="px-6 py-4 bg-card/30 border-t border-border text-muted-foreground text-sm leading-relaxed">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center space-y-4 pt-8 border-t border-border">
          <h3 className="text-lg font-semibold text-foreground">Still have questions?</h3>
          <p className="text-muted-foreground mb-4">Get in touch with our team</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact">
              <Button>Talk to Us</Button>
            </Link>
            <a href="mailto:support@dac.ai">
              <Button variant="outline">Contact Support</Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
