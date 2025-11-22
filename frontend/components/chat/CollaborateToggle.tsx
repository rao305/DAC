"use client"

import { Network } from "lucide-react"
import { cn } from "@/lib/utils"

interface CollaborateToggleProps {
    isCollaborateMode: boolean
    toggleCollaborateMode: () => void
    mode: "auto" | "manual"
    setMode: (mode: "auto" | "manual") => void
}

export function CollaborateToggle({
    isCollaborateMode,
    toggleCollaborateMode,
    mode,
    setMode
}: CollaborateToggleProps) {
    return (
        <div className="flex items-center gap-2">
            <button
                onClick={toggleCollaborateMode}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200",
                    isCollaborateMode
                        ? "bg-blue-500/10 border-blue-500/50 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800"
                )}
            >
                <Network className="w-4 h-4" />
                <span className="text-xs font-medium">Collaborate</span>
            </button>

            {isCollaborateMode && (
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 animate-in fade-in slide-in-from-left-2 duration-200">
                    <button
                        onClick={() => setMode("auto")}
                        className={cn(
                            "px-2 py-1 rounded-md text-[10px] font-medium transition-colors",
                            mode === "auto"
                                ? "bg-zinc-800 text-zinc-200"
                                : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        Auto
                    </button>
                    <button
                        onClick={() => setMode("manual")}
                        className={cn(
                            "px-2 py-1 rounded-md text-[10px] font-medium transition-colors",
                            mode === "manual"
                                ? "bg-zinc-800 text-zinc-200"
                                : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        Manual
                    </button>
                </div>
            )}
        </div>
    )
}
