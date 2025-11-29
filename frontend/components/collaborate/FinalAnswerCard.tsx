"use client"

import { FinalAnswer, CollaborateRunMeta } from "@/lib/collaborate-types"

interface FinalAnswerCardProps {
  finalAnswer: FinalAnswer
  meta: CollaborateRunMeta
}

export function FinalAnswerCard({ finalAnswer, meta }: FinalAnswerCardProps) {
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Collaborate
            </span>
            <span className="text-xs text-muted-foreground">
              Synthesized by {finalAnswer.model.display_name}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {finalAnswer.explanation?.external_reviews_considered && (
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-700">
              {finalAnswer.explanation.external_reviews_considered} expert reviews used
            </span>
          )}
          {finalAnswer.explanation?.confidence_level && (
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-700">
              Confidence: {finalAnswer.explanation.confidence_level}
            </span>
          )}
        </div>
      </div>

      <div className="prose prose-sm max-w-none dark:prose-invert">
        {/* You can render markdown here if you store it that way */}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {finalAnswer.content}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          Combined answer from internal pipeline + multi-model reviewers.
        </span>
        <span>
          Finished at {new Date(meta.finished_at).toLocaleTimeString()}
        </span>
      </div>
    </div>
  )
}