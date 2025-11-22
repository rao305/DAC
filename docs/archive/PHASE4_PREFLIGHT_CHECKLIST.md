---
title: Phase 4 Preflight Checklist (10-Minute Go/No-Go)
summary: Documentation file
last_updated: '2025-11-12'
owner: DAC
tags:
- dac
- docs
---

# Phase 4 Preflight Checklist (10-Minute Go/No-Go)

## ⚡ Quick Verification (10 minutes)

### Env Sanity
- [ ] `DAC_SSE_V2=1` set for canary slice
- [ ] Provider API keys present and validated
- [ ] Pricing table loaded for `cost_est` (per 1k tokens, by model)
- [ ] Environment variables documented

### Rate Limits
- [ ] Per-IP rate limits configured (burst + sustained)
- [ ] Per-thread rate limits configured
- [ ] 429 responses include `Retry-After` header
- [ ] Rate limit middleware active

### Token Caps
- [ ] Max input/output per intent:
  - [ ] `social_chat`: 2k input / 1k output
  - [ ] `coding_help`: 8k input / 2k output
  - [ ] `qa_retrieval`: 6k input / 1.5k output
  - [ ] `editing/writing`: 4k input / 2k output
  - [ ] `reasoning/math`: 6k input / 1.5k output
- [ ] Token caps enforced in request validation

### Fallbacks
- [ ] No dead-end chains (every intent has fallback)
- [ ] Provider 400/timeout simulation tested
- [ ] Single continuous stream confirmed (no double headers)
- [ ] Fallback ladder order verified

### Cache TTLs
- [ ] Default TTL: 1h
- [ ] Cache bypass for stateful ops (if applicable)
- [ ] Cache invalidation logic tested

### PII Redaction
- [ ] Sample logs checked:
  - [ ] Email addresses masked
  - [ ] Phone numbers masked
  - [ ] SSN masked
  - [ ] Credit cards masked
  - [ ] IP addresses masked
- [ ] End-to-end redaction verified

### SLOs Wired
- [ ] Error rate < 1% (dashboard configured)
- [ ] p95 latency < 5s (dashboard configured)
- [ ] Dashboards show:
  - [ ] Intent distribution
  - [ ] Fallback usage rate
  - [ ] Cache hit rate
  - [ ] Cost per turn
- [ ] Alerts configured (Prometheus/Grafana)

### Rollback Path
- [ ] Flag flip tested: `DAC_SSE_V2=0`
- [ ] Restart procedure documented
- [ ] Rollback script tested (`scripts/canary_rollback.sh`)

---

## ✅ Go/No-Go Decision

**GO if:**
- All items checked
- Dashboards accessible
- Team on-call for first 24h
- Rollback tested

**NO-GO if:**
- Any critical item unchecked
- Monitoring not ready
- Team unavailable

---

**Time to complete**: ~10 minutes
**Last Updated**: 2025-01-XX

