---
title: Phase 4 Chaos Drills (5 Minutes Each)
summary: Documentation file
last_updated: '2025-11-12'
owner: DAC
tags:
- dac
- docs
---

# Phase 4 Chaos Drills (5 Minutes Each)

## 🧪 Quick Chaos Tests

### Drill 1: Provider Outage
**Duration**: 5 minutes  
**Goal**: Verify fallback ladder engages smoothly

**Steps:**
1. Disable primary provider in router config (e.g., set Gemini to invalid API key)
2. Send test request that would normally route to Gemini
3. **Verify**:
   - [ ] Fallback provider engaged (check logs)
   - [ ] SSE stream remains continuous (no double headers)
   - [ ] Single response (not two separate streams)
   - [ ] Observability logged with `fallback_used=True`
   - [ ] No errors to client

**Rollback**: Re-enable primary provider

---

### Drill 2: Slowdown/Timeout
**Duration**: 5 minutes  
**Goal**: Verify timeout handling and fallback

**Steps:**
1. Inject 5s delay in provider adapter (temporarily)
2. Send test request with 12s timeout
3. **Verify**:
   - [ ] Timeout triggers after 12s
   - [ ] Fallback provider engaged
   - [ ] Graceful error message (if all fail)
   - [ ] No hanging connections
   - [ ] Observability logged correctly

**Rollback**: Remove delay injection

---

### Drill 3: Cache Storm
**Duration**: 5 minutes  
**Goal**: Verify cache deduplication and hit rate

**Steps:**
1. Send same prompt across 20 different threads
2. **Verify**:
   - [ ] First request hits provider (cache miss)
   - [ ] Subsequent 19 requests hit cache (cache hit)
   - [ ] No thundering herd (only 1 provider call)
   - [ ] Cache hit rate increases
   - [ ] All responses identical

**Expected**: 1 provider call, 19 cache hits

---

## 🔧 Implementation Notes

### Provider Outage Simulation
```python
# Temporarily disable provider in router
# backend/app/api/router.py
if provider == ProviderType.GEMINI:
    # Simulate outage
    raise ValueError("Provider unavailable")
```

### Slowdown Injection
```python
# Temporarily add delay in adapter
# backend/app/adapters/gemini.py
import asyncio
await asyncio.sleep(5)  # Inject 5s delay
```

### Cache Storm Test
```bash
# Send same prompt to 20 threads
for i in {1..20}; do
  curl -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "{\"thread_id\": \"test-$i\", \"prompt\": \"hello there\"}" &
done
wait
```

---

## ✅ Success Criteria

**All drills pass if:**
- [ ] Fallback engages without errors
- [ ] SSE streams remain continuous
- [ ] No client-facing errors
- [ ] Observability logs correctly
- [ ] System recovers automatically

---

**Frequency**: Run before canary, then weekly
**Last Updated**: 2025-01-XX

