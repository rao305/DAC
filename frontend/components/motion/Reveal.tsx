"use client"

import { motion, useReducedMotion } from "framer-motion"

interface RevealProps {
  children: React.ReactNode
  delay?: number
}

export default function Reveal({ children, delay = 0 }: RevealProps) {
  const reduce = useReducedMotion()

  const initial = reduce ? { opacity: 0 } : { opacity: 0, y: 12 }
  const animate = reduce ? { opacity: 1 } : { opacity: 1, y: 0 }

  return (
    <motion.div
      initial={initial}
      whileInView={animate}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  )
}

