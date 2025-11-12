#!/usr/bin/env bash
# Canary Rollback Script
# 
# Quick rollback if canary shows issues.
# Sets DAC_SSE_V2=0 to revert to legacy streaming.

set -euo pipefail

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          Canary Rollback                                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check if DAC_SSE_V2 is set
if [[ "${DAC_SSE_V2:-0}" == "1" ]]; then
  echo "⚠️  DAC_SSE_V2 is currently enabled (1)"
  echo ""
  read -p "Rollback to legacy streaming? (y/N): " -n 1 -r
  echo ""
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Rolling back..."
    export DAC_SSE_V2=0
    echo "✅ DAC_SSE_V2=0 (legacy mode)"
    echo ""
    echo "⚠️  Restart backend to apply changes:"
    echo "   cd backend && source venv/bin/activate && python main.py"
    echo ""
  else
    echo "❌ Rollback cancelled"
    exit 0
  fi
else
  echo "ℹ️  DAC_SSE_V2 is already disabled (legacy mode)"
  echo ""
fi

