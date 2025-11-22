"use client"

import { WorkflowStep } from "@/lib/workflow"
import { Brain, Search, Sparkles, Zap, Wand2, Check, RefreshCw, Edit2, XCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useState } from "react"

interface StepCardProps {
    step: WorkflowStep
    index: number
    total: number
    onApprove: (stepId: string, content: string) => void
    onRegenerate: (stepId: string, instructions?: string) => void
    onCancel: () => void
}

const MODEL_ICONS = {
    gpt: Zap,
    gemini: Sparkles,
    perplexity: Search,
    kimi: Brain,
}

const bubbleVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
}

export function StepCard({ step, index, total, onApprove, onRegenerate, onCancel }: StepCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [content, setContent] = useState(step.outputDraft || "")
    const Icon = MODEL_ICONS[step.model] || Wand2
    const isError = step.status === "error"
    const isMock = step.metadata?.isMock === true // Strict check
    const isRunning = step.status === "running"
    const isAwaiting = step.status === "awaiting_user"

    if (step.status === "pending") return null

    return (
        <motion.div
            variants={bubbleVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
                "rounded-2xl bg-[#111214]/50 border border-white/10 px-4 py-3 max-w-[620px] mb-4 transition-all",
                isRunning && "animate-pulse border-white/20",
                isAwaiting && "border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]",
                isError && "border-red-500/30 bg-red-950/10"
            )}
        >
            {/* Header inside the bubble */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-zinc-400">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium capitalize">{step.role}</span>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="text-xs text-zinc-500 uppercase">{step.model}</span>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="text-xs text-zinc-500">Step {index + 1} of {total}</span>

                    {isMock && (
                        <span className="ml-2 text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-700">
                            MOCK
                        </span>
                    )}

                    {isError && (
                        <span className="ml-2 text-[10px] bg-red-900/30 px-1.5 py-0.5 rounded text-red-400 border border-red-800/50">
                            ERROR
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="text-sm text-zinc-300 leading-relaxed">
                {isRunning ? (
                    <div className="flex items-center gap-2 text-zinc-500 italic py-1">
                        <span className="animate-pulse">Thinking...</span>
                    </div>
                ) : isError ? (
                    <div className="flex flex-col gap-2 text-red-400 bg-red-950/10 p-3 rounded-lg border border-red-900/20">
                        <div className="flex items-center gap-2 font-medium text-xs uppercase tracking-wider">
                            <AlertTriangle className="w-3 h-3" />
                            Provider Error
                        </div>
                        <p className="text-xs font-mono opacity-90">{step.error?.message || "An unknown error occurred."}</p>
                    </div>
                ) : isEditing ? (
                    <div className="mt-2">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-[200px] bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-300 font-mono text-xs focus:outline-none focus:border-blue-500/50 resize-none"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onApprove(step.id, content)
                                    setIsEditing(false)
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium"
                            >
                                Save & Approve
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent pr-2">
                        {step.outputDraft || step.outputFinal}
                    </div>
                )}
            </div>

            {/* Actions for Awaiting User */}
            {isAwaiting && !isEditing && (
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-white/5">
                    <button
                        onClick={() => onRegenerate(step.id)}
                        className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-200 transition-colors"
                        title="Regenerate"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-200 transition-colors"
                        title="Edit"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="h-4 w-px bg-zinc-800 mx-1" />
                    <button
                        onClick={onCancel}
                        className="px-3 py-1.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-md text-xs font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onApprove(step.id, content)}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5"
                    >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                    </button>
                </div>
            )}
        </motion.div>
    )
}
