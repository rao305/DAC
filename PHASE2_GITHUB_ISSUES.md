# Phase 2 GitHub Issues

Copy each issue below into GitHub → New Issue. Each has title, description, and acceptance criteria matching the DoD.

---

## Week 1 – Frontend Performance & UX

### Issue 1: [FE] Add preconnect/dns-prefetch for SSE host

**Description:**
Add `rel="preconnect"` and `rel="dns-prefetch"` link tags to the frontend layout to establish early connections to the SSE streaming host, reducing connection latency for first requests.

**Acceptance Criteria:**
- [ ] `<link rel="preconnect" href="{SSE_HOST}" crossorigin>` present in `<head>`
- [ ] `<link rel="dns-prefetch" href="{SSE_HOST}">` present in `<head>`
- [ ] SSE_HOST environment variable documented
- [ ] Verified via Lighthouse network logs (connection timing improved)

**Labels:** `frontend`, `performance`, `phase-2`, `week-1`

---

### Issue 2: [FE] Dynamic imports for heavy components

**Description:**
Use Next.js dynamic imports for heavy client-side components (react-markdown, code highlighter, charts) to reduce initial bundle size and improve TBT/TTI.

**Acceptance Criteria:**
- [ ] `react-markdown` loaded via `next/dynamic` with loading skeleton
- [ ] Code highlighter (if used) loaded via dynamic import
- [ ] JS bundle size reduced (measure before/after)
- [ ] TBT not regressed (Lighthouse check)
- [ ] Loading skeletons show during lazy load

**Labels:** `frontend`, `performance`, `phase-2`, `week-1`

---

### Issue 3: [FE] First-token skeleton + stream on first delta

**Description:**
Display a skeleton placeholder until the first SSE token arrives, then immediately render streaming content. Improves perceived performance and provides visual feedback during TTFT.

**Acceptance Criteria:**
- [ ] Skeleton visible when request starts (loading=true, ttft_ms=undefined)
- [ ] Skeleton disappears on first SSE delta
- [ ] TTFT rendered as badge in UI
- [ ] User content grows incrementally as tokens arrive
- [ ] No layout shift when skeleton→content transition occurs

**Labels:** `frontend`, `ux`, `phase-2`, `week-1`

---

### Issue 4: [FE] Cancel UX within 300ms

**Description:**
Implement responsive cancel/stop button that immediately updates UI state and aborts the network request using AbortController. Target: <300ms perceived latency.

**Acceptance Criteria:**
- [ ] Stop button immediately flips UI to "cancelled" state (optimistic update)
- [ ] AbortController.abort() called to cancel network request
- [ ] No further tokens appended after cancel
- [ ] Playwright test confirms <300ms response time
- [ ] Cancelled state clearly indicated to user

**Labels:** `frontend`, `ux`, `phase-2`, `week-1`

---

### Issue 5: [FE] Cache-hit chip

**Description:**
When backend emits `event:meta` with `{cache_hit:true}`, display a "cache_hit" badge on the message to show the response was served from cache.

**Acceptance Criteria:**
- [ ] Hook parses SSE `event:meta` events
- [ ] `cache_hit` boolean extracted and stored in state
- [ ] Badge/chip displayed when cache_hit=true
- [ ] Visually distinct from TTFT badge
- [ ] Works correctly for repeat identical prompts

**Labels:** `frontend`, `ux`, `phase-2`, `week-1`

---

### Issue 6: [FE] Image size/priority audit

**Description:**
Audit all images in the application to ensure above-the-fold images have explicit sizes and appropriate priority to prevent layout shifts and improve LCP.

**Acceptance Criteria:**
- [ ] All ATF images use Next/Image with explicit width/height
- [ ] Hero/LCP image has `priority` flag
- [ ] No "properly size images" warning in Lighthouse
- [ ] No CLS from image loading
- [ ] Image formats optimized (WebP/AVIF where supported)

**Labels:** `frontend`, `performance`, `phase-2`, `week-1`

---

### Issue 7: [FE] Lighthouse ≥90 / LCP ≤2.5s / CLS <0.1

**Description:**
Ensure all target pages pass Lighthouse CI assertions for mobile/Fast-3G: Performance ≥90, LCP ≤2500ms, CLS <0.1.

