'use client'

import * as React from 'react'
import { OkaraSidebar } from './okara-sidebar'
import { OkaraHeroInput, OkaraContextPills } from './okara-hero-input'
import { OkaraSuggestionCards } from './okara-suggestion-cards'
import { OkaraPrivacyFooter } from './okara-privacy-footer'
import { OkaraChatMessage } from './okara-chat-message'
import { ScrollArea } from './ui/scroll-area'
import { cn } from '@/lib/utils'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    chainOfThought?: string
}

interface OkaraLayoutProps {
    messages?: Message[]
    onSendMessage?: (content: string) => void
    onNewChat?: () => void
    isLoading?: boolean
}

export function OkaraLayout({
    messages = [],
    onSendMessage,
    onNewChat,
    isLoading = false
}: OkaraLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
    const [inputValue, setInputValue] = React.useState('')
    const [selectedContext, setSelectedContext] = React.useState<'learn' | 'code' | 'write' | 'generate' | null>(null)

    const handleSubmit = () => {
        if (inputValue.trim() && onSendMessage) {
            onSendMessage(inputValue.trim())
            setInputValue('')
        }
    }

    const handleSuggestionSelect = (text: string) => {
        setInputValue(text)
    }

    const isEmpty = messages.length === 0

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#09090b]">
            {/* Sidebar */}
            <OkaraSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                onNewChat={onNewChat}
            />

            {/* Main Canvas */}
            <div className="flex flex-1 flex-col">
                {isEmpty ? (
                    /* Empty State - Vertically Centered */
                    <div className="flex h-full items-center justify-center p-8">
                        <div className="flex w-full max-w-4xl flex-col items-center gap-8">
                            {/* Hero Input */}
                            <OkaraHeroInput
                                value={inputValue}
                                onChange={setInputValue}
                                onSubmit={handleSubmit}
                                disabled={isLoading}
                            />

                            {/* Context Pills */}
                            <OkaraContextPills
                                selected={selectedContext}
                                onSelect={setSelectedContext}
                            />

                            {/* Suggestion Cards */}
                            <OkaraSuggestionCards onSelect={handleSuggestionSelect} />

                            {/* Privacy Footer */}
                            <div className="mt-8">
                                <OkaraPrivacyFooter />
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Chat State */
                    <div className="flex h-full flex-col">
                        {/* Messages Area */}
                        <ScrollArea className="flex-1 p-8">
                            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                                {messages.map((message) => (
                                    <OkaraChatMessage
                                        key={message.id}
                                        role={message.role}
                                        content={message.content}
                                        chainOfThought={message.chainOfThought}
                                        onCopy={() => navigator.clipboard.writeText(message.content)}
                                    />
                                ))}
                            </div>
                        </ScrollArea>

                        {/* Fixed Input at Bottom */}
                        <div className="border-t border-white/10 bg-[#09090b] p-6">
                            <div className="mx-auto w-full max-w-3xl">
                                <OkaraHeroInput
                                    value={inputValue}
                                    onChange={setInputValue}
                                    onSubmit={handleSubmit}
                                    disabled={isLoading}
                                    placeholder="Send a message..."
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
