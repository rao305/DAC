"use client"

import { 
  ExternalReview, 
  SOURCE_LABELS, 
  SOURCE_ICONS, 
  STANCE_COLORS, 
  STANCE_LABELS,
  getProviderColor 
} from "@/lib/collaborate-types"

interface ExternalReviewsPanelProps {
  reviews: ExternalReview[]
}

export function ExternalReviewsPanel({ reviews }: ExternalReviewsPanelProps) {
  if (!reviews.length) {
    return (
      <div className="text-center py-8">
        <div className="text-2xl mb-2">🤖</div>
        <p className="text-xs text-muted-foreground">
          No external reviews were required for this query.
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          The internal team report had sufficient confidence.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <span>External reviewers provided critiques of the internal report:</span>
        <div className="flex gap-1">
          {reviews.map(review => (
            <span key={review.id} className="text-lg">
              {SOURCE_ICONS[review.source]}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="flex flex-col rounded-xl border bg-background p-3 text-xs shadow-sm"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span 
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: getProviderColor(rev.model.provider) }}
                />
                <span className="font-medium flex items-center gap-1">
                  <span className="text-sm">{SOURCE_ICONS[rev.source]}</span>
                  {SOURCE_LABELS[rev.source]}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {rev.model.display_name}
                </span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STANCE_COLORS[rev.stance]}`}
              >
                {STANCE_LABELS[rev.stance]}
              </span>
            </div>
            <div className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap leading-snug">
              {rev.content}
            </div>
            <div className="flex items-center justify-between mt-2 text-[9px] text-muted-foreground">
              {rev.latency_ms && (
                <span>
                  {rev.latency_ms < 1000 
                    ? `${Math.round(rev.latency_ms)}ms`
                    : `${(rev.latency_ms / 1000).toFixed(1)}s`
                  }
                </span>
              )}
              {rev.token_usage && (
                <span>
                  {(rev.token_usage.input_tokens + rev.token_usage.output_tokens).toLocaleString()} tokens
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {reviews.length > 0 && (
        <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs">
          <div className="flex items-start gap-2">
            <span className="text-sm">💡</span>
            <div>
              <div className="font-medium text-sky-900 mb-1">How external reviews work:</div>
              <div className="text-sky-800 text-[11px] leading-relaxed">
                Each external model reviewed the compressed internal report and provided specific critiques. 
                The final answer incorporates valid corrections and valuable perspectives from these reviews.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}