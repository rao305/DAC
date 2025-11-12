'use client'

import * as React from 'react'
import { MessageSquarePlus, Sparkles, Brain, Code, FileSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ExamplePrompt {
  icon: React.ReactNode
  title: string
  prompt: string
  category: string
}

interface EmptyConversationProps {
  onPromptSelect?: (prompt: string) => void
  showExamples?: boolean
  className?: string
}

const EXAMPLE_PROMPTS: ExamplePrompt[] = [
  {
    icon: <Brain className="w-5 h-5" />,
    title: 'Brainstorm ideas',
    prompt: 'Help me brainstorm creative ideas for a new mobile app that helps people stay organized',
    category: 'Creative',
  },
  {
    icon: <Code className="w-5 h-5" />,
    title: 'Write code',
    prompt: 'Write a Python function that validates email addresses using regex',
    category: 'Technical',
  },
  {
    icon: <FileSearch className="w-5 h-5" />,
    title: 'Analyze data',
    prompt: 'Explain the key insights I should look for when analyzing user behavior data',
    category: 'Analysis',
  },
  {
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Get advice',
    prompt: 'What are the best practices for conducting effective user interviews?',
    category: 'Learning',
  },
]

/**
 * EmptyConversation - Friendly empty state with example prompts
 *
 * Features:
 * - Welcoming message
 * - Example prompt cards
 * - One-click prompt insertion
 * - Category-based organization
 * - Responsive grid layout
 */
export function EmptyConversation({
  onPromptSelect,
  showExamples = true,
  className,
}: EmptyConversationProps) {
  return (
    <div className={cn('flex items-center justify-center p-8 h-full', className)}>
      <div className="max-w-3xl w-full space-y-8">
        {/* Welcome message */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center ring-2 ring-purple-500/30">
              <MessageSquarePlus className="w-8 h-8 text-purple-300" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Start a new conversation
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Choose from the examples below or type your own message to get started with AI-powered
              assistance across multiple LLM providers.
            </p>
          </div>
        </div>

        {/* Example prompts */}
        {showExamples && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 justify-center">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">
                Try these examples
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EXAMPLE_PROMPTS.map((example, index) => (
                <Card
                  key={index}
                  className={cn(
                    'cursor-pointer transition-all duration-200',
                    'hover:bg-accent/50 hover:border-accent hover:shadow-md',
                    'group'
                  )}
                  onClick={() => onPromptSelect?.(example.prompt)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onPromptSelect?.(example.prompt)
                    }
                  }}
                  aria-label={`Use example prompt: ${example.title}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-accent/30 text-accent-foreground group-hover:bg-accent group-hover:text-primary transition-colors flex-shrink-0">
                        {example.icon}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-semibold text-foreground">
                            {example.title}
                          </h4>
                          <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                            {example.category}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {example.prompt}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Capabilities */}
        <div className="pt-4 border-t border-border">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-purple-300">4+</div>
              <div className="text-xs text-muted-foreground">LLM Providers</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-300">Smart</div>
              <div className="text-xs text-muted-foreground">Auto-routing</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-300">Fast</div>
              <div className="text-xs text-muted-foreground">Responses</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
