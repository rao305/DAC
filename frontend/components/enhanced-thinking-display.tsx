'use client'

import * as React from 'react'
import { Brain, Search, Lightbulb, CheckCircle, ChevronDown, ChevronUp, Clock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThinkingStep {
  id: string
  type: 'strategy' | 'search' | 'analysis' | 'synthesis' | 'validation'
  content: string
  tags?: string[]
  status: 'pending' | 'active' | 'completed'
  timestamp?: string
}

interface EnhancedThinkingDisplayProps {
  isVisible: boolean
  currentStep?: string
  strategy?: string
  searchTags?: string[]
  sourcesCount?: number
  onComplete?: () => void
  className?: string
}

export function EnhancedThinkingDisplay({
  isVisible,
  currentStep = "Analyzing your request",
  strategy,
  searchTags = [],
  sourcesCount = 0,
  onComplete,
  className
}: EnhancedThinkingDisplayProps) {
  const [isExpanded, setIsExpanded] = React.useState(true)
  const [completedSteps, setCompletedSteps] = React.useState<Set<string>>(new Set())
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0)

  const thinkingSteps: ThinkingStep[] = [
    {
      id: 'strategy',
      type: 'strategy',
      content: strategy || 'Analyzing request and determining optimal approach',
      status: currentStepIndex >= 0 ? 'completed' : 'pending'
    },
    {
      id: 'search',
      type: 'search', 
      content: 'Gathering relevant knowledge and context',
      tags: searchTags,
      status: currentStepIndex >= 1 ? 'completed' : currentStepIndex === 0 ? 'active' : 'pending'
    },
    {
      id: 'analysis',
      type: 'analysis',
      content: 'Processing information and identifying key patterns',
      status: currentStepIndex >= 2 ? 'completed' : currentStepIndex === 1 ? 'active' : 'pending'
    },
    {
      id: 'synthesis',
      type: 'synthesis',
      content: 'Synthesizing insights and formulating response',
      status: currentStepIndex >= 3 ? 'completed' : currentStepIndex === 2 ? 'active' : 'pending'
    }
  ]

  // Simulate thinking progression
  React.useEffect(() => {
    if (!isVisible) return

    const progressTimer = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < thinkingSteps.length - 1) {
          return prev + 1
        } else {
          clearInterval(progressTimer)
          setTimeout(() => onComplete?.(), 1000)
          return prev
        }
      })
    }, 1500)

    return () => clearInterval(progressTimer)
  }, [isVisible, onComplete])

  const getStepIcon = (type: ThinkingStep['type'], status: ThinkingStep['status']) => {
    const baseClasses = "h-4 w-4 transition-colors duration-200"
    
    switch (status) {
      case 'completed':
        return <CheckCircle className={cn(baseClasses, "text-green-600")} />
      case 'active':
        switch (type) {
          case 'strategy':
            return <Brain className={cn(baseClasses, "text-blue-600 animate-pulse")} />
          case 'search':
            return <Search className={cn(baseClasses, "text-purple-600 animate-pulse")} />
          case 'analysis':
            return <Lightbulb className={cn(baseClasses, "text-orange-600 animate-pulse")} />
          case 'synthesis':
            return <Sparkles className={cn(baseClasses, "text-indigo-600 animate-pulse")} />
          default:
            return <Brain className={cn(baseClasses, "text-blue-600 animate-pulse")} />
        }
      default:
        return <div className={cn("h-4 w-4 rounded-full border-2 border-gray-300")} />
    }
  }

  const getStepColor = (status: ThinkingStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'active':
        return 'text-blue-600 font-medium'
      default:
        return 'text-gray-500'
    }
  }

  if (!isVisible) return null

  return (
    <div className={cn(
      "mb-4 w-full max-w-[680px] rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50/30 p-4 shadow-sm transition-all duration-300",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-2">
            <Brain className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Enhanced Reasoning</h3>
            <p className="text-xs text-gray-600">Processing your request with advanced chain of thought</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4">
          {/* Current Step */}
          <div className="mb-4 rounded-lg bg-white/60 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-3 w-3 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Currently Processing</span>
            </div>
            <p className="text-sm text-gray-800">{currentStep}</p>
          </div>

          {/* Thinking Steps */}
          <div className="space-y-3">
            {thinkingSteps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getStepIcon(step.type, step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", getStepColor(step.status))}>
                    {step.content}
                  </p>
                  
                  {/* Search Tags */}
                  {step.type === 'search' && step.tags && step.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {step.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors duration-200",
                            step.status === 'active' 
                              ? "bg-purple-100 text-purple-700 animate-pulse" 
                              : step.status === 'completed'
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          )}
                        >
                          <Search className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Sources Count */}
          {sourcesCount > 0 && (
            <div className="mt-4 text-center">
              <span className="text-xs text-gray-600">
                Analyzing {sourcesCount} knowledge sources
              </span>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="rounded-full bg-gray-200 h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${((currentStepIndex + 1) / thinkingSteps.length) * 100}%` 
                }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>Reasoning Progress</span>
              <span>{Math.round(((currentStepIndex + 1) / thinkingSteps.length) * 100)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}