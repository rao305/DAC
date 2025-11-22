'use client'

import * as React from 'react'
import { Copy, Check, RefreshCw, Edit2, Trash2, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface MessageActionsProps {
  messageId: string
  content: string
  role: 'user' | 'assistant' | 'system'
  onCopy?: (content: string) => void
  onRegenerate?: (messageId: string) => void
  onEdit?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  className?: string
}

/**
 * MessageActions - Action buttons for messages
 *
 * Features:
 * - Copy message content
 * - Regenerate response (assistant only)
 * - Edit message (user only)
 * - Delete message
 * - Dropdown menu for additional actions
 * - Keyboard shortcuts
 */
export function MessageActions({
  messageId,
  content,
  role,
  onCopy,
  onRegenerate,
  onEdit,
  onDelete,
  className,
}: MessageActionsProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    onCopy?.(content)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = () => {
    onRegenerate?.(messageId)
  }

  const handleEdit = () => {
    onEdit?.(messageId)
  }

  const handleDelete = () => {
    onDelete?.(messageId)
  }

  const showRegenerate = role === 'assistant' && onRegenerate
  const showEdit = role === 'user' && onEdit

  return (
    <div
      className={cn(
        'flex items-center gap-0.5 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-0.5',
        className
      )}
      role="toolbar"
      aria-label="Message actions"
    >
      {/* Copy button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-7 w-7 p-0"
        title="Copy message (Cmd+Shift+C)"
        aria-label="Copy message"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </Button>

      {/* Regenerate button (assistant messages only) */}
      {showRegenerate && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRegenerate}
          className="h-7 w-7 p-0"
          title="Regenerate response (Cmd+R)"
          aria-label="Regenerate response"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      )}

      {/* Edit button (user messages only) */}
      {showEdit && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleEdit}
          className="h-7 w-7 p-0"
          title="Edit message (Cmd+E)"
          aria-label="Edit message"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
      )}

      {/* More actions dropdown */}
      {onDelete && (
        <>
          <div className="w-px h-4 bg-border mx-0.5" aria-hidden="true" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                aria-label="More actions"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </DropdownMenuItem>
              {showRegenerate && (
                <DropdownMenuItem onClick={handleRegenerate}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </DropdownMenuItem>
              )}
              {showEdit && (
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  )
}