**Acceptance Criteria:**
- [ ] LHCI assertions pass on all target pages
- [ ] Mobile/Fast-3G preset used (150ms RTT, 1.6Mbps)
- [ ] Performance score ≥90
- [ ] LCP ≤2500ms
- [ ] CLS <0.1
- [ ] CI workflow runs on PRs

**Labels:** `frontend`, `performance`, `phase-2`, `week-1`, `ci`

---

## Week 2 – Pacer & Observability

### Issue 8: [BE] AIMD pacer drop-in

**Description:**
Implement Additive Increase Multiplicative Decrease (AIMD) rate pacer. On HTTP 429, reduce RPS to `max(0.2, rps*0.7)` for 60s, then recover at +0.1/s back to base.

**Acceptance Criteria:**
- [ ] AdaptiveRps class implemented with `penalize()` and `value()` methods
- [ ] On 429, RPS falls to max(0.2, rps*0.7)
- [ ] Penalty period: 60 seconds
- [ ] Recovery: +0.1 RPS per second back to base
- [ ] Unit tests cover penalize and recovery logic
- [ ] Integration with existing ProviderPacer

**Labels:** `backend`, `performance`, `phase-2`, `week-2`

---

### Issue 9: [BE] Emit pacer + 429 metrics

**Description:**
Add metrics tracking for pacer current RPS and total HTTP 429 responses. Expose via metrics API for observability.

**Acceptance Criteria:**
- [ ] `pacer_rps_current` gauge exposed (per provider)
- [ ] `http_429_total` counter increments on 429 responses
- [ ] Metrics visible in `/api/metrics/summary`
- [ ] Grafana dashboard includes pacer panels (if using Prometheus)

**Labels:** `backend`, `observability`, `phase-2`, `week-2`

---

### Issue 10: [OBS] Dashboard cards

**Description:**
Create monitoring dashboards (Grafana and/or web) showing TTFT p95, latency p95, queue wait p95, error rate, and coalesce L/F ratio.

**Acceptance Criteria:**
- [ ] Grafana dashboard JSON imported (if using Prometheus)
- [ ] Web dashboard (`dashboard.html`) accessible at `/dashboard.html`
- [ ] Shows: TTFT p95, latency p95, queue_wait p95, error_rate, coalesce ratio
- [ ] Auto-refreshes every 5-30 seconds
- [ ] Color-coded thresholds (green/yellow/red)

**Labels:** `observability`, `phase-2`, `week-2`

---

### Issue 11: [OBS] Alerts for SLOs

**Description:**
Create alerting script (`alert.sh`) that checks SLO thresholds and exits non-zero on breach. Hook to CI nightly or monitoring system.

**Acceptance Criteria:**
- [ ] `alert.sh` script created and executable
- [ ] Checks: TTFT ≤1500ms, latency ≤6000ms, queue ≤1000ms, error_rate <1%
- [ ] Exits non-zero when SLOs breached
- [ ] Integrated into CI nightly job or monitoring
- [ ] Clear error messages on breach

**Labels:** `observability`, `ci`, `phase-2`, `week-2`

---

## Week 3 – Soak & Polish

### Issue 12: [OPS] 15-min soak (3 conc)

**Description:**
Run 15-minute soak test with 3 concurrent workers. Measure availability, 5xx rate, TTFT, and latency. Save results as artifact.

**Acceptance Criteria:**
- [ ] `soak_test.py` script runs for 900 seconds
- [ ] 3 concurrent workers
- [ ] Final summary shows ≥99.5% availability
- [ ] 5xx error rate <1%
- [ ] Results saved as JSON artifact
- [ ] CI job runs soak test weekly

**Labels:** `testing`, `performance`, `phase-2`, `week-3`

---

### Issue 13: [FE] Cancel path polish + retry affordance

**Description:**
After user cancels a request, show a small retry button to easily re-send. Ensure cancelled state is clearly marked.

**Acceptance Criteria:**
- [ ] Retry button appears after cancel
- [ ] Clicking retry re-sends the same request
- [ ] Cancelled state clearly indicated (text + icon)
- [ ] No stale content from previous request
- [ ] Works correctly with streaming + cache

**Labels:** `frontend`, `ux`, `phase-2`, `week-3`

---

### Issue 14: [FE] Queue wait micro-chip

