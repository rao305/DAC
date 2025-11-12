import React from 'react'
import { Badge } from '@/components/ui/badge'

interface TypingIndicatorProps {
  provider?: string
  model?: string
  reason?: string
}

const PROVIDER_COLORS: Record<string, string> = {
  perplexity: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  openai: 'bg-green-500/20 text-green-300 border-green-500/30',
  gemini: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  openrouter: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  kimi: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
}

const PROVIDER_LABELS: Record<string, string> = {
  perplexity: 'Perplexity',
  openai: 'OpenAI',
  gemini: 'Gemini',
  openrouter: 'OpenRouter',
  kimi: 'Kimi',
}

export function TypingIndicator({ provider, model, reason }: TypingIndicatorProps = {}) {
  const providerColor = provider ? PROVIDER_COLORS[provider.toLowerCase()] || 'bg-muted/20 text-muted-foreground' : 'bg-muted/20 text-muted-foreground'
  const providerLabel = provider ? PROVIDER_LABELS[provider.toLowerCase()] || provider : 'AI'

  return (
    <div className="flex gap-4 justify-start" data-testid="skeleton-loader">
      <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="bg-card border border-border p-4 rounded-lg rounded-bl-none">
          <div className="flex gap-1.5 items-center">
            <div className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
        {provider && (
          <div className="flex gap-2 items-center text-xs">
            <Badge variant="outline" className={providerColor}>
              {providerLabel}
            </Badge>
            {reason && (
              <span className="text-muted-foreground">({reason})</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
