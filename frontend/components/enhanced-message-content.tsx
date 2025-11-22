'use client'

import React, { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'
import { Copy, Check, Code2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ImageMessageDisplay } from '@/components/image-message-display'

interface CodeBlockProps {
  children: React.ReactNode
  className?: string
}

interface ImageFile {
  file?: File
  url: string
  id: string
}

interface EnhancedMessageContentProps {
  content: string
  role: 'user' | 'assistant'
  images?: ImageFile[]
  onCodePanelOpen?: (code: string, language: string) => void
}

// Threshold for determining when to show code in parallel panel (characters)
const LARGE_CODE_THRESHOLD = 300

// Custom code block component
const CodeBlock: React.FC<CodeBlockProps> = ({ children, className }) => {
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const language = className?.replace('language-', '') || 'text'
  const codeString = String(children).replace(/\n$/, '')
  const isLargeCode = codeString.length > LARGE_CODE_THRESHOLD
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeString)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleExpand = () => {
    if (window.onCodePanelOpen) {
      window.onCodePanelOpen(codeString, language)
    }
  }

  // Small code snippets - inline with background
  if (!isLargeCode) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-zinc-700/50 bg-zinc-900/80 my-3">
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50 border-b border-zinc-700/30">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
            {language}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-6 px-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="p-3 overflow-x-auto">
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={language}
            customStyle={{
              margin: 0,
              padding: 0,
              background: 'transparent',
              fontSize: '13px',
              lineHeight: '1.5'
            }}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      </div>
    )
  }

  // Large code blocks - show preview with expand option
  const previewLines = codeString.split('\n').slice(0, 8).join('\n')
  const hasMoreLines = codeString.split('\n').length > 8

  return (
    <div className="relative rounded-lg overflow-hidden border border-zinc-700/50 bg-zinc-900/80 my-3">
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50 border-b border-zinc-700/30">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          {language} • {codeString.split('\n').length} lines
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExpand}
            className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 transition-colors"
          >
            <Maximize2 className="w-3 h-3 mr-1" />
            Expand
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-6 px-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="p-3 overflow-x-auto">
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          customStyle={{
            margin: 0,
            padding: 0,
            background: 'transparent',
            fontSize: '13px',
            lineHeight: '1.5'
          }}
        >
          {isExpanded ? codeString : previewLines}
        </SyntaxHighlighter>
        {hasMoreLines && !isExpanded && (
          <div className="mt-2 pt-2 border-t border-zinc-700/30">
            <button
              onClick={() => setIsExpanded(true)}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Show {codeString.split('\n').length - 8} more lines...
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Custom inline code component
const InlineCode: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-200 text-sm font-mono border border-zinc-700/50">
    {children}
  </code>
)

// Math component that handles both inline and block math
const MathComponent: React.FC<{ children: string; display?: boolean }> = ({ children, display }) => {
  try {
    return display ? (
      <BlockMath math={children} />
    ) : (
      <InlineMath math={children} />
    )
  } catch (error) {
    console.error('KaTeX rendering error:', error)
    return (
      <span className="px-2 py-1 bg-red-900/20 text-red-400 rounded text-sm border border-red-700/50">
        Math rendering error: {children}
      </span>
    )
  }
}

// Process text to handle LaTeX math expressions
const processLatexInText = (text: string): React.ReactNode[] => {
  // Pattern to match both inline $...$ and block $$...$$
  const mathRegex = /(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/g
  const parts = text.split(mathRegex)
  
  return parts.map((part, index) => {
    if (part.match(/^\$\$[\s\S]*?\$\$$/)) {
      // Block math
      const mathContent = part.slice(2, -2).trim()
      return <MathComponent key={index} display={true}>{mathContent}</MathComponent>
    } else if (part.match(/^\$[^$\n]*?\$$/)) {
      // Inline math
      const mathContent = part.slice(1, -1).trim()
      return <MathComponent key={index} display={false}>{mathContent}</MathComponent>
    } else {
      // Regular text
      return part
    }
  })
}

// Custom paragraph component that handles LaTeX
const Paragraph: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (typeof children === 'string') {
    return <p className="mb-4">{processLatexInText(children)}</p>
  }
  return <p className="mb-4">{children}</p>
}

export const EnhancedMessageContent: React.FC<EnhancedMessageContentProps> = ({
  content,
  role,
  images,
  onCodePanelOpen
}) => {
  // Set global handler for code expansion
  React.useEffect(() => {
    if (onCodePanelOpen) {
      window.onCodePanelOpen = onCodePanelOpen
    }
    return () => {
      delete window.onCodePanelOpen
    }
  }, [onCodePanelOpen])

  return (
    <div className={cn(
      "prose prose-invert max-w-none",
      role === 'user' ? "text-zinc-100" : "text-zinc-100"
    )}>
      {/* Image Display */}
      {images && images.length > 0 && (
        <ImageMessageDisplay images={images} />
      )}

      {/* Text Content */}
      {content && (
        <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            if (inline) {
              return <InlineCode>{children}</InlineCode>
            }
            return (
              <CodeBlock className={className}>
                {children}
              </CodeBlock>
            )
          },
          p: Paragraph,
          // Style other markdown elements
          h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-zinc-100">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold mb-3 text-zinc-200">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-medium mb-2 text-zinc-200">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-zinc-200">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-zinc-600 pl-4 italic text-zinc-300 my-4">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border border-zinc-700 rounded-lg">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-zinc-700 px-3 py-2 bg-zinc-800 text-zinc-200 font-medium text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-zinc-700 px-3 py-2 text-zinc-300">
              {children}
            </td>
          )
        }}
        >
          {content}
        </ReactMarkdown>
      )}
    </div>
  )
}

// Global type extension for the window object
declare global {
  interface Window {
    onCodePanelOpen?: (code: string, language: string) => void
  }
}