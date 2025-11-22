#!/bin/bash
# Quick TTFT diagnosis - fast triage
set -e

echo "=== Quick TTFT Diagnosis ==="
echo ""

# Create a test thread
THREAD=$(curl -s -X POST http://localhost:8000/api/threads/ \
  -H "Content-Type: application/json" \
  -H "x-org-id: org_demo" \
  -d '{"title":"Diagnostic"}' | jq -r '.thread_id')

echo "1. Checking SSE headers..."
echo "---"
curl -sI -X POST "http://localhost:8000/api/threads/$THREAD/messages/stream" \
  -H "Content-Type: application/json" \
  -H "x-org-id: org_demo" \
  --data '{"role":"user","content":"test","provider":"perplexity","model":"llama-3.1-sonar-small-128k-online","reason":"diag","scope":"private"}' | sed -n '1,15p'

echo ""
echo "✅ Expected headers:"
echo "   Content-Type: text/event-stream"
echo "   Cache-Control: no-store, no-transform"
echo "   X-Accel-Buffering: no"
echo "   (No Content-Encoding: gzip)"
echo ""

echo "2. Checking streaming frames (first 10 seconds)..."
echo "---"
timeout 10 curl -N -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -H "x-org-id: org_demo" \
  -X POST "http://localhost:8000/api/threads/$THREAD/messages/stream" \
  --data '{"role":"user","content":"Test streaming.","provider":"perplexity","model":"llama-3.1-sonar-small-128k-online","reason":"diag","scope":"private"}' 2>/dev/null | head -30

echo ""
echo "✅ Expected:"
echo "   - Multiple 'event: delta' frames (not one big JSON)"
echo "   - 'event: ping' immediately"
echo "   - 'event: meta' with ttft_ms"
echo ""

echo "3. Checking queue wait in metrics..."
echo "---"
QUEUE_WAIT=$(curl -s "http://localhost:8000/api/metrics/performance?last_n=50" | jq -r '.queue_wait_ms.p95 // "N/A"')
echo "Queue wait p95: ${QUEUE_WAIT}ms"

if [ "$QUEUE_WAIT" != "N/A" ] && awk "BEGIN {exit !($QUEUE_WAIT > 10)}" 2>/dev/null; then
  echo "⚠️  Queue wait is high - pacer may be blocking"
  echo "   Fix: Set PERPLEXITY_RPS=5, PERPLEXITY_CONCURRENCY=5"
else
  echo "✅ Queue wait is low (≈0)"
fi
echo ""

echo "4. Verifying shared HTTP/2 client usage..."
echo "   (Manual check: grep 'get_client' in backend/app/adapters/*.py)"
echo "   ✅ Should see: from app.adapters._client import get_client"
echo "   ❌ Should NOT see: httpx.AsyncClient() in streaming functions"
echo ""

echo "=== Diagnosis Complete ==="

