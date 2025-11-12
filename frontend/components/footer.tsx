"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mail, Github, Linkedin, Twitter, ArrowRight } from "lucide-react"
import { Logo } from "@/components/logo"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <Logo size="md" href="/" />
            <p className="text-sm text-muted-foreground max-w-xs">
              Enterprise AI routing platform. Operate across LLMs with intelligent provider selection, unified context, and enterprise-grade security.
            </p>
            <Link href="/conversations">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Open Chat
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-sm">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/product" className="hover:text-foreground hover:text-emerald-400 transition">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/use-cases" className="hover:text-foreground hover:text-emerald-400 transition">
                  Use Cases
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground hover:text-emerald-400 transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/conversations" className="hover:text-foreground hover:text-emerald-400 transition">
                  Demo
                </Link>
              </li>
            </ul>
          </div>

          {/* Docs */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-sm">Docs</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/docs" className="hover:text-foreground hover:text-emerald-400 transition">
                  Quickstart
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-foreground hover:text-emerald-400 transition">
                  API Reference
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-foreground hover:text-emerald-400 transition">
                  SDKs
                </Link>
              </li>
              <li>
                <a href="https://status.dac.io" className="hover:text-foreground hover:text-emerald-400 transition">
                  Status
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Security */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground hover:text-emerald-400 transition">
                  Security
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground hover:text-emerald-400 transition">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground hover:text-emerald-400 transition">
                  Terms
                </a>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground hover:text-emerald-400 transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <p className="text-sm text-muted-foreground">© 2025 DAC. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <a href="https://twitter.com/dac" className="text-muted-foreground hover:text-emerald-400 transition p-2" title="Twitter">
              <Twitter size={20} />
            </a>
            <a href="https://github.com/dac" className="text-muted-foreground hover:text-emerald-400 transition p-2" title="GitHub">
              <Github size={20} />
            </a>
            <a href="https://linkedin.com/company/dac" className="text-muted-foreground hover:text-emerald-400 transition p-2" title="LinkedIn">
              <Linkedin size={20} />
            </a>
            <a href="mailto:hello@dac.io" className="text-muted-foreground hover:text-emerald-400 transition p-2" title="Email">
              <Mail size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
