"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface DifferentiatorCardProps {
  icon: LucideIcon
  title: string
  description: string
  delay?: number
}

export function DifferentiatorCard({
  icon: Icon,
  title,
  description,
  delay = 0,
}: DifferentiatorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-sm hover:bg-zinc-900/60 transition-all hover:shadow-xl hover:shadow-emerald-500/10 h-full">
        <CardHeader>
          <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
            <Icon className="w-6 h-6 text-emerald-400" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

