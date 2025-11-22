#!/bin/bash
# Smoke test: verify first bytes arrive immediately
set -e

# Provider switching support
: "${TTFT_PROVIDER:=perplexity}"
: "${TTFT_MODEL:=llama-3.1-sonar-small-128k-online}"

echo "=== Smoke Test: First Bytes Over SSE ==="
echo ""

THREAD=$(curl -s -X POST http://localhost:8000/api/threads/ \
  -H "Content-Type: application/json" \
  -H "x-org-id: org_demo" \
  -d '{"title":"TTFT Smoke"}' | jq -r '.thread_id')

if [ -z "$THREAD" ] || [ "$THREAD" == "null" ]; then
  echo "❌ Failed to create thread"
  exit 1
fi

echo "Created thread: $THREAD"
echo ""
echo "Checking response headers and first frames..."
echo "---"

curl -i -N -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -H "x-org-id: org_demo" \
  -X POST "http://localhost:8000/api/threads/$THREAD/messages/stream" \
  --data "{\"role\":\"user\",\"content\":\"Say hello once.\",\"provider\":\"${TTFT_PROVIDER}\",\"model\":\"${TTFT_MODEL}\",\"reason\":\"smoke-test\",\"scope\":\"private\"}" 2>&1 | head -n 20

echo ""
echo "---"
echo ""
echo "✅ Expected:"
echo "   - Content-Type: text/event-stream"
echo "   - X-Accel-Buffering: no"
echo "   - Cache-Control: no-store, no-transform"
echo "   - Immediate 'event: ping' followed by 'event: meta' or 'event: delta'"

