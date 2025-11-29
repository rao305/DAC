"use client"

import React from "react"
import { Brain, Play, Pause, RotateCcw, StopCircle, Edit, Check, X, Users, Sparkles, Search, Lightbulb, Eye, Zap } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface AgentStep {
  id: string
  role: "analyst" | "researcher" | "creator" | "critic" | "synthesizer"
  name: string
  icon: React.ElementType
  status: "waiting" | "thinking" | "awaiting_approval" | "done" | "rerun" | "skipped" | "error"
  output?: string
  summary?: string
  context?: string[]
  error?: string
}

interface MultiAgentThinkingProps {
  isVisible: boolean
  mode: "auto" | "manual"
  userPrompt: string
  steps: AgentStep[]
  currentStepIndex: number
  isRunning: boolean
  onModeChange: (mode: "auto" | "manual") => void
  onApprove?: (stepId: string) => void
  onEdit?: (stepId: string, newOutput: string) => void
  onRerun?: (stepId: string) => void
  onSkip?: (stepId: string) => void
  onStop?: () => void
  onRerunAll?: () => void
}

const getAgentIcon = (role: string) => {
  switch (role) {
    case "analyst": return Brain
    case "researcher": return Search
    case "creator": return Lightbulb
    case "critic": return Eye
    case "synthesizer": return Zap
    default: return Users
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "waiting": return "text-zinc-500 border-zinc-600/30"
    case "thinking": return "text-blue-400 border-blue-500/40"
    case "awaiting_approval": return "text-yellow-400 border-yellow-500/40"
    case "done": return "text-green-400 border-green-500/40"
    case "rerun": return "text-orange-400 border-orange-500/40"
    case "skipped": return "text-zinc-400 border-zinc-500/30"
    case "error": return "text-red-400 border-red-500/40"
    default: return "text-zinc-500 border-zinc-600/30"
  }
}

