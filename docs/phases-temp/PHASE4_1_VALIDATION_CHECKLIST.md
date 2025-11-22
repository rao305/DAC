# Phase 4.1 — Behavioral Intelligence Validation Checklist

**Release**: v4.1.0 "Behavioral Intelligence"  
**Date**: 2025-01-XX  
**Status**: ⏳ Pending QA Sign-Off

## Overview

This checklist validates two critical behavioral fixes:
1. **Social greetings** → DAC persona (no dictionary definitions, no citations)
2. **Time-sensitive queries** → Real-time multi-search with synthesis

---

## ✅ Test 1: Greeting Flow

### Test Case 1.1: Basic Greeting
**Input**: `hi` or `hello there`  
**Expected**:
- ✅ Friendly DAC greeting (1-2 sentences)
- ✅ No citations `[1][2][3]`
- ✅ No dictionary definitions
- ✅ Optional light follow-up question
- ✅ Intent: `social_chat`
- ✅ Provider: `openai` / Model: `gpt-4o-mini`
- ✅ Pipeline: `direct_llm` (NOT `web_multisearch`)

**Logs to Verify**:
```json
{
  "intent": "social_chat",
  "provider": "openai",
  "model": "gpt-4o-mini",
  "pipeline": "direct_llm",
  "behavior": "chat_only"
}
```

**Pass/Fail**: ⬜

---

### Test Case 1.2: Conversational Follow-up
**Input**: `how are you?`  
**Expected**:
- ✅ Warm, conversational response (1-2 sentences)
- ✅ Maintains DAC tone
- ✅ No citations
- ✅ Intent: `social_chat`

**Pass/Fail**: ⬜

---

### Test Case 1.3: Context Switch (Definition Request)
**Input**: `define "hi there"`  
**Expected**:
- ✅ Definition provided (user explicitly asked)
- ✅ Citation included (definition request = factual query)
- ✅ Intent switches to `qa_retrieval`
- ✅ Provider may change to Perplexity

**Pass/Fail**: ⬜

**Notes**: This confirms the system correctly distinguishes between greeting and definition requests.

---

## ✅ Test 2: Real-Time Multi-Search

### Test Case 2.1: Time-Sensitive Query (Place + Time)
**Input**: `what happened in delhi india two days ago`  
**Expected**:
- ✅ Multi-source summary (3-6 bullet points)
- ✅ Dates included in bullets
- ✅ Short recency note if coverage is limited
- ✅ Citations list not empty (logged)
- ✅ Intent: `qa_retrieval`
- ✅ Pipeline: `web_multisearch`
- ✅ Provider: `web+openai`

**Logs to Verify**:
```json
{
  "intent": "qa_retrieval",
  "pipeline": "web_multisearch",
  "provider": "web+openai",
  "model": "gpt-4o-mini",
  "citations": ["url1", "url2", ...],
  "fallback_used": false
}
```

**Pass/Fail**: ⬜

---

### Test Case 2.2: Time-Sensitive Query (Topic + Time)
**Input**: `what's new in ai this week`  
**Expected**:
- ✅ Same multi-search path triggered
- ✅ Aggregated summary from multiple sources
- ✅ Recent events (last 7 days)
- ✅ Citations present

**Pass/Fail**: ⬜

---

### Test Case 2.3: Non-Time-Sensitive Retrieval (Control)
**Input**: `who is the chief minister of delhi`  
**Expected**:
- ✅ Falls back to `direct_llm` pipeline
- ✅ NOT `web_multisearch` (no time indicators)
- ✅ Standard retrieval answer
- ✅ May use Perplexity or other provider

**Logs to Verify**:
```json
{
  "intent": "qa_retrieval",
  "pipeline": "direct_llm",
  "provider": "perplexity" // or other
}
```

**Pass/Fail**: ⬜

**Notes**: Confirms time-sensitive detection doesn't trigger false positives.

---

## ✅ Test 3: Tone Consistency (Long Conversation)

### Test Case 3.1: Multi-Turn Conversation
**Sequence**:
1. User: `hi there`
2. User: `can you code a function that prints today's date?`
3. User: `explain it`
4. User: `btw what happened in delhi india two days ago`

**Expected**:
- ✅ Turn 1: Friendly greeting (social_chat, OpenAI)
- ✅ Turn 2: Code generation (coding_help, Gemini/OpenAI)
- ✅ Turn 3: Explanation (qa_retrieval, direct_llm)
- ✅ Turn 4: Multi-search summary (qa_retrieval, web_multisearch)
- ✅ Each response maintains DAC tone
- ✅ Context remembered across turns
- ✅ No provider/model names exposed

**Pass/Fail**: ⬜

**Notes**: Verify memory/context continuity in logs.

---

## ✅ Test 4: Regression Tests

