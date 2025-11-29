"use client"

/**
 * Dynamic Collaboration Panel
 * 
 * Displays the orchestrator's plan, current progress, and step results
 * for dynamic collaboration runs.
 */

import { motion, AnimatePresence } from "framer-motion"
import { 
  Brain, 
  Search, 
  Sparkles, 
  Zap, 
  Wand2, 
  Check, 
  Loader2, 
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Target
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import {
  CollaborationPlan,
  StepResult,
  CollabRole,
  COLLAB_ROLE_DISPLAY,
  getRoleColor,
  formatExecutionTime,
  getProviderFromModelId
} from "@/lib/orchestrator-types"

interface DynamicCollaborationPanelProps {
  plan: CollaborationPlan | null
  stepResults: StepResult[]
  currentStepIndex: number | null
  isPlanning: boolean
  totalTimeMs: number
  error: string | null
}

// Provider icons
const PROVIDER_ICONS: Record<string, typeof Zap> = {
  openai: Zap,
  gemini: Sparkles,
  perplexity: Search,
  kimi: Brain,
}

function getProviderIcon(modelId: string) {
  const provider = getProviderFromModelId(modelId)
  return PROVIDER_ICONS[provider] || Wand2
}

// Step status indicator component
function StepStatusIndicator({ 
  step, 
  result, 
  isActive, 
  isCurrent 
}: { 
  step: { step_index: number; role: CollabRole; model_id: string; purpose: string }
  result?: StepResult
  isActive: boolean
  isCurrent: boolean
}) {
  const roleInfo = COLLAB_ROLE_DISPLAY[step.role]
  const Icon = getProviderIcon(step.model_id)
  const roleColor = getRoleColor(step.role)
  
  const isCompleted = result?.success === true
  const hasError = result?.success === false
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: step.step_index * 0.1 }}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all",
        isCurrent && "bg-blue-500/10 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.15)]",
        isCompleted && !isCurrent && "bg-green-500/5 border-green-500/30",
        hasError && "bg-red-500/5 border-red-500/30",
        !isCurrent && !isCompleted && !hasError && "bg-zinc-900/30 border-zinc-800/50"
      )}
    >
      {/* Step number */}
      <div 
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
          isCurrent && "bg-blue-500/20 text-blue-400",
          isCompleted && !isCurrent && "bg-green-500/20 text-green-400",
          hasError && "bg-red-500/20 text-red-400",
          !isCurrent && !isCompleted && !hasError && "bg-zinc-800 text-zinc-500"
        )}
      >
        {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.step_index}
      </div>
      
      {/* Role & Model info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{roleInfo.icon}</span>
          <span className="font-medium text-sm text-zinc-200">{roleInfo.name}</span>
          {isCurrent && (
            <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Icon className="w-3 h-3 text-zinc-500" />
          <span className="text-xs text-zinc-500">{step.model_id}</span>
        </div>
      </div>
      
      {/* Timing */}
      {result && (
        <div className="flex items-center gap-1 text-xs text-zinc-500">
          <Clock className="w-3 h-3" />
          {formatExecutionTime(result.execution_time_ms)}
        </div>
      )}
      
      {/* Error indicator */}
      {hasError && (
        <AlertCircle className="w-4 h-4 text-red-400" />
      )}
    </motion.div>
  )
}

// Step result card with expandable content
function StepResultCard({ result }: { result: StepResult }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const roleInfo = COLLAB_ROLE_DISPLAY[result.role]
  const Icon = getProviderIcon(result.model_id)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border overflow-hidden",
        result.success 
          ? "bg-[#111214]/50 border-zinc-800" 
          : "bg-red-950/20 border-red-900/30"
      )}
    >
      {/* Header - clickable to expand */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-900/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{roleInfo.icon}</span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-zinc-200">{roleInfo.name}</span>
              <span className="text-xs text-zinc-500">•</span>
              <span className="text-xs text-zinc-500">{result.model_name}</span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">{result.purpose}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">
            {formatExecutionTime(result.execution_time_ms)}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-500" />
          )}
        </div>
      </button>
      
      {/* Content - expandable */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-zinc-800">
              {result.error ? (
                <div className="mt-3 p-3 bg-red-950/30 rounded-lg border border-red-900/30">
                  <p className="text-sm text-red-400">{result.error}</p>
                </div>
              ) : (
                <div className="mt-3 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                  <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">
                    {result.content}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function DynamicCollaborationPanel({
  plan,
  stepResults,
  currentStepIndex,
  isPlanning,
  totalTimeMs,
  error
}: DynamicCollaborationPanelProps) {
  // Calculate progress
  const totalSteps = plan?.steps.length || 0
  const completedSteps = stepResults.length
  const progressPercent = totalSteps > 0 
    ? Math.round((completedSteps / totalSteps) * 100) 
    : 0
  
  return (
    <div className="flex flex-col h-full">
      {/* Header with plan summary */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" />
            Collaboration Pipeline
          </h3>
          {totalTimeMs > 0 && (
            <span className="text-xs text-zinc-500">
              Total: {formatExecutionTime(totalTimeMs)}
            </span>
          )}
        </div>
        
        {plan && (
          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
            {plan.pipeline_summary}
          </p>
        )}
        
        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-zinc-600">
            {completedSteps}/{totalSteps} steps
          </span>
          <span className="text-[10px] text-zinc-600">
            {progressPercent}%
          </span>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Planning state */}
        {isPlanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-8"
          >
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 rounded-xl border border-blue-500/30">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-sm text-blue-300">
                Orchestrator planning collaboration...
              </span>
            </div>
          </motion.div>
        )}
        
        {/* Error state */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-950/30 rounded-xl border border-red-900/30"
          >
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium text-sm">Collaboration Error</span>
            </div>
            <p className="text-xs text-red-300/80">{error}</p>
          </motion.div>
        )}
        
        {/* Step indicators */}
        {plan && !isPlanning && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
              Pipeline Steps
            </h4>
            <div className="space-y-2">
              {plan.steps.map((step, index) => {
                const result = stepResults.find(r => r.step_index === step.step_index)
                const isCurrent = currentStepIndex === step.step_index
                const isActive = isCurrent || (result !== undefined)
                
                return (
                  <StepStatusIndicator
                    key={step.step_index}
                    step={step}
                    result={result}
                    isActive={isActive}
                    isCurrent={isCurrent}
                  />
                )
              })}
            </div>
          </div>
        )}
        
        {/* Step results (expandable) */}
        {stepResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
              Step Outputs
            </h4>
            <div className="space-y-2">
              {stepResults.map((result) => (
                <StepResultCard key={result.step_index} result={result} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DynamicCollaborationPanel






