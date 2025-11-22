#!/bin/bash
# One-time prep for TTFT tests - avoids pacer skew
set -e

echo "=== TTFT Test Prep ==="
echo ""
echo "Setting fast-but-safe test knobs..."

# Fast pacer settings (zero queue wait for TTFT)
export PERPLEXITY_RPS=5
export PERPLEXITY_CONCURRENCY=5
export PERPLEXITY_BURST=5

# Use fastest streaming model
export DAC_DEFAULT_PROVIDER=perplexity
export DAC_DEFAULT_MODEL=llama-3.1-sonar-small-128k-online

# Ensure features are enabled
export COALESCE_ENABLED=1
export STREAM_FANOUT_ENABLED=1

echo "✅ Environment variables set:"
echo "   PERPLEXITY_RPS=$PERPLEXITY_RPS"
echo "   PERPLEXITY_CONCURRENCY=$PERPLEXITY_CONCURRENCY"
echo "   PERPLEXITY_BURST=$PERPLEXITY_BURST"
echo "   DAC_DEFAULT_PROVIDER=$DAC_DEFAULT_PROVIDER"
echo "   DAC_DEFAULT_MODEL=$DAC_DEFAULT_MODEL"
echo "   COALESCE_ENABLED=$COALESCE_ENABLED"
echo "   STREAM_FANOUT_ENABLED=$STREAM_FANOUT_ENABLED"
echo ""
echo "⚠️  IMPORTANT: Restart your backend server for these to take effect!"
echo ""
echo "To persist these for your session, run:"
echo "  source prep_ttft_test.sh"

