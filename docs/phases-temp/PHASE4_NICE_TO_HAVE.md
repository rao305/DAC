# Phase 4 Nice-to-Have Features (If Time Permits)

## 🎯 Optional Enhancements

### 1. Per-Intent Budgets

**Feature**: Daily token ceilings per intent

**Implementation**:
```python
# backend/app/services/budget_manager.py
INTENT_BUDGETS = {
    "social_chat": 100_000,  # tokens/day
    "coding_help": 500_000,
    "qa_retrieval": 300_000,
    # ...
}

def check_budget(org_id: str, intent: str, tokens: int) -> bool:
    daily_usage = get_daily_usage(org_id, intent)
    budget = INTENT_BUDGETS.get(intent, 200_000)
    
    if daily_usage >= budget:
        return False  # Hard stop
    
    if daily_usage >= budget * 0.80:
        # Soft warn at 80%
        log_warning(f"Budget 80% reached for {intent}")
    
    return True
```

**Benefit**: Cost control per use case

---

### 2. PII Opt-Out Header

**Feature**: `X-DAC-Store: none` disables server-side memory

**Implementation**:
```python
# backend/app/api/threads.py
store_memory = request.headers.get("X-DAC-Store", "default") != "none"

if store_memory:
    add_turn(thread_id, Turn(...))
    # Normal flow
else:
    # Skip memory storage
    # Still process request, but don't persist
```

**Benefit**: Privacy for sensitive chats

---

### 3. DR Snapshot

**Feature**: Export configs + pricing tables for disaster recovery

**Implementation**:
```bash
# scripts/dr_snapshot.sh
#!/bin/bash
# Export critical configs
tar -czf dr_snapshot_$(date +%Y%m%d).tar.gz \
  backend/config/ \
  backend/app/services/model_registry.py \
  backend/app/services/fallback_ladder.py \
  pricing_table.json

# Restore rehearsal
# 1. Extract snapshot
# 2. Restore configs
# 3. Verify system works
```

**Benefit**: Quick recovery from config loss

---

## 📋 Priority Order

1. **Per-Intent Budgets** (High value, medium effort)
2. **PII Opt-Out Header** (High value, low effort)
3. **DR Snapshot** (Medium value, low effort)

---

**Last Updated**: 2025-01-XX

