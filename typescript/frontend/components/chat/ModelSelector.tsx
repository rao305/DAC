"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Brain, Eye } from "lucide-react";
import { MODEL_OPTIONS, ModelId, getModelById } from "./modelOptions";

interface ModelSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    anchorWidth?: number;
    currentModelId: ModelId;
    onModelChange: (modelId: ModelId) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
    isOpen,
    onClose,
    anchorWidth,
    currentModelId,
    onModelChange,
}) => {
    const [query, setQuery] = useState("");
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    const filteredModels = MODEL_OPTIONS.filter((model) =>
        model.name.toLowerCase().includes(query.toLowerCase())
    );

    const current = getModelById(currentModelId);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={containerRef}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 4, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="absolute bottom-full mb-2 right-0 z-30"
                    style={{ minWidth: anchorWidth ?? 320, maxWidth: 360 }}
                >
                    <div className="rounded-2xl border border-white/10 bg-[#111111]/95 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.65)] overflow-hidden">
                        {/* Header / current */}
                        <div className="px-4 pt-3 pb-2 border-b border-white/5">
                            <div className="text-xs text-white/50 mb-1">
                                Model selection
                            </div>
                            <div className="flex items-center gap-2 text-sm text-white">
                                <span className="inline-flex items-center justify-center rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-[.16em] text-white/60">
                                    Auto
                                </span>
                                <span className="font-medium">{current.name}</span>
                            </div>
                        </div>

                        {/* Search bar */}
                        <div className="px-3 pt-2 pb-3 border-b border-white/5">
                            <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white/60">
                                <Search className="h-3.5 w-3.5 shrink-0" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search models..."
                                    className="bg-transparent outline-none text-[13px] text-white placeholder:text-white/30 flex-1"
                                />
                            </div>
                        </div>

                        {/* Model list */}
                        <div className="max-h-72 overflow-y-auto py-2">
                            <div className="px-4 pb-1 text-[11px] font-medium text-white/45 uppercase tracking-[.18em]">
                                Auto
                            </div>
                            {filteredModels.map((model) => {
                                const isActive = model.id === currentModelId;
                                return (
                                    <button
                                        key={model.id}
                                        type="button"
                                        onClick={() => {
                                            onModelChange(model.id);
                                            onClose();
                                        }}
                                        className={`w-full text-left px-3 py-2.5 flex items-center gap-3 text-[13px] transition-colors duration-150 ${isActive ? "bg-white/8" : "hover:bg-white/4"
                                            }`}
                                    >
                                        <div className="h-7 w-7 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-[11px] font-semibold text-white/90">
                                            {model.provider === 'kimi' ? 'K' :
                                                model.provider === 'google' ? 'G' :
                                                    model.provider === 'openai' ? 'O' : 'P'}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm text-white font-medium">
                                                    {model.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-white/45">
                                                <span className="capitalize">{model.provider}</span>
                                                <span className="inline-flex items-center gap-1">
                                                    {model.thinking && (
                                                        <span className="inline-flex items-center gap-0.5">
                                                            <Brain className="h-3 w-3" />
                                                        </span>
                                                    )}
                                                    {model.vision && (
                                                        <span className="inline-flex items-center gap-0.5">
                                                            <Eye className="h-3 w-3" />
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                            {filteredModels.length === 0 && (
                                <div className="px-4 py-6 text-center text-xs text-white/40">
                                    No models match "{query}".
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
