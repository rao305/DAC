# Phase 2 Week 1 Verification Guide

This document provides a comprehensive verification checklist for Phase 2 Week 1 deliverables. Use this to validate that all acceptance criteria are met before marking Week 1 complete.

## Table of Contents

1. [DoD Acceptance Matrix](#dod-acceptance-matrix)
2. [Setup Instructions](#setup-instructions)
3. [Automated Tests](#automated-tests)
4. [Manual Verification](#manual-verification)
5. [CI/CD Integration](#cicd-integration)
6. [Troubleshooting](#troubleshooting)

---

## DoD Acceptance Matrix

| Capability | Test / Threshold | How to Verify | Pass Criteria |
|------------|------------------|---------------|---------------|
| **Lighthouse (mobile/Fast-3G)** | Perf ≥ 0.90, LCP ≤ 2.5s, CLS < 0.1 | `npm run lh:ci` | LHCI assertions pass on all target pages |
| **Cache UX** | cache_hit badge on repeat prompt; TTFT < 300ms (repeat) | Run `node scripts/ttft_probe.mjs` then send same prompt in UI | Badge visible on repeat; probe p95 < 300ms |
| **First token render** | Skeleton shows until first delta; content streams incrementally | Trigger a prompt; watch UI | Skeleton disappears on first token; text grows live |
| **Cancel UX** | Stop is responsive <300ms and shows cancelled | `npx playwright test tests/cancel.spec.ts` | Test passes (badge/text appears within 300ms) |
| **Preconnect** | rel=preconnect to SSE host | Elements tab → `<head>` | Tag present; DNS-prefetch present |
| **Dynamic imports** | Heavy modules lazy-loaded | Network tab | react-markdown / highlighter loaded after interaction |
| **Images** | Correct sizes/priority for ATF | Lighthouse → Diagnostics | No warnings for unoptimized ATF image |

---

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
# Frontend dependencies (includes Lighthouse CI and Playwright)
cd frontend
npm install

# Install Playwright browsers (first time only)
npx playwright install

# Backend dependencies (for Python scripts)
cd ../backend
pip install httpx  # For soak_test.py
\`\`\`

### 2. Start Services

\`\`\`bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
python main.py

# Terminal 2: Frontend
cd frontend
npm run dev
\`\`\`

---

## Automated Tests

### Lighthouse CI

\`\`\`bash
cd frontend
npm run lh:ci
\`\`\`

### TTFT Probe

\`\`\`bash
node scripts/ttft_probe.mjs
\`\`\`

### Playwright Tests

\`\`\`bash
cd frontend
npx playwright test tests/cancel.spec.ts
\`\`\`

---

## Sign-Off Checklist

- [ ] Lighthouse CI passes
- [ ] TTFT probe passes
- [ ] Playwright tests pass
- [ ] Manual verification complete

