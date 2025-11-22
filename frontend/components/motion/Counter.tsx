"use client"

import { useEffect, useRef, useState } from "react"
import { useInView } from "framer-motion"

interface CounterProps {
  to?: number
  suffix?: string
  duration?: number
}

export default function Counter({ to = 99, suffix = "%", duration = 800 }: CounterProps) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.5 })
  const start = useRef<number>()

  useEffect(() => {
    if (!isInView) return

    const step = (t: number) => {
      if (!start.current) start.current = t
      const progress = Math.min((t - start.current) / duration, 1)
      setVal(Math.round(to * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) requestAnimationFrame(step)
    }

    const id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [to, duration, isInView])

  return <span ref={ref}>{val}{suffix}</span>
}

