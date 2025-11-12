---
title: Phase 4 Day-2 Operations (Weekly Rhythm)
summary: Documentation file
last_updated: '2025-11-12'
owner: DAC
tags:
- dac
- docs
---

# Phase 4 Day-2 Operations (Weekly Rhythm)

## 📅 Weekly Operations Schedule

### Nightly (Automated)

**Smoke Evaluation**
- **Time**: 02:00 UTC (nightly)
- **Script**: `scripts/smoke_eval.js`
- **Action**: Treat any red as blocking
- **Threshold**: 8/8 tests must pass

**Status Check**:
```bash
# Check last run
cat logs/smoke_eval_$(date +%Y%m%d).log

# Manual run
node scripts/smoke_eval.js
```

---

### Weekly (Sunday 02:00 UTC)

**Metrics Rollup**
- **Script**: `scripts/weekly_rollup.sh`
- **Output**: Weekly metrics report
- **Review**: Intent mix, latency, cost, fallbacks

**Report Includes**:
- Intent distribution
- p95 latency per provider
- Cost per user
- Top fallback reasons
- Cache hit rate trend

---

### Regression Gates

**Quality Thresholds** (Must pass or rollback):
- [ ] Intent accuracy ≥ 95%
- [ ] p95 latency < 5s
- [ ] Task accuracy ≥ 80%
- [ ] Cost per turn ≤ $0.01

**Action on Failure**:
1. Investigate root cause
2. Apply patch or rollback
3. Re-run tests
4. Document in incident log

---

## 🔍 Weekly Review Checklist

### Monday Morning Review

- [ ] Review weekend metrics rollup
- [ ] Check for anomalies:
  - [ ] Unusual intent mix
  - [ ] Latency spikes
  - [ ] Cost increases
  - [ ] Fallback usage spikes
- [ ] Review top errors from past week
- [ ] Check cache hit rate trend

### Weekly Deep Dive

- [ ] Sample 50 random turns for quality
- [ ] Review fallback usage patterns
- [ ] Analyze cost by provider/model
- [ ] Check for routing drift
- [ ] Review incident logs

---

## 📊 Weekly Metrics Dashboard

**Create weekly dashboard with:**
1. Intent distribution (week over week)
2. p95 latency trend (by provider)
3. Cost per user (trend)
4. Fallback usage (top reasons)
5. Cache hit rate (trend)
6. Error rate (trend)
7. Top 10 most expensive requests

---

## 🚨 Escalation Path

**If thresholds fail:**
1. **Immediate**: Check dashboards for root cause
2. **15 min**: Apply mitigation (rollback, config change)
3. **1 hour**: Deep dive investigation
4. **24 hours**: Postmortem if unresolved

---

**Last Updated**: 2025-01-XX

