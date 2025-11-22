'use client'

import { useEffect } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  callback: (event: KeyboardEvent) => void
  description?: string
  preventDefault?: boolean
}

/**
 * useKeyboardShortcuts - Hook for managing keyboard shortcuts
 *
 * Features:
 * - Multiple shortcut registration
 * - Modifier key support (Cmd/Ctrl, Shift, Alt)
 * - Cross-platform (Mac/Windows/Linux)
 * - Automatic cleanup
 * - Prevent default behavior option
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   {
 *     key: 'n',
 *     metaKey: true,
 *     callback: () => createNewConversation(),
 *     description: 'New conversation',
 *   },
 *   {
 *     key: 'Enter',
 *     metaKey: true,
 *     callback: () => sendMessage(),
 *     description: 'Send message',
 *   },
 * ])
 * ```
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const matches =
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          (!!event.ctrlKey || false) === !!shortcut.ctrlKey &&
          (!!event.metaKey || false) === !!shortcut.metaKey &&
          (!!event.shiftKey || false) === !!shortcut.shiftKey &&
          !!event.altKey === !!shortcut.altKey

        if (matches) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault()
          }
          shortcut.callback(event)
          break // Stop after first match
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}

/**
 * Common keyboard shortcuts for conversation interface
 */
export const CONVERSATION_SHORTCUTS = {
  NEW_CONVERSATION: {
    key: 'n',
    metaKey: true,
    shiftKey: true,
    description: 'New conversation',
  },
  SEARCH: {
    key: 'f',
    metaKey: true,
    description: 'Search conversations',
  },
  SEND_MESSAGE: {
    key: 'Enter',
    metaKey: true,
    description: 'Send message',
  },
  CANCEL: {
    key: 'Escape',
    description: 'Cancel or close',
  },
  COPY_LAST: {
    key: 'c',
    metaKey: true,
    shiftKey: true,
    description: 'Copy last message',
  },
  REGENERATE: {
    key: 'r',
    metaKey: true,
    description: 'Regenerate response',
  },
  EDIT_LAST: {
    key: 'e',
    metaKey: true,
    description: 'Edit last message',
  },
  COMMAND_PALETTE: {
    key: 'k',
    metaKey: true,
    description: 'Open command palette',
  },
  SETTINGS: {
    key: ',',
    metaKey: true,
    description: 'Open settings',
  },
  HELP: {
    key: '/',
    metaKey: true,
    description: 'Show keyboard shortcuts',
  },
}

/**
 * Hook to get the platform-specific modifier key name
 */
export function useModifierKey(): 'Cmd' | 'Ctrl' {
  if (typeof window === 'undefined') return 'Ctrl'
  return navigator.platform.toLowerCase().includes('mac') ? 'Cmd' : 'Ctrl'
}

/**
 * Format a keyboard shortcut for display
 */
export function formatShortcut(shortcut: {
  key: string
  metaKey?: boolean
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
}): string {
  const parts: string[] = []
  const isMac = typeof window !== 'undefined' && navigator.platform.toLowerCase().includes('mac')

  if (shortcut.metaKey) parts.push(isMac ? '⌘' : 'Ctrl')
  if (shortcut.ctrlKey) parts.push('Ctrl')
  if (shortcut.altKey) parts.push(isMac ? '⌥' : 'Alt')
  if (shortcut.shiftKey) parts.push(isMac ? '⇧' : 'Shift')

  // Capitalize single letters, keep special keys as-is
  const key = shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key
  parts.push(key)

  return parts.join('+')
}
