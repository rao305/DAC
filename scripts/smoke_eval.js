#!/usr/bin/env node
/**
 * Nightly Smoke Evaluation - Simple Runner
 * 
 * Runs a quick smoke test sequence to verify system health.
 * Fails on non-200 responses.
 */
const fetch = require('node-fetch');

const ENDPOINT = process.env.DAC_URL || "http://localhost:3000/api/chat";
const ORG_ID = process.env.ORG_ID || "org_demo";

const seq = [
  ["hello there", "social_chat"],
  ["write python to reverse a list", "coding_help"],
  ["explain how that code works", "qa_retrieval"],
  ["rewrite this to be formal: hey team, we shipped.", "editing/writing"],
  ["what is time complexity of merge sort?", "reasoning/math"],
  ["lol nice", "social_chat"],
  ["make it better", "ambiguous"],
  ["what were we working on again?", "qa_retrieval"]
];

async function sendMessage(threadId, prompt) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-org-id": ORG_ID
    },
    body: JSON.stringify({
      thread_id: threadId,
      prompt: prompt
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  // Parse streaming response (simplified - just get text)
  let text = "";
  const reader = response.body;
  
  // For Node.js, we'd need to handle streaming properly
  // This is a simplified version - in production, use proper SSE parsing
  const data = await response.json().catch(() => ({ text: "" }));
  return data.text || data.content || "";
}

async function run() {
  let threadId = `smoke-${Date.now()}`;
  let passed = 0;
  let failed = 0;

  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║          Nightly Smoke Evaluation                             ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log();
  console.log(`📝 Thread ID: ${threadId}`);
  console.log(`🔗 Endpoint: ${ENDPOINT}`);
  console.log();

  for (const [prompt, expected] of seq) {
    try {
      console.log(`> ${prompt}`);
      const text = await sendMessage(threadId, prompt);
      console.log(`< ${text.slice(0, 120)}...`);
      console.log(`✅ PASS`);
      passed++;
    } catch (error) {
      console.log(`❌ FAIL: ${error.message}`);
      failed++;
    }
    console.log();
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  console.log();

  if (failed > 0) {
    console.log("❌ Smoke evaluation FAILED");
    process.exit(1);
  } else {
    console.log("✅ Smoke evaluation PASSED");
    process.exit(0);
  }
}

run().catch(e => {
  console.error("Fatal error:", e);
  process.exit(1);
});

