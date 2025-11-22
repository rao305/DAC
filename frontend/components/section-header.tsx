"use client"

import { motion } from "framer-motion"
import Reveal from "@/components/motion/Reveal"

interface SectionHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  className?: string
}

export function SectionHeader({ eyebrow, title, subtitle, className = "" }: SectionHeaderProps) {
  return (
    <Reveal>
      <div className={`text-center mb-12 ${className}`}>
        {eyebrow && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4"
          >
            {eyebrow}
          </motion.p>
        )}
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{title}</h2>
        {subtitle && (
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        )}
      </div>
    </Reveal>
  )
}

