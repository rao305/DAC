"use client"

import { InternalPipeline, ROLE_LABELS, ROLE_ICONS, getProviderColor } from "@/lib/collaborate-types"

interface InternalPipelineTimelineProps {
  pipeline: InternalPipeline
}

export function InternalPipelineTimeline({ pipeline }: InternalPipelineTimelineProps) {
  return (
    <div className="space-y-4">
      {pipeline.stages.map((stage, idx) => (
        <div key={stage.id} className="flex gap-3">
          {/* timeline line + dot */}
          <div className="flex flex-col items-center">
            <div className="h-3 w-[2px] bg-border" />
            <div 
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: getProviderColor(stage.model.provider) }}
            />
            {idx < pipeline.stages.length - 1 && (
              <div className="flex-1 w-[2px] bg-border mt-1" style={{ minHeight: "20px" }} />
            )}
          </div>

          {/* card */}
          <div className="flex-1 rounded-xl border bg-background p-3 text-xs shadow-sm">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="text-sm">
                    {ROLE_ICONS[stage.role]}
                  </span>
                  <span 
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase text-white"
                    style={{ backgroundColor: getProviderColor(stage.model.provider) }}
                  >
                    {ROLE_LABELS[stage.role]}
                  </span>
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {stage.model.display_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {stage.used_in_final_answer && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                    Used in final answer
                  </span>
                )}
                {stage.latency_ms && (
                  <span className="text-[10px] text-muted-foreground">
                    {stage.latency_ms < 1000 
                      ? `${Math.round(stage.latency_ms)}ms`
                      : `${(stage.latency_ms / 1000).toFixed(1)}s`
                    }
                  </span>
                )}
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto whitespace-pre-wrap text-[11px] leading-snug text-slate-800 dark:text-slate-100">
              {stage.content}
            </div>
            {stage.token_usage && (
              <div className="mt-2 text-[9px] text-muted-foreground">
                {(stage.token_usage.input_tokens + stage.token_usage.output_tokens).toLocaleString()} tokens
              </div>
            )}
          </div>
        </div>
      ))}

      {pipeline.compressed_report && (
        <div className="ml-6 mt-2 rounded-xl border border-dashed bg-muted/40 p-3 text-[11px]">
          <div className="mb-1 flex items-center justify-between">
            <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-50">
              Compressed Report
            </span>
            <span className="text-[10px] text-muted-foreground">
              {pipeline.compressed_report.model.display_name}
            </span>
          </div>
          <div className="max-h-32 overflow-y-auto whitespace-pre-wrap leading-snug">
            {pipeline.compressed_report.content}
          </div>
          <div className="mt-1 text-[9px] text-muted-foreground">
            Sent to external reviewers for critique
          </div>
        </div>
      )}
    </div>
  )
}