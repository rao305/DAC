import React from 'react'

interface TypingIndicatorProps {
  provider?: string
  model?: string
  reason?: string
}

/**
 * Get loading status message based on reason/provider
 */
function getStatusMessage(reason?: string, provider?: string): string {
  if (!reason) {
    return 'Thinking'
  }

  const reasonLower = reason.toLowerCase()

  // Check for web search / retrieval
  if (reasonLower.includes('search') || reasonLower.includes('web') || reasonLower.includes('retrieval')) {
    return 'Searching the web'
  }

  // Check for reasoning / math
  if (reasonLower.includes('math') || reasonLower.includes('reasoning') || reasonLower.includes('calculate')) {
    return 'Solving'
  }

  // Check for code generation
  if (reasonLower.includes('code') || reasonLower.includes('programming') || reasonLower.includes('coding')) {
    return 'Generating code'
  }

  // Check for writing / editing
  if (reasonLower.includes('write') || reasonLower.includes('edit') || reasonLower.includes('draft')) {
    return 'Writing'
  }

  // Default based on provider
  if (provider?.toLowerCase() === 'perplexity') {
    return 'Searching the web'
  }

  return 'Thinking'
}

/**
 * TypingIndicator - Gemini-inspired minimalist loading status with animation
 * 
 * Features:
 * - Simple status text in light green/emerald
 * - Animated dots for visual feedback (sequential bounce)
 * - Left-aligned like AI messages
 * - Clean, minimalist design
 * - Context-aware status messages
 */
export function TypingIndicator({ provider, model, reason }: TypingIndicatorProps = {}) {
  const statusMessage = getStatusMessage(reason, provider)

  return (
    <div className="flex justify-start" data-testid="typing-indicator">
      <div className="flex items-center gap-1 text-sm text-emerald-400/80 font-medium">
        <span>{statusMessage}</span>
        <span className="flex items-center gap-1 ml-1">
          <span 
            className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400/80"
            style={{ 
              animation: 'typing 1.4s ease-in-out infinite',
              animationDelay: '0ms'
            }}
          />
          <span 
            className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400/80"
            style={{ 
              animation: 'typing 1.4s ease-in-out infinite',
              animationDelay: '200ms'
            }}
          />
          <span 
            className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400/80"
            style={{ 
              animation: 'typing 1.4s ease-in-out infinite',
              animationDelay: '400ms'
            }}
          />
        </span>
      </div>
    </div>
  )
}
