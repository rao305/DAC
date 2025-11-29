"use client"

import { CollaborateResponse, summarizeCollaboration } from "@/lib/collaborate-types"
import { FinalAnswerCard } from "./FinalAnswerCard"
import { InternalPipelineTimeline } from "./InternalPipelineTimeline"
import { ExternalReviewsPanel } from "./ExternalReviewsPanel"

interface CollaborateResultProps {
  data: CollaborateResponse
}

export function CollaborateResult({ data }: CollaborateResultProps) {
  const { final_answer, internal_pipeline, external_reviews, meta } = data
  const summary = summarizeCollaboration(data)

  return (
    <div className="space-y-6">
      {/* Final Answer */}
      <FinalAnswerCard finalAnswer={final_answer} meta={meta} />

      {/* Summary Stats */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <div className="flex items-center gap-1">
          <span className="font-medium text-slate-900 dark:text-slate-100">{summary.total_models}</span>
          <span>models used</span>
        </div>
        <div className="w-px h-3 bg-border" />
        <div className="flex items-center gap-1">
          <span className="font-medium text-slate-900 dark:text-slate-100">{summary.reviews_count}</span>
          <span>external reviews</span>
        </div>
        <div className="w-px h-3 bg-border" />
        <div className="flex items-center gap-1">
          <span className="font-medium text-slate-900 dark:text-slate-100">{summary.total_time}</span>
          <span>total time</span>
        </div>
      </div>

      {/* Accordion / tabs for details */}
      <details className="group rounded-xl border bg-muted/40 p-4">
        <summary className="flex cursor-pointer items-center justify-between text-sm font-medium list-none">
          <span className="flex items-center gap-2">
            <span>🔄</span>
            Internal pipeline (Analyst → Researcher → Creator → Critic → Report)
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground group-open:hidden">
              Show {internal_pipeline.stages.length} steps
            </span>
            <span className="hidden text-xs text-muted-foreground group-open:inline">
              Hide steps
            </span>
            <svg
              className="w-4 h-4 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </summary>
        <div className="mt-4">
          <InternalPipelineTimeline pipeline={internal_pipeline} />
        </div>
      </details>

      {external_reviews.length > 0 && (
        <details className="group rounded-xl border bg-muted/40 p-4">
          <summary className="flex cursor-pointer items-center justify-between text-sm font-medium list-none">
            <span className="flex items-center gap-2">
              <span>👥</span>
              Multi-model reviews (Perplexity, Gemini, GPT, Kimi, OpenRouter)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground group-open:hidden">
                Show {external_reviews.length} reviews
              </span>
              <span className="hidden text-xs text-muted-foreground group-open:inline">
                Hide reviews
              </span>
              <svg
                className="w-4 h-4 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </summary>
          <div className="mt-4">
            <ExternalReviewsPanel reviews={external_reviews} />
          </div>
        </details>
      )}
    </div>
  )
}