"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const steps = [
  "Syncing your models…",
  "Loading routing policies…",
  "Restoring conversation context…",
  "Booting multi-LLM workspace…",
];

export function WorkspaceLoader() {
  return (
    <div className="relative flex h-[calc(100vh-56px)] w-full items-center justify-center overflow-hidden bg-gradient-to-b from-black via-slate-950 to-black">
      <div className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.15),transparent_60%),linear-gradient(to_right,rgba(15,23,42,0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.6)_1px,transparent_1px)] bg-[length:auto,_40px_40px,_40px_40px] opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex flex-col items-center gap-5 rounded-3xl border border-white/10 bg-slate-950/80 px-10 py-8 shadow-2xl shadow-emerald-500/20 backdrop-blur-xl"
      >
        <div className="relative h-20 w-20">
          <motion.div
            className="absolute inset-0 rounded-full border border-emerald-500/40"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-3 rounded-full border border-emerald-400/40"
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
          <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 text-black shadow-lg">
            <Sparkles className="h-7 w-7" />
          </div>

          <motion.span
            className="absolute -top-1 left-1 h-2 w-2 rounded-full bg-emerald-400"
            animate={{ rotate: 360 }}
            style={{ originX: 1.8, originY: 2.7 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <motion.span
            className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-cyan-400"
            animate={{ rotate: -360 }}
            style={{ originX: -1.5, originY: -2.3 }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/80">
            Syntra Workspace
          </p>
          <p className="mt-1 text-base font-medium text-slate-50">
            Loading your workspace…
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Connecting providers and restoring your multi-LLM context.
          </p>
        </div>

        <motion.div
          className="mt-1 flex flex-col gap-1 text-[11px] text-slate-400"
          initial="hidden"
          animate="visible"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step}
              variants={{
                hidden: { opacity: 0, x: 8 },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: { delay: index * 0.2 },
                },
              }}
              className="flex items-center gap-2"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
              <span className="opacity-80">{step}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="mt-4 h-1.5 w-40 overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className="h-full w-1/2 rounded-full bg-gradient-to-r from-emerald-400 to-green-500"
            animate={{ x: ["-50%", "120%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
