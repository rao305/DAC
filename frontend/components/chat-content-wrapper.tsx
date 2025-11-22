"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ChatContentWrapperProps {
  children: React.ReactNode
  className?: string
}

/**
 * ChatContentWrapper - Gemini-style chat container with fixed max-width
 * 
 * Features:
 * - Fixed max-width (80ch) for optimal readability on large screens
 * - Full-width on small screens
 * - Centered content
 * - Responsive padding
 */
export function ChatContentWrapper({ children, className }: ChatContentWrapperProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[80ch] px-4",
        className
      )}
    >
      {children}
    </div>
  )
}

interface AIResponseBlockProps {
  children: React.ReactNode
  className?: string
}

/**
 * AIResponseBlock - Styled block for AI responses
 * 
 * Features:
 * - Dark background matching Gemini UI
 * - Rounded corners
 * - Proper spacing
 * - Text styling optimized for readability
 */
export function AIResponseBlock({ children, className }: AIResponseBlockProps) {
  return (
    <div
      className={cn(
        "bg-[#202124] text-[#e8eaed]",
        "px-5 py-4 rounded-[18px] mb-4",
        "leading-relaxed",
        className
      )}
    >
      {children}
    </div>
  )
}

interface CodeBlockProps {
  children: React.ReactNode
  language?: string
  className?: string
}

/**
 * CodeBlock - Styled code block within the chat container
 * 
 * Features:
 * - Distinct styling from regular text
 * - Syntax highlighting ready
 * - Proper overflow handling
 */
export function CodeBlock({ children, language, className }: CodeBlockProps) {
  return (
    <div
      className={cn(
        "mt-4 mb-4 rounded-lg overflow-hidden",
        "bg-[#1a1a1a] border border-[#3c3c3c]",
        className
      )}
    >
      {language && (
        <div className="px-4 py-2 bg-[#252525] border-b border-[#3c3c3c] text-xs text-[#9aa0a6] font-mono">
          {language}
        </div>
      )}
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm text-[#e8eaed] font-mono leading-relaxed">
          {children}
        </code>
      </pre>
    </div>
  )
}

