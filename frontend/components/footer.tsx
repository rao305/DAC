"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mail, Github, Linkedin, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <div className="w-8 h-8 bg-accent rounded-sm flex items-center justify-center">
                <span className="text-primary font-bold">D</span>
              </div>
              <span>DAC</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Enterprise AI agent platform for secure, scalable deployments.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-sm">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/#product" className="hover:text-foreground transition">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#use-cases" className="hover:text-foreground transition">
                  Use Cases
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-foreground transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/demo" className="hover:text-foreground transition">
                  Demo
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-sm">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground transition">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition">
                  Careers
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-foreground transition">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Resources */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-sm">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/docs" className="hover:text-foreground transition">
                  Docs
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition">
                  Security
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-8" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <p className="text-sm text-muted-foreground">© 2025 DAC. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <Link href="/demo">
              <Button variant="outline" size="sm">
                Book a Demo
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-accent transition p-2" title="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition p-2" title="GitHub">
                <Github size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition p-2" title="LinkedIn">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition p-2" title="Email">
                <Mail size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
