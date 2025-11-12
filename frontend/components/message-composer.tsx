'use client'

import * as React from 'react'
import { Send, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface MessageComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel?: () => void
  isLoading?: boolean
  disabled?: boolean
  selectedModels?: string[]
  onModelToggle?: (model: string) => void
  placeholder?: string
  maxLength?: number
  showCharacterCount?: boolean
  autoFocus?: boolean
  className?: string
}

/**
 * MessageComposer - Enhanced multiline input for composing messages
 *
 * Features:
 * - Auto-resizing textarea
 * - Character count
 * - Model selection badges
 * - Keyboard shortcuts (Cmd/Ctrl+Enter to send, Esc to cancel)
 * - Loading state
 * - Disabled state
 * - Submit validation
 */
export function MessageComposer({
  value,
  onChange,
  onSubmit,
  onCancel,
  isLoading = false,
  disabled = false,
  selectedModels = [],
  onModelToggle,
  placeholder = 'Type your message...',
  maxLength = 10000,
  showCharacterCount = true,
  autoFocus = false,
  className,
}: MessageComposerProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = React.useState(false)

  const characterCount = value.length
  const isNearLimit = characterCount > maxLength * 0.9
  const isOverLimit = characterCount > maxLength
  const canSubmit = value.trim().length > 0 && !isLoading && !disabled && !isOverLimit

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [value])

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter to send
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (canSubmit) {
        onSubmit()
      }
    }

    // Escape to cancel
    if (e.key === 'Escape' && onCancel) {
      e.preventDefault()
      onCancel()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canSubmit) {
      onSubmit()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'border-t border-border bg-card/50 backdrop-blur-sm transition-all',
        isFocused && 'border-accent/50',
        className
      )}
    >
      <div className="p-4 space-y-3">
        {/* Selected models */}
        {selectedModels.length > 0 && onModelToggle && (
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Using:</span>
            {selectedModels.map((model) => (
              <Badge
                key={model}
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-secondary/80"
                onClick={() => onModelToggle(model)}
              >
                {model}
                <span className="ml-1.5 text-muted-foreground hover:text-foreground">×</span>
              </Badge>
            ))}
          </div>
        )}

        {/* Textarea */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            autoFocus={autoFocus}
            className={cn(
              'min-h-[60px] max-h-[300px] resize-none',
              'bg-background border-border',
              'focus-visible:ring-accent focus-visible:ring-2',
              'placeholder:text-muted-foreground',
              isOverLimit && 'border-destructive focus-visible:ring-destructive'
            )}
            aria-label="Message input"
            aria-describedby="character-count keyboard-hint"
          />

          {/* Character count and hints */}
          <div className="mt-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span id="keyboard-hint" className="hidden sm:block">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                  {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                </kbd>
                <span className="mx-1">+</span>
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Enter</kbd>
                <span className="ml-1">to send</span>
              </span>
            </div>

            {showCharacterCount && (
              <span
                id="character-count"
                className={cn(
                  'tabular-nums',
                  isNearLimit && 'text-yellow-500',
                  isOverLimit && 'text-destructive font-medium'
                )}
                aria-live="polite"
              >
                {characterCount.toLocaleString()} / {maxLength.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={!isLoading}
                data-testid="cancel-button"
                aria-label="Cancel request"
              >
                Cancel
              </Button>
            )}
          </div>

          <Button
            type="submit"
            disabled={!canSubmit}
            className="gap-2"
            aria-label="Send message"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
