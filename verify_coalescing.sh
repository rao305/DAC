#!/bin/bash
# Verify request coalescing is working

set -e

BASE_URL="http://localhost:8000"
ORG_ID="org_demo"

echo "=========================================="
echo "Request Coalescing Verification"
echo "=========================================="
echo ""

# Test 1: Multi-thread burst (should get 100% success)
echo "Test 1: Multi-thread burst (20 requests, different threads)"
echo "Creating threads..."
THREADS=()
for i in {1..20}; do
  THREAD=$(curl -s -X POST "$BASE_URL/api/threads/" \
    -H "Content-Type: application/json" \
    -H "x-org-id: $ORG_ID" \
    -d '{"title":"Test"}' | jq -r '.thread_id')
  THREADS+=($THREAD)
done

echo "Sending 20 concurrent identical requests..."
START=$(date +%s)
for THREAD in "${THREADS[@]}"; do
  curl -s -X POST "$BASE_URL/api/threads/$THREAD/messages" \
    -H "Content-Type: application/json" \
    -H "x-org-id: $ORG_ID" \
    -d '{"role":"user","content":"Test message","provider":"perplexity","model":"llama-3.1-sonar-small-128k-online","reason":"test","scope":"private"}' &
done
wait
END=$(date +%s)
DURATION=$((END - START))

echo "✓ Completed in ${DURATION}s"
echo ""

# Test 2: Single-thread burst with autocannon
echo "Test 2: Single-thread burst (50 requests, 10 concurrent)"
THREAD=$(curl -s -X POST "$BASE_URL/api/threads/" \
  -H "Content-Type: application/json" \
  -H "x-org-id: $ORG_ID" \
  -d '{"title":"Burst Test"}' | jq -r '.thread_id')

echo "Thread: $THREAD"
echo "Running burst..."

npx --yes autocannon -c 10 -a 50 -m POST \
  --timeout 120 --connectionTimeout 120 \
  -H "content-type: application/json" \
  -H "x-org-id: $ORG_ID" \
  -b '{"role":"user","content":"Give me 5 bullets about DAC.","provider":"perplexity","model":"llama-3.1-sonar-small-128k-online","reason":"burst-test","scope":"private"}' \
  "$BASE_URL/api/threads/$THREAD/messages" 2>/dev/null | grep -E "(Code|2xx|requests in)"

echo ""

# Check message count
MSG_COUNT=$(curl -s "$BASE_URL/api/threads/$THREAD" -H "x-org-id: $ORG_ID" | jq '.messages | length')
echo "Messages created: $MSG_COUNT (should be low due to coalescing)"

echo ""

# Check performance metrics
echo "Test 3: Performance Metrics"
METRICS=$(curl -s "$BASE_URL/api/metrics/performance?last_n=100")
ERROR_RATE=$(echo "$METRICS" | jq -r '.errors.rate * 100 | tostring + "%"')
P50_MS=$(echo "$METRICS" | jq '.latency.p50 * 1000 | round')
P95_MS=$(echo "$METRICS" | jq '.latency.p95 * 1000 | round')

echo "Error rate: $ERROR_RATE (target: <40% for single-thread)"
echo "P50 latency: ${P50_MS}ms"
echo "P95 latency: ${P95_MS}ms (target: <6000ms)"

echo ""
echo "=========================================="
echo "Verification Complete!"
echo "=========================================="
echo ""
echo "Expected results:"
echo "- Multi-thread: 100% success (coalescing works)"
echo "- Single-thread: 50-80% success (Perplexity validation limits)"
echo "- Messages created: <10 (proves deduplication)"
echo "- Error rate: <50% (acceptable with free tier)"

