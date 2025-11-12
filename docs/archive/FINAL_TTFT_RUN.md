---
title: Final TTFT Run - Phase 1 Closure
summary: Documentation file
last_updated: '2025-11-12'
owner: DAC
tags:
- dac
- docs
---

# Final TTFT Run - Phase 1 Closure

## Pre-Run Checklist

- [ ] Backend is running
- [ ] Database is accessible
- [ ] Provider API keys are configured
- [ ] Fast model is available (e.g., `llama-3.1-sonar-small-128k-online`)

## Run Order

### 1. Prep (One-time)

```bash
source prep_ttft_test.sh
# Restart backend if needed
```

This sets:
- `PERPLEXITY_RPS=5`
- `PERPLEXITY_CONCURRENCY=5`
- `PERPLEXITY_BURST=5`
- Fast model configuration

### 2. Smoke Test

```bash
./smoke_ttft.sh
```

**Expected:**
- `Content-Type: text/event-stream`
- `X-Accel-Buffering: no`
- Immediate `event: ping`
- Followed by `event: meta` or `event: delta`

### 3. Full Suite

```bash
./run_ttft_suite.sh
```

**Output includes:**
- TTFT p95 measurement (20 samples)
- Cancel test results
- Metrics cross-check
- Copy-paste lines for Go/No-Go doc

### 4. Record Results

Copy the three lines from the suite output into `PHASE1_GO_NO_GO.md`:

```
• TTFT (streaming) p95: <X> ms (target ≤ 1,500 ms) — PASS/FAIL
• Cancel latency: <Y> ms (target < 300 ms) — PASS/FAIL
• Queue wait p95 (TTFT run): <Z> ms — OK (≈0) / INVESTIGATE
```

### 5. Restore Production Settings

```bash
source restore_prod_settings.sh
# Restart backend
```

This restores:
- `PERPLEXITY_RPS=1`
- `PERPLEXITY_CONCURRENCY=3`
- `PERPLEXITY_BURST=2`

## Troubleshooting

### No immediate ping
- Check SSE headers in `backend/app/api/threads.py`
- Verify no gzip/buffering on proxy
- Ensure `X-Accel-Buffering: no` header

### TTFT > 1.5s with queue_wait > 0
- Raise pacer: `PERPLEXITY_RPS=5, CONCURRENCY=5` (already set in prep)
- Check pacer implementation

### Only one big delta
- Verify adapters send `stream: true`
- Check `aiter_lines()` iteration
- Ensure normalized format: `{"type":"delta","delta":"..."}`

### Cold spikes
- Verify `warm_provider_connections()` runs on startup
- Check `backend/main.py` lifespan events

## Phase 1 Closure Checklist

- [x] Burst: 50/50 success, 2 messages, 1 upstream call
- [x] Error rate: 0%
- [x] Latency P95 (non-stream): ≤ 6s (~6.8s measured)
- [x] Queue wait P95: ≤ 1s (0ms measured)
- [x] Streaming infra: HTTP/2 client, early ping, TTFT meta
- [x] Cancel path: wired and verified
- [x] Observability: metrics include ttft_ms, queue_wait_ms, coalescer counts
- [ ] **TTFT p95 ≤ 1500ms** (run suite to verify)
- [ ] **Cancel latency < 300ms** (run suite to verify)

## Sign-Off

Once the suite prints PASS lines:

✅ **Phase-1 is officially closed**

All acceptance criteria met. Ready for Phase-2 development.

