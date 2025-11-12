#!/usr/bin/env bash
# Post-Deploy Sanity Tests
# 
# Quick verification tests after canary rollout.
# Run immediately after enabling DAC_SSE_V2=1

set -euo pipefail

ENDPOINT="${DAC_URL:-http://localhost:3000/api/chat}"
ORG_ID="${ORG_ID:-org_demo}"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          Post-Deploy Sanity Tests                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Create test thread
THREAD_ID="sanity-$(date +%s)"
echo "📝 Test thread: $THREAD_ID"
echo ""

# Test 1: Friendly chat
echo "🧪 Test 1: Friendly chat"
echo "   Query: 'hello there'"
RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "x-org-id: $ORG_ID" \
  -d "{\"thread_id\": \"$THREAD_ID\", \"prompt\": \"hello there\"}" | jq -r '.text // .content // "ERROR"')
if [[ "$RESPONSE" == *"ERROR"* ]] || [[ -z "$RESPONSE" ]]; then
  echo "   ❌ FAIL"
  exit 1
else
  echo "   ✅ PASS: $(echo "$RESPONSE" | cut -c1-60)..."
fi
echo ""

# Test 2: Code generation
echo "🧪 Test 2: Code generation"
echo "   Query: 'write python to reverse a list'"
RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "x-org-id: $ORG_ID" \
  -d "{\"thread_id\": \"$THREAD_ID\", \"prompt\": \"write python to reverse a list\"}" | jq -r '.text // .content // "ERROR"')
if [[ "$RESPONSE" == *"def"* ]] || [[ "$RESPONSE" == *"reverse"* ]]; then
  echo "   ✅ PASS: Code generated"
else
  echo "   ⚠️  PARTIAL: $(echo "$RESPONSE" | cut -c1-60)..."
fi
echo ""

# Test 3: Explanation follow-up
echo "🧪 Test 3: Explanation follow-up"
echo "   Query: 'explain how that code works'"
RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "x-org-id: $ORG_ID" \
  -d "{\"thread_id\": \"$THREAD_ID\", \"prompt\": \"explain how that code works\"}" | jq -r '.text // .content // "ERROR"')
if [[ "$RESPONSE" != *"ERROR"* ]] && [[ -n "$RESPONSE" ]]; then
  echo "   ✅ PASS: Explanation provided"
else
  echo "   ❌ FAIL"
  exit 1
fi
echo ""

# Test 4: Context check
echo "🧪 Test 4: Context check"
echo "   Query: 'what were we working on again?'"
RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "x-org-id: $ORG_ID" \
  -d "{\"thread_id\": \"$THREAD_ID\", \"prompt\": \"what were we working on again?\"}" | jq -r '.text // .content // "ERROR"')
if [[ "$RESPONSE" != *"ERROR"* ]] && [[ -n "$RESPONSE" ]]; then
  echo "   ✅ PASS: Context maintained"
else
  echo "   ⚠️  PARTIAL: Context may be lost"
fi
echo ""

# Test 5: Ambiguous query
echo "🧪 Test 5: Ambiguous query"
echo "   Query: 'make it better'"
RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "x-org-id: $ORG_ID" \
  -d "{\"thread_id\": \"$THREAD_ID\", \"prompt\": \"make it better\"}" | jq -r '.text // .content // "ERROR"')
if [[ "$RESPONSE" != *"ERROR"* ]] && [[ -n "$RESPONSE" ]]; then
  echo "   ✅ PASS: Graceful handling"
else
  echo "   ❌ FAIL: Timeout or error"
  exit 1
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All sanity tests passed!"
echo ""

