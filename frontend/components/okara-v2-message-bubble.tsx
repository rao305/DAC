'use client'

import * as React from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { prism } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { EnhancedChainOfThought } from './enhanced-chain-of-thought'
import { ModelReasoningIndicator } from './model-reasoning-indicator'

interface OkaraMessageBubbleProps {
    role: 'user' | 'assistant'
    content: string
    chainOfThought?: string
    timestamp?: string
    modelId?: string
    modelName?: string
    reasoningType?: 'coding' | 'analysis' | 'creative' | 'research' | 'conversation'
    confidence?: number
    processingTime?: number
}

export function OkaraMessageBubble({
    role,
    content,
    chainOfThought,
    timestamp,
    modelId = 'kimi-k2-thinking',
    modelName = 'Kimi K2',
    reasoningType,
    confidence,
    processingTime,
}: OkaraMessageBubbleProps) {
    const [isThoughtExpanded, setIsThoughtExpanded] = React.useState(true)
    const [isVisible, setIsVisible] = React.useState(false)

    // Slide-up animation on mount
    React.useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 10)
        return () => clearTimeout(timer)
    }, [])

    if (role === 'user') {
        return (
            <div
                className={cn(
                    'mb-4 ml-auto max-w-[680px] rounded-[12px] border border-[#3a3a3a] bg-[#2a2a2a] p-4 shadow-[rgba(0,0,0,.3)] transition-all duration-200 ease-out',
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
                )}
            >
                <div className="text-sm text-white leading-relaxed">{content}</div>
                {timestamp && (
                    <div className="mt-2 text-xs text-[#888888]">{timestamp}</div>
                )}
            </div>
        )
    }

    return (
        <div
            className={cn(
                'mb-6 w-full max-w-[680px] rounded-[12px] border border-[#3a3a3a] bg-[#2a2a2a] p-4 shadow-[rgba(0,0,0,.3)] transition-all duration-200 ease-out hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)]',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
            )}
        >
            {/* Model Reasoning Indicator */}
            {role === 'assistant' && (
                <div className="mb-3 flex items-center justify-between">
                    <ModelReasoningIndicator
                        modelId={modelId}
                        modelName={modelName}
                        reasoningType={reasoningType}
                        confidence={confidence}
                        processingTime={processingTime}
                    />
                </div>
            )}

            {/* Enhanced Chain of Thought Section */}
            {chainOfThought && role === 'assistant' && (
                <EnhancedChainOfThought
                    chainOfThought={chainOfThought}
                    isExpanded={isThoughtExpanded}
                    onToggle={() => setIsThoughtExpanded(!isThoughtExpanded)}
                />
            )}

            {/* Main Content */}
            <div className="prose max-w-none text-sm">
                <ReactMarkdown
                    components={{
                        code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                                <SyntaxHighlighter
                                    style={prism}
                                    language={match[1]}
                                    PreTag="div"
                                    className="rounded-[8px] border border-[#3a3a3a]"
                                    customStyle={{
                                        background: '#1a1a1a',
                                        padding: '16px',
                                        fontSize: '13px',
                                        lineHeight: '1.6',
                                        margin: 0,
                                        color: '#ffffff'
                                    }}
                                    {...props}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            ) : (
                                <code
                                    className="rounded-[4px] bg-[#3a3a3a] border border-[#4a4a4a] px-1.5 py-0.5 text-xs font-mono text-white"
                                    {...props}
                                >
                                    {children}
                                </code>
                            )
                        },
                        p({ children }) {
                            return <p className="mb-3 leading-relaxed text-white">{children}</p>
                        },
                        ul({ children }) {
                            return <ul className="mb-3 ml-4 list-disc text-white marker:text-[#009688]">{children}</ul>
                        },
                        ol({ children }) {
                            return <ol className="mb-3 ml-4 list-decimal text-white marker:text-[#009688]">{children}</ol>
                        },
                        h1({ children }) {
                            return <h1 className="mb-3 text-xl font-semibold text-white">{children}</h1>
                        },
                        h2({ children }) {
                            return <h2 className="mb-2 text-lg font-semibold text-white">{children}</h2>
                        },
                        h3({ children }) {
                            return <h3 className="mb-2 text-base font-semibold text-white">{children}</h3>
                        },
                        blockquote({ children }) {
                            return <blockquote className="mb-3 border-l-4 border-[#009688] pl-4 italic text-[#888888]">{children}</blockquote>
                        },
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>

            {timestamp && (
                <div className="mt-3 text-xs text-[#888888]">{timestamp}</div>
            )}
        </div>
    )
}
