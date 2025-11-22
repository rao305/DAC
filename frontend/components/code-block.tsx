'use client'

import * as React from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

/**
 * CodeBlock - Enhanced code display with copy functionality
 * 
 * Features:
 * - Language label
 * - Copy button with feedback
 * - Syntax highlighting ready (can be enhanced with prism/react-syntax-highlighter)
 * - Dark theme styling
 */
export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  return (
    <div
      className={cn(
        'relative rounded-lg overflow-hidden border border-emerald-500/20 my-4',
        className
      )}
      style={{ backgroundColor: '#0a0a0a' }}
    >
      {/* Header with language and copy button */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0f0f0f] border-b border-emerald-500/10">
        {language && (
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wide">
            {language}
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 px-2 text-[11px] text-gray-400 hover:text-emerald-400 hover:bg-emerald-950/30 transition-colors"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 mr-1.5 text-emerald-400" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1.5" />
              Copy code
            </>
          )}
        </Button>
      </div>

      {/* Code content */}
      <div className="relative">
        <pre className="p-4 overflow-x-auto text-[14px] leading-[1.6]">
          <code className="font-mono text-gray-100 whitespace-pre code-green-highlight">{code}</code>
        </pre>
      </div>
    </div>
  )
}

