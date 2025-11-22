"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  features: string[]
  color: "emerald" | "blue" | "purple" | "orange" | "green" | "teal"
  delay?: number
}

const colorClasses = {
  emerald: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
  },
  blue: {
    bg: "bg-blue-500/20",
    text: "text-blue-400",
  },
  purple: {
    bg: "bg-purple-500/20",
    text: "text-purple-400",
  },
  orange: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
  },
  green: {
    bg: "bg-green-500/20",
    text: "text-green-400",
  },
  teal: {
    bg: "bg-teal-500/20",
    text: "text-teal-400",
  },
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  features,
  color,
  delay = 0,
}: FeatureCardProps) {
  const colors = colorClasses[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-sm hover:bg-zinc-900/60 transition-all hover:shadow-xl h-full">
        <CardHeader>
          <motion.div
            className={cn("w-12 h-12 rounded-lg flex items-center justify-center mb-4", colors.bg)}
            animate={{ scale: [0.98, 1, 0.98] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay }}
          >
            <Icon className={cn("w-6 h-6", colors.text)} />
          </motion.div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {features.map((feature, index) => (
              <li key={index}>• {feature}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  )
}

