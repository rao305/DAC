// frontend/components/ModelSwitchIndicator.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';

type ModelSwitchIndicatorProps = {
    activeModel: string;        // e.g. "GPT-4.1"
    activeProvider: string;     // e.g. "OpenAI"
    phase: 'planning' | 'primary' | 'collab' | 'synthesis';
};

const phaseLabels: Record<ModelSwitchIndicatorProps['phase'], string> = {
    planning: 'Planning',
    primary: 'Primary Response',
    collab: 'Multi-Model Collaboration',
    synthesis: 'Synthesizing Final Answer',
};

export function ModelSwitchIndicator({ activeModel, activeProvider, phase }: ModelSwitchIndicatorProps) {
    return (
        <div className="flex items-center gap-3 rounded-2xl bg-slate-900/70 border border-slate-700/70 px-4 py-2 shadow-lg backdrop-blur">
            <div className="relative h-3 w-3">
                <motion.span
                    className="absolute inset-0 rounded-full bg-emerald-400 shadow-lg"
                    animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                />
            </div>

            <div className="flex flex-col leading-tight">
                <span className="text-xs uppercase tracking-wide text-slate-400">
                    DAC Routing · {phaseLabels[phase]}
                </span>
                <AnimatePresence mode="wait">
                    <motion.span
                        key={activeModel + activeProvider}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                        className="text-xs text-slate-200"
                    >
                        {activeProvider} · <span className="font-medium text-emerald-300">{activeModel}</span>
                    </motion.span>
                </AnimatePresence>
            </div>
        </div>
    );
}
