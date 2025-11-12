// cancel_quick.mjs
const BASE_URL = "http://localhost:8000";
const ORG_ID = "org_demo";

// Provider switching support
const TTFT_PROVIDER = process.env.TTFT_PROVIDER || process.env.DAC_DEFAULT_PROVIDER || "perplexity";
const TTFT_MODEL = process.env.TTFT_MODEL || process.env.DAC_DEFAULT_MODEL || "llama-3.1-sonar-small-128k-online";

// Create a thread
const threadRes = await fetch(`${BASE_URL}/api/threads/`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-org-id": ORG_ID },
  body: JSON.stringify({ title: "Cancel Test" })
});
const threadData = await threadRes.json();
const threadId = threadData.thread_id;

const url = `${BASE_URL}/api/threads/${threadId}/messages/stream`;
const body = {
  role: "user",
  content: "Write a very long story so I can cancel.",
  provider: TTFT_PROVIDER,
  model: TTFT_MODEL,
  reason: "cancel-test",
  scope: "private"
};

const ac = new AbortController();
const t0 = Date.now();

setTimeout(() => {
  ac.abort();
  console.log("Client abort at", Date.now() - t0, "ms");
}, 2000);

try {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "text/event-stream",
      "x-org-id": ORG_ID
    },
    body: JSON.stringify(body),
    signal: ac.signal
  });

  if (!res.body) {
    console.log("No response body");
    process.exit(0);
  }

  const r = res.body.getReader();
  while (true) {
    const { done } = await r.read();
    if (done) break;
  }
} catch (err) {
  if (err.name === 'AbortError') {
    const cancelTime = Date.now() - t0;
    console.log(`✅ Cancel completed at ${cancelTime}ms`);
    if (cancelTime < 300) {
      console.log("✅ PASS: Cancel time < 300ms");
    } else {
      console.log(`⚠️  Cancel time ${cancelTime}ms (target: <300ms)`);
    }
  } else {
    console.error("❌ Error:", err.message);
  }
}

