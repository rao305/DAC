# Phase 4 Incident Runbook

## Quick Reference

**On-Call Contact**: [Your team contact]
**Slack Channel**: #dac-incidents
**Incident Template**: [Link to template]

---

## Common Symptoms & Immediate Actions

### 1. Timeouts / High Latency Spikes

**Symptoms:**
- P95 latency > 5s
- Timeout errors in logs
- User reports of slow responses

**Immediate Actions:**
1. Check provider status (OpenAI, Gemini, Perplexity dashboards)
2. Switch to fallback ladder (enable in router config)
3. Increase cache TTL (reduce load on providers)
4. Lower concurrency limits (rate limiting)
5. Check for DDoS or unusual traffic patterns

**Escalation:**
- If > 50% requests timing out → Enable maintenance mode
- If specific provider down → Route all traffic away from that provider

---

### 2. 400/401 Errors (Provider API Issues)

**Symptoms:**
- 400 Bad Request errors
- 401 Unauthorized errors
- Provider-specific failures

**Immediate Actions:**
1. Check API key validity (test endpoint)
2. Verify rate limits not exceeded
3. Check provider status page
4. Switch to fallback provider immediately
5. Mask PII in error logs

**Escalation:**
- If all providers failing → Enable graceful degradation mode
- If API key issue → Rotate keys immediately

---

### 3. Provider Outage

**Symptoms:**
- All requests to provider timing out
- Provider status page shows outage
- 503 errors from provider

**Immediate Actions:**
1. **Immediately**: Route all traffic to fallback provider
2. Update router config to skip affected provider
3. Increase cache TTL to reduce load
4. Notify team in #dac-incidents
5. Monitor fallback provider for overload

**Recovery:**
- Wait for provider status to return to normal
- Gradually re-enable provider (start with 10% traffic)
- Monitor for stability before full re-enable

---

### 4. Cost Spike / Budget Exceeded

**Symptoms:**
- Cost metrics > budget threshold
- Unusual token usage patterns
- Provider billing alerts

**Immediate Actions:**
1. Enable response caching (if not already)
2. Switch to cheaper models (small-model-first routing)
3. Reduce max_tokens limits
4. Increase cache TTL
5. Review recent high-cost requests

**Escalation:**
- If cost > 2x budget → Enable cost-only mode (cheapest models)
- If suspicious usage → Enable rate limiting

---

### 5. Quality Degradation

**Symptoms:**
- Intent accuracy < 95%
- User complaints about wrong responses
- Tone drift detected

**Immediate Actions:**
1. Check recent system prompt changes
2. Review router decisions (are wrong models being used?)
3. Check for provider model changes
4. Run quality regression suite
5. Review recent deployments

**Escalation:**
- If accuracy < 90% → Rollback to previous version
- If tone drift > 20% → Review persona prompts

---

### 6. Safety / Abuse Incident

**Symptoms:**
- PII detected in logs
- Prompt injection attempts
- Content filter violations

**Immediate Actions:**
1. **Immediately**: Block offending user/IP
2. Mask PII in all logs
3. Review guardrail logs
4. Check for data leakage
5. Notify security team

**Escalation:**
- If PII exposed → Incident response protocol
- If systematic abuse → Enable stricter guardrails

---

## Incident Response Workflow

### Step 1: Triage (0-5 minutes)
1. Identify symptom category
2. Check dashboards (latency, errors, cost)
3. Review recent logs
4. Determine severity (P0/P1/P2)

### Step 2: Immediate Actions (5-15 minutes)
1. Execute immediate actions from runbook
2. Enable fallback/circuit breakers
3. Notify team in Slack
4. Update status page if needed

### Step 3: Investigation (15-60 minutes)
1. Review logs and metrics
2. Check provider status
3. Identify root cause
4. Document findings

### Step 4: Resolution (varies)
1. Apply fix (config change, rollback, etc.)
2. Verify fix works (monitor metrics)
3. Gradually restore normal operation
4. Document incident

### Step 5: Postmortem (within 24 hours)
1. Review timeline
2. Identify root cause
3. Document lessons learned
4. Update runbook if needed
5. Create follow-up tasks

---

## Configuration Quick Fixes

### Enable Fallback Ladder
```python
# In router config
FALLBACK_ENABLED = True
```

### Increase Cache TTL
```python
# In response_cache.py
CACHE_TTL_SECONDS = 7200  # 2 hours
```

### Lower Concurrency
```python
# In rate limiter
MAX_CONCURRENT_REQUESTS = 10  # Reduce from default
```

### Switch to Cheapest Models
```python
# In router
SMALL_MODEL_FIRST = True
```

### Enable Maintenance Mode
```python
# Return maintenance message for all requests
MAINTENANCE_MODE = True
```

---

## Monitoring Dashboards

**Key Metrics to Watch:**
- P95 latency (target: < 5s)
- Error rate (target: < 1%)
- Cache hit rate (target: > 30%)
- Cost per turn (target: < $0.01)
- Intent accuracy (target: > 95%)

**Alerts:**
- P95 latency > 5s → P1 alert
- Error rate > 5% → P0 alert
- Cost spike > 2x → P1 alert
- Provider outage → P0 alert

---

## Postmortem Checklist

- [ ] Timeline documented
- [ ] Root cause identified
- [ ] Impact assessed (users affected, duration)
- [ ] Fix applied and verified
- [ ] Prevention measures identified
- [ ] Runbook updated if needed
- [ ] Follow-up tasks created
- [ ] Team notified of resolution

---

## Contact Information

**On-Call Engineer**: [Contact]
**Backup On-Call**: [Contact]
**Security Team**: [Contact]
**Provider Support**: 
- OpenAI: support@openai.com
- Gemini: [Support contact]
- Perplexity: [Support contact]

---

**Last Updated**: 2025-01-XX
**Version**: 1.0

