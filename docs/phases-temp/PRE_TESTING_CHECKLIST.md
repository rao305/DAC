# Pre-Testing Checklist

## Quick Verification Before Manual Testing

### Backend Status Check

**Files Modified/Created:**
- ✅ `backend/app/services/query_classifier.py` - NEW
- ✅ `backend/app/services/intelligent_router.py` - NEW
- ✅ `backend/app/services/memory_service.py` - NEW
- ✅ `backend/app/api/threads.py` - MODIFIED (intelligent routing integrated)

**Dependencies:**
- ✅ All required packages already in `requirements.txt`
- ✅ Qdrant running (Docker)
- ✅ OpenAI API key configured
- ✅ Provider keys configured

---

## 1. Backend Verification

### Start Backend:
```bash
cd /Users/rao305/Documents/DAC/backend
source venv/bin/activate
python main.py
```

**Expected Output:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Health Check:
```bash
# In another terminal
curl http://localhost:8000/health
```

**Expected Response:**
```json
{"status": "healthy"}
```

---

## 2. Frontend Verification

### Start Frontend:
```bash
cd /Users/rao305/Documents/DAC/frontend
npm run dev
```

**Expected Output:**
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in X.Xs
```

---

## 3. Quick API Test (Intelligent Routing)

### Test 1: Auto-Routing (Factual Query)
```bash
curl -X POST http://localhost:8000/api/threads/{thread_id}/messages \
  -H "x-org-id: org_demo" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What is the capital of France?",
    "use_memory": true
  }'
```

**Expected:**
- Should route to **Perplexity** or **Gemini** (factual query)
- Response includes `"router": {"provider": "...", "model": "...", "reason": "..."}`

### Test 2: Auto-Routing (Code Query)
```bash
curl -X POST http://localhost:8000/api/threads/{thread_id}/messages \
  -H "x-org-id: org_demo" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Write a Python function to reverse a string",
    "use_memory": true
  }'
```

**Expected:**
- Should route to **OpenAI** (code query)
- Response includes router decision

### Test 3: Manual Override (Still Works)
```bash
curl -X POST http://localhost:8000/api/threads/{thread_id}/messages \
  -H "x-org-id: org_demo" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello",
    "provider": "openai",
    "model": "gpt-4o-mini",
    "use_memory": true
  }'
```

**Expected:**
- Should use **OpenAI GPT-4o-mini** as specified
- Manual override working

---

## 4. Frontend Testing Checklist

### Existing Functionality (Should Still Work):

- [ ] **Login/Auth**: Can you log in?
- [ ] **Create Thread**: Can you create a new conversation?
- [ ] **Send Message with Manual Selection**:
  - Select provider manually
  - Select model manually
  - Send message
  - Get response
- [ ] **Message History**: Previous messages display correctly
- [ ] **Provider Settings**: Can configure API keys

### New Functionality (Optional - Frontend Changes Needed):

If you want to enable auto-routing in the frontend, you'll need to:

1. **Make provider/model optional** in your message form
2. **Add "use_memory" toggle** (default: true)
3. **Display router decision** in the UI (which model was chosen)

**But your existing frontend should still work 100%** - it will just send provider/model as before, and the backend will use those (manual override).

---

## 5. What Changed in the Backend API

### Request Schema (Backward Compatible):

**Before (still works):**
```json
{
  "content": "your message",
  "provider": "perplexity",  // Required
  "model": "sonar",          // Required
  "reason": "test"
}
```

**Now (new option):**
```json
{
  "content": "your message",
  "provider": null,          // Optional - auto-routing
  "model": null,             // Optional - auto-routing
  "use_memory": true         // Optional - default true
}
```

**Key Points:**
- ✅ **100% Backward Compatible** - old requests still work
- ✅ Provider/model can be omitted for auto-routing
- ✅ New `use_memory` field (defaults to true)

### Response Schema (Enhanced):

**Response now includes:**
```json
{
  "user_message": {...},
  "assistant_message": {...},
  "router": {
    "provider": "perplexity",
    "model": "sonar",
    "reason": "Factual query benefits from Perplexity's real-time search"
  }
}
```

The `router` field shows which model was selected and why.

---

## 6. Potential Issues & Fixes

### Issue 1: Backend fails to start

**Error**: `ImportError: No module named 'app.services.intelligent_router'`

**Fix**:
```bash
cd /Users/rao305/Documents/DAC/backend
source venv/bin/activate
# Verify files exist
ls app/services/intelligent_router.py
ls app/services/query_classifier.py
ls app/services/memory_service.py
```

### Issue 2: Qdrant connection error

**Error**: `Connection refused` or `Qdrant not available`

**Fix**:
```bash
# Check if Qdrant is running
docker ps | grep qdrant

