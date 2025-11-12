'use client'

import * as React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Conversation } from './conversation-list'

interface ConversationCardProps {
  conversation: Conversation
  isActive?: boolean
  onClick: () => void
  className?: string
}

const PROVIDER_COLORS: Record<string, string> = {
  perplexity: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  openai: 'bg-green-500/20 text-green-300 border-green-500/30',
  gemini: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  openrouter: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

const PROVIDER_LABELS: Record<string, string> = {
  perplexity: 'Perplexity',
  openai: 'OpenAI',
  gemini: 'Gemini',
  openrouter: 'OpenRouter',
}

/**
 * ConversationCard - Individual conversation list item
 *
 * Features:
 * - Title with overflow ellipsis and tooltip
 * - Provider badges
 * - Last updated timestamp
 * - Active state highlighting
 * - Unread indicator
 * - Hover effects
 */
export function ConversationCard({
  conversation,
  isActive = false,
  onClick,
  className,
}: ConversationCardProps) {
  const { title, lastMessage, providers = [], lastUpdated, unread = false } = conversation

  const truncatedTitle = title.length > 50 ? `${title.slice(0, 50)}...` : title
  const timeAgo = formatDistanceToNow(lastUpdated, { addSuffix: true })

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'w-full text-left p-3 rounded-lg transition-all duration-150',
              'hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
              'group relative',
              isActive && 'bg-sidebar-accent border-l-2 border-sidebar-primary',
              !isActive && 'border-l-2 border-transparent',
              className
            )}
            role="listitem"
            aria-current={isActive ? 'page' : undefined}
            aria-label={`Conversation: ${title}`}
          >
            {/* Unread indicator */}
            {unread && !isActive && (
              <div
                className="absolute top-3 right-3 w-2 h-2 rounded-full bg-sidebar-primary"
                aria-label="Unread messages"
              />
            )}

            {/* Title */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3
                className={cn(
                  'text-sm font-medium truncate flex-1',
                  isActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground',
                  'group-hover:text-sidebar-primary-foreground'
                )}
              >
                {truncatedTitle}
              </h3>
            </div>

            {/* Last message preview */}
            {lastMessage && (
              <p
                className="text-xs text-muted-foreground truncate mb-2"
                title={lastMessage}
              >
                {lastMessage}
              </p>
            )}

            {/* Provider badges and timestamp */}
            <div className="flex items-center justify-between gap-2">
              {providers.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {providers.slice(0, 2).map((provider) => (
                    <Badge
                      key={provider}
                      variant="outline"
                      className={cn(
                        'text-[10px] px-1.5 py-0 h-4',
                        PROVIDER_COLORS[provider.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
                      )}
                    >
                      {PROVIDER_LABELS[provider.toLowerCase()] || provider}
                    </Badge>
                  ))}
                  {providers.length > 2 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground"
                    >
                      +{providers.length - 2}
                    </Badge>
                  )}
                </div>
              )}

              <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-auto">
                {timeAgo}
              </span>
            </div>
          </button>
        </TooltipTrigger>

        {/* Full title tooltip for truncated titles */}
        {title.length > 50 && (
          <TooltipContent side="right" className="max-w-xs">
            <p className="text-sm">{title}</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}
