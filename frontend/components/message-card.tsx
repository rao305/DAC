'use client'

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSSEChat } from "@/hooks/use-sse-chat";

interface MessageCardProps {
  onSend?: (payload: any) => void;
  defaultPayload?: any;
}

/**
 * MessageCard - Streaming chat message component with Phase 2 perf features
 *
 * Features:
 * - First-token skeleton (shows until TTFT)
 * - TTFT badge (time to first token in ms)
 * - Cache hit indicator
 * - Cancel button (<300ms responsiveness via AbortController)
 * - Streaming content display
 */
export function MessageCard({ onSend, defaultPayload }: MessageCardProps) {
  const { state, start, cancel } = useSSEChat();

  const handleSend = () => {
    const payload = defaultPayload || { prompt: 'Hello' };
    start(payload);
    onSend?.(payload);
  };

  return (
    <div className="rounded-2xl border p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {state.cache_hit && (
            <Badge variant="secondary" className="text-xs">
              cache_hit
            </Badge>
          )}
          {typeof state.ttft_ms === 'number' && (
            <Badge variant="outline" className="text-xs">
              TTFT {state.ttft_ms}ms
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {!state.loading ? (
            <Button size="sm" onClick={handleSend}>
              Send
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={cancel}>
              Stop
            </Button>
          )}
        </div>
      </div>

      {/* Skeleton until the first delta */}
      {state.loading && !state.ttft_ms ? (
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
      ) : null}

      {/* Content display */}
      {state.content && (
        <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm">
          {state.content}
        </div>
      )}

      {/* Status indicators */}
      {state.cancelled && (
        <p className="text-sm text-muted-foreground italic">
          cancelled
        </p>
      )}
      {state.error && (
        <p className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </div>
  );
}
