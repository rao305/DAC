"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Activity,
  Layers,
  Target,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip } from '@/components/ui/tooltip'

interface ModelExecution {
  model: string
  role: string
  status: 'running' | 'completed' | 'error'
  progress: number
  keyInsight: string
  confidence: number
  contradictions: number
  citations: number
  executionTime: number
  tokensUsed: number
}

interface ConflictResolution {
  id: string
  type: 'factual' | 'methodological' | 'interpretive'
  severity: number
  status: 'unresolved' | 'investigating' | 'resolved'
  resolution: string
  confidence: number
}

interface SwarmMetrics {
  totalModels: number
  activeModels: number
  convergenceScore: number
  totalExecutionTime: number
  avgConfidence: number
  insightsGenerated: number
  conflictsResolved: number
  memoryUpdates: number
}

interface MultiPerspectivePanelProps {
  executions: ModelExecution[]
  conflicts: ConflictResolution[]
  metrics: SwarmMetrics
  isVisible: boolean
  onToggle: () => void
}

const ModelStatusIcon = ({ status }: { status: ModelExecution['status'] }) => {
  switch (status) {
    case 'running':
      return <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
        <Activity className="w-4 h-4 text-blue-400" />
      </motion.div>
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-emerald-400" />
    case 'error':
      return <XCircle className="w-4 h-4 text-red-400" />
  }
}

const ConfidenceMeter = ({ confidence, size = 'sm' }: { confidence: number, size?: 'sm' | 'lg' }) => {
  const getColor = (conf: number) => {
    if (conf >= 0.8) return 'text-emerald-400 bg-emerald-400/20'
    if (conf >= 0.6) return 'text-yellow-400 bg-yellow-400/20'
    return 'text-red-400 bg-red-400/20'
  }

  const sizeClasses = size === 'lg' ? 'w-16 h-2' : 'w-12 h-1.5'
  
  return (
    <div className="flex items-center gap-2">
      <div className={cn('bg-zinc-800 rounded-full overflow-hidden', sizeClasses)}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidence * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', getColor(confidence))}
        />
      </div>
      <span className={cn('text-xs font-medium', getColor(confidence))}>
        {(confidence * 100).toFixed(0)}%
      </span>
    </div>
  )
}

