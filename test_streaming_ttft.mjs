// Streaming TTFT test - dynamic thread
import { setTimeout } from "node:timers/promises";

// Create a fresh thread
const createThread = await fetch("http://localhost:8000/api/threads/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-org-id": "org_demo"
  },
  body: JSON.stringify({ title: "TTFT Test" })
});
const threadData = await createThread.json();
const THREAD_ID = threadData.thread_id;

const url = `http://localhost:8000/api/threads/${THREAD_ID}/messages/stream`;
const body = {
  user_id: "d34053d1-a5d5-480b-b2d1-988fb792ab2a",
  content: "Explain DAC briefly (streaming test).",
  provider: "perplexity",
  model: "llama-3.1-sonar-small-128k-online",
  reason: "streaming-test",
  scope: "private"
};

const ac = new AbortController();
const start = Date.now();
let printedTTFT = false;
let requestId = null;

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "text/event-stream",
    "x-org-id": "org_demo"
  },
  body: JSON.stringify(body),
  signal: ac.signal,
});

if (!res.ok || !res.body) {
  console.error("HTTP", res.status, await res.text());
  process.exit(1);
}

const reader = res.body.getReader();
const dec = new TextDecoder();
let buf = "";

// Cancel after 2 seconds to test cancellation
const cancelAfterMs = 2000;
setTimeout(cancelAfterMs).then(() => {
  const t = Date.now();
  ac.abort();
  console.log(`\n✋ CANCEL sent at +${t - start}ms`);
  
  if (requestId) {
    fetch(`http://localhost:8000/api/threads/cancel/${requestId}`, {
      method: "POST",
      headers: { "x-org-id": "org_demo" }
    }).then(r => console.log(`Server cancel response: ${r.status}`))
      .catch(e => console.log(`Server cancel failed: ${e.message}`));
  }
});

try {
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });

    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const frame = buf.slice(0, i);
      buf = buf.slice(i + 2);

      let ev = "message", data = "{}";
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) ev = line.slice(6).trim();
        if (line.startsWith("data:")) data = line.slice(5).trim();
      }

      try {
        const json = JSON.parse(data || "{}");

        if (json.request_id) {
          requestId = json.request_id;
        }

        // Check for TTFT in meta event
        if (!printedTTFT && (ev === "meta" && "ttft_ms" in json)) {
          console.log(`⚡ TTFT: ${json.ttft_ms} ms`);
          printedTTFT = true;
        } else if (!printedTTFT && ev === "delta" && json.content) {
          // Fallback if meta not emitted
          const ttft = Date.now() - start;
          console.log(`⚡ TTFT (first delta): ${ttft} ms`);
          printedTTFT = true;
        }

        if (ev === "delta" && json.content) {
          process.stdout.write(json.content);
        }

        if (ev === "done") {
          console.log(`\n✅ DONE`);
          break;
        }

        if (ev === "error") {
          console.error("\n❌ ERROR:", json);
          break;
        }

      } catch (e) {
        // Ignore parse errors
      }
    }
  }
} catch (err) {
  if (err.name === 'AbortError') {
    const cancelTime = Date.now() - start;
    console.log(`\n❌ Request aborted at +${cancelTime}ms (expected)`);
    if (cancelTime < 300) {
      console.log(`✅ Cancel time < 300ms: PASS`);
    } else {
      console.log(`⚠️  Cancel time ${cancelTime}ms (target: <300ms)`);
    }
  } else {
    console.error("❌ Error:", err.message);
  }
} finally {
  const elapsed = Date.now() - start;
  console.log(`⏱️  Total elapsed: ${elapsed}ms`);
}

