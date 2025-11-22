'use client'

import * as React from 'react'
import { Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedChainOfThoughtProps {
  chainOfThought: string
  isExpanded?: boolean
  onToggle?: () => void
  className?: string
}

export function EnhancedChainOfThought({
  chainOfThought,
  isExpanded = false,
  onToggle,
  className
}: EnhancedChainOfThoughtProps) {
  const [localExpanded, setLocalExpanded] = React.useState(isExpanded)

  const handleToggle = () => {
    const newExpanded = !localExpanded
    setLocalExpanded(newExpanded)
    onToggle?.()
  }

  // Get preview text (first line)
  const previewText = React.useMemo(() => {
    if (!chainOfThought) return "Why I chose this approach..."
    const firstSentence = chainOfThought.split(/[.!?]+/)[0]?.trim()
    return firstSentence ? `${firstSentence}...` : "Why I chose this approach..."
  }, [chainOfThought])

  if (!chainOfThought) return null

  return (
    <div className={cn("mb-3 w-full max-w-[90%]", className)}>
      {/* CoT Panel */}
      <div className="bg-[#f9f9f9] rounded-lg p-3 border-t border-[#e0e0e0]">
        <div className="flex items-start justify-between">
          <div className="flex-1 overflow-hidden">
            {localExpanded ? (
              <div className="animate-in fade-in-0 slide-in-from-top-2 duration-150">
                <div className="text-sm text-gray-700 leading-[1.6] font-normal">
                  {chainOfThought}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600 font-normal hover:text-[#3f51b5] transition-colors duration-150 cursor-pointer truncate" onClick={handleToggle}>
                {previewText}
              </div>
            )}
          </div>

          {/* Brain Icon */}
          <button
            onClick={handleToggle}
            className="ml-3 flex-shrink-0 cursor-pointer transition-all duration-120 hover:scale-105 active:shadow-[inset_0_0_4px_rgba(63,81,181,.2)]"
          >
            <Brain 
              className={cn(
                "h-4 w-4 transition-colors duration-150",
                localExpanded ? "text-[#3f51b5]" : "text-[#9e9e9e]"
              )}
            />
          </button>
        </div>
      </div>
    </div>
  )
}