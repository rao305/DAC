# TTFT Verification - Quick Start

Complete verification suite for Time To First Token (TTFT) performance.

## One-Time Setup

```bash
# Set pacer limits (zero queue wait for TTFT)
source prep_ttft_test.sh

# Restart your backend server
cd backend
python main.py
```

**After testing, restore production settings:**
```bash
source restore_prod_settings.sh
# Restart backend
```

## Run Complete Suite

```bash
./run_ttft_suite.sh
```

This runs:
1. ✅ Smoke test (early bytes)
2. ✅ TTFT p95 measurement (20 samples)
3. ✅ Cancel test (<300ms)
4. ✅ Metrics cross-check

## Individual Tests

### Smoke Test
```bash
./smoke_ttft.sh
```
Verifies immediate `event: ping` and first delta.

### TTFT P95
```bash
node sse_ttft_p95.mjs
```
Measures TTFT p95 with 20 samples (parallel 5).

### Cancel Test
```bash
node cancel_quick.mjs
```
Verifies cancellation completes in <300ms.

### Quick Diagnosis
```bash
./diagnose_ttft_quick.sh
```
Fast triage if TTFT > 1.5s.

## CI Integration

Add to your CI pipeline:

```bash
./check_ttft_ci.sh
```

Fails if TTFT p95 > 1500ms.

## Results

After running the suite, copy the results to `PHASE1_GO_NO_GO.md`:

```
• TTFT (streaming) p95: ___ ms (target ≤ 1,500 ms) — PASS/FAIL
• Cancel latency: ___ ms (target < 300 ms) — PASS/FAIL
• Queue wait p95 (TTFT run): ___ ms — OK/CHECK
```

## Troubleshooting

If TTFT > 1.5s, check in order:

1. **Headers/buffering**: Run `./diagnose_ttft_quick.sh` step 1
2. **Streaming enabled**: Verify multiple `event: delta` frames
3. **Shared client**: Check adapters use `get_client()` from `_client.py`
4. **Pacer blocking**: Check `queue_wait_ms.p95` (should be ≈0)
5. **Model choice**: Use fastest model (e.g., `llama-3.1-sonar-small-128k-online`)

## Files

- `prep_ttft_test.sh` - One-time environment setup
- `run_ttft_suite.sh` - Complete verification suite
- `smoke_ttft.sh` - Early bytes smoke test
- `sse_ttft_p95.mjs` - TTFT p95 measurement
- `cancel_quick.mjs` - Cancel latency test
- `diagnose_ttft_quick.sh` - Quick diagnosis
- `check_ttft_ci.sh` - CI guardrail

