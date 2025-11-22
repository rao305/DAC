---
title: Phase 4 Ops Runbook Quick Card
summary: Documentation file
last_updated: '2025-11-12'
owner: DAC
tags:
- dac
- docs
---

# Phase 4 Ops Runbook Quick Card

## 📊 Grafana Panels to Pin

### Panel 1: Error Rate
**Query**: `rate(dac_errors_total[5m]) / rate(dac_requests_total[5m])`  
**Type**: Line chart  
**Alert**: > 2% for 5m → Critical

### Panel 2: p95 Latency
**Query**: `histogram_quantile(0.95, rate(dac_request_latency_seconds_bucket[5m]))`  
**Type**: Line chart  
**Alert**: > 7s for 10m → Warning

### Panel 3: Fallback Usage
**Query**: `rate(dac_fallback_used_total[10m]) / rate(dac_requests_total[10m])`  
**Type**: Line chart  
**Alert**: > 15% for 10m → Warning

### Panel 4: Cache Hit Rate
**Query**: `rate(dac_cache_hits_total[30m]) / rate(dac_requests_total[30m])`  
**Type**: Line chart  
**Alert**: < 10% for 30m → Warning

### Panel 5: Cost per Turn
**Query**: `rate(dac_cost_usd_total[15m]) / rate(dac_requests_total[15m])`  
**Type**: Line chart  
**Alert**: > $0.02 for 15m → Warning

### Panel 6: Intent Distribution
**Query**: `sum by (intent) (rate(dac_requests_total[1h]))`  
**Type**: Pie chart  
**Watch**: Unusual intent mix

### Panel 7: Provider Distribution
**Query**: `sum by (provider) (rate(dac_requests_total[1h]))`  
**Type**: Bar chart  
**Watch**: Routing drift

---

## 🔍 6 Copy-Paste Queries for On-Call

### Query 1: What's the error rate?
```promql
rate(dac_errors_total[5m]) / rate(dac_requests_total[5m])
```

### Query 2: Which provider is slow?
```promql
histogram_quantile(0.95, rate(dac_provider_latency_seconds_bucket[5m])) by (provider)
```

### Query 3: Why are we using fallbacks?
```promql
sum by (provider, reason) (rate(dac_fallback_used_total[10m]))
```

### Query 4: What's costing the most?
```promql
sum by (provider, model) (rate(dac_cost_usd_total[1h]))
```

### Query 5: Is cache working?
```promql
rate(dac_cache_hits_total[30m]) / rate(dac_requests_total[30m])
```

### Query 6: What intents are failing?
```promql
sum by (intent, status_code) (rate(dac_errors_total[5m]))
```

---

## 🚨 Quick Actions

### Rollback
```bash
export DAC_SSE_V2=0
# Restart backend
```

### Check Cache
```bash
# View cache stats
python3 -c "from app.services.response_cache import get_cache_stats; print(get_cache_stats())"
```

### Force Provider Outage Test
```bash
# Temporarily disable provider in router config
# Test fallback engagement
```

### View Recent Logs
```bash
tail -f logs/dac_backend.log | grep -E "(ERROR|WARN|fallback_used)"
```

---

## 📞 Escalation

**P0 (Critical)**: Error rate > 2% for 5m
- Page on-call immediately
- Check dashboards
- Consider rollback

**P1 (Warning)**: Latency > 7s, fallback > 15%, cost > $0.02
- Warn in Slack channel
- Investigate root cause
- Monitor for 15m before escalating

**P2 (Info)**: Cache hit < 10%, unusual intent mix
- Log for review
- Investigate during business hours

---

## 🔗 Quick Links

- **Runbook**: `PHASE4_INCIDENT_RUNBOOK.md`
- **Dashboard**: [Grafana Link]
- **Alerts**: [Prometheus Link]
- **Logs**: [Log Aggregation Link]

---

**Print this card and keep it handy for on-call shifts**

**Last Updated**: 2025-01-XX

