'use client'

import * as React from 'react'
import { Paperclip, Search, ChevronDown, ArrowUp, Book, Code, Pen, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface OkaraHeroInputProps {
    value: string
    onChange: (value: string) => void
    onSubmit: () => void
    onAttach?: () => void
    selectedModel?: string
    onModelSelect?: () => void
    disabled?: boolean
    placeholder?: string
}

export function OkaraHeroInput({
    value,
    onChange,
    onSubmit,
    onAttach,
    selectedModel = 'GPT-OSS 20B',
    onModelSelect,
    disabled = false,
    placeholder = 'How can I help you today?'
}: OkaraHeroInputProps) {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (value.trim() && !disabled) {
                onSubmit()
            }
        }
    }

    // Auto-resize textarea
    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [value])

    return (
        <div className="w-full max-w-3xl">
            {/* Main Input Container */}
            <div className="relative rounded-3xl border border-white/10 bg-zinc-900 p-6 shadow-2xl transition-all duration-200 hover:border-white/20">
                {/* Textarea */}
                <Textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="min-h-[80px] max-h-[400px] resize-none border-0 bg-transparent p-0 text-lg text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                    rows={1}
                />

                {/* Footer Toolbar */}
                <div className="mt-4 flex items-center justify-between">
                    {/* Left Side Tools */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onAttach}
                            className="h-8 w-8 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                        >
                            <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                        >
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Right Side Tools */}
                    <div className="flex items-center gap-2">
                        {/* Model Selector */}
                        <button
                            onClick={onModelSelect}
                            className="flex items-center gap-2 rounded-full border border-white/10 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-100 transition-all duration-200 hover:bg-zinc-700"
                        >
                            <span>{selectedModel}</span>
                            <ChevronDown className="h-3 w-3" />
                        </button>

                        {/* Submit Button */}
                        <Button
                            onClick={onSubmit}
                            disabled={!value.trim() || disabled}
                            size="icon"
                            className="h-9 w-9 rounded-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600"
                        >
                            <ArrowUp className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Context Pills Component
interface OkaraContextPillsProps {
    onSelect?: (context: 'learn' | 'code' | 'write' | 'generate') => void
    selected?: 'learn' | 'code' | 'write' | 'generate' | null
}

export function OkaraContextPills({ onSelect, selected }: OkaraContextPillsProps) {
    const pills = [
        { id: 'learn' as const, icon: Book, label: 'Learn' },
        { id: 'code' as const, icon: Code, label: 'Code' },
        { id: 'write' as const, icon: Pen, label: 'Write' },
        { id: 'generate' as const, icon: ImageIcon, label: 'Generate' },
    ]

    return (
        <div className="flex items-center justify-center gap-2">
            {pills.map((pill) => {
                const Icon = pill.icon
                return (
                    <button
                        key={pill.id}
                        onClick={() => onSelect?.(pill.id)}
                        className={cn(
                            'flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
                            selected === pill.id
                                ? 'border-white/20 bg-white/10 text-zinc-100'
                                : 'border-white/10 bg-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        <span>{pill.label}</span>
                    </button>
                )
            })}
        </div>
    )
}
