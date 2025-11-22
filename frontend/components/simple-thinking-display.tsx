'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SimpleThinkingDisplayProps {
  isVisible: boolean
  className?: string
}

export function SimpleThinkingDisplay({
  isVisible,
  className
}: SimpleThinkingDisplayProps) {
  if (!isVisible) return null

  return (
    <div className={cn("w-full flex justify-center mb-6", className)}>
      <div className="max-w-[680px] w-full">
        <div className="flex items-center gap-3 text-white">
          {/* Rotating Brain/Gear Icon */}
          <div className="animate-spin">
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className="text-white"
            >
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6"/>
              <path d="m21 12-6 0m-6 0-6 0"/>
              <path d="m16.24 7.76-4.24 4.24m-4.24 0L3.52 7.76"/>
              <path d="m16.24 16.24-4.24-4.24m-4.24 0L3.52 16.24"/>
            </svg>
          </div>
          
          {/* Analyzing text */}
          <span className="text-[16px] text-white">Analyzing...</span>
        </div>
      </div>
    </div>
  )
}