---
title: Phase 1 Smoke Test Checklist
summary: Documentation file
last_updated: '2025-11-12'
owner: DAC
tags:
- dac
- docs
---

# Phase 1 Smoke Test Checklist

Quick reference for testing all Phase 1 implemented features.

## Backend API Tests

### Thread Management
- [ ] POST `/api/threads/` - Create new thread
  - Payload: `{"title": "Test Thread", "description": "Test description"}`
  - Expected: 200, returns thread_id
  
- [ ] POST `/api/threads/{thread_id}/messages` - Send message to thread
  - Payload: `{"content": "Hello", "provider": "perplexity", "model": "...", "reason": "...", "role": "user"}`
  - Expected: 200, returns user_message + assistant_message
  
- [ ] GET `/api/threads/{thread_id}` - Retrieve thread with messages
  - Expected: 200, returns all messages with sequence ordering
  
- [ ] GET `/api/threads/{thread_id}/audit` - Get audit trail
  - Expected: 200, returns audit entries (up to 25)

### Provider Management
- [ ] POST `/api/orgs/org_demo/providers` - Save provider API key
  - Payload: `{"provider": "perplexity", "api_key": "...", "key_name": "..."}`
  - Expected: 200, masked key returned
  
- [ ] GET `/api/orgs/org_demo/providers/status` - Get provider status
  - Expected: 200, shows configured providers with usage metrics
  
- [ ] POST `/api/orgs/org_demo/providers/test` - Test provider connection
  - Payload: `{"provider": "perplexity"}`
  - Expected: 200, success flag + connection test result

### Routing
- [ ] POST `/api/router/choose` - Get provider recommendation
  - Payload: `{"message": "What's the latest news?", "context_size": 0}`
  - Expected: 200, returns provider + model + reason
  - Test each rule:
    - [ ] Web query (search/latest/recent) → Perplexity
    - [ ] Code/JSON query → OpenAI
    - [ ] Long context (>10 messages) → Gemini
    - [ ] Question → Perplexity
    - [ ] Default → OpenRouter

### Metrics
- [ ] GET `/api/metrics` - System-wide metrics
  - Expected: 200, returns request counts, latencies, errors
  
- [ ] GET `/api/metrics/org/org_demo` - Org-specific metrics
  - Expected: 200, returns org request counts by provider

### Health
- [ ] GET `/` - Root health check
  - Expected: 200, status: "ok"
  
- [ ] GET `/health` - Health check with DB
  - Expected: 200, status: "healthy"

---

## Frontend Tests

### Home Page (`/`)
- [ ] Page loads with hero section
- [ ] Problem/Solution section visible
- [ ] Features section displays properly
- [ ] Pricing section visible
- [ ] FAQ section has clickable items
- [ ] Footer renders correctly
- [ ] Navigation links work
- [ ] "Sign In" button visible
- [ ] "Threads" button links to threads page
- [ ] "Settings" button links to settings page
- [ ] Dark mode active (dark theme)

### Threads Page (`/threads`)
- [ ] Page loads without errors
- [ ] "Start a conversation" message shows when empty
- [ ] Can type a message
- [ ] Send button enabled when text entered
- [ ] Message sent successfully (no errors)
- [ ] Thread created automatically on first message
- [ ] Provider selector shows routing decision
- [ ] Provider badge displays (color-coded)
- [ ] Routing reason shows in message
- [ ] Can copy message with icon
- [ ] User messages align right
- [ ] Assistant messages align left
- [ ] Avatar indicators (U for user, AI for assistant)
- [ ] Forward scope toggle (private/shared) works
- [ ] Auto-scroll to latest message works
- [ ] Typing indicator shows while waiting
- [ ] Rate limit error handled (429)
- [ ] Error alert displays on failures

### Provider Settings Page (`/settings/providers`)
- [ ] Page loads all 4 providers
- [ ] Perplexity provider card visible
- [ ] OpenAI provider card visible
- [ ] Gemini provider card visible
- [ ] OpenRouter provider card visible
- [ ] Memory status card visible
  - [ ] Shows enabled/disabled status
  - [ ] Shows health check message
  - [ ] Shows last checked timestamp
- [ ] "Add Key" button visible for unconfigured providers
- [ ] Click "Add Key" shows input fields
  - [ ] API Key input field
  - [ ] Key Name input field
  - [ ] Save button
  - [ ] Cancel button
- [ ] Save API key successfully
  - [ ] Masked key format (first 8 + last 4)
  - [ ] Provider shows as "Configured"
- [ ] Usage metrics display after configuration
  - [ ] Requests today / limit shows
  - [ ] Tokens today / limit shows
- [ ] "Test" button appears for configured providers
- [ ] Test connection succeeds/fails appropriately
- [ ] Test result shows success/failure message
- [ ] "Update Key" button available for configured providers
- [ ] Update key flow works same as add key
- [ ] Error alerts show on failures

### Demo Page (`/demo`)
- [ ] Page loads with demo header
- [ ] ChatInterface component renders
- [ ] "Getting Started" sidebar visible
- [ ] "Key Features" section visible
- [ ] Can send messages to demo chat
- [ ] Demo chat responds appropriately

---

## API Header Requirements

All requests except health checks should include:
- [ ] `x-org-id: org_demo` header
- [ ] Missing header returns 401 Unauthorized

---

## Database & Infrastructure