### Test Case 4.1: Editing/Writing Intent
**Input**: `edit this email: hey team we shipped!`  
**Expected**:
- ✅ Intent: `editing/writing`
- ✅ Improved text returned
- ✅ Key changes noted
- ✅ No behavioral regression

**Pass/Fail**: ⬜

---

### Test Case 4.2: Reasoning/Math Intent
**Input**: `solve: 2x + 5 = 11`  
**Expected**:
- ✅ Intent: `reasoning/math`
- ✅ Step-by-step logic shown
- ✅ Final answer provided
- ✅ Provider: OpenAI (reasoning specialist)

**Pass/Fail**: ⬜

---

### Test Case 4.3: Coding Help Intent
**Input**: `make this code faster` (with code context)  
**Expected**:
- ✅ Intent: `coding_help`
- ✅ Optimized code provided
- ✅ Explanation included
- ✅ Provider: Gemini or OpenAI

**Pass/Fail**: ⬜

---

### Test Case 4.4: Context Recall
**Input**: `what were we working on again?` (after previous conversation)  
**Expected**:
- ✅ Recalls previous context (e.g., "Alex" + "Python project")
- ✅ 1-2 sentence summary
- ✅ Intent: `social_chat` or `qa_retrieval` (context-dependent)

**Pass/Fail**: ⬜

---

## ✅ Test 5: Observability & Logging

### Test Case 5.1: Log Structure
**Check**: `observability.log_turn()` output for time-sensitive query

**Expected Fields**:
```json
{
  "intent": "qa_retrieval",
  "provider": "web+openai",
  "model": "gpt-4o-mini",
  "latency_ms": <numeric_value>,
  "cache_hit": false,
  "fallback_used": false,
  "safety_flags": [],
  "pipeline": "web_multisearch",
  "citations": ["url1", "url2"]
}
```

**Pass/Fail**: ⬜

---

### Test Case 5.2: OTEL Spans
**Check**: OpenTelemetry spans include:
- ✅ `dac.intent` attribute
- ✅ `dac.provider` attribute
- ✅ `dac.pipeline` attribute (for web_multisearch)

**Pass/Fail**: ⬜

---

### Test Case 5.3: Grafana Metrics
**Check**: Grafana dashboard shows:
- ✅ New intent: `social_chat` (count > 0)
- ✅ New pipeline: `web_multisearch` (count > 0)
- ✅ Provider breakdown includes `web+openai`

**Pass/Fail**: ⬜

---

## ✅ Test 6: Performance & Cost

### Test Case 6.1: Latency
**Expected**:
- ✅ Greeting response: < 2 seconds
- ✅ Time-sensitive multi-search: < 8 seconds
- ✅ Non-time-sensitive retrieval: < 3 seconds

**Pass/Fail**: ⬜

---

### Test Case 6.2: Cost Per Turn
**Expected**:
- ✅ Greeting: < $0.001 (OpenAI mini, ~50 tokens)
- ✅ Multi-search: < $0.01 (Perplexity search + OpenAI synthesis)
- ✅ Average cost per turn: < $0.005

**Pass/Fail**: ⬜

**Notes**: Multi-search adds 1 search call + 1 synthesis call, but should remain cost-effective.

---

## 🚀 Pre-Deployment Checklist

- [ ] All test cases above pass
- [ ] No linter errors
- [ ] No new exceptions in logs
- [ ] Grafana metrics look healthy
- [ ] Cost metrics within budget
- [ ] Performance metrics acceptable

---

## 📋 Deployment Steps

1. **Run Post-Deploy Sanity**:
   ```bash
   ./scripts/post_deploy_sanity.sh
   ```

2. **Monitor Grafana**:
   - Watch for new intents (`social_chat`, `qa_retrieval:web_multisearch`)
   - Check error rates
   - Monitor latency percentiles

3. **Cost Verification**:
   - Confirm cost per turn < $0.01
   - Track multi-search usage
   - Verify no cost spikes

4. **Stability Period**:
   - Monitor for 24 hours
   - Check error logs
   - Verify user feedback

5. **Merge & Tag**:
   ```bash
   git tag v4.1.0-behavioral-intelligence
   git push origin v4.1.0-behavioral-intelligence
   ```

---

## 📝 Sign-Off

**QA Engineer**: _________________ **Date**: ________  
**Engineering Lead**: _________________ **Date**: ________  
**Product Owner**: _________________ **Date**: ________

---

## 🐛 Known Issues / Notes

_Add any discovered issues or notes here during testing._

---

## ✅ Success Criteria

Phase 4.1 is considered successful when:

1. ✅ Greetings feel natural and conversational (no dictionary definitions)
2. ✅ Time-sensitive queries return real-time, multi-source summaries
3. ✅ DAC maintains consistent personality across all intents
4. ✅ No regression in existing functionality
5. ✅ Observability provides clear visibility into routing decisions
6. ✅ Cost and performance remain within acceptable bounds

---

**End of Validation Checklist**

