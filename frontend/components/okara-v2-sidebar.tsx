'use client'

import * as React from 'react'
import { 
  Search, 
  Plus, 
  Trash2, 
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ChatHistoryItem {
    id: string
    firstLine: string
    timestamp: string
}

interface OkaraSidebarV2Props {
    isOpen?: boolean
    onClose?: () => void
    history?: ChatHistoryItem[]
    onHistoryClick?: (id: string) => void
    onNewChat?: () => void
    onClearAll?: () => void
    onExport?: () => void
}

export function OkaraSidebarV2({
    isOpen = true,
    onClose,
    history = [],
    onHistoryClick,
    onNewChat,
    onClearAll,
    onExport,
}: OkaraSidebarV2Props) {
    const [searchQuery, setSearchQuery] = React.useState('')

    const filteredHistory = history.filter((item) =>
        item.firstLine.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 md:hidden opacity-40"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'w-[280px] h-full bg-[#171717] border-r border-[#333] flex-shrink-0 overflow-hidden',
                    'max-md:fixed max-md:top-0 max-md:left-0 max-md:z-50',
                    !isOpen && 'max-md:-translate-x-full'
                )}
                style={{
                    display: isOpen ? 'block' : 'none'
                }}
            >
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-[#333]">
                        <Button
                            onClick={onNewChat}
                            className="w-full gap-2 bg-transparent border border-[#333] text-white hover:bg-[#2a2a2a] transition-colors rounded-lg h-10"
                        >
                            <Plus className="h-4 w-4" />
                            New Chat
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search history..."
                                className="w-full pl-10 pr-4 py-2.5 text-sm bg-transparent border border-[#333] rounded-lg placeholder:text-gray-500 text-white focus:outline-none focus:border-gray-400 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Chat History List */}
                    <ScrollArea className="flex-1 px-2">
                        <div className="space-y-1">
                            {filteredHistory.length === 0 && (
                                <div className="py-8 text-center text-sm text-gray-500">
                                    {searchQuery ? 'No results found' : 'No chat history'}
                                </div>
                            )}
                            {filteredHistory.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => onHistoryClick?.(item.id)}
                                    className="w-full rounded-lg p-3 text-left transition-colors hover:bg-[#2a2a2a] group"
                                >
                                    <div className="mb-1 truncate text-sm text-white">
                                        {item.firstLine}
                                    </div>
                                    <div className="text-xs text-gray-500">{item.timestamp}</div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>

                    {/* Footer actions */}
                    <div className="p-4 border-t border-[#333]">
                        <div className="flex gap-2">
                            <Button
                                onClick={onClearAll}
                                size="sm"
                                variant="ghost"
                                className="text-gray-400 hover:text-white hover:bg-[#2a2a2a] flex-1"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                                onClick={onExport}
                                size="sm"
                                variant="ghost"
                                className="text-gray-400 hover:text-white hover:bg-[#2a2a2a] flex-1"
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}
