"use client";

import * as React from "react";
import { motion } from "framer-motion";

interface DisambiguationChipsProps {
  question: string;
  options: string[];
  onSelect: (option: string) => void;
  pronoun?: string;
}

export function DisambiguationChips({
  question,
  options,
  onSelect,
  pronoun,
}: DisambiguationChipsProps) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg border border-white/10 bg-white/5">
      <p className="text-sm text-white/90 font-medium">{question}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => (
          <motion.button
            key={option}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(option)}
            className="px-4 py-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 hover:border-emerald-500/50 transition-colors text-sm font-medium text-white/90"
          >
            {option}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

