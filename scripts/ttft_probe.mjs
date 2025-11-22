#!/usr/bin/env node
/**
 * TTFT Probe - Measures Time To First Token for SSE streaming endpoints
 *
 * This probe calls the Next.js API route /api/chat which proxies to the backend
 * streaming endpoint /api/threads/{thread_id}/messages/stream.
 *
 * Usage:
 *   node scripts/ttft_probe.mjs
 *   DAC_URL=http://localhost:3000/api/chat RUNS=10 node scripts/ttft_probe.mjs
 *
 * Environment Variables:
 *   DAC_URL  - API endpoint URL (default: http://localhost:3000/api/chat)
 *   RUNS     - Number of test runs (default: 10)
 *   PROMPT   - Test prompt (default: "Say hello in one short sentence.")
 *   ORG_ID   - Organization ID header (default: org_demo)
 *
 * Exit Codes:
 *   0 - Pass (p95 ≤ 300ms for repeat prompts, indicating cache working)
 *   1 - Fail (p95 > 300ms)
 *   2 - Error (fetch failed, network error, etc.)
 */

import { setTimeout as sleep } from 'node:timers/promises';

// Configuration
// Default to frontend API route which proxies to backend
const url = process.env.DAC_URL ?? 'http://localhost:3000/api/chat';
const runs = Number(process.env.RUNS ?? 10);
const prompt = process.env.PROMPT ?? 'Say hello in one short sentence.';
const orgId = process.env.ORG_ID ?? 'org_demo';

// Colors for output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

/**
 * Measure time to first SSE token
 */
async function measureTTFT() {
  const t0 = performance.now();

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'text/event-stream',
        'Content-Type': 'application/json',
        'x-org-id': orgId
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }]
      }),
      // Note: x-org-id header is optional for the frontend route (defaults to org_demo)
      // but we include it for consistency
    });

    if (!response.ok) {
      console.error(`${RED}✗${RESET} HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // Read until we get the first data event
    while (true) {
      const { value, done } = await reader.read();

      if (done) {
        // Stream ended without sending data
        return performance.now() - t0;
      }

      buffer += decoder.decode(value, { stream: true });

      // Look for SSE event frames (delimited by \n\n)
      let frameEnd;
      while ((frameEnd = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, frameEnd);
        buffer = buffer.slice(frameEnd + 2);

        // Parse SSE frame
        for (const line of frame.split('\n')) {
          if (line.startsWith('data:')) {
            // First token received!
            const ttft = performance.now() - t0;

            // Cancel the rest of the stream
            await reader.cancel();

            return ttft;
          }
        }
      }
    }
  } catch (error) {
    console.error(`${RED}✗${RESET} Request failed:`, error.message);
    return null;
  }
}

/**
 * Calculate percentile (0-1 range)
 */
function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(0, Math.ceil(p * sorted.length) - 1);
  return sorted[index];
}

/**
 * Format milliseconds
 */
function formatMs(ms) {
  if (ms == null) return 'N/A';
  return Math.round(ms) + 'ms';
}

/**
 * Main test runner
 */
async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`${BLUE}TTFT Probe${RESET}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`URL:    ${url}`);
  console.log(`Runs:   ${runs}`);
  console.log(`Prompt: ${prompt}`);
  console.log('');
  console.log('Running tests...');
  console.log('');

  const ttfts = [];
  let failures = 0;

  for (let i = 0; i < runs; i++) {
    process.stdout.write(`  Run ${i + 1}/${runs}... `);

    const ttft = await measureTTFT();

    if (ttft === null) {
      console.log(`${RED}FAILED${RESET}`);
      failures++;
    } else {
      ttfts.push(ttft);
      console.log(`${GREEN}${formatMs(ttft)}${RESET}`);
    }

    // Small pause between requests to avoid overwhelming the system
    // and to allow coalescing to settle
    if (i < runs - 1) {
      await sleep(150);
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Results');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  if (ttfts.length === 0) {
    console.log(`${RED}✗ All requests failed${RESET}`);
    process.exit(2);
  }

  const p50 = percentile(ttfts, 0.50);
  const p95 = percentile(ttfts, 0.95);
  const p99 = percentile(ttfts, 0.99);
  const min = Math.min(...ttfts);
  const max = Math.max(...ttfts);
  const avg = ttfts.reduce((a, b) => a + b, 0) / ttfts.length;

  console.log(`Successful: ${ttfts.length}/${runs}`);
  console.log(`Failed:     ${failures}/${runs}`);
  console.log('');
  console.log('TTFT Statistics:');
  console.log(`  Min:  ${formatMs(min)}`);
  console.log(`  Max:  ${formatMs(max)}`);
  console.log(`  Avg:  ${formatMs(avg)}`);
  console.log(`  p50:  ${formatMs(p50)}`);
  console.log(`  p95:  ${formatMs(p95)}`);
  console.log(`  p99:  ${formatMs(p99)}`);
  console.log('');

  // Output JSON for CI/scripting
  const result = {
    runs,
    successful: ttfts.length,
    failed: failures,
    ttft_ms: ttfts.map(Math.round),
    statistics: {
      min: Math.round(min),
      max: Math.round(max),
      avg: Math.round(avg),
      p50: Math.round(p50),
      p95: Math.round(p95),
      p99: Math.round(p99)
    }
  };

  console.log('JSON Output:');
  console.log(JSON.stringify(result, null, 2));
  console.log('');

  // Threshold check
  // For repeat prompts with cache enabled, p95 should be <300ms
  // First run may be slower, so we check overall p95
  const threshold = 300;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (p95 > threshold) {
    console.log(`${RED}✗ FAILED:${RESET} TTFT p95 (${formatMs(p95)}) > ${threshold}ms`);
    console.log('');
    console.log('This may indicate:');
    console.log('  - Cache not working correctly');
    console.log('  - Proxy buffering SSE responses');
    console.log('  - Network latency too high');
    console.log('  - Backend performance issues');
    console.log('');
    process.exit(1);
  } else {
    console.log(`${GREEN}✓ PASSED:${RESET} TTFT p95 (${formatMs(p95)}) ≤ ${threshold}ms`);
    console.log('');
    process.exit(0);
  }
}

// Run
main().catch((error) => {
  console.error(`${RED}Fatal error:${RESET}`, error);
  process.exit(2);
});
