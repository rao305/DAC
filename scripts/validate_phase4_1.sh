#!/bin/bash
# Phase 4.1 Behavioral Intelligence Validation Script
# Quick smoke tests for greeting and time-sensitive query fixes

set -e

echo "🧪 Phase 4.1 Validation - Behavioral Intelligence"
echo "=================================================="
echo ""

API_URL="${API_URL:-http://localhost:8000}"
ORG_ID="${ORG_ID:-test-org}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function to make API calls
test_query() {
    local query="$1"
    local expected_intent="$2"
    local expected_provider="$3"
    local expected_pipeline="${4:-direct_llm}"
    
    echo "Testing: '$query'"
    echo "  Expected: intent=$expected_intent, provider=$expected_provider, pipeline=$expected_pipeline"
    
    # Make API call (adjust endpoint as needed)
    response=$(curl -s -X POST "${API_URL}/api/threads/test-thread/messages" \
        -H "Content-Type: application/json" \
        -H "X-Org-ID: ${ORG_ID}" \
        -d "{\"content\": \"$query\", \"role\": \"user\"}" || echo "ERROR")
    
    if [[ "$response" == "ERROR" ]]; then
        echo -e "  ${RED}✗ FAILED: API call failed${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
    
    # Extract intent, provider, pipeline from response (adjust JSON parsing as needed)
    intent=$(echo "$response" | jq -r '.intent // "unknown"' 2>/dev/null || echo "unknown")
    provider=$(echo "$response" | jq -r '.result.provider // "unknown"' 2>/dev/null || echo "unknown")
    pipeline=$(echo "$response" | jq -r '.result.pipeline // "direct_llm"' 2>/dev/null || echo "direct_llm")
    
    # Check results
    local checks_passed=true
    
    if [[ "$intent" != "$expected_intent" ]]; then
        echo -e "  ${RED}✗ Intent mismatch: got '$intent', expected '$expected_intent'${NC}"
        checks_passed=false
    fi
    
    if [[ "$provider" != "$expected_provider" ]]; then
        echo -e "  ${YELLOW}⚠ Provider mismatch: got '$provider', expected '$expected_provider'${NC}"
        # Not a hard failure, just a warning
    fi
    
    if [[ "$pipeline" != "$expected_pipeline" ]]; then
        echo -e "  ${RED}✗ Pipeline mismatch: got '$pipeline', expected '$expected_pipeline'${NC}"
        checks_passed=false
    fi
    
    if [[ "$checks_passed" == "true" ]]; then
        echo -e "  ${GREEN}✓ PASSED${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "Test 1: Greeting Flow"
echo "---------------------"
test_query "hi there" "social_chat" "openai" "direct_llm"
test_query "hello" "social_chat" "openai" "direct_llm"
test_query "hey" "social_chat" "openai" "direct_llm"
echo ""

echo "Test 2: Time-Sensitive Queries"
echo "-----------------------------"
test_query "what happened in delhi two days ago" "qa_retrieval" "web+openai" "web_multisearch"
test_query "what's new in ai this week" "qa_retrieval" "web+openai" "web_multisearch"
echo ""

echo "Test 3: Non-Time-Sensitive (Control)"
echo "------------------------------------"
test_query "who is the chief minister of delhi" "qa_retrieval" "perplexity" "direct_llm"
echo ""

echo "Test 4: Other Intents (Regression)"
echo "---------------------------------"
test_query "solve: 2x + 5 = 11" "reasoning/math" "openai" "direct_llm"
test_query "write a python function" "coding_help" "gemini" "direct_llm"
echo ""

echo "=================================================="
echo "Results:"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo ""

if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Check logs above.${NC}"
    exit 1
fi

