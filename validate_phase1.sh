#!/bin/bash
# Phase-1 Validation Script
# Tests coalescing, streaming fan-out, and performance targets

set -e

BASE_URL="http://localhost:8000"
ORG_ID="org_demo"

echo "=========================================="
echo "Phase-1 Validation Suite"
echo "=========================================="
echo ""

# Test 1: Non-stream burst on fresh thread
echo "Test 1: Non-stream burst (50 requests, 10 concurrent)"
THREAD=$(curl -s -X POST "$BASE_URL/api/threads/" \
  -H "Content-Type: application/json" \
  -H "x-org-id: $ORG_ID" \
  -d '{"title":"Burst Test"}' | jq -r '.thread_id')

echo "Thread ID: $THREAD"
echo "Running burst..."

npx autocannon -c 10 -a 50 -m POST --timeout 120 --connectionTimeout 120 \
  -H "content-type: application/json" \
  -H "x-org-id: $ORG_ID" \
  -b '{"role":"user","content":"Give me 5 bullets about DAC.","provider":"perplexity","model":"llama-3.1-sonar-small-128k-online","reason":"burst-test","scope":"private"}' \
  "http://localhost:8000/api/threads/$THREAD/messages" 2>/dev/null | grep -E "(2xx|Code|requests in)"

MSG_COUNT=$(curl -s "$BASE_URL/api/threads/$THREAD" -H "x-org-id: $ORG_ID" | jq '.messages | length')
echo "Messages created: $MSG_COUNT (expected: 2)"

if [ "$MSG_COUNT" -eq 2 ]; then
  echo "✅ PASS: Exactly 2 messages (1 user + 1 assistant)"
else
  echo "❌ FAIL: Expected 2 messages, got $MSG_COUNT"
fi

echo ""

# Check performance metrics
echo "Test 2: Performance Metrics"
METRICS=$(curl -s "$BASE_URL/api/metrics/performance?last_n=100")
ERROR_RATE=$(echo "$METRICS" | jq -r '.errors.rate * 100')
P95_LATENCY=$(echo "$METRICS" | jq '.latency.p95 * 1000')
P95_QUEUE=$(echo "$METRICS" | jq '.queue_wait_ms.p95')
LEADERS=$(echo "$METRICS" | jq '.coalesce.leaders // 0')
FOLLOWERS=$(echo "$METRICS" | jq '.coalesce.followers // 0')

echo "Error rate: ${ERROR_RATE}% (target: <1%)"
echo "P95 latency: ${P95_LATENCY}ms (target: ≤6000ms)"
echo "P95 queue wait: ${P95_QUEUE}ms (target: ≤1000ms)"
echo "Coalesce: $LEADERS leaders, $FOLLOWERS followers"

if (( $(echo "$ERROR_RATE < 1" | bc -l) )); then
  echo "✅ PASS: Error rate < 1%"
else
  echo "❌ FAIL: Error rate too high"
fi

if (( $(echo "$P95_LATENCY <= 6000" | bc -l) )); then
  echo "✅ PASS: P95 latency ≤ 6000ms"
else
  echo "⚠️  WARN: P95 latency > 6000ms (may need tuning)"
fi

if (( $(echo "$P95_QUEUE <= 1000" | bc -l) )); then
  echo "✅ PASS: P95 queue wait ≤ 1000ms"
else
  echo "⚠️  WARN: P95 queue wait > 1000ms"
fi

if [ "$LEADERS" -eq 1 ] && [ "$FOLLOWERS" -gt 0 ]; then
  echo "✅ PASS: Coalescing working (1 leader, $FOLLOWERS followers)"
else
  echo "⚠️  WARN: Coalescing stats unexpected"
fi

echo ""

# Test 3: Streaming fan-out (if sse_ttft.mjs exists)
if [ -f "sse_ttft.mjs" ]; then
  echo "Test 3: Streaming fan-out (10 concurrent clients)"
  echo "Running 10 parallel SSE clients..."
  
  # Run 10 clients in parallel
  seq 10 | xargs -n1 -P10 -I{} node sse_ttft.mjs > /tmp/sse_test_{}.log 2>&1 &
  SSE_PIDS=$!
  
  sleep 15  # Wait for streams to complete
  
  # Check results
  SUCCESS_COUNT=$(grep -l "TTFT:" /tmp/sse_test_*.log 2>/dev/null | wc -l || echo "0")
  echo "Successful streams: $SUCCESS_COUNT/10"
  
  if [ "$SUCCESS_COUNT" -ge 8 ]; then
    echo "✅ PASS: Most clients received streams"
  else
    echo "⚠️  WARN: Some clients may have failed"
  fi
  
  # Cleanup
  rm -f /tmp/sse_test_*.log
  echo ""
fi

echo "=========================================="
echo "Validation Complete!"
echo "=========================================="

