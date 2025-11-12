'use client'

import * as React from 'react'
import { Settings, Sliders, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ModelSelector } from '@/components/model-selector'
import { cn } from '@/lib/utils'

interface SettingsPanelProps {
  // Model configuration
  selectedModels?: string[]
  availableModels?: Array<{ id: string; name: string; provider: string }>
  onModelChange?: (models: string[]) => void

  // System prompt
  systemPrompt?: string
  onSystemPromptChange?: (prompt: string) => void

  // Parameters
  temperature?: number
  onTemperatureChange?: (value: number) => void
  maxTokens?: number
  onMaxTokensChange?: (value: number) => void

  // Context
  contextDocuments?: Array<{ id: string; name: string; size: number }>
  onAddContext?: () => void
  onRemoveContext?: (id: string) => void

  // Visibility
  onClose?: () => void
  className?: string
}

/**
 * SettingsPanel - Right sidebar for conversation settings and context
 *
 * Features:
 * - Tabbed interface (Settings, Context, History)
 * - Model selection
 * - System prompt editor
 * - Temperature and parameter controls
 * - Context document management
 * - Collapsible sections
 * - Save/reset functionality
 */
export function SettingsPanel({
  selectedModels = [],
  availableModels = [],
  onModelChange,
  systemPrompt = '',
  onSystemPromptChange,
  temperature = 0.7,
  onTemperatureChange,
  maxTokens = 2000,
  onMaxTokensChange,
  contextDocuments = [],
  onAddContext,
  onRemoveContext,
  onClose,
  className,
}: SettingsPanelProps) {
  const [localSystemPrompt, setLocalSystemPrompt] = React.useState(systemPrompt)
  const [hasChanges, setHasChanges] = React.useState(false)

  React.useEffect(() => {
    setHasChanges(localSystemPrompt !== systemPrompt)
  }, [localSystemPrompt, systemPrompt])

  const handleSaveSystemPrompt = () => {
    onSystemPromptChange?.(localSystemPrompt)
    setHasChanges(false)
  }

  const handleResetSystemPrompt = () => {
    setLocalSystemPrompt(systemPrompt)
    setHasChanges(false)
  }

  return (
    <div className={cn('h-full flex flex-col bg-card', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label="Close settings panel"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Tabbed content */}
      <Tabs defaultValue="settings" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="settings" className="flex-1">
            <Sliders className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="context" className="flex-1">
            <FileText className="w-4 h-4 mr-2" />
            Context
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-0 space-y-6">
              {/* Model Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Active Models</CardTitle>
                  <CardDescription className="text-xs">
                    Select which LLMs to use for this conversation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ModelSelector
                    selectedModels={selectedModels}
                    availableModels={availableModels}
                    onSelectionChange={onModelChange}
                  />
                </CardContent>
              </Card>

              {/* System Prompt */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">System Prompt</CardTitle>
                  <CardDescription className="text-xs">
                    Instructions for how the AI should behave
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={localSystemPrompt}
                    onChange={(e) => setLocalSystemPrompt(e.target.value)}
                    placeholder="You are a helpful assistant..."
                    className="min-h-[120px] resize-none text-sm"
                  />
                  {hasChanges && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleSaveSystemPrompt}
                        size="sm"
                        className="flex-1"
                      >
                        Save Changes
                      </Button>
                      <Button
                        onClick={handleResetSystemPrompt}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Reset
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Parameters */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Parameters</CardTitle>
                  <CardDescription className="text-xs">
                    Fine-tune the model's behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Temperature */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="temperature" className="text-xs font-medium">
                        Temperature
                      </Label>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {temperature.toFixed(1)}
                      </span>
                    </div>
                    <Slider
                      id="temperature"
                      value={[temperature]}
                      onValueChange={(values) => onTemperatureChange?.(values[0])}
                      min={0}
                      max={2}
                      step={0.1}
                      className="w-full"
                      aria-label="Temperature setting"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Higher values make output more random and creative
                    </p>
                  </div>

                  <Separator />

                  {/* Max Tokens */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="max-tokens" className="text-xs font-medium">
                        Max Tokens
                      </Label>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {maxTokens.toLocaleString()}
                      </span>
                    </div>
                    <Slider
                      id="max-tokens"
                      value={[maxTokens]}
                      onValueChange={(values) => onMaxTokensChange?.(values[0])}
                      min={100}
                      max={4000}
                      step={100}
                      className="w-full"
                      aria-label="Maximum tokens setting"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Maximum length of the generated response
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Context Tab */}
            <TabsContent value="context" className="mt-0 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm">Context Documents</CardTitle>
                      <CardDescription className="text-xs">
                        Attached files and documents
                      </CardDescription>
                    </div>
                    {onAddContext && (
                      <Button onClick={onAddContext} size="sm" variant="outline">
                        Add
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {contextDocuments.length === 0 ? (
                    <div className="text-center py-6">
                      <FileText className="w-10 h-10 mx-auto text-muted-foreground opacity-50 mb-2" />
                      <p className="text-xs text-muted-foreground">
                        No context documents attached
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {contextDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">{doc.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {(doc.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          {onRemoveContext && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onRemoveContext(doc.id)}
                              className="h-6 w-6 p-0 ml-2 flex-shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Token usage info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Token Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Context:</span>
                    <Badge variant="secondary">1,234 tokens</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Available:</span>
                    <Badge variant="secondary">6,766 tokens</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  )
}
