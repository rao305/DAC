'use client'

import * as React from 'react'
import { Menu } from 'lucide-react'
import { OkaraSidebarV2 } from './okara-v2-sidebar'
import { OkaraBubbleFreeMessage } from './okara-bubble-free-message'
import { ChatInputBox } from './chat/ChatInputBox'
import { ModelId } from './chat/modelOptions'
import { ScrollArea } from './ui/scroll-area'
import { SimpleThinkingDisplay } from './simple-thinking-display'

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

interface ChatHistoryItem {
    id: string
    firstLine: string
    timestamp: string
}

interface OkaraLayoutV2Props {
    messages?: Message[]
    history?: ChatHistoryItem[]
    onSendMessage?: (content: string) => void
    onNewChat?: () => void
    onHistoryClick?: (id: string) => void
    isLoading?: boolean
    selectedModel?: string
    onModelSelect?: (modelId: string) => void
}

export function OkaraLayoutV2({
    messages = [],
    history = [],
    onSendMessage,
    onNewChat,
    onHistoryClick,
    isLoading = false,
    selectedModel = 'kimi-k2-thinking',
    onModelSelect,
}: OkaraLayoutV2Props) {
    const [sidebarOpen, setSidebarOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState('')
    const [showThinking, setShowThinking] = React.useState(false)
    const [currentQuery, setCurrentQuery] = React.useState('')
    const scrollRef = React.useRef<HTMLDivElement>(null)

    // Load sidebar state from localStorage on mount
    React.useEffect(() => {
        const savedState = localStorage.getItem('sidebar-open')
        if (savedState !== null) {
            setSidebarOpen(JSON.parse(savedState))
        }
    }, [])

    // Save sidebar state to localStorage when it changes
    React.useEffect(() => {
        localStorage.setItem('sidebar-open', JSON.stringify(sidebarOpen))
    }, [sidebarOpen])

    // Keyboard shortcuts for sidebar toggle
    React.useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + B to toggle sidebar
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault()
                setSidebarOpen(prev => !prev)
            }
        }

        document.addEventListener('keydown', handleKeydown)
        return () => document.removeEventListener('keydown', handleKeydown)
    }, [])


    // Hide thinking display when loading stops
    React.useEffect(() => {
        if (!isLoading && showThinking) {
            setShowThinking(false)
        }
    }, [isLoading, showThinking])

    // Auto-scroll to bottom when new messages arrive
    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    return (
        <div className="flex h-screen w-full bg-[#212121] overflow-hidden">
            {/* Sidebar */}
            <div className={`transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-[280px]' : 'w-0'} flex-shrink-0`}>
                <OkaraSidebarV2
                    isOpen={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    history={history}
                    onHistoryClick={onHistoryClick}
                    onNewChat={onNewChat}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col min-h-screen relative">
                {/* Header with menu toggle */}
                <header className="flex items-center justify-between p-4 border-b border-[#333]">
                    <div className="relative group">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className={`p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 ${
                                sidebarOpen 
                                    ? 'bg-[#2a2a2a] text-white' 
                                    : 'hover:bg-[#2a2a2a] text-white'
                            }`}
                            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                            title={sidebarOpen ? "Close sidebar (Ctrl+B)" : "Open sidebar (Ctrl+B)"}
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        
                        {/* Tooltip */}
                        <div className="absolute left-0 top-12 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                            {sidebarOpen ? "Close sidebar" : "Open sidebar"} (Ctrl+B)
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <span className="text-white font-medium">Hi there</span>
                        <button className="p-2 rounded-lg hover:bg-[#2a2a2a] transition-colors text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                        </button>
                    </div>
                </header>

                {/* Main content */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Messages area or welcome screen */}
                    <div className="flex-1 flex flex-col justify-center items-center p-6">
                        {messages.length === 0 ? (
                            <div className="text-center max-w-2xl">
                                <h1 className="text-4xl font-semibold text-white mb-4">
                                    Welcome to Okara
                                </h1>
                                <p className="text-gray-400 text-lg mb-8">
                                    Start a conversation to see the magic happen
                                </p>
                            </div>
                        ) : (
                            <ScrollArea className="flex-1 w-full max-w-4xl" ref={scrollRef}>
                                <div className="space-y-6 p-6">
                                    {messages.map((message, index) => (
                                        <div 
                                            key={message.id}
                                            className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <OkaraBubbleFreeMessage
                                                role={message.role}
                                                content={message.content}
                                                chainOfThought={message.chainOfThought}
                                                timestamp={message.timestamp}
                                                modelId={message.modelId}
                                                modelName={message.modelName}
                                                reasoningType={message.reasoningType}
                                                confidence={message.confidence}
                                                processingTime={message.processingTime}
                                            />
                                        </div>
                                    ))}
                                    
                                    {/* Simple Thinking Display */}
                                    {showThinking && isLoading && (
                                        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
                                            <SimpleThinkingDisplay isVisible={true} />
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        )}
                    </div>

                    {/* Input area - fixed at bottom */}
        <div className="border-t border-[#333] bg-[#212121] p-6">
                        <div className="max-w-4xl mx-auto">
                            <ChatInputBox
                                value={inputValue}
                                onChange={setInputValue}
                                onSubmit={(message) => {
                                    setCurrentQuery(message)
                                    setShowThinking(true)
                                    if (onSendMessage) {
                                        onSendMessage(message)
                                    }
                                    setInputValue('')
                                }}
                                currentModelId={selectedModel as ModelId || 'kimi-k2-thinking'}
                                onModelChange={(modelId) => onModelSelect?.(modelId)}
                                isSending={isLoading}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
