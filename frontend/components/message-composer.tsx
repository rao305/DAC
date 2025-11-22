'use client'

import * as React from 'react'
import { Send, Sparkles, Loader2, Plus, X, Image as ImageIcon, File, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AnimatedPlaceholder } from '@/components/animated-placeholder'
import { uploadImage } from '@/lib/storage'

export interface FileAttachment {
  id: string
  file: File
  preview?: string // For images
  type: 'image' | 'file'
  uploadStatus?: 'pending' | 'uploading' | 'uploaded' | 'error'
  uploadedUrl?: string // Firebase Storage URL after upload
  uploadError?: string
}

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
  attachments?: FileAttachment[]
  onAttachmentsChange?: (attachments: FileAttachment[]) => void
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
  attachments = [],
  onAttachmentsChange,
}: MessageComposerProps) {
  const formRef = React.useRef<HTMLFormElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [internalAttachments, setInternalAttachments] = React.useState<FileAttachment[]>(attachments || [])
  const isSubmittingRef = React.useRef(false) // Prevent double submission

  // Sync internal attachments with prop
  React.useEffect(() => {
    if (attachments) {
      setInternalAttachments(attachments)
    }
  }, [attachments])

  // Reset submission flag when loading completes
  // This ensures the form can be used again after submission
  React.useEffect(() => {
    if (!isLoading && isSubmittingRef.current) {
      // Small delay to ensure all state updates have completed
      const timeoutId = setTimeout(() => {
        isSubmittingRef.current = false
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [isLoading])

  const characterCount = value.length
  const isNearLimit = characterCount > maxLength * 0.9
  const isOverLimit = characterCount > maxLength
  // CRITICAL: Also check isSubmittingRef to prevent submissions while already submitting
  const canSubmit = (value.trim().length > 0 || internalAttachments.length > 0) && !isLoading && !disabled && !isOverLimit && !isSubmittingRef.current

  // Handle file processing (no upload needed - using base64)
  const processFiles = React.useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const newAttachments: FileAttachment[] = []

    for (const file of fileArray) {
      const id = `${Date.now()}-${Math.random()}`
      const isImage = file.type.startsWith('image/')

      const attachment: FileAttachment = {
        id,
        file,
        type: isImage ? 'image' : 'file',
        uploadStatus: 'uploaded', // No upload needed, mark as ready
      }

      // Create preview for images using object URL
      if (isImage) {
        attachment.preview = URL.createObjectURL(file)
      }

      newAttachments.push(attachment)
    }

    // Add all attachments at once
    const updated = [...internalAttachments, ...newAttachments]
    setInternalAttachments(updated)
    if (onAttachmentsChange) {
      onAttachmentsChange(updated)
    }
  }, [internalAttachments, onAttachmentsChange])

  // Handle file input change
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files)
      e.target.value = '' // Reset input
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isLoading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled || isLoading) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFiles(files)
    }
  }

  // Remove attachment and cleanup object URL
  const removeAttachment = (id: string) => {
    const attachment = internalAttachments.find((a) => a.id === id)
    if (attachment?.preview && attachment.preview.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.preview)
    }
    const updated = internalAttachments.filter((a) => a.id !== id)
    setInternalAttachments(updated)
    if (onAttachmentsChange) {
      onAttachmentsChange(updated)
    }
  }

  // Handle paste event for images
  const handlePaste = React.useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    let hasImage = false
    const imageFiles: File[] = []

    // Check for images in clipboard
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        hasImage = true
        const file = item.getAsFile()
        if (file) {
          imageFiles.push(file)
        }
      }
    }

    // If we found images, prevent default text paste and process images
    if (hasImage && imageFiles.length > 0) {
      e.preventDefault()
      processFiles(imageFiles)
    }
  }, [processFiles])

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      internalAttachments.forEach((attachment) => {
        if (attachment.preview && attachment.preview.startsWith('blob:')) {
          URL.revokeObjectURL(attachment.preview)
        }
      })
    }
  }, [])

  // Auto-resize textarea - Gemini style expanding input
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to auto to get accurate scrollHeight
    textarea.style.height = 'auto'
    
    // Calculate new height based on content
    const scrollHeight = textarea.scrollHeight
    const minHeight = 32 // Minimum height in pixels
    const maxHeight = 200 // Maximum height in pixels
    
    // Set height, constrained between min and max
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
    textarea.style.height = `${newHeight}px`
    
    // Show scrollbar if content exceeds max height
    if (scrollHeight > maxHeight) {
      textarea.style.overflowY = 'auto'
    } else {
      textarea.style.overflowY = 'hidden'
    }
  }, [value])

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter - send message (no Shift+Enter for newlines)
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      // Don't set the flag here - let handleSubmit manage it
      // This ensures handleSubmit is the single source of truth for submission state
      if (canSubmit && !isSubmittingRef.current) {
        formRef.current?.requestSubmit()
      }
      return
    }

    // Escape to cancel
    if (e.key === 'Escape' && onCancel) {
      e.preventDefault()
      onCancel()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent event bubbling
    
    // CRITICAL: Double-check guard - if already submitting, ignore this call
    if (isSubmittingRef.current) {
      return
    }
    
    // Only submit if not already submitting and can submit
    if (canSubmit) {
      // Set guard IMMEDIATELY to prevent any duplicate submissions
      isSubmittingRef.current = true
      
      // CRITICAL: Clear the input value IMMEDIATELY before calling onSubmit
      // This prevents the user from submitting the same value twice
      // We clear it here in the form component, not in the parent
      const currentValue = value.trim()
      if (currentValue) {
        onChange('') // Clear the input immediately
        // Also clear the textarea directly as a safety measure
        if (textareaRef.current) {
          textareaRef.current.value = ''
        }
      }
      
      onSubmit()
      
      // Reset flag after a delay to prevent rapid double submissions
      // But keep it disabled while isLoading is true (handled by canSubmit)
      setTimeout(() => {
        // Only reset if not loading (parent controls loading state)
        if (!isLoading) {
          isSubmittingRef.current = false
        }
      }, 2000) // Longer delay to ensure submission completes
    } else {
      // If can't submit, reset the flag in case it was set by keyboard handler
      isSubmittingRef.current = false
    }
  }

  // Check if in compact mode (centered initial state)
  const isCompactMode = className?.includes('max-w-3xl')
  
  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'transition-all bg-transparent',
        isDragging && 'border border-emerald-500/50 bg-emerald-500/5',
        className
      )}
    >
      <div className={cn('space-y-2', isCompactMode ? 'p-0' : 'p-3')}>
        {/* File attachments preview */}
        {internalAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg">
            {internalAttachments.map((attachment) => (
              <div
                key={attachment.id}
                className={cn(
                  "relative group flex items-center gap-2 p-2 bg-background rounded border",
                  attachment.uploadStatus === 'error' ? 'border-destructive' : 'border-border',
                  attachment.uploadStatus === 'uploading' && 'opacity-70'
                )}
              >
                {attachment.type === 'image' && attachment.preview ? (
                  <div className="relative">
                    <img
                      src={attachment.preview}
                      alt={attachment.file.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    {attachment.uploadStatus === 'uploading' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center bg-muted rounded">
                    <File className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">
                    {attachment.file.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {attachment.uploadStatus === 'uploading' ? 'Uploading...' :
                     attachment.uploadStatus === 'uploaded' ? 'Uploaded' :
                     attachment.uploadStatus === 'error' ? attachment.uploadError || 'Upload failed' :
                     `${(attachment.file.size / 1024).toFixed(1)} KB`}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeAttachment(attachment.id)}
                  aria-label="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Drag overlay hint */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10 border-2 border-dashed border-emerald-500/50 rounded-lg z-10 pointer-events-none">
            <div className="text-center space-y-2">
              <ImageIcon className="w-12 h-12 mx-auto text-emerald-400" />
              <p className="text-sm font-medium text-emerald-400">Drop files here</p>
            </div>
          </div>
        )}
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

        {/* Textarea - Gemini-inspired expanding design */}
        <div className={cn(
          'relative rounded-[28px] transition-all',
          'bg-[#202124]',
          isCompactMode ? 'px-4 py-2.5' : 'px-5 py-3',
          isFocused && 'ring-1 ring-emerald-500/30 shadow-sm',
          isDragging && 'border border-emerald-500/50 bg-emerald-500/5',
          disabled && 'opacity-50 cursor-not-allowed',
          'flex flex-col items-end',
          'max-w-[80ch] mx-auto'
        )}>
          {/* Textarea area */}
          <div className="relative flex-1 min-h-[32px] w-full min-w-0">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                // Prevent changes while submitting
                if (!isSubmittingRef.current) {
                  onChange(e.target.value)
                }
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder=""
              disabled={disabled || isLoading || isSubmittingRef.current}
              autoFocus={autoFocus}
              className={cn(
                'min-h-[32px] max-h-[200px] resize-none border-0 bg-transparent',
                'text-sm leading-[1.5]',
                'focus-visible:ring-0 focus-visible:ring-offset-0',
                'px-0 py-2',
                'text-[#e8eaed] placeholder:text-[#9aa0a6]',
                'w-full',
                isCompactMode && 'text-base',
                isOverLimit && 'text-destructive'
              )}
              style={{
                flexGrow: 1,
                minWidth: 0,
                width: '100%',
                boxSizing: 'border-box',
                outline: 'none',
                paddingRight: '12px',
                minHeight: '20px',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}
              aria-label="Message input"
              aria-describedby="character-count keyboard-hint"
            />
            
            {/* Animated placeholder overlay - only show when empty and not focused */}
            {!value && !isFocused && (
              <div className="absolute left-0 top-1.5 pointer-events-none">
                <AnimatedPlaceholder className="text-sm text-[#9aa0a6]" />
              </div>
            )}
          </div>

          {/* Bottom row controls - Gemini style */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#3c3c3c] w-full flex-shrink-0">
            {/* Left side: + button and Auto mode */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Plus button for attachments */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.doc,.docx,.csv,.json"
                onChange={handleFileInput}
                className="hidden"
                aria-label="Upload file"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isLoading}
                className="h-7 w-7 p-0 hover:bg-muted/50"
                aria-label="Add file"
                title="Add file or image"
              >
                <Plus className="w-4 h-4" />
              </Button>

              {/* Auto mode badge */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xs font-medium text-emerald-400">Auto mode</span>
                <ChevronDown className="w-3 h-3 text-emerald-400/70" />
              </div>
            </div>

            {/* Right side: Send button */}
            <div className="flex items-center flex-shrink-0">
              {!isLoading && canSubmit && !isSubmittingRef.current && (
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingRef.current}
                  className="h-7 w-7 p-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              )}
              {isLoading && onCancel && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={onCancel}
                  className="h-7 w-7 p-0"
                  aria-label="Cancel"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Compact mode shows disclaimer, normal mode shows hints */}
        {isCompactMode ? (
          <div className="text-[10px] text-muted-foreground/50 text-center px-1">
            Syntra can make mistakes, so double-check important information
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-muted-foreground/60 px-1">
            <span id="keyboard-hint" className="hidden sm:block">
              <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[10px]">Enter</kbd>
              <span className="ml-1 mr-2">to send</span>
              <span className="mx-1">•</span>
              <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[10px]">Shift</kbd>
              <span className="mx-1">+</span>
              <kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[10px]">Enter</kbd>
              <span className="ml-1">for new line</span>
            </span>
            {showCharacterCount && (
              <span
                id="character-count"
                className={cn(
                  'tabular-nums text-[10px]',
                  isNearLimit && 'text-yellow-500',
                  isOverLimit && 'text-destructive font-medium'
                )}
                aria-live="polite"
              >
                {characterCount.toLocaleString()} / {maxLength.toLocaleString()}
              </span>
            )}
          </div>
        )}

      </div>
    </form>
  )
}
