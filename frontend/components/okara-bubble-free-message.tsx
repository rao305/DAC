'use client'

import * as React from 'react'
import { ChevronDown, Copy, RefreshCw, Share, Bookmark, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { prism } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface Message {
    id: string
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

interface OkaraBubbleFreeMessageProps {
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

export function OkaraBubbleFreeMessage({
    role,
    content,
    chainOfThought,
    timestamp,
    modelId = 'kimi-k2-thinking',
    modelName = 'Kimi K2',
    reasoningType,
    confidence,
    processingTime,
}: OkaraBubbleFreeMessageProps) {
    const [isThoughtExpanded, setIsThoughtExpanded] = React.useState(false)

    if (role === 'user') {
        return (
            <div className="w-full flex justify-end mb-6">
                <div className="bg-[#1A1A1D] max-w-[620px] rounded-2xl py-3 px-4 shadow-sm">
                    <div className="text-white text-[16px] leading-[1.5]">{content}</div>
                    {timestamp && (
                        <div className="text-[#A1A1A8] text-xs mt-2 text-right">{timestamp}</div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full flex justify-center mb-6">
            <div className="max-w-[680px] w-full">
                {/* Chain of Thought Dropdown */}
                {chainOfThought && (
                    <div className="mb-3">
                        <button
                            onClick={() => setIsThoughtExpanded(!isThoughtExpanded)}
                            className="flex items-center gap-2 text-[#A1A1A8] text-xs hover:text-white transition-colors"
                        >
                            <ChevronDown 
                                className={cn(
                                    "w-3 h-3 transition-transform", 
                                    isThoughtExpanded && "rotate-180"
                                )} 
                            />
                            Chain of Thought
                        </button>
                        {isThoughtExpanded && (
                            <div className="mt-2 p-3 bg-[#0F0F0F] rounded-lg border border-[#1A1A1B] text-[#A1A1A8] text-sm">
                                {chainOfThought}
                            </div>
                        )}
                    </div>
                )}

                {/* Main Message Content */}
                <div className="text-white text-[16px] leading-[1.5]">
                    <ReactMarkdown
                        components={{
                            code({ node, inline, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '')
                                return !inline && match ? (
                                    <SyntaxHighlighter
                                        style={prism}
                                        language={match[1]}
                                        PreTag="div"
                                        className="rounded-lg border border-[#1A1A1B]"
                                        customStyle={{
                                            background: '#0F0F0F',
                                            padding: '16px',
                                            fontSize: '14px',
                                            lineHeight: '1.5',
                                            margin: '16px 0',
                                            color: '#ffffff'
                                        }}
                                        {...props}
                                    >
                                        {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                ) : (
                                    <code
                                        className="bg-[#1A1A1D] border border-[#2A2A2D] rounded px-1.5 py-0.5 text-sm font-mono text-white"
                                        {...props}
                                    >
                                        {children}
                                    </code>
                                )
                            },
                            p({ children }) {
                                return <p className="mb-4 text-white leading-[1.5]">{children}</p>
                            },
                            ul({ children }) {
                                return <ul className="mb-4 ml-4 list-disc text-white marker:text-[#009688]">{children}</ul>
                            },
                            ol({ children }) {
                                return <ol className="mb-4 ml-4 list-decimal text-white marker:text-[#009688]">{children}</ol>
                            },
                            h1({ children }) {
                                return <h1 className="mb-4 text-xl font-semibold text-white">{children}</h1>
                            },
                            h2({ children }) {
                                return <h2 className="mb-3 text-lg font-semibold text-white">{children}</h2>
                            },
                            h3({ children }) {
                                return <h3 className="mb-3 text-base font-semibold text-white">{children}</h3>
                            },
                            blockquote({ children }) {
                                return <blockquote className="mb-4 border-l-4 border-[#009688] pl-4 italic text-[#A1A1A8]">{children}</blockquote>
                            },
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>

                {/* Model Badge and Action Icons Row */}
                <div className="flex items-center justify-between mt-4">
                    {/* Model Badge */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-transparent border border-[#2A2A2D] rounded-full h-7">
                            <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex-shrink-0"></div>
                            <span className="text-white text-xs font-medium">{modelName || 'GPT-OSS 20B'}</span>
                        </div>
                        {timestamp && (
                            <span className="text-[#A1A1A8] text-xs">{timestamp}</span>
                        )}
                    </div>

                    {/* Action Icons */}
                    <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-[#1A1A1D] transition-colors text-[#A1A1A8] hover:text-white">
                            <Copy className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-[#1A1A1D] transition-colors text-[#A1A1A8] hover:text-white">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-[#1A1A1D] transition-colors text-[#A1A1A8] hover:text-white">
                            <Share className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-[#1A1A1D] transition-colors text-[#A1A1A8] hover:text-white">
                            <Bookmark className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-[#1A1A1D] transition-colors text-[#A1A1A8] hover:text-white">
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}