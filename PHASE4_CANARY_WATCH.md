# Phase 4 Canary Watch Guide (First 24-48h)

## 📊 Dashboard Queries (Quick Reference)

### Latency Monitoring

**Query 1: p95 End-to-End Latency**
```promql
histogram_quantile(0.95, rate(dac_request_latency_seconds_bucket[5m]))
```
**Target**: < 5s
**Alert**: > 7s for 10m

**Query 2: p95 by Provider**
```promql
histogram_quantile(0.95, rate(dac_provider_latency_seconds_bucket{provider=~".+"}[5m])) by (provider)
```
**Watch for**: Provider-specific spikes

**Query 3: Latency vs Fallback Correlation**
```promql
histogram_quantile(0.95, rate(dac_request_latency_seconds_bucket[5m])) 
/ 
rate(dac_fallback_used_total[5m])
```
**Insight**: High latency + high fallback = provider degradation

---

### Reliability Monitoring

**Query 4: Error Rate**
```promql
rate(dac_errors_total[5m]) / rate(dac_requests_total[5m])
```
**Target**: < 1%
**Alert**: > 2% for 5m

**Query 5: Top Error Codes**
```promql
topk(5, sum by (status_code) (rate(dac_errors_total[5m])))
```
**Watch for**: 400s (bad requests), 429s (rate limits), 500s (server errors)

**Query 6: Timeouts vs Provider**
```promql
rate(dac_timeouts_total{provider=~".+"}[5m]) by (provider)
```
**Insight**: Which providers are timing out

---

### Cost Monitoring

**Query 7: Cost per Turn**
```promql
rate(dac_cost_usd_total[15m]) / rate(dac_requests_total[15m])
```
**Target**: < $0.01
**Alert**: > $0.02 for 15m

**Query 8: Tokens per Turn**
```promql
rate(dac_tokens_total[15m]) / rate(dac_requests_total[15m])
```
**Watch for**: Unusual token usage spikes

**Query 9: Cost by Provider**
```promql
sum by (provider) (rate(dac_cost_usd_total[15m]))
```
**Insight**: Routing drift to expensive models

---

### Cache Monitoring

**Query 10: Cache Hit Rate**
```promql
rate(dac_cache_hits_total[30m]) / rate(dac_requests_total[30m])
```
**Target**: > 30%
**Alert**: < 10% for 30m

**Query 11: Cache Hit Rate Trend**
```promql
rate(dac_cache_hits_total[1h]) / rate(dac_requests_total[1h])
```
**Insight**: Declining trend = key drift or normalization gap

---

### Quality Monitoring

**Query 12: Intent Distribution**
```promql
sum by (intent) (rate(dac_requests_total[1h]))
```
**Watch for**: Unusual intent mix

**Query 13: Fallback Usage Rate**
```promql
rate(dac_fallback_used_total[10m]) / rate(dac_requests_total[10m])
```
**Target**: < 5%
**Alert**: > 15% for 10m

---

## 🔍 Quality Sampling

**Random Sample: 20 Turns**
- [ ] Tone consistency (friendly, concise)
- [ ] Context recall (remembers name/project)
- [ ] Refusal correctness (safe, helpful)
- [ ] Intent accuracy (correct routing)

**Sampling Query:**
```sql
SELECT thread_id, intent, provider, model, latency_ms, cache_hit, fallback_used
FROM dac_turns
WHERE timestamp > NOW() - INTERVAL '1 hour'
ORDER BY RANDOM()
LIMIT 20;
```

---

## 🚨 Alert Thresholds Summary

| Metric | Threshold | Duration | Severity |
|--------|-----------|----------|----------|
| Error rate | > 2% | 5m | Critical |
| p95 latency | > 7s | 10m | Warning |
| Fallback usage | > 15% | 10m | Warning |
| Cache hit rate | < 10% | 30m | Warning |
| Cost per turn | > $0.02 | 15m | Warning |

---

## 📈 Golden Signals Dashboard

**Create a single dashboard with:**
1. Error rate (line chart)
2. p95 latency (line chart)
3. Fallback usage % (line chart)
4. Cache hit rate % (line chart)
5. Cost per turn (line chart)
6. Top intents (pie chart)
7. Provider distribution (bar chart)

---

**Last Updated**: 2025-01-XX

