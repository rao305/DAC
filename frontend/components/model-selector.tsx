'use client'

import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface Model {
  id: string
  name: string
  provider: string
  description?: string
}

interface ModelSelectorProps {
  selectedModels: string[]
  availableModels: Model[]
  onSelectionChange?: (models: string[]) => void
  maxSelection?: number
  className?: string
}

const PROVIDER_COLORS: Record<string, string> = {
  perplexity: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  openai: 'bg-green-500/20 text-green-300 border-green-500/30',
  gemini: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  openrouter: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

/**
 * ModelSelector - Multi-select dropdown for choosing LLM models
 *
 * Features:
 * - Multiple model selection
 * - Grouped by provider
 * - Badge display of selected models
 * - Maximum selection limit
 * - Searchable (future enhancement)
 * - Provider color coding
 */
export function ModelSelector({
  selectedModels,
  availableModels,
  onSelectionChange,
  maxSelection,
  className,
}: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false)

  // Group models by provider
  const modelsByProvider = React.useMemo(() => {
    const grouped = new Map<string, Model[]>()
    availableModels.forEach((model) => {
      const provider = model.provider
      if (!grouped.has(provider)) {
        grouped.set(provider, [])
      }
      grouped.get(provider)!.push(model)
    })
    return grouped
  }, [availableModels])

  const handleToggle = (modelId: string) => {
    const isSelected = selectedModels.includes(modelId)

    let newSelection: string[]
    if (isSelected) {
      newSelection = selectedModels.filter((id) => id !== modelId)
    } else {
      if (maxSelection && selectedModels.length >= maxSelection) {
        return // Don't allow more than max
      }
      newSelection = [...selectedModels, modelId]
    }

    onSelectionChange?.(newSelection)
  }

  const handleClearAll = () => {
    onSelectionChange?.([])
  }

  const selectedModelObjects = availableModels.filter((m) =>
    selectedModels.includes(m.id)
  )

  return (
    <div className={cn('space-y-2', className)}>
      {/* Popover trigger */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select models"
            className="w-full justify-between"
          >
            <span className="truncate">
              {selectedModels.length === 0
                ? 'Select models...'
                : `${selectedModels.length} model${selectedModels.length !== 1 ? 's' : ''} selected`}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <span className="text-sm font-medium">Select Models</span>
            {selectedModels.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            )}
          </div>

          <ScrollArea className="max-h-[300px]">
            <div className="p-2">
              {Array.from(modelsByProvider.entries()).map(([provider, models], providerIndex) => (
                <div key={provider}>
                  {providerIndex > 0 && <Separator className="my-2" />}

                  {/* Provider header */}
                  <div className="px-2 py-1.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        PROVIDER_COLORS[provider.toLowerCase()] || 'bg-gray-500/20 text-gray-300'
                      )}
                    >
                      {provider}
                    </Badge>
                  </div>

                  {/* Models */}
                  <div className="space-y-1">
                    {models.map((model) => {
                      const isSelected = selectedModels.includes(model.id)
                      const isDisabled =
                        !isSelected && maxSelection && selectedModels.length >= maxSelection

                      return (
                        <div
                          key={model.id}
                          className={cn(
                            'flex items-start gap-2 rounded-md px-2 py-2 hover:bg-accent transition-colors',
                            isDisabled && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <Checkbox
                            id={model.id}
                            checked={isSelected}
                            onCheckedChange={() => handleToggle(model.id)}
                            disabled={isDisabled}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <Label
                              htmlFor={model.id}
                              className={cn(
                                'text-sm font-medium cursor-pointer',
                                isDisabled && 'cursor-not-allowed'
                              )}
                            >
                              {model.name}
                            </Label>
                            {model.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {model.description}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 text-accent-foreground flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {maxSelection && (
            <div className="p-2 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                {selectedModels.length} / {maxSelection} models selected
              </p>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Selected models badges */}
      {selectedModelObjects.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedModelObjects.map((model) => (
            <Badge
              key={model.id}
              variant="secondary"
              className={cn(
                'text-xs cursor-pointer hover:bg-secondary/80',
                PROVIDER_COLORS[model.provider.toLowerCase()]
              )}
              onClick={() => handleToggle(model.id)}
            >
              {model.name}
              <span className="ml-1.5 text-muted-foreground hover:text-foreground">×</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
