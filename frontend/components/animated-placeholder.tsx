'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface AnimatedPlaceholderProps {
  className?: string
  staticText?: string
  suggestions?: string[]
  interval?: number
}

const DEFAULT_SUGGESTIONS = [
  'brainstorm ideas',
  'to look something up',
  'help with homework',
  'find similar examples',
  'explain a concept',
  'to generate code',
  'image generation',
]

/**
 * AnimatedPlaceholder - Rotating text suggestions with upward slide animation
 * 
 * Features:
 * - Static prefix text ("Ask DAC about")
 * - Rotating suggestions that slide up and fade
 * - Smooth transitions between suggestions
 * - Customizable interval and suggestions
 */
export function AnimatedPlaceholder({
  className,
  staticText = 'Ask DAC about',
  suggestions = DEFAULT_SUGGESTIONS,
  interval = 3000,
}: AnimatedPlaceholderProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isAnimating, setIsAnimating] = React.useState(false)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true)
      // After animation completes, move to next suggestion
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % suggestions.length)
        setIsAnimating(false)
      }, 400) // Animation duration
    }, interval)

    return () => clearInterval(timer)
  }, [suggestions.length, interval])

  const currentSuggestion = suggestions[currentIndex]
  const nextSuggestion = suggestions[(currentIndex + 1) % suggestions.length]

  return (
    <span className={cn('inline-flex items-center', className)}>
      <span className="text-muted-foreground/70">{staticText}</span>
      <span className="relative ml-1 inline-block min-w-[200px] h-[1.2em] overflow-hidden text-muted-foreground/70">
        {/* Current suggestion sliding out */}
        <span
          className={cn(
            'inline-block transition-all duration-400 ease-in-out',
            isAnimating && 'animate-slide-out-up'
          )}
        >
          {currentSuggestion}
        </span>
        {/* Next suggestion sliding in */}
        {isAnimating && (
          <span className="absolute left-0 top-0 inline-block animate-slide-in-up">
            {nextSuggestion}
          </span>
        )}
      </span>
    </span>
  )
}