export function MultiAgentThinking({
  isVisible,
  mode,
  userPrompt,
  steps,
  currentStepIndex,
  isRunning,
  onModeChange,
  onApprove,
  onEdit,
  onRerun,
  onSkip,
  onStop,
  onRerunAll
}: MultiAgentThinkingProps) {
  const [editingStep, setEditingStep] = useState<string | null>(null)
  const [editText, setEditText] = useState("")

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isVisible) {
      // Save current body overflow style
      const originalStyle = window.getComputedStyle(document.body).overflow
      // Disable body scroll
      document.body.style.overflow = 'hidden'
      
      return () => {
        // Restore original overflow style when modal closes
        document.body.style.overflow = originalStyle
      }
    }
  }, [isVisible])

  // Prevent scroll propagation from modal to background
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on overlay, not on modal content
    if (e.target === e.currentTarget) {
      // Optionally close modal on overlay click
      // onStop?.()
    }
  }

  const handleOverlayWheel = (e: React.WheelEvent) => {
    // Prevent wheel events from reaching background
    e.stopPropagation()
  }

  if (!isVisible) return null

  const currentStep = steps[currentStepIndex]
  const completedSteps = steps.filter(s => s.status === "done").length
  const progressPercent = (completedSteps / steps.length) * 100

  const handleEdit = (stepId: string) => {
    const step = steps.find(s => s.id === stepId)
    if (step?.output) {
      setEditText(step.output)
      setEditingStep(stepId)
    }
  }

  const saveEdit = () => {
    if (editingStep && onEdit) {
      onEdit(editingStep, editText)
      setEditingStep(null)
      setEditText("")
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden"
      onClick={handleOverlayClick}
      onWheel={handleOverlayWheel}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div 
        className="w-full max-w-7xl h-[90vh] bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header: User Request Panel */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-zinc-700/50 p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-white">Multi-Agent Collaboration</h2>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-4 text-zinc-300 text-sm leading-relaxed">
                {userPrompt}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Mode Toggle */}
              <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg p-1">
                <button
                  onClick={() => onModeChange("auto")}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-all",
                    mode === "auto" 
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                      : "text-zinc-400 hover:text-zinc-300"
                  )}
                >
                  <Play className="w-4 h-4 inline mr-1" />
                  Auto
                </button>
                <button
                  onClick={() => onModeChange("manual")}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-all",
                    mode === "manual" 
                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" 
                      : "text-zinc-400 hover:text-zinc-300"
                  )}
                >
                  <Pause className="w-4 h-4 inline mr-1" />
                  Manual
                </button>
              </div>
              
              {/* Global Controls */}
              <div className="flex gap-2">
                {isRunning && onStop && (
                  <button
                    onClick={onStop}
                    className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all text-sm"
                  >
                    <StopCircle className="w-4 h-4 inline mr-1" />
                    Stop
                  </button>
                )}
                {onRerunAll && (
                  <button
                    onClick={onRerunAll}
                    className="px-3 py-2 bg-zinc-700/50 text-zinc-400 border border-zinc-600/30 rounded-lg hover:bg-zinc-600/50 transition-all text-sm"
                  >
                    <RotateCcw className="w-4 h-4 inline mr-1" />
                    Rerun All
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex gap-6 p-6 overflow-hidden min-h-0">
          
          {/* Agent Timeline */}
          <div className="w-80 flex flex-col min-h-0">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-white mb-2">Agent Pipeline</h3>
              <div className="bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                {completedSteps} of {steps.length} completed
              </div>
            </div>

            <div 
              className="space-y-4 flex-1 overflow-y-auto overscroll-contain"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {steps.map((step, index) => {
                const IconComponent = getAgentIcon(step.role)
                const isActive = index === currentStepIndex
                const isPast = index < currentStepIndex
                const isConnected = index < currentStepIndex || (index === currentStepIndex && step.status !== "waiting")

                return (
                  <div key={step.id} className="relative">
                    <div className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
                      isActive && "scale-105 shadow-lg",
                      getStatusColor(step.status),
                      step.status === "thinking" && "animate-pulse",
                      isPast && "bg-zinc-800/30",
                      isActive && step.status === "thinking" && "bg-blue-500/5",
                      isActive && step.status === "awaiting_approval" && "bg-yellow-500/5"
                    )}>
                      
                      {/* Agent Icon */}
                      <div className={cn(
                        "w-12 h-12 rounded-full border-2 flex items-center justify-center relative transition-all",
                        getStatusColor(step.status),
                        step.status === "thinking" && "animate-pulse ring-2 ring-blue-500/30",
                        step.status === "awaiting_approval" && "ring-2 ring-yellow-500/30"
                      )}>
                        <IconComponent className="w-5 h-5" />
                        
                        {/* Status Badge */}
                        {step.status === "done" && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {step.status === "error" && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                            <X className="w-3 h-3 text-white" />
                          </div>
                        )}
                        {step.status === "thinking" && (
                          <div className="absolute inset-0 rounded-full border-2 border-blue-500/50 animate-spin border-t-transparent" />
                        )}
                      </div>

                      {/* Agent Info */}
                      <div className="flex-1">
                        <div className="font-medium text-white text-sm">{step.name}</div>
                        <div className="text-xs text-zinc-400 capitalize">{step.status.replace("_", " ")}</div>
                        {step.context && step.context.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {step.context.map((ctx, i) => (
                              <span key={i} className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                                {ctx}
                              </span>
                            ))}
                          </div>
                        )}
                        {step.summary && (
                          <div className="text-xs text-zinc-500 mt-1 line-clamp-2">{step.summary}</div>
                        )}
                      </div>

                      {/* Step Number */}
                      <div className="text-xs text-zinc-500 font-mono">
                        {index + 1}
                      </div>
                    </div>

                    {/* Connection Line */}
                    {index < steps.length - 1 && (
                      <div className="absolute left-10 top-20 w-0.5 h-4 bg-gradient-to-b from-transparent transition-colors duration-500"
                        style={{
                          backgroundColor: isConnected ? '#3b82f6' : '#52525b'
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Active Step Panel */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {currentStep ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Active Step Header */}
                <div className="mb-4 flex-shrink-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "w-10 h-10 rounded-full border-2 flex items-center justify-center",
                      getStatusColor(currentStep.status)
                    )}>
                      {React.createElement(getAgentIcon(currentStep.role), { className: "w-5 h-5" })}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{currentStep.name}</h3>
                      <p className="text-sm text-zinc-400 capitalize">{currentStep.status.replace("_", " ")}</p>
                      {currentStep.context && currentStep.context.length > 0 && (
                        <div className="flex gap-2 mt-1">
                          {currentStep.context.map((ctx, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                              {ctx}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Output Area */}
                <div className="flex-1 bg-zinc-800/50 rounded-xl border border-zinc-700/50 overflow-hidden flex flex-col min-h-0">
                  
                  {/* Status Bar */}
                  <div className="bg-zinc-900/50 border-b border-zinc-700/50 px-4 py-3 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-zinc-400">
                        {currentStep.status === "thinking" && "Processing your request..."}
                        {currentStep.status === "awaiting_approval" && "Review and approve to continue"}
                        {currentStep.status === "done" && "Analysis complete"}
                      </div>
                      
                      {/* Context Chips */}
                      {currentStep.context && currentStep.context.length > 0 && (
                        <div className="flex gap-1">
                          {currentStep.context.map((ctx, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                              {ctx}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content - Scrollable Area */}
                  <div 
                    className="flex-1 p-4 overflow-y-auto overscroll-contain min-h-0"
                    style={{ maxHeight: '100%' }}
                    onWheel={(e) => {
                      e.stopPropagation()
                      // Allow normal scrolling within this container
                    }}
                    onTouchMove={(e) => e.stopPropagation()}
                  >
                    {currentStep.status === "thinking" && (
                      <div className="flex items-center justify-center h-32">
                        <div className="text-center">
                          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                          <p className="text-zinc-400">Agent is thinking...</p>
                        </div>
                      </div>
                    )}

                    {currentStep.output && (
                      <div className="space-y-4">
                        <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-700/30">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-white">Agent Output</h4>
                            {currentStep.context && currentStep.context.length > 0 && (
                              <div className="flex gap-1">
                                {currentStep.context.map((ctx, i) => (
                                  <span key={i} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                                    {ctx}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {editingStep === currentStep.id ? (
                            <div className="space-y-3">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full h-64 bg-zinc-800 border border-zinc-600 rounded-lg p-3 text-zinc-300 text-sm resize-none focus:outline-none focus:border-blue-500 font-mono"
                                placeholder="Edit the output..."
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={saveEdit}
                                  className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-md text-sm hover:bg-green-500/30 transition-all"
                                >
                                  Save Changes
                                </button>
                                <button
                                  onClick={() => setEditingStep(null)}
                                  className="px-3 py-1 bg-zinc-700/50 text-zinc-400 border border-zinc-600/30 rounded-md text-sm hover:bg-zinc-600/50 transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed prose prose-invert max-w-none">
                              {currentStep.output}
                            </div>
                          )}
                        </div>

                        {currentStep.summary && currentStep.summary !== currentStep.output && (
                          <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-700/20">
                            <h4 className="font-medium text-white text-xs mb-1">Quick Summary</h4>
                            <p className="text-zinc-400 text-xs">{currentStep.summary}</p>
                          </div>
                        )}

                        {currentStep.error && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                            <h4 className="font-medium text-red-400 mb-2">Error</h4>
                            <p className="text-red-300 text-sm">{currentStep.error}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Controls (Manual Mode) */}
                  {mode === "manual" && currentStep.status === "awaiting_approval" && (
                    <div className="bg-zinc-900/50 border-t border-zinc-700/50 p-4 flex-shrink-0">
                      <div className="flex gap-3">
                        <button
                          onClick={() => onApprove?.(currentStep.id)}
                          className="flex-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg py-2 px-4 hover:bg-green-500/30 transition-all font-medium"
                        >
                          <Check className="w-4 h-4 inline mr-2" />
                          Approve & Continue
                        </button>
                        <button
                          onClick={() => handleEdit(currentStep.id)}
                          className="bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg py-2 px-4 hover:bg-blue-500/30 transition-all"
                        >
                          <Edit className="w-4 h-4 inline mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={() => onRerun?.(currentStep.id)}
                          className="bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg py-2 px-4 hover:bg-orange-500/30 transition-all"
                        >
                          <RotateCcw className="w-4 h-4 inline mr-2" />
                          Rerun
                        </button>
                        {onSkip && (
                          <button
                            onClick={() => onSkip(currentStep.id)}
                            className="bg-zinc-700/50 text-zinc-400 border border-zinc-600/30 rounded-lg py-2 px-4 hover:bg-zinc-600/50 transition-all"
                          >
                            Skip
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-zinc-500">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No active collaboration step</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}