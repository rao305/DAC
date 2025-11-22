"use client"

import { motion } from "framer-motion"

interface StaggerProps {
  children: React.ReactNode
}

export default function Stagger({ children }: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
    >
      {children}
    </motion.div>
  )
}

export const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

