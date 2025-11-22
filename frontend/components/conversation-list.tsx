'use client'

import * as React from 'react'
import { Search, Plus, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { ConversationCard } from '@/components/conversation-card'
import { cn } from '@/lib/utils'

export interface Conversation {
  id: string
  title: string
  lastMessage?: string
  providers?: string[]
  lastUpdated: Date
  unread?: boolean
}

interface ConversationListProps {
  conversations: Conversation[]
  activeConversationId?: string
  onConversationSelect: (id: string) => void
  onNewConversation: () => void
  isLoading?: boolean
  className?: string
}

/**
 * ConversationList - Left sidebar for browsing and managing conversations
 *
 * Features:
 * - Search/filter conversations
 * - Create new conversation
 * - Scrollable list with active state
 * - Loading skeletons
 * - Empty state
 * - Keyboard navigation
 */
export function ConversationList({
  conversations,
  activeConversationId,
  onConversationSelect,
  onNewConversation,
  isLoading = false,
  className,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filteredConversations, setFilteredConversations] = React.useState(conversations)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Filter conversations based on search query
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = conversations.filter(
      (conv) =>
        conv.title.toLowerCase().includes(query) ||
        conv.lastMessage?.toLowerCase().includes(query)
    )
    setFilteredConversations(filtered)
  }, [searchQuery, conversations])

  // Keyboard shortcut: Cmd/Ctrl + F to focus search
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={cn('h-full flex flex-col bg-sidebar', className)}>
      {/* Header with New Conversation button */}
      <div className="p-4 border-b border-sidebar-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-sidebar-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Conversations
          </h2>
          <Button
            onClick={onNewConversation}
            size="sm"
            className="h-8 w-8 p-0"
            title="New conversation (Cmd+Shift+N)"
            aria-label="Create new conversation"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-muted-foreground focus-visible:ring-sidebar-ring"
            aria-label="Search conversations"
          />
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1" role="list" aria-label="Conversation list">
          {isLoading ? (
            // Loading skeletons
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-sidebar-accent" />
                  <Skeleton className="h-3 w-full bg-sidebar-accent" />
                  <Skeleton className="h-3 w-1/2 bg-sidebar-accent" />
                </div>
              ))}
            </>
          ) : filteredConversations.length === 0 ? (
            // Empty state
            <div className="p-8 text-center space-y-2">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={onNewConversation}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start a conversation
                </Button>
              )}
            </div>
          ) : (
            // Conversation cards
            filteredConversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onClick={() => onConversationSelect(conversation.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer with conversation count */}
      {!isLoading && filteredConversations.length > 0 && (
        <div className="p-3 border-t border-sidebar-border">
          <p className="text-xs text-muted-foreground text-center">
            {searchQuery
              ? `${filteredConversations.length} of ${conversations.length} conversations`
              : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      )}
    </div>
  )
}
