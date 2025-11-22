'use client'

import * as React from 'react'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface OkaraInputBoxProps {
    value: string
    onChange: (value: string) => void
    onSubmit: () => void
    disabled?: boolean
    placeholder?: string
}

export function OkaraInputBox({
    value,
    onChange,
    onSubmit,
    disabled = false,
    placeholder = 'Type your message...',
}: OkaraInputBoxProps) {
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
        <div className="w-full max-w-none px-6">
            <div className="relative flex items-center max-w-4xl mx-auto">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="How can I help you today?"
                    disabled={disabled}
                    rows={1}
                    className="w-full h-12 px-4 pr-16 text-sm bg-[#2a2a2a] border border-[#404040] rounded-2xl resize-none placeholder:text-[#888888] text-white focus:outline-none focus:ring-2 focus:ring-[#009688] focus:border-[#009688] disabled:opacity-50 transition-all duration-200 shadow-sm hover:bg-[#2d2d2d]"
                    style={{ minHeight: '48px', maxHeight: '200px' }}
                />
                
                {/* Send button inside input */}
                <div className="absolute right-3 flex items-center">
                    <button
                        onClick={onSubmit}
                        disabled={!value.trim() || disabled}
                        className={cn(
                            "h-8 w-8 flex items-center justify-center transition-all duration-200 rounded-lg",
                            value.trim() && !disabled 
                                ? "bg-white text-black hover:bg-gray-100 shadow-sm" 
                                : "bg-[#404040] text-[#888888] cursor-not-allowed"
                        )}
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    )
}
