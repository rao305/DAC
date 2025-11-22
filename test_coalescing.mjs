#!/usr/bin/env node
/**
 * Test request coalescing by sending multiple identical requests to different threads
 * If coalescing works, only 1 provider call should be made despite many requests
 */

const ORG_ID = 'org_demo';
const BASE_URL = 'http://localhost:8000';
const NUM_REQUESTS = 20;

async function createThread() {
  const response = await fetch(`${BASE_URL}/api/threads/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-org-id': ORG_ID,
    },
    body: JSON.stringify({ title: 'Coalesce Test' }),
  });
  const data = await response.json();
  return data.thread_id;
}

async function sendMessage(threadId) {
  const start = Date.now();
  try {
    const response = await fetch(`${BASE_URL}/api/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-org-id': ORG_ID,
      },
      body: JSON.stringify({
        role: 'user',
        content: 'Give me 5 bullets about DAC.',
        provider: 'perplexity',
        model: 'llama-3.1-sonar-small-128k-online',
        reason: 'coalesce-test',
        scope: 'private',
      }),
    });
    const elapsed = Date.now() - start;
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, elapsed, threadId };
    } else {
      return { success: false, elapsed, error: data.detail, threadId };
    }
  } catch (err) {
    const elapsed = Date.now() - start;
    return { success: false, elapsed, error: err.message, threadId };
  }
}

async function main() {
  console.log(`Creating ${NUM_REQUESTS} threads...`);
  const threadIds = await Promise.all(
    Array(NUM_REQUESTS).fill(0).map(() => createThread())
  );
  console.log(`Created ${threadIds.length} threads\n`);

  console.log(`Sending ${NUM_REQUESTS} identical requests concurrently...`);
  const overallStart = Date.now();
  
  const results = await Promise.all(
    threadIds.map(threadId => sendMessage(threadId))
  );
  
  const overallElapsed = Date.now() - overallStart;

  const successes = results.filter(r => r.success).length;
  const failures = results.filter(r => !r.success).length;
  const avgLatency = results.reduce((sum, r) => sum + r.elapsed, 0) / results.length;

  console.log(`\n=== RESULTS ===`);
  console.log(`Total requests: ${NUM_REQUESTS}`);
  console.log(`Successes: ${successes}`);
  console.log(`Failures: ${failures}`);
  console.log(`Success rate: ${(successes / NUM_REQUESTS * 100).toFixed(1)}%`);
  console.log(`Average latency: ${avgLatency.toFixed(0)}ms`);
  console.log(`Overall time: ${overallElapsed}ms`);
  console.log(`\nLatency breakdown:`);
  console.log(`  Min: ${Math.min(...results.map(r => r.elapsed))}ms`);
  console.log(`  Max: ${Math.max(...results.map(r => r.elapsed))}ms`);
  console.log(`  P50: ${results.map(r => r.elapsed).sort((a, b) => a - b)[Math.floor(NUM_REQUESTS / 2)]}ms`);
  
  if (failures > 0) {
    console.log(`\nSample errors:`);
    results.filter(r => !r.success).slice(0, 3).forEach(r => {
      console.log(`  - ${r.error}`);
    });
  }

  // Check performance metrics
  console.log(`\n=== Checking performance metrics ===`);
  const metricsRes = await fetch(`${BASE_URL}/api/metrics/performance?last_n=50`);
  const metrics = await metricsRes.json();
  console.log(`Total logged requests: ${metrics.total_requests}`);
  console.log(`Error rate: ${(metrics.errors.rate * 100).toFixed(1)}%`);
  console.log(`P50 latency: ${(metrics.latency.p50 * 1000).toFixed(0)}ms`);
  console.log(`P95 latency: ${(metrics.latency.p95 * 1000).toFixed(0)}ms`);
}

main().catch(console.error);

