# Phase 4 Common Gotchas (Last Checks)

## ⚠️ Known Issues & Solutions

### 1. Thread IDs

**Issue**: Front-end regenerates `thread_id` on refresh

**Symptom**: Context lost, cache misses, duplicate threads

**Solution**:
```typescript
// frontend: Store thread_id in localStorage
const threadId = localStorage.getItem('current_thread_id') || generateNewThreadId();
localStorage.setItem('current_thread_id', threadId);
```

**Check**: Verify `thread_id` persists across page refreshes

---

### 2. Usage Tokens

**Issue**: Some providers emit usage after stream end

**Symptom**: Missing token counts in logs, incorrect cost estimates

**Solution**:
```python
# backend/app/api/threads.py
async def gen():
    full_text_parts = []
    usage_data = {}  # Collect usage
    
    try:
        async for chunk in stream_iter:
            # Collect usage if present
            if chunk.get("type") == "meta" and "usage" in chunk:
                usage_data.update(chunk["usage"])
            # ... stream chunks
    
    finally:
        # Usage may arrive after stream end
        # Wait a bit for final usage data
        await asyncio.sleep(0.1)
        # Normalize and log
        usage = normalize_usage(usage_data, provider)
```

**Check**: Verify tokens captured in `finally` block

---

### 3. Double Streams

**Issue**: Nested yields across fallbacks create double SSE headers

**Symptom**: Client receives malformed SSE, connection errors

**Solution**:
```python
# Ensure only ONE SSE channel per request
# Fallback should return stream iterator, not yield directly
async def call_with_fallback(...):
    # Return stream iterator, don't yield
    return {"stream": stream_iter, ...}

# In endpoint, yield from single iterator
async def gen():
    async for chunk in stream_iter:  # Single source
        yield sse_event({"delta": chunk}, event="delta")
```

**Check**: Verify single `StreamingResponse` per request

---

### 4. Cache Pollution

**Issue**: Same prompt with different intents gets same cache key

**Symptom**: Wrong responses cached, context confusion

**Solution**:
```python
# Include intent in cache key
cache_key = make_cache_key(
    thread_id=thread_id,
    user_text=user_text,
    intent=intent  # Include intent
)
```

**Check**: Verify intent included in cache key generation

---

## 🔍 Pre-Launch Verification

- [ ] Thread IDs persist across refreshes
- [ ] Usage tokens captured in `finally` block
- [ ] Single SSE stream per request (no nested yields)
- [ ] Intent included in cache key
- [ ] All gotchas documented and tested

---

## 📝 Testing Checklist

**Test Thread ID Persistence:**
1. Create thread
2. Refresh page
3. Verify same `thread_id` used

**Test Usage Tokens:**
1. Send request
2. Check logs for `input_tokens` and `output_tokens`
3. Verify cost calculated correctly

**Test Double Streams:**
1. Force fallback scenario
2. Check SSE response format
3. Verify single continuous stream

**Test Cache Pollution:**
1. Send same prompt with different intents
2. Verify different cache keys
3. Verify correct responses

---

**Last Updated**: 2025-01-XX