### PostgreSQL
- [ ] Container running: `docker-compose ps`
- [ ] Can connect: `psql -h localhost -U postgres -d dac`
- [ ] Tables created: `dac=# \dt`
- [ ] RLS policies applied: Check PostgreSQL
- [ ] ENUM types created: message_role, user_role, provider_type, memory_tier

### Qdrant
- [ ] Container running
- [ ] Health check: `curl http://localhost:6333/healthz`
- [ ] Can list collections (should be empty on first start)

### Redis
- [ ] Container running
- [ ] Health check: `redis-cli ping` returns PONG
- [ ] Rate limit keys stored correctly

---

## Security & Encryption

### API Key Encryption
- [ ] Keys stored encrypted in database
- [ ] Keys decrypted on retrieval
- [ ] Masked key format working
- [ ] No plaintext keys in responses
- [ ] Fernet encryption confirmed

### RLS (Row-Level Security)
- [ ] Org isolation enforced
- [ ] Cannot access other org data
- [ ] set_rls_context called on each request

### CORS
- [ ] Frontend can call backend API
- [ ] x-org-id header accepted
- [ ] Preflight requests succeed

---

## Error Handling

- [ ] 400 Bad Request for invalid input
- [ ] 401 Unauthorized for missing org header
- [ ] 404 Not Found for missing thread/org
- [ ] 429 Too Many Requests for rate limits
- [ ] 502 Bad Gateway for provider errors
- [ ] 503 Service Unavailable for infrastructure issues
- [ ] Error messages are descriptive
- [ ] Error classification working

---

## Metrics & Observability

- [ ] Request metrics collected
- [ ] Per-path latency tracked
- [ ] Provider metrics tracked
- [ ] Error classification working
- [ ] Percentile calculation (p50, p95, p99)
- [ ] Middleware recording requests

---

## Performance

- [ ] Provider calls complete within 30 seconds
- [ ] Thread creation < 500ms
- [ ] Message sending < 2 seconds (including provider call)
- [ ] Provider list endpoint < 200ms
- [ ] Settings page loads < 1 second

---

## Feature-Specific Tests

### Rule-Based Routing
Test each routing rule triggers correctly:
- [ ] "What's the latest news?" → Perplexity
- [ ] "Generate JSON for users" → OpenAI
- [ ] Send 11 messages → Gemini triggered
- [ ] "Tell me about React" → Perplexity (question pattern)
- [ ] "Random conversation" → OpenRouter (default)

### Rate Limiting
- [ ] First request succeeds
- [ ] Token counter increments
- [ ] At limit, next request returns 429
- [ ] Retry-After header present
- [ ] After midnight (UTC), limits reset

### Token Estimation
- [ ] Token estimate calculated on input
- [ ] Actual tokens from provider recorded
- [ ] Difference (completion tokens) added to daily count

### Provider Testing
- [ ] Perplexity test with valid key succeeds
- [ ] Perplexity test with invalid key fails
- [ ] OpenAI test with valid key succeeds
- [ ] OpenAI test with invalid key fails
- [ ] Gemini test with valid key succeeds
- [ ] Gemini test with invalid key fails
- [ ] OpenRouter test with valid key succeeds
- [ ] OpenRouter test with invalid key fails

### Citation Support
- [ ] Perplexity responses include citations
- [ ] Citations stored in message.citations
- [ ] Other providers don't have citations

---

## UI/UX Verification

- [ ] Page load times acceptable
- [ ] Buttons have proper hover states
- [ ] Form inputs clear on submit
- [ ] Loading spinners show during requests
- [ ] Error messages are visible and readable
- [ ] Success messages appear (masked key display)
- [ ] Responsive design works on mobile
- [ ] Dark mode displays correctly
- [ ] Provider color coding consistent
- [ ] Badge styling matches design
- [ ] Cards properly spaced and styled

---

## Configuration Verification

- [ ] All env vars read from .env
- [ ] Database URL valid
- [ ] Encryption key valid (Fernet format)
- [ ] Production environment detection working
- [ ] CORS configured correctly
- [ ] Rate limits applied correctly
- [ ] Frontend URL configured

---

## Known Issues / Limitations

- [ ] Billing endpoints (checkout, webhooks, portal) not implemented (Phase 2)
- [ ] Authentication/login flow not implemented (Phase 2)
- [ ] Thread forwarding endpoint exists but returns placeholder (Phase 2)
- [ ] Audit endpoints partially implemented (main audit in GET /threads/{id}/audit)
- [ ] Memory forwarding not implemented (Phase 2)
- [ ] Streaming responses not implemented (Phase 2)
- [ ] SSO/SAML not enabled (Phase 2)

---

## Success Criteria

All of the following must pass for Phase 1 sign-off:

- [ ] All backend endpoints tested and working
- [ ] All frontend pages load and function
- [ ] All 4 providers can be configured and tested
- [ ] Threading and message flow complete end-to-end
- [ ] Rate limiting prevents over-usage
- [ ] Encryption protects sensitive data
- [ ] RLS enforces org isolation
- [ ] Routing rules trigger appropriately
- [ ] UI is responsive and professional
- [ ] Error handling is comprehensive
- [ ] Metrics collection working
- [ ] Docker infrastructure stable
- [ ] No unhandled exceptions
- [ ] API documentation complete (via FastAPI Swagger)