const ModelCard = ({ execution }: { execution: ModelExecution }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <motion.div
      layout
      className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ModelStatusIcon status={execution.status} />
          <div>
            <div className="text-sm font-medium text-zinc-100">{execution.model}</div>
            <div className="text-xs text-zinc-400">{execution.role}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ConfidenceMeter confidence={execution.confidence} />
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {execution.status === 'running' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          <Progress value={execution.progress} className="h-1.5" />
          <div className="text-xs text-zinc-400">
            Processing {execution.role.toLowerCase()}...
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 pt-2 border-t border-zinc-800"
          >
            <div className="text-xs text-zinc-300">
              <strong>Key Insight:</strong> {execution.keyInsight}
            </div>
            
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-orange-400" />
                <span className="text-zinc-400">{execution.contradictions} conflicts</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3 text-blue-400" />
                <span className="text-zinc-400">{execution.citations} citations</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-400" />
                <span className="text-zinc-400">{execution.executionTime}ms</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const ConflictCard = ({ conflict }: { conflict: ConflictResolution }) => {
  const getSeverityColor = (severity: number) => {
    if (severity >= 0.7) return 'text-red-400 border-red-400/30'
    if (severity >= 0.4) return 'text-orange-400 border-orange-400/30'
    return 'text-yellow-400 border-yellow-400/30'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-emerald-400 bg-emerald-400/10'
      case 'investigating': return 'text-blue-400 bg-blue-400/10'
      default: return 'text-orange-400 bg-orange-400/10'
    }
  }

  return (
    <div className={cn("border rounded-lg p-3 space-y-2", getSeverityColor(conflict.severity))}>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={getStatusColor(conflict.status)}>
          {conflict.status}
        </Badge>
        <div className="text-xs text-zinc-400">
          {conflict.type} • severity {(conflict.severity * 100).toFixed(0)}%
        </div>
      </div>
      
      {conflict.status === 'resolved' && (
        <div className="text-xs text-zinc-300">
          <strong>Resolution:</strong> {conflict.resolution}
        </div>
      )}
      
      <ConfidenceMeter confidence={conflict.confidence} size="sm" />
    </div>
  )
}

const MetricsGrid = ({ metrics }: { metrics: SwarmMetrics }) => {
  const metricCards = [
    {
      label: 'Convergence',
      value: `${(metrics.convergenceScore * 100).toFixed(0)}%`,
      icon: Target,
      color: 'text-emerald-400',
      description: 'How well models agreed'
    },
    {
      label: 'Avg Confidence', 
      value: `${(metrics.avgConfidence * 100).toFixed(0)}%`,
      icon: TrendingUp,
      color: 'text-blue-400',
      description: 'Average model confidence'
    },
    {
      label: 'Execution Time',
      value: `${(metrics.totalExecutionTime / 1000).toFixed(1)}s`,
      icon: Clock,
      color: 'text-purple-400',
      description: 'Total parallel execution time'
    },
    {
      label: 'Insights',
      value: metrics.insightsGenerated,
      icon: Brain,
      color: 'text-orange-400',
      description: 'New insights generated'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metricCards.map((metric, index) => (
        <Tooltip key={index} content={metric.description}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-zinc-900/30 border border-zinc-800 rounded-lg p-3 space-y-1"
          >
            <div className="flex items-center justify-between">
              <metric.icon className={cn('w-4 h-4', metric.color)} />
              <div className={cn('text-sm font-mono font-bold', metric.color)}>
                {metric.value}
              </div>
            </div>
            <div className="text-xs text-zinc-400">{metric.label}</div>
          </motion.div>
        </Tooltip>
      ))}
    </div>
  )
}

export const MultiPerspectivePanel: React.FC<MultiPerspectivePanelProps> = ({
  executions,
  conflicts,
  metrics,
  isVisible,
  onToggle
}) => {
  const [activeTab, setActiveTab] = useState<'models' | 'conflicts' | 'metrics'>('models')

  const runningModels = executions.filter(e => e.status === 'running')
  const completedModels = executions.filter(e => e.status === 'completed')
  const activeConflicts = conflicts.filter(c => c.status !== 'resolved')

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
          isVisible 
            ? "bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800"
        )}
      >
        <Layers className="w-4 h-4" />
        <span>Multi-Perspective View</span>
        {runningModels.length > 0 && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 bg-blue-400 rounded-full"
          />
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 right-0 w-96 max-h-96 overflow-hidden bg-zinc-950/95 border border-zinc-800 rounded-lg shadow-xl backdrop-blur-sm z-50"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-zinc-100">
                  AI Intelligence Orchestrator
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs text-zinc-400">
                      {metrics.activeModels}/{metrics.totalModels} active
                    </span>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-1 bg-zinc-900/50 rounded-lg p-0.5">
                {[
                  { key: 'models', label: 'Models', count: executions.length },
                  { key: 'conflicts', label: 'Conflicts', count: activeConflicts.length },
                  { key: 'metrics', label: 'Metrics' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                      activeTab === tab.key
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    {tab.label}
                    {tab.count !== undefined && (
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                        {tab.count}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-80 overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeTab === 'models' && (
                  <motion.div
                    key="models"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {executions.length === 0 ? (
                      <div className="text-center py-6 text-zinc-400">
                        <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <div className="text-sm">No active models</div>
                      </div>
                    ) : (
                      <>
                        {runningModels.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Activity className="w-3 h-3 text-blue-400" />
                              <span className="text-xs font-medium text-zinc-300">Running</span>
                            </div>
                            {runningModels.map((execution, index) => (
                              <ModelCard key={`running-${index}`} execution={execution} />
                            ))}
                          </div>
                        )}

                        {completedModels.length > 0 && (
                          <div className="space-y-2">
                            {runningModels.length > 0 && <div className="border-t border-zinc-800 my-3" />}
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              <span className="text-xs font-medium text-zinc-300">Completed</span>
                            </div>
                            {completedModels.map((execution, index) => (
                              <ModelCard key={`completed-${index}`} execution={execution} />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}

                {activeTab === 'conflicts' && (
                  <motion.div
                    key="conflicts"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {conflicts.length === 0 ? (
                      <div className="text-center py-6 text-zinc-400">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <div className="text-sm">No conflicts detected</div>
                      </div>
                    ) : (
                      conflicts.map((conflict, index) => (
                        <ConflictCard key={index} conflict={conflict} />
                      ))
                    )}
                  </motion.div>
                )}

                {activeTab === 'metrics' && (
                  <motion.div
                    key="metrics"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <MetricsGrid metrics={metrics} />
                    
                    {/* Additional Metrics */}
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-zinc-300">Performance</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Conflicts Resolved:</span>
                          <span className="text-zinc-300">{metrics.conflictsResolved}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Memory Updates:</span>
                          <span className="text-zinc-300">{metrics.memoryUpdates}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}