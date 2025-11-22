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
    <div className={cn('flex flex-col items-center justify-center w-full py-4', className)}>
      <div className="max-w-3xl w-full space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Welcome message - Gemini-inspired centered design */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-emerald-500/20">
              <MessageSquarePlus className="w-8 h-8 text-emerald-300" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">
              Ask Syntra anything
            </h2>
            <p className="text-muted-foreground/70 max-w-md mx-auto text-xs leading-relaxed">
              Type your message to get started with AI-powered assistance across multiple LLM providers.
            </p>
          </div>
        </div>


        {/* Capabilities - Shrunk stats like Gemini */}
        <div className="pt-3 border-t border-border/30">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="space-y-0.5">
              <div className="text-base font-semibold text-emerald-400">4+</div>
              <div className="text-[10px] text-muted-foreground/60">Providers</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-base font-semibold text-blue-400">Smart</div>
              <div className="text-[10px] text-muted-foreground/60">Routing</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-base font-semibold text-purple-400">Secure</div>
              <div className="text-[10px] text-muted-foreground/60">by Design</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
