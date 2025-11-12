#!/bin/bash
# TTFT Diagnosis Helper
set -e

echo "=== TTFT Diagnosis Decision Tree ==="
echo ""

echo "1. Checking SSE headers..."
THREAD_DIAG=$(curl -s -X POST http://localhost:8000/api/threads/ \
  -H "Content-Type: application/json" \
  -H "x-org-id: org_demo" \
  -d '{"title":"Diagnostic"}' | jq -r '.thread_id')

curl -v -X POST "http://localhost:8000/api/threads/$THREAD_DIAG/messages/stream" \
  -H "Content-Type: application/json" \
  -H "x-org-id: org_demo" \
  -d '{"role":"user","content":"test","provider":"perplexity","model":"llama-3.1-sonar-small-128k-online","reason":"diag","scope":"private"}' 2>&1 | grep -E "(Content-Type|Cache-Control|Connection|X-Accel)" || echo "⚠️  Headers not visible (check server logs)"

echo ""
echo "2. Testing immediate ping response..."
THREAD=$(curl -s -X POST http://localhost:8000/api/threads/ \
  -H "Content-Type: application/json" \
  -H "x-org-id: org_demo" \
  -d '{"title":"Diagnostic"}' | jq -r '.thread_id')

timeout 2 curl -N -H "Accept: text/event-stream" \
  -H "Content-Type: application/json" \
  -H "x-org-id: org_demo" \
  -X POST "http://localhost:8000/api/threads/$THREAD/messages/stream" \
  --data '{"role":"user","content":"ping test","provider":"perplexity","model":"llama-3.1-sonar-small-128k-online","reason":"ping-test","scope":"private"}' 2>/dev/null | head -5

echo ""
echo "3. Checking if adapters use shared client..."
echo "   (Review backend/app/adapters/*.py - should import from _client.py)"

echo ""
echo "4. Checking for pacer delays..."
echo "   Set PERPLEXITY_CONCURRENCY>=1, PERPLEXITY_RPS>=2 for TTFT tests"

echo ""
echo "5. Checking connection warmup..."
echo "   (Review backend/main.py - should call warm_provider_connections on startup)"

echo ""
echo "=== Common Issues ==="
echo ""
echo "❌ No immediate ping:"
echo "   → Check SSE headers in backend/app/api/threads.py"
echo "   → Ensure no gzip on SSE (Accept-Encoding: identity)"
echo ""
echo "❌ Adapter sends full blob:"
echo "   → Verify stream: true in provider payload"
echo "   → Check aiter_lines() iteration in adapters"
echo ""
echo "❌ Client created per request:"
echo "   → Confirm adapters use get_client() from _client.py"
echo ""
echo "❌ Pacer adds delay:"
echo "   → Check queue_wait_ms in metrics (should be ~0 for TTFT)"
echo "   → Temporarily increase concurrency limits for tests"
echo ""
echo "❌ Cold starts:"
echo "   → Verify warm_provider_connections() runs on startup"
echo "   → Check backend/main.py lifespan events"

