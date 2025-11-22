#!/bin/bash
# Complete TTFT verification suite
set -e

# Provider switching support (default: mock for CI, real for local)
: "${TTFT_PROVIDER:=perplexity}"      # default real provider for local
: "${TTFT_MODEL:=llama-3.1-sonar-small-128k-online}"

# Override if mock requested
if [ "$TTFT_PROVIDER" = "mock" ]; then
  export DAC_DEFAULT_PROVIDER="mock"
  export DAC_DEFAULT_MODEL="faststream-ttft"
else
  export DAC_DEFAULT_PROVIDER="$TTFT_PROVIDER"
  export DAC_DEFAULT_MODEL="$TTFT_MODEL"
fi

echo "=========================================="
echo "TTFT Verification Suite"
echo "=========================================="
echo ""
echo "Provider: ${TTFT_PROVIDER} / Model: ${TTFT_MODEL}"
echo ""

# Check if backend is running
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
  echo "❌ Backend not running at http://localhost:8000"
  echo "   Start it with: cd backend && python main.py"
  exit 1
fi

echo "✅ Backend is running"
echo ""

# Step 1: Smoke test
echo "=== Step 1: Smoke Test - First Bytes ==="
./smoke_ttft.sh
echo ""

# Step 2: TTFT p95 measurement
echo "=== Step 2: TTFT P95 Measurement (20 samples) ==="
TTFT_OUTPUT=$(node sse_ttft_p95.mjs 2>&1)
echo "$TTFT_OUTPUT"
TTFT_P95=$(echo "$TTFT_OUTPUT" | grep "TTFT p95:" | awk '{print $3}' | tr -d 'ms,' | tr -d ',')
echo ""

# Step 3: Cancel test
echo "=== Step 3: Cancel Test (<300ms) ==="
node cancel_quick.mjs
echo ""

# Step 4: Cross-check with metrics
echo "=== Step 4: Cross-check with Metrics API ==="
METRICS=$(curl -s "http://localhost:8000/api/metrics/performance?last_n=50" | jq '{ttft_ms, queue_wait_ms}')
echo "$METRICS" | jq '.'
echo ""

# Extract metrics
TTFT_P95_METRICS=$(echo "$METRICS" | jq -r '.ttft_ms.p95 // "N/A"')
QUEUE_WAIT_P95=$(echo "$METRICS" | jq -r '.queue_wait_ms.p95 // "N/A"')

echo "=========================================="
echo "Results Summary"
echo "=========================================="
echo ""
echo "TTFT (streaming) p95: ${TTFT_P95}ms (target ≤ 1,500 ms)"
if [ -n "$TTFT_P95" ] && awk "BEGIN {exit !($TTFT_P95 <= 1500)}" 2>/dev/null; then
  echo "   ✅ PASS"
else
  echo "   ❌ FAIL"
fi
echo ""
echo "Queue wait p95 (TTFT run): ${QUEUE_WAIT_P95}ms"
if [ "$QUEUE_WAIT_P95" != "N/A" ] && awk "BEGIN {exit !($QUEUE_WAIT_P95 <= 10)}" 2>/dev/null; then
  echo "   ✅ OK (≈0)"
else
  echo "   ⚠️  Check pacer settings"
fi
echo ""
echo "=========================================="
echo ""
echo "📋 Copy-paste for Go/No-Go doc:"
echo ""
if [ -n "$TTFT_P95" ] && awk "BEGIN {exit !($TTFT_P95 <= 1500)}" 2>/dev/null; then
  TTFT_STATUS="PASS"
else
  TTFT_STATUS="FAIL"
fi

if [ "$QUEUE_WAIT_P95" != "N/A" ] && awk "BEGIN {exit !($QUEUE_WAIT_P95 <= 10)}" 2>/dev/null; then
  QUEUE_STATUS="OK (≈0)"
else
  QUEUE_STATUS="CHECK"
fi

echo "• TTFT (streaming) p95: ${TTFT_P95}ms (target ≤ 1,500 ms) — ${TTFT_STATUS}"
echo "• Cancel latency: ___ ms (target < 300 ms) — (check cancel_quick.mjs output)"
echo "• Queue wait p95 (TTFT run): ${QUEUE_WAIT_P95}ms — ${QUEUE_STATUS}"
echo ""

