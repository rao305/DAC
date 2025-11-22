'use client'

import * as React from 'react'
import { Brain, Zap, Target, Sparkles, Search, Code, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModelReasoningIndicatorProps {
  modelId: string
  modelName: string
  reasoningType?: 'coding' | 'analysis' | 'creative' | 'research' | 'conversation'
  confidence?: number
  processingTime?: number
  className?: string
}

const REASONING_TYPES = {
  coding: {
    icon: Code,
    color: 'green',
    label: 'Code Generation',
    description: 'Applying coding best practices and patterns'
  },
  analysis: {
    icon: Brain,
    color: 'purple',
    label: 'Deep Analysis',
    description: 'Systematic reasoning and problem decomposition'
  },
  creative: {
    icon: Sparkles,
    color: 'pink',
    label: 'Creative Synthesis',
    description: 'Generating innovative and engaging content'
  },
  research: {
    icon: Search,
    color: 'blue',
    label: 'Research & Facts',
    description: 'Gathering and synthesizing information'
  },
  conversation: {
    icon: MessageSquare,
    color: 'orange',
    label: 'Conversational',
    description: 'Natural dialogue and assistance'
  }
}

const MODEL_SPECIALTIES = {
  'gpt-4': {
    primary: 'analysis',
    strengths: ['reasoning', 'problem-solving', 'code review']
  },
  'gpt-4-turbo': {
    primary: 'coding',
    strengths: ['fast coding', 'optimization', 'debugging']
  },
  'claude-3-opus': {
    primary: 'analysis',
    strengths: ['deep reasoning', 'complex analysis', 'research']
  },
  'claude-3-sonnet': {
    primary: 'conversation',
    strengths: ['balanced responses', 'helpful guidance', 'clarity']
  },
  'gemini-pro': {
    primary: 'creative',
    strengths: ['creativity', 'multimodal', 'long context']
  },
  'kimi-k2-thinking': {
    primary: 'analysis',
    strengths: ['step-by-step reasoning', 'chain of thought', 'systematic analysis']
  }
}

export function ModelReasoningIndicator({
  modelId,
  modelName,
  reasoningType,
  confidence = 85,
  processingTime,
  className
}: ModelReasoningIndicatorProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const modelSpecialty = MODEL_SPECIALTIES[modelId as keyof typeof MODEL_SPECIALTIES]
  const detectedType = reasoningType || modelSpecialty?.primary || 'conversation'
  const reasoningConfig = REASONING_TYPES[detectedType]
  
  const IconComponent = reasoningConfig.icon
  const colorClass = reasoningConfig.color

  return (
    <div className={cn(
      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all duration-300",
      `border-${colorClass}-200 bg-${colorClass}-50`,
      isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95",
      className
    )}>
      <div className={cn("rounded-full p-1", `bg-${colorClass}-100`)}>
        <IconComponent className={cn("h-3 w-3", `text-${colorClass}-600`)} />
      </div>
      
      <div className="flex items-center gap-2">
        <span className={cn("font-medium", `text-${colorClass}-700`)}>
          {reasoningConfig.label}
        </span>
        
        {/* Confidence Indicator */}
        <div className="flex items-center gap-1">
          <div className="h-1 w-8 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-1000", `bg-${colorClass}-500`)}
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="text-gray-600 text-xs">{confidence}%</span>
        </div>
      </div>

      {/* Processing Time */}
      {processingTime && (
        <div className="flex items-center gap-1 text-gray-500">
          <Zap className="h-3 w-3" />
          <span>{processingTime}ms</span>
        </div>
      )}

      {/* Model Badge */}
      <div className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        `bg-${colorClass}-100 text-${colorClass}-700`
      )}>
        {modelName}
      </div>
    </div>
  )
}

export function ModelReasoningTooltip({ 
  modelId, 
  children 
}: { 
  modelId: string
  children: React.ReactNode 
}) {
  const [showTooltip, setShowTooltip] = React.useState(false)
  const modelSpecialty = MODEL_SPECIALTIES[modelId as keyof typeof MODEL_SPECIALTIES]

  if (!modelSpecialty) return <>{children}</>

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
          <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg min-w-[200px]">
            <div className="font-medium mb-1">Model Strengths</div>
            <div className="space-y-1">
              {modelSpecialty.strengths.map((strength, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Target className="h-2 w-2" />
                  <span>{strength}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}