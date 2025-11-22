'use client'

import * as React from 'react'
import { Check, ChevronDown, Sparkles, Brain, Zap, Search, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface SyntraModel {
    id: string
    name: string
    provider: 'auto' | 'kimi' | 'google' | 'openai' | 'perplexity'
    icon: React.ElementType
    description: string
    features?: string[]
}

export const SYNTRA_MODELS: SyntraModel[] = [
    {
        id: 'auto',
        name: 'Auto',
        provider: 'auto',
        icon: Wand2,
        description: 'Intelligent routing - automatically selects the best model for your query',
        features: ['Smart routing', 'Cost optimized', 'Best performance'],
    },
    {
        id: 'kimi-k2-thinking',
        name: 'Kimi K2 Thinking',
        provider: 'kimi',
        icon: Brain,
        description: 'Advanced reasoning with extended context and deep analysis',
        features: ['Long context', 'Chain of thought', 'Multilingual'],
    },
    {
        id: 'gemini-2.0-flash-thinking-exp',
        name: 'Gemini 2.0 Flash Thinking',
        provider: 'google',
        icon: Sparkles,
        description: 'Fast multimodal AI with visual understanding and code generation',
        features: ['Multimodal', 'Code expert', 'Fast response'],
    },
    {
        id: 'gpt-5',
        name: 'GPT-5',
        provider: 'openai',
        icon: Zap,
        description: 'Most capable reasoning model with advanced problem-solving',
        features: ['Best reasoning', 'Complex tasks', 'High accuracy'],
    },
    {
        id: 'sonar-pro',
        name: 'Perplexity Sonar Pro',
        provider: 'perplexity',
        icon: Search,
        description: 'Web-grounded answers with real-time search and citations',
        features: ['Real-time search', 'Citations', 'Current info'],
    },
]

interface SyntraModelSelectorProps {
    selectedModel?: string
    onSelectModel?: (modelId: string) => void
}

export function SyntraModelSelector({
    selectedModel = 'auto',
    onSelectModel,
}: SyntraModelSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState('')
    const [isFlashing, setIsFlashing] = React.useState(false)

    const selected = SYNTRA_MODELS.find((m) => m.id === selectedModel) || SYNTRA_MODELS[0]

    const filteredModels = SYNTRA_MODELS.filter((model) =>
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleSelect = (modelId: string) => {
        onSelectModel?.(modelId)
        setOpen(false)
        setSearchQuery('')

        // Flash green effect
        setIsFlashing(true)
        setTimeout(() => setIsFlashing(false), 500)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className={cn(
                    "flex items-center gap-2 w-36 h-9 justify-center rounded border border-gray-200 bg-white text-[13px] font-medium text-[#333] transition-all duration-150 hover:bg-[#eeeeee]",
                    isFlashing && "shadow-[inset_0_0_6px_rgba(76,175,80,0.4)]"
                )}>
                    <selected.icon className="h-4 w-4" />
                    <span>{selected.name}</span>
                    <ChevronDown className="h-4 w-4" />
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl animate-in fade-in-0 slide-in-from-top-1 duration-150 ease-out">
                <DialogHeader>
                    <DialogTitle>Select Model</DialogTitle>
                </DialogHeader>

                {/* Search */}
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search models..."
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Model List */}
                <div className="space-y-2">
                    {filteredModels.map((model) => {
                        const Icon = model.icon
                        const isSelected = model.id === selectedModel

                        return (
                            <button
                                key={model.id}
                                onClick={() => handleSelect(model.id)}
                                className={cn(
                                    'w-full rounded-lg border p-4 text-left transition-all',
                                    isSelected
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={cn(
                                            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                                            isSelected ? 'bg-blue-100' : 'bg-gray-100'
                                        )}
                                    >
                                        <Icon
                                            className={cn('h-5 w-5', isSelected ? 'text-blue-600' : 'text-gray-600')}
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-900">{model.name}</h3>
                                            {isSelected && <Check className="h-5 w-5 text-blue-600" />}
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600">{model.description}</p>

                                        {model.features && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {model.features.map((feature) => (
                                                    <span
                                                        key={feature}
                                                        className={cn(
                                                            'rounded-full px-2 py-0.5 text-xs font-medium',
                                                            isSelected
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-gray-100 text-gray-600'
                                                        )}
                                                    >
                                                        {feature}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        )
                    })}

                    {filteredModels.length === 0 && (
                        <div className="py-8 text-center text-sm text-gray-500">
                            No models found matching "{searchQuery}"
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
