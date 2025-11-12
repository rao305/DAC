#!/usr/bin/env bash
# Simple SLO alert for local/dev – exits non-zero on breach
#
# Usage:
#   ./alert.sh [URL]
#
# Environment Variables:
#   TTFT_LIMIT     - TTFT p95 threshold in ms (default: 1500)
#   LATENCY_LIMIT  - Latency p95 threshold in ms (default: 6000)
#   QUEUE_LIMIT    - Queue wait p95 threshold in ms (default: 1000)
#   ERROR_RATE     - Error rate threshold (default: 0.01 = 1%)

set -euo pipefail

# Configuration
URL="${1:-http://localhost:8000/api/metrics/performance?last_n=100}"
TTFT_LIMIT="${TTFT_LIMIT:-1500}"
LATENCY_LIMIT="${LATENCY_LIMIT:-6000}"
QUEUE_LIMIT="${QUEUE_LIMIT:-1000}"
ERROR_RATE_LIMIT="${ERROR_RATE:-0.01}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DAC SLO Alert Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Thresholds:"
echo "  TTFT p95:       ≤ ${TTFT_LIMIT} ms"
echo "  Latency p95:    ≤ ${LATENCY_LIMIT} ms"
echo "  Queue wait p95: ≤ ${QUEUE_LIMIT} ms"
echo "  Error rate:     < ${ERROR_RATE_LIMIT}"
echo ""
echo "Fetching metrics from: ${URL}"
echo ""

# Fetch metrics
if ! json=$(curl -fsS "$URL" 2>&1); then
  echo -e "${RED}✗ ERROR:${NC} Failed to fetch metrics"
  echo "$json"
  exit 2
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
  echo -e "${RED}✗ ERROR:${NC} jq is required but not installed"
  echo "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
  exit 2
fi

# Parse metrics
ttft=$(echo "$json" | jq -r '.ttft_ms.p95 // null')
latency=$(echo "$json" | jq -r '.latency_ms.p95 // null')
queue=$(echo "$json" | jq -r '.queue_wait_ms.p95 // null')
error_rate=$(echo "$json" | jq -r '.error_rate // 0')

# Display current values
echo "Current metrics:"
echo "  TTFT p95:       ${ttft} ms"
echo "  Latency p95:    ${latency} ms"
echo "  Queue wait p95: ${queue} ms"
echo "  Error rate:     ${error_rate}"
echo ""

# Check each SLO with improved handling of "no data" vs actual violations
violations=0
insufficient_data=0

# Check for insufficient data (null metrics)
ttft_type=$(echo "$json" | jq -r '.ttft_ms.p95 | type')
latency_type=$(echo "$json" | jq -r '.latency_ms.p95 | type')
error_rate_type=$(echo "$json" | jq -r '.error_rate | type')
queue_type=$(echo "$json" | jq -r '.queue_wait_ms.p95 | type')

# TTFT check
if [ "$ttft_type" = "null" ]; then
  echo -e "${YELLOW}⚠ WARN:${NC} TTFT p95 is null (insufficient data) — generate traffic and rerun"
  ((insufficient_data++))
elif [ "$ttft_type" != "number" ]; then
  echo -e "${RED}✗ ALERT:${NC} TTFT p95 is not a number (got: ${ttft_type})"
  ((violations++))
elif [ "$(echo "$ttft > $TTFT_LIMIT" | bc -l)" -eq 1 ]; then
  echo -e "${RED}✗ ALERT:${NC} TTFT p95 exceeded: ${ttft} ms > ${TTFT_LIMIT} ms"
  ((violations++))
else
  echo -e "${GREEN}✓${NC} TTFT p95 OK (${ttft} ms)"
fi

# Latency check
if [ "$latency_type" = "null" ]; then
  echo -e "${YELLOW}⚠ WARN:${NC} Latency p95 is null (insufficient data) — generate traffic and rerun"
  ((insufficient_data++))
elif [ "$latency_type" != "number" ]; then
  echo -e "${RED}✗ ALERT:${NC} Latency p95 is not a number (got: ${latency_type})"
  ((violations++))
elif [ "$(echo "$latency > $LATENCY_LIMIT" | bc -l)" -eq 1 ]; then
  echo -e "${RED}✗ ALERT:${NC} Latency p95 exceeded: ${latency} ms > ${LATENCY_LIMIT} ms"
  ((violations++))
else
  echo -e "${GREEN}✓${NC} Latency p95 OK (${latency} ms)"
fi

# Queue wait check
if [ "$queue_type" = "null" ]; then
  echo -e "${YELLOW}⚠ WARN:${NC} Queue wait p95 is null (insufficient data) — generate traffic and rerun"
  ((insufficient_data++))
elif [ "$queue_type" != "number" ]; then
  echo -e "${RED}✗ ALERT:${NC} Queue wait p95 is not a number (got: ${queue_type})"
  ((violations++))
elif [ "$(echo "$queue > $QUEUE_LIMIT" | bc -l)" -eq 1 ]; then
  echo -e "${RED}✗ ALERT:${NC} Queue wait p95 exceeded: ${queue} ms > ${QUEUE_LIMIT} ms"
  ((violations++))
else
  echo -e "${GREEN}✓${NC} Queue wait p95 OK (${queue} ms)"
fi

# Error rate check
if [ "$error_rate_type" = "null" ]; then
  echo -e "${YELLOW}⚠ WARN:${NC} Error rate is null (insufficient data) — generate traffic and rerun"
  ((insufficient_data++))
elif [ "$error_rate_type" != "number" ]; then
  echo -e "${RED}✗ ALERT:${NC} Error rate is not a number (got: ${error_rate_type})"
  ((violations++))
elif [ "$(echo "$error_rate >= $ERROR_RATE_LIMIT" | bc -l)" -eq 1 ]; then
  echo -e "${RED}✗ ALERT:${NC} Error rate exceeded: ${error_rate} >= ${ERROR_RATE_LIMIT}"
  ((violations++))
else
  echo -e "${GREEN}✓${NC} Error rate OK (${error_rate})"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Exit with appropriate code
if [ $violations -gt 0 ]; then
  echo -e "${RED}FAILED:${NC} ${violations} SLO violation(s) detected"
  echo ""
  exit 1
elif [ $insufficient_data -gt 0 ]; then
  echo -e "${YELLOW}WARN:${NC} Insufficient data (${insufficient_data} metric(s) are null)"
  echo "   Run traffic generation (e.g., TTFT probe or soak test) and rerun this check."
  echo ""
  echo "   Example: node scripts/ttft_probe.mjs && ./alert.sh"
  echo ""
  exit 0  # Exit 0 for insufficient data (not a failure, just needs more data)
else
  echo -e "${GREEN}PASSED:${NC} All SLOs met"
  echo ""
  exit 0
fi
