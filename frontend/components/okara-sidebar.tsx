'use client'

import * as React from 'react'
import { MessageSquare, Settings, Plus, Library, History, Crown, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface OkaraSidebarProps {
    collapsed?: boolean
    onToggle?: () => void
    onNewChat?: () => void
}

export function OkaraSidebar({ collapsed = false, onToggle, onNewChat }: OkaraSidebarProps) {
    return (
        <div
            className={cn(
                'flex h-full flex-col border-r border-white/10 bg-[#0c0c0e] transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Top Section */}
            <div className="flex flex-col gap-4 p-4">
                {/* Logo */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">
                            <div className="flex flex-col gap-0.5">
                                <div className="h-0.5 w-4 rounded-full bg-zinc-400" />
                                <div className="h-0.5 w-4 rounded-full bg-zinc-400" />
                                <div className="h-0.5 w-4 rounded-full bg-zinc-400" />
                            </div>
                        </div>
                        {!collapsed && (
                            <span className="text-sm font-semibold text-zinc-100">DAC</span>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggle}
                        className="h-8 w-8 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                    >
                        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                </div>

                {/* New Chat Button */}
                <Button
                    onClick={onNewChat}
                    className={cn(
                        'justify-start gap-2 border border-white/10 bg-transparent text-zinc-100 transition-all duration-200 hover:bg-white/5',
                        collapsed && 'justify-center px-2'
                    )}
                >
                    <Plus className="h-4 w-4" />
                    {!collapsed && <span>New Chat</span>}
                </Button>
            </div>

            {/* Middle Section - Navigation */}
            <div className="flex-1 px-2">
                <nav className="flex flex-col gap-1">
                    <NavItem icon={Library} label="Library" collapsed={collapsed} />
                    <NavItem icon={History} label="History" collapsed={collapsed} />
                </nav>
            </div>

            {/* Bottom Section */}
            <div className="flex flex-col gap-2 border-t border-white/10 p-4">
                {/* Upgrade CTA */}
                <Button
                    variant="outline"
                    className={cn(
                        'justify-start gap-2 border-white/20 bg-transparent text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 hover:bg-white/5',
                        collapsed && 'justify-center px-2'
                    )}
                >
                    <Crown className="h-4 w-4 text-purple-400" />
                    {!collapsed && <span>Upgrade</span>}
                </Button>

                {/* User Profile */}
                <div
                    className={cn(
                        'flex items-center gap-2 rounded-lg p-2 hover:bg-zinc-800 transition-all cursor-pointer',
                        collapsed && 'justify-center'
                    )}
                >
                    <Avatar className="h-8 w-8 border border-white/10">
                        <AvatarFallback className="bg-zinc-800 text-zinc-100 text-sm">
                            U
                        </AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-zinc-100 truncate">User</p>
                            <p className="text-xs text-zinc-400 truncate">user@example.com</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

interface NavItemProps {
    icon: React.ElementType
    label: string
    collapsed: boolean
    active?: boolean
}

function NavItem({ icon: Icon, label, collapsed, active }: NavItemProps) {
    return (
        <button
            className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                active
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100',
                collapsed && 'justify-center px-2'
            )}
        >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
        </button>
    )
}
