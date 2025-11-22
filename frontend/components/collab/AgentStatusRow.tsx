"use client"

import { WorkflowStep } from "@/lib/workflow"
import { Brain, Search, Sparkles, Zap, Wand2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface AgentStatusRowProps {
    steps: WorkflowStep[]
}

const MODEL_ICONS = {
    gpt: Zap,
    gemini: Sparkles,
    perplexity: Search,
    kimi: Brain,
}

const ROLE_LABELS = {
    analyst: "Analyst",
    researcher: "Researcher",
    creator: "Creator",
    critic: "Critic",
    synthesizer: "Synthesizer",
}

export function AgentStatusRow({ steps }: AgentStatusRowProps) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 scrollbar-hide">
            {steps.map((step, index) => {
                const Icon = MODEL_ICONS[step.model] || Wand2
                const isActive = step.status === "running" || step.status === "awaiting_user"
                const isDone = step.status === "done"
                const isError = step.status === "error"
                const isMock = step.metadata?.isMock

                return (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-all",
                            isActive
                                ? "bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                                : isError
                                    ? "bg-red-500/10 border-red-500/50 text-red-400"
                                    : isDone
                                        ? "bg-green-500/10 border-green-500/50 text-green-400"
                                        : "bg-zinc-900/50 border-zinc-800 text-zinc-500"
                        )}
                    >
                        <div className="relative">
                            <Icon className="w-3.5 h-3.5" />
                            {isActive && (
                                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                            )}
                            {isError && (
                                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                            )}
                        </div>
                        <div className="flex flex-col leading-none gap-0.5">
                            <span className="uppercase text-[9px] opacity-70 tracking-wider flex items-center gap-1">
                                {step.model}
                                {isMock && <span className="text-[8px] bg-zinc-800 px-1 rounded text-zinc-400">MOCK</span>}
                            </span>
                            <span>{ROLE_LABELS[step.role]}</span>
                        </div>
                        {step.status === "awaiting_user" && (
                            <span className="ml-1 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                        )}
                    </motion.div>
                )
            })}
        </div>
    )
}
