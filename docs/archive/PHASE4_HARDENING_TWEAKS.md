---
title: Phase 4 Hardening Tweaks (Drop-in Policies)
summary: Documentation file
last_updated: '2025-11-12'
owner: DAC
tags:
- dac
- docs
---

# Phase 4 Hardening Tweaks (Drop-in Policies)

## 🔒 Production Hardening

### 1. Intent Caps (Small Model First)

**Policy**: Ambiguous queries → small model first; escalate only on low confidence

**Implementation**:
```python
# backend/app/api/router.py
if intent == "ambiguous_or_other":
    # Try small model first
    provider = ProviderType.PERPLEXITY
    model = "sonar"  # Small, fast
    confidence = estimate_confidence(message)
    
    if confidence < 0.5:
        # Low confidence → escalate to better model
        provider = ProviderType.GEMINI
        model = "gemini-1.5-flash"
```

**Benefit**: Reduces cost for ambiguous queries

---

### 2. Summarization Guard

**Policy**: Summarize at 70% of model's context, not at OOM

**Implementation**:
```python
# backend/app/services/memory_manager.py
def should_summarize(thread: Thread, model_context: int) -> bool:
    current_tokens = estimate_tokens(thread.turns)
    threshold = int(model_context * 0.70)  # 70% threshold
    return current_tokens > threshold
```

**Benefit**: Prevents OOM errors, maintains quality

---

### 3. Prompt-Injection Rule

**Policy**: Never follow instructions from quoted/user-provided docs without explicit user confirmation

**Implementation**:
```python
# backend/app/services/guardrails.py
def detect_quoted_instructions(text: str) -> bool:
    # Detect quoted blocks with instructions
    patterns = [
        r'```.*?(?:ignore|forget|system|assistant).*?```',
        r'["\'].*?(?:ignore|forget|system|assistant).*?["\']',
    ]
    return any(re.search(p, text, re.IGNORECASE | re.DOTALL) for p in patterns)

# In sanitize_user_input:
if detect_quoted_instructions(text):
    # Require explicit confirmation
    return "I see instructions in your message. Please confirm you want me to follow them."
```

**Benefit**: Prevents prompt injection attacks

---

### 4. Content Safety

**Policy**: Short, friendly refusal + safer alt by default

**Implementation**:
```python
# backend/app/services/guardrails.py
def generate_safety_refusal(reason: str) -> str:
    """Generate safe refusal with alternative."""
    refusals = {
        "prompt_injection": "I can't process requests that try to override my instructions. How can I help you in a different way?",
        "unsafe_content": "I can't help with that request. Is there something else I can assist you with?",
        "pii_detected": "I noticed sensitive information in your message. For your privacy, please rephrase without personal details.",
    }
    return refusals.get(reason, "I can't help with that request. Is there something else I can assist you with?")
```

**Benefit**: User-friendly safety responses

---

## 📋 Implementation Checklist

- [ ] Intent caps implemented (small model first)
- [ ] Summarization guard at 70% threshold
- [ ] Prompt-injection detection active
- [ ] Content safety refusals tested
- [ ] All policies documented

---

**Last Updated**: 2025-01-XX

