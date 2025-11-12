"use client"

import * as React from "react"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function StickyCTABar() {
  const [isVisible, setIsVisible] = React.useState(true)
  const [lastScrollY, setLastScrollY] = React.useState(0)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (latest) => {
    // Show bar when scrolling up, hide when scrolling down
    if (latest > 100) {
      // Only activate after scrolling 100px
      if (latest < lastScrollY) {
        setIsVisible(true)
      } else if (latest > lastScrollY + 5) {
        // Add threshold to prevent jittery behavior
        setIsVisible(false)
      }
    } else {
      setIsVisible(true)
    }
    setLastScrollY(latest)
  })

  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : -100 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-16 left-0 right-0 z-40 bg-zinc-900/95 backdrop-blur-lg border-b border-border shadow-lg"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              Start building with DAC today
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pricing">
              <Button variant="ghost" size="sm">
                Pricing
              </Button>
            </Link>
            <Link href="/conversations">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Start Chat
                <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

