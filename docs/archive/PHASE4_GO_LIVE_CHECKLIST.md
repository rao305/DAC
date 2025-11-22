---
title: Phase 4 Go-Live Checklist
summary: Documentation file
last_updated: '2025-11-12'
owner: DAC
tags:
- dac
- docs
---

# Phase 4 Go-Live Checklist

## 🚀 Pre-Launch Verification

### Config & Secrets
- [ ] `DAC_SSE_V2=1` enabled for canary slice (5-10% traffic)
- [ ] Provider API keys present and validated
- [ ] Per-provider timeout set (12-15s)
- [ ] Retry count set (1 retry with jittered backoff)
- [ ] Pricing table loaded for `cost_est` (per 1k tokens, by model)
- [ ] PII masking ON for logs
- [ ] Redaction verified end-to-end (test with email/phone/SSN)

### Router & Fallbacks
- [ ] Fallback ladder active for every intent (no "dead end" chains)
- [ ] Ambiguous intent → safe provider (Gemini) confirmed
- [ ] Follow-up "explain this" smoothing tested after `coding_help`
- [ ] All fallback chains tested (primary → failover → final)

### SSE Endpoint
- [ ] Cache → route → stream → log pattern exercised
- [ ] Client disconnect doesn't crash; stream finalizes and logs
- [ ] Legacy fan-out path intact when flag is off (`DAC_SSE_V2=0`)
- [ ] SSE event format correct (`event: delta`, `event: done`)

### Memory & Context
- [ ] Rolling summary + last N turns populated
- [ ] Profile facts (name/project) persist across trims
- [ ] DB bootstrap loads history on first access (cold start ok)
- [ ] Context check test passes (remembers "Alex" + "Python project")

### Observability
- [ ] `log_turn()` emits all required fields:
  - `thread_id`, `intent`, `provider`, `model`
  - `latency_ms`, `input_tokens`, `output_tokens`
  - `cost_est`, `cache_hit`, `fallback_used`, `truncated`
- [ ] OpenTelemetry spans around route/stream
- [ ] Span attributes set: `dac.intent`, `dac.provider`, `dac.model`, `dac.latency_ms`, `dac.fallback_used`
- [ ] Weekly rollup job wired (or manual run tested)

### Guardrails
- [ ] Prompt-injection filter in request path
- [ ] PII detectors verified (email/phone/SSN/CC/IP)
- [ ] Refusal template returns safe alt suggestions
- [ ] Safety flags logged correctly

### Caching
- [ ] Cache key: `(thread_id, normalized_prompt)` (optionally include intent)
- [ ] TTL set (e.g., 1h)
- [ ] Cache invalidation on stateful ops (if needed)
- [ ] Cache stats visible (hit rate)

### CI / QA
- [ ] Nightly smoke-eval job green (8/8)
- [ ] Quality suite thresholds enforced:
  - Intent accuracy ≥ 95%
  - p95 latency < 5s
  - Task accuracy ≥ 80%
- [ ] Canary rollback script ready (`DAC_SSE_V2=0`)

---

## 📈 Canary Monitoring (First 24-48h)

### Dash KPIs to Watch

**Latency:**
- p50 latency (target: < 2s)
- p95 latency (target: < 5s)
- Provider-specific latency breakdown

**Reliability:**
- Error rate (target: < 1%)
- Fallback usage (target: < 5%)
- Cache hit rate (target: > 30%)

**Cost:**
- Cost per turn (target: < $0.01)
- Total cost per hour/day
- Cost by provider/model

**Quality:**
- Intent accuracy (target: ≥ 95%)
- Task accuracy (target: ≥ 80%)

### Top Alerts (Sample Thresholds)

| Alert | Threshold | Duration | Action |
|-------|-----------|----------|--------|
| Error rate spike | > 2% | 5m | Page on-call |
| p95 latency high | > 7s | 10m | Warn channel |
| Fallback usage high | > 15% | 10m | Warn (provider degradation) |
| Cache hit low | < 10% | 30m | Warn (cache key drift) |
| Cost per turn high | > $0.02 | 15m | Warn (model misrouting) |

### Golden Traces to Sample

1. **Long chats with summarization**
   - Verify rolling summary works
   - Check context preservation

2. **Ambiguous queries**
   - Ensure graceful clarifiers
   - No timeouts

3. **Provider timeouts**
   - Verify ladder engages
   - Final apology path works

---

## 🔁 Rollback & Mitigations

### Feature Flag Rollback
```bash
# Immediate rollback
export DAC_SSE_V2=0
# Restart backend
```

### Provider Outage
- Raise cache TTL (reduce load)
- Switch ladder order (prioritize working provider)
- Lower concurrency limits

### Latency Spike
- Drop temperature (faster responses)
- Reduce max_tokens
- Prefer cheaper model first

### Cost Spike
- Enforce small-first routing
- Strict token caps
- Enable response reuse (caching)

---

## 🔒 Security & Data

- [ ] Logs exclude raw PII (masked fields audited)
- [ ] Retention policy documented:
  - 30d logs
  - 7d traces
- [ ] Access to dashboards behind SSO
- [ ] Incident runbook link pinned for on-call

---

## 🧪 Fast Post-Deploy Sanity Tests

Run these immediately after canary enable:

1. **"hello there"** → friendly chat (no defs)
2. **"write python to reverse a list"** → code + explainer
3. **"explain how that code works"** → correct `qa_retrieval`
4. **"what were we working on again?"** → remembers name + project
5. **Ambiguous: "make it better"** → targeted clarifier (no timeout)
6. **Force provider 400** → ladder engages, single continuous stream

---

## ✅ Go/No-Go Decision

**GO Criteria:**
- All checklist items checked
- Canary monitoring dashboards ready
- Rollback plan tested
- On-call team briefed

**NO-GO Criteria:**
- Any critical checklist item unchecked
- Known issues unresolved
- Monitoring not ready
- Team not available for first 24h

---

**Status**: Ready for canary rollout
**Last Updated**: 2025-01-XX

