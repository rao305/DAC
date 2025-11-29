'use client'

import * as React from 'react'
import { Settings, HelpCircle, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ModelSelector } from './model-selector'

interface OkaraHeaderProps {
    selectedModel?: string
    onModelSelect?: (modelId: string) => void
    onSettings?: () => void
    onHelp?: () => void
    onMenuToggle?: () => void
}

export function OkaraHeader({
    selectedModel = 'kimi-k2-thinking',
    onModelSelect,
    onSettings,
    onHelp,
    onMenuToggle,
}: OkaraHeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#2a2a2a] bg-[#1a1a1a] px-6 shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
            {/* Left: Logo + Menu Toggle */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMenuToggle}
                    className="md:hidden text-[#888888] hover:bg-[#009688] hover:text-white transition-all duration-120"
                >
                    <Menu className="h-5 w-5" />
                </Button>

                <div className="flex items-center gap-3">
                    {/* Okara Logo - Circle with O */}
                    <div className="flex h-8 w-8 items-center justify-center bg-[#009688] rounded-full">
                        <span className="text-sm font-bold text-white">O</span>
                    </div>
                    <span className="text-lg font-semibold text-white tracking-tight">Okara</span>
                </div>
            </div>

            {/* Center: Model Selector */}
            <div className="flex items-center gap-2 px-3 py-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded-[8px] shadow-[rgba(0,0,0,.2)]">
                <ModelSelector
                    value={selectedModel}
                    onValueChange={onModelSelect}
                />
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSettings}
                    className="text-[#888888] hover:bg-[#009688] hover:text-white transition-all duration-120 rounded-[8px]"
                >
                    <Settings className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onHelp}
                    className="text-[#888888] hover:bg-[#009688] hover:text-white transition-all duration-120 rounded-[8px]"
                >
                    <HelpCircle className="h-5 w-5" />
                </Button>
            </div>
        </header>
    )
}
