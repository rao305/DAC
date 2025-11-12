#!/bin/bash
# TTFT Verification Script
set -e

echo "=== Step 1: Smoke Test - Early Bytes Over SSE ==="
echo ""

# Create a fresh thread
THREAD=$(curl -s -X POST http://localhost:8000/api/threads/ \
  -H "Content-Type: application/json" \
  -H "x-org-id: org_demo" \
  -d '{"title":"TTFT"}' | jq -r '.thread_id')

if [ -z "$THREAD" ] || [ "$THREAD" == "null" ]; then
  echo "❌ Failed to create thread"
  exit 1
fi

echo "Created thread: $THREAD"
echo ""
echo "Streaming response (first 5 seconds, looking for ping and first delta):"
echo "---"

timeout 5 curl -N -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -H "x-org-id: org_demo" \
  -X POST "http://localhost:8000/api/threads/$THREAD/messages/stream" \
  --data '{"role":"user","content":"Say hello once.","provider":"perplexity","model":"llama-3.1-sonar-small-128k-online","reason":"smoke-test","scope":"private"}' 2>/dev/null | head -20

echo ""
echo "---"
echo "✅ If you see 'event: ping' immediately, then 'event: meta' or 'event: delta', early bytes are working."
echo ""

echo "=== Step 2: Measure TTFT p95 (20 samples, parallel 5) ==="
echo ""

node sse_ttft_p95.mjs

echo ""
echo "=== Step 3: Quick Cancel Test (<300ms) ==="
echo ""

node cancel_quick.mjs

echo ""
echo "=== Step 4: Cross-check with Metrics API ==="
echo ""

curl -s "http://localhost:8000/api/metrics/performance?last_n=50" | jq '.ttft_ms // "No TTFT data yet"'

echo ""
echo "=== Verification Complete ==="

