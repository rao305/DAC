'use client'

import React, { useState, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { X, Copy, Check, Download, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CodePanelProps {
  isOpen: boolean
  onClose: () => void
  code: string
  language: string
  title?: string
}

export const CodePanel: React.FC<CodePanelProps> = ({
  isOpen,
  onClose,
  code,
  language,
  title
}) => {
  const [copied, setCopied] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  // Handle escape key to close panel
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code.${language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleMaximize = () => {
    setIsMaximized(!isMaximized)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={cn(
        "fixed z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl transition-all duration-300 ease-in-out",
        isMaximized 
          ? "inset-4" 
          : "top-1/2 right-4 w-1/2 h-3/4 -translate-y-1/2",
        "flex flex-col"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-800/50">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-zinc-200">
              {title || `${language.toUpperCase()} Code`}
            </h3>
            <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded">
              {code.split('\n').length} lines
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMaximize}
              className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50"
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-3 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto p-4">
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={language}
              showLineNumbers={true}
              customStyle={{
                margin: 0,
                padding: '1rem',
                background: 'transparent',
                fontSize: '14px',
                lineHeight: '1.6',
              }}
              lineNumberStyle={{
                color: '#4a5568',
                paddingRight: '1rem',
                minWidth: '3rem',
                textAlign: 'right'
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-700 bg-zinc-800/30">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>{language.toUpperCase()}</span>
            <span>{code.length} characters • {code.split('\n').length} lines</span>
          </div>
        </div>
      </div>
    </>
  )
}