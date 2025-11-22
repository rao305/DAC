#!/bin/bash
# Restore production-safe pacer settings after TTFT tests
set -e

echo "=== Restoring Production-Safe Pacer Settings ==="
echo ""

# Production-safe values (free tier friendly)
export PERPLEXITY_RPS=1
export PERPLEXITY_CONCURRENCY=3
export PERPLEXITY_BURST=2

echo "✅ Production settings restored:"
echo "   PERPLEXITY_RPS=$PERPLEXITY_RPS"
echo "   PERPLEXITY_CONCURRENCY=$PERPLEXITY_CONCURRENCY"
echo "   PERPLEXITY_BURST=$PERPLEXITY_BURST"
echo ""
echo "⚠️  IMPORTANT: Restart your backend server for these to take effect!"
echo ""
echo "To persist these for your session, run:"
echo "  source restore_prod_settings.sh"

