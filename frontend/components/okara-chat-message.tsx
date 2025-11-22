'use client'

import * as React from 'react'
import { ChevronDown, Brain, Copy, RotateCcw, Share } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface OkaraChatMessageProps {
    role: 'user' | 'assistant'
    content: string
    chainOfThought?: string
    onCopy?: () => void
    onRegenerate?: () => void
    onShare?: () => void
}

export function OkaraChatMessage({
    role,
    content,
    chainOfThought,
    onCopy,
    onRegenerate,
    onShare,
}: OkaraChatMessageProps) {
    const [isChainExpanded, setIsChainExpanded] = React.useState(false)

    if (role === 'user') {
        return (
            <div className="flex w-full justify-end">
                <div className="max-w-[80%] rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-zinc-100">
                    {content}
                </div>
            </div>
        )
    }

    return (
        <div className="flex w-full flex-col gap-4">
            {/* Chain of Thought Accordion */}
            {chainOfThought && (
                <button
                    onClick={() => setIsChainExpanded(!isChainExpanded)}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-2 text-left transition-all duration-200 hover:bg-zinc-800"
                >
                    <Brain className="h-4 w-4 text-purple-400" />
                    <span className="flex-1 text-sm font-medium text-zinc-100">Chain of Thought</span>
                    <ChevronDown
                        className={cn(
                            'h-4 w-4 text-zinc-400 transition-transform duration-200',
                            isChainExpanded && 'rotate-180'
                        )}
                    />
                </button>
            )}

            {/* Expanded Chain of Thought */}
            {isChainExpanded && chainOfThought && (
                <div className="rounded-xl border border-white/10 bg-zinc-900/30 p-4">
                    <p className="text-sm text-zinc-400">{chainOfThought}</p>
                </div>
            )}

            {/* Main Response */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
                <div className="prose prose-invert max-w-none">
                    <ReactMarkdown
                        components={{
                            code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '')
                                return !inline && match ? (
                                    <SyntaxHighlighter
                                        style={oneDark}
                                        language={match[1]}
                                        PreTag="div"
                                        className="rounded-lg"
                                        {...props}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                ) : (
                                    <code className={cn('rounded bg-zinc-800 px-1.5 py-0.5 text-sm', className)} {...props}>
                                        {children}
                                    </code>
                                )
                            },
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCopy}
                    className="h-8 gap-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                >
                    <Copy className="h-3 w-3" />
                    <span className="text-xs">Copy</span>
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRegenerate}
                    className="h-8 gap-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                >
                    <RotateCcw className="h-3 w-3" />
                    <span className="text-xs">Regenerate</span>
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onShare}
                    className="h-8 gap-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                >
                    <Share className="h-3 w-3" />
                    <span className="text-xs">Share</span>
                </Button>
            </div>
        </div>
    )
}
