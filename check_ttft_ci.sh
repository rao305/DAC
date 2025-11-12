#!/bin/bash
# CI guardrail: fail if TTFT p95 regresses
set -e

echo "Running TTFT p95 check..."
node sse_ttft_p95.mjs | tee /tmp/ttft.txt

# Extract p95 value and check threshold
P95=$(awk '/TTFT p95:/ {print $3}' /tmp/ttft.txt | tr -d 'ms,' | tr -d ',')

if [ -z "$P95" ]; then
  echo "❌ Failed to extract TTFT p95 value"
  exit 1
fi

echo ""
echo "TTFT p95: ${P95}ms (threshold: 1500ms)"

# Use awk for comparison (works without bc)
if awk "BEGIN {exit !($P95 > 1500)}"; then
  echo "❌ TTFT regression detected: p95=${P95}ms > 1500ms"
  exit 1
else
  echo "✅ TTFT p95 within threshold: ${P95}ms ≤ 1500ms"
  exit 0
fi