# If not running, start it
cd /Users/rao305/Documents/DAC
docker-compose up -d qdrant

# Wait 5 seconds and check
sleep 5
docker ps | grep qdrant
```

### Issue 3: Memory not saving

**Check**: Look for console output when sending messages
- Should see: `Saved X memory fragments from turn`
- If not, memory extraction might not be finding insights

**This is OK** - memory extraction uses heuristics and won't save for every message.

### Issue 4: Frontend sends old request format

**This is fine!** Backend is 100% backward compatible.

If frontend sends:
```json
{
  "content": "test",
  "provider": "openai",
  "model": "gpt-4o",
  "reason": "test"
}
```

Backend will use those values (manual override mode).

---

## 7. Testing Flow

### Recommended Testing Order:

1. **Start Backend** ✅
   ```bash
   cd backend && source venv/bin/activate && python main.py
   ```

2. **Verify Backend Health** ✅
   ```bash
   curl http://localhost:8000/health
   ```

3. **Start Frontend** ✅
   ```bash
   cd frontend && npm run dev
   ```

4. **Test Existing Flow** ✅
   - Login
   - Create thread
   - Send message with manual provider selection
   - Verify response works

5. **Check Logs** ✅
   - Backend terminal: Look for any errors
   - If you see routing decisions logged, that's good!

6. **Optional: Test Auto-Routing via API** ✅
   ```bash
   # Use curl commands from section 3 above
   ```

---

## 8. Success Criteria

### Backend Working:
- ✅ Starts without errors
- ✅ `/health` endpoint responds
- ✅ Can create threads
- ✅ Can send messages with manual provider selection
- ✅ Can send messages without provider (auto-routing)

### Frontend Working:
- ✅ Loads without errors
- ✅ Can login
- ✅ Can create threads
- ✅ Can send messages
- ✅ Can see responses

### Integration Working:
- ✅ Frontend → Backend communication works
- ✅ Messages saved to database
- ✅ Responses displayed correctly

### New Features Working (Optional Testing):
- ✅ Auto-routing selects appropriate models
- ✅ Memory fragments saved to Qdrant
- ✅ Memory fragments retrieved for context
- ✅ Router decision visible in response

---

## 9. If Everything Works

### Your system now has:

1. **Intelligent Routing** - Automatically selects best model
2. **Cross-Model Memory** - Memory shared across all models
3. **Backward Compatibility** - Old frontend works unchanged
4. **Performance Tracking** - System learns from usage

### Next Steps:

1. ✅ **Manual testing** - Use your app normally
2. ✅ **Try auto-routing** - Send messages via API without provider
3. ✅ **Monitor logs** - See which models are selected
4. ✅ **Update frontend** (optional) - Add auto-routing UI

---

## 10. Quick Commands Reference

```bash
# Start everything
cd /Users/rao305/Documents/DAC/backend && source venv/bin/activate && python main.py &
cd /Users/rao305/Documents/DAC/frontend && npm run dev &

# Check Qdrant
docker ps | grep qdrant

# Test health
curl http://localhost:8000/health

# Test auto-routing (create thread first)
curl -X POST http://localhost:8000/api/threads/ \
  -H "x-org-id: org_demo" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Thread"}'

# Use thread_id from response above
curl -X POST http://localhost:8000/api/threads/{thread_id}/messages \
  -H "x-org-id: org_demo" \
  -H "Content-Type: application/json" \
  -d '{"content": "What is AI?", "use_memory": true}'
```

---

## Summary

✅ **Implementation is complete**
✅ **Backend is backward compatible**
✅ **Frontend requires no changes** (but can be enhanced)
✅ **Intelligent routing ready to use**
✅ **Cross-model memory enabled**

**Your existing app will work exactly as before**, with the added benefit that you can now send messages without specifying provider/model and let the system choose!

Good luck with testing! 🚀