**Description:**
If `queue_wait_ms > 300`, show a subtle "preparing..." chip before first token to provide feedback during queueing.

**Acceptance Criteria:**
- [ ] Hook receives queue_wait_ms from backend
- [ ] If queue_wait_ms > 300, show "preparing..." chip
- [ ] Chip disappears on first token
- [ ] Does not interfere with TTFT measurement
- [ ] Visually distinct from other status indicators

**Labels:** `frontend`, `ux`, `phase-2`, `week-3`

---

## Additional Tasks

### Issue 15: [DOCS] Proxy buffering guide for SSE

**Description:**
Document required proxy configurations (Nginx, Apache, Caddy) to disable buffering for SSE endpoints. Include verification steps.

**Acceptance Criteria:**
- [ ] Nginx config example with `proxy_buffering off`
- [ ] Apache config example
- [ ] Caddy config example
- [ ] Verification curl commands
- [ ] Troubleshooting section for common issues
- [ ] Added to deployment docs

**Labels:** `documentation`, `ops`, `phase-2`

---

### Issue 16: [TEST] TTFT probe script

**Description:**
Create `ttft_probe.mjs` script that measures TTFT for repeated requests to verify cache hit performance (<300ms p95).

**Acceptance Criteria:**
- [ ] Script sends N requests (default 10) sequentially
- [ ] Measures TTFT (time to first SSE token)
- [ ] Calculates p50, p95 percentiles
- [ ] Exits non-zero if p95 >300ms (for repeat requests)
- [ ] Works with local and deployed backends

**Labels:** `testing`, `phase-2`

---

### Issue 17: [TEST] Playwright cancel test

**Description:**
Create Playwright test (`cancel.spec.ts`) to verify cancel button responds within 300ms and displays "cancelled" state.

**Acceptance Criteria:**
- [ ] Test clicks Send button
- [ ] Test clicks Stop button after 80ms
- [ ] Asserts "cancelled" text appears within 300ms
- [ ] Test passes consistently in CI
- [ ] Separate test verifies cache_hit badge on repeat

**Labels:** `testing`, `e2e`, `phase-2`

---

### Issue 18: [DOCS] Phase 2 Week 1 verification guide

**Description:**
Create comprehensive verification guide (PHASE2_WEEK1_COMPLETE.md) with DoD acceptance matrix, test commands, and troubleshooting.

**Acceptance Criteria:**
- [ ] DoD → Acceptance matrix table
- [ ] Exact commands for Lighthouse (mobile/Fast-3G)
- [ ] TTFT probe usage
- [ ] Playwright cancel test usage
- [ ] Manual quick checks (preconnect, dynamic imports, skeleton)
- [ ] CI hookup instructions
- [ ] Troubleshooting section

**Labels:** `documentation`, `phase-2`, `week-1`

---

## Labels to Create

Create these labels in your GitHub repo for easy filtering:

- `phase-2` (color: #0E8A16)
- `week-1` (color: #D4C5F9)
- `week-2` (color: #D4C5F9)
- `week-3` (color: #D4C5F9)
- `frontend` (color: #1D76DB)
- `backend` (color: #D93F0B)
- `observability` (color: #FBCA04)
- `testing` (color: #BFD4F2)
- `e2e` (color: #C5DEF5)
- `performance` (color: #0E8A16)
- `ux` (color: #D876E3)
- `ci` (color: #0052CC)
- `documentation` (color: #0075CA)
- `ops` (color: #D93F0B)

---

## Milestones

Create these milestones to track progress:

### Phase 2 Week 1: Frontend Perf & UX
**Due:** [Set date]
- Issues: #1-7, #18

### Phase 2 Week 2: Pacer & Observability
**Due:** [Set date]
- Issues: #8-11

### Phase 2 Week 3: Soak & Polish
**Due:** [Set date]
- Issues: #12-14

### Phase 2 Infrastructure
**Due:** [Set date]
- Issues: #15-17

---

## How to Use

1. Copy each issue section above
2. Create a new GitHub issue
3. Paste the content
4. Add appropriate labels
5. Assign to milestone
6. Link related issues (e.g., #7 depends on #1-6)

## Notes

- Mark issues as blocked if dependencies not met
- Update acceptance criteria checkboxes as work progresses
- Link PRs to issues for automatic closure
- Use issue comments for implementation notes
