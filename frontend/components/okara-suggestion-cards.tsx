'use client'

import * as React from 'react'
import { Lightbulb, Code, FileText, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SuggestionCard {
    icon: React.ElementType
    text: string
    onClick?: () => void
}

const SUGGESTIONS: SuggestionCard[] = [
    {
        icon: Lightbulb,
        text: 'Explain quantum computing in simple terms',
    },
    {
        icon: Code,
        text: 'Create a React component for a todo list',
    },
    {
        icon: FileText,
        text: 'Write a professional email to decline a meeting',
    },
    {
        icon: Sparkles,
        text: 'Generate a creative story about time travel',
    },
]

export function OkaraSuggestionCards({ onSelect }: { onSelect?: (text: string) => void }) {
    return (
        <div className="flex w-full max-w-3xl flex-col gap-2">
            {SUGGESTIONS.map((suggestion, index) => {
                const Icon = suggestion.icon
                return (
                    <button
                        key={index}
                        onClick={() => onSelect?.(suggestion.text)}
                        className="flex w-full items-center gap-4 rounded-xl border border-white/10 bg-zinc-900/50 p-4 text-left transition-all duration-200 hover:border-white/20 hover:bg-zinc-800"
                    >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-800">
                            <Icon className="h-5 w-5 text-zinc-400" />
                        </div>
                        <span className="text-sm text-zinc-100">{suggestion.text}</span>
                    </button>
                )
            })}
        </div>
    )
}
