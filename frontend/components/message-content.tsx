'use client'

import * as React from 'react'
import { CodeBlock } from './code-block'
import { cn } from '@/lib/utils'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

interface MessageContentProps {
  content: string
  className?: string
}

type ContentPart = 
  | { type: 'text'; content: string }
  | { type: 'code'; content: string; language?: string }
  | { type: 'latex-inline'; content: string }
  | { type: 'latex-display'; content: string }

/**
 * Parse content to extract code blocks and LaTeX expressions
 */
function parseContent(text: string): ContentPart[] {
  const parts: ContentPart[] = []
  
  // First, find all code blocks with their positions
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g
  const codeBlocks: Array<{ start: number; end: number; language?: string; content: string }> = []
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    codeBlocks.push({
      start: match.index,
      end: match.index + match[0].length,
      language: match[1] || undefined,
      content: match[2].trim(),
    })
  }

  // Process text in segments, avoiding code blocks
  let lastIndex = 0

  for (const block of codeBlocks) {
    // Process text before code block
    if (block.start > lastIndex) {
      const textSegment = text.substring(lastIndex, block.start)
      parts.push(...parseLaTeX(textSegment))
    }
    
    // Add code block
    parts.push({ type: 'code', content: block.content, language: block.language })
    lastIndex = block.end
  }

  // Process remaining text after last code block
  if (lastIndex < text.length) {
    const textSegment = text.substring(lastIndex)
    parts.push(...parseLaTeX(textSegment))
  }

  // If no code blocks found, parse entire text for LaTeX
  if (codeBlocks.length === 0) {
    return parseLaTeX(text)
  }

  return parts
}

/**
 * Parse LaTeX expressions in text (inline $...$ and display $$...$$)
 * Returns parts that can be rendered together, with inline LaTeX flowing with text
 */
function parseLaTeX(text: string): ContentPart[] {
  const parts: ContentPart[] = []
  let lastIndex = 0
  let currentIndex = 0
  let currentTextBlock = ''

  const flushTextBlock = () => {
    if (currentTextBlock.trim()) {
      parts.push({ type: 'text', content: currentTextBlock })
      currentTextBlock = ''
    }
  }

  while (currentIndex < text.length) {
    // Check for display mode LaTeX: $$...$$
    const displayMatch = text.substring(currentIndex).match(/^\$\$([\s\S]*?)\$\$/)
    if (displayMatch) {
      // Flush any accumulated text
      flushTextBlock()
      // Add display LaTeX
      parts.push({ type: 'latex-display', content: displayMatch[1].trim() })
      lastIndex = currentIndex + displayMatch[0].length
      currentIndex = lastIndex
      continue
    }

    // Check for inline LaTeX: $...$ (but not $$)
    const inlineMatch = text.substring(currentIndex).match(/^\$([^$\n]+?)\$/)
    if (inlineMatch) {
      // Add text before LaTeX to current block
      if (currentIndex > lastIndex) {
        currentTextBlock += text.substring(lastIndex, currentIndex)
      }
      // Flush text block and add inline LaTeX
      flushTextBlock()
      parts.push({ type: 'latex-inline', content: inlineMatch[1].trim() })
      lastIndex = currentIndex + inlineMatch[0].length
      currentIndex = lastIndex
      continue
    }

    currentIndex++
  }

  // Add remaining text
  if (lastIndex < text.length) {
    currentTextBlock += text.substring(lastIndex)
  }

  // Flush any remaining text
  flushTextBlock()

  // If no parts found, return entire text
  if (parts.length === 0) {
    parts.push({ type: 'text', content: text })
  }

  return parts
}

/**
 * MessageContent - Parses and renders message content with code block and LaTeX detection
 * 
 * Features:
 * - Automatically detects code blocks (```language blocks) and renders them with CodeBlock
 * - Detects and renders LaTeX expressions (both inline $...$ and display $$...$$)
 * - Works with streaming content updates
 * - Real-time LaTeX rendering as content streams in
 */
/**
 * Group consecutive text and inline LaTeX parts for inline rendering
 */
function groupInlineParts(parts: ContentPart[]): Array<ContentPart | ContentPart[]> {
  const grouped: Array<ContentPart | ContentPart[]> = []
  let currentInlineGroup: ContentPart[] = []

  for (const part of parts) {
    if (part.type === 'code' || part.type === 'latex-display') {
      // Flush any accumulated inline group
      if (currentInlineGroup.length > 0) {
        grouped.push([...currentInlineGroup])
        currentInlineGroup = []
      }
      // Add block-level part
      grouped.push(part)
    } else {
      // Add to inline group (text or inline LaTeX)
      currentInlineGroup.push(part)
    }
  }

  // Flush any remaining inline group
  if (currentInlineGroup.length > 0) {
    grouped.push(currentInlineGroup)
  }

  return grouped
}

export function MessageContent({ content, className }: MessageContentProps) {
  const parts = React.useMemo(() => parseContent(content), [content])
  const groupedParts = React.useMemo(() => groupInlineParts(parts), [parts])

  return (
    <div className={cn('space-y-3', className)}>
      {groupedParts.map((item, index) => {
        // Handle inline group (text + inline LaTeX)
        if (Array.isArray(item)) {
          return (
            <div
              key={index}
              className="text-sm leading-relaxed whitespace-pre-wrap break-words"
            >
              {item.map((part, partIndex) => {
                if (part.type === 'latex-inline') {
                  try {
                    return <InlineMath key={partIndex} math={part.content} />
                  } catch (error) {
                    return (
                      <span key={partIndex} className="font-mono text-muted-foreground">
                        ${part.content}$
                      </span>
                    )
                  }
                } else {
                  return <span key={partIndex}>{part.content}</span>
                }
              })}
            </div>
          )
        }

        // Handle block-level parts
        const part = item
        if (part.type === 'code') {
          return (
            <CodeBlock
              key={index}
              code={part.content}
              language={part.language}
            />
          )
        } else if (part.type === 'latex-display') {
          try {
            return (
              <div key={index} className="my-4 overflow-x-auto">
                <BlockMath math={part.content} />
              </div>
            )
          } catch (error) {
            // Fallback to raw LaTeX if rendering fails
            return (
              <div key={index} className="my-4 p-2 bg-muted/30 rounded text-sm font-mono">
                $${part.content}$$
              </div>
            )
          }
        }
        
        return null
      })}
    </div>
  )
}
