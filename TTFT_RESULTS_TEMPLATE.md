# TTFT Test Results Template

Run `./run_ttft_suite.sh` and copy the results below.

## Test Configuration

- **Provider**: perplexity
- **Model**: llama-3.1-sonar-small-128k-online
- **Samples**: 20 (parallel 5)
- **Pacer Settings**: PERPLEXITY_RPS=5, PERPLEXITY_CONCURRENCY=5

## Results

### TTFT P95 Measurement
```
TTFT ms (all): [___]
TTFT p95: ___ ms
TTFT min: ___ ms
TTFT max: ___ ms
TTFT avg: ___ ms
```

### Cancel Test
```
Client abort at ___ ms
✅ Cancel completed at ___ ms
✅ PASS: Cancel time < 300ms
```

### Metrics API Cross-check
```json
{
  "ttft_ms": {
    "p50": ___,
    "p95": ___,
    "p99": ___,
    "min": ___,
    "max": ___,
    "count": ___
  },
  "queue_wait_ms": {
    "p95": ___
  }
}
```

## Sign-Off

Copy these lines to `PHASE1_GO_NO_GO.md`:

- TTFT (streaming) p95: ___ ms (target ≤ 1,500 ms) — PASS/FAIL
- Cancel latency: ___ ms (target < 300 ms) — PASS/FAIL
- Queue wait p95 (TTFT run): ___ ms — OK/CHECK

