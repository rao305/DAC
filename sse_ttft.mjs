// sse_ttft.mjs - Streaming TTFT and Cancel test
import { setTimeout } from "node:timers/promises";

const THREAD_ID = "4a2cd86d-27ca-457a-afb2-eff1723592b5";
const url = `http://localhost:8000/api/threads/${THREAD_ID}/messages/stream`;
const body = {
  user_id: "d34053d1-a5d5-480b-b2d1-988fb792ab2a",
  content: "Explain DAC briefly (streaming test).",
  provider: "perplexity",
  model: "sonar",
  reason: "streaming-test"
};

const ac = new AbortController();
const start = Date.now();
let printedTTFT = false;
let requestId = null;

console.log("Starting streaming request...");

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

  // If we have a request_id, also test server-side cancel
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

        // Extract request_id if available
        if (json.request_id) {
          requestId = json.request_id;
        }

        // Check for TTFT in meta event
        if (!printedTTFT && (ev === "meta" && "ttft_ms" in json)) {
          console.log(`⚡ TTFT: ${json.ttft_ms} ms`);
          printedTTFT = true;
        } else if (!printedTTFT && ev === "delta" && json.delta) {
          // Fallback if meta not emitted
          const ttft = Date.now() - start;
          console.log(`⚡ TTFT (first delta): ${ttft} ms`);
          printedTTFT = true;
        }

        if (ev === "delta" && json.delta) {
          process.stdout.write(json.delta);
        }

        if (ev === "done") {
          console.log(`\n✅ DONE${json.reason ? ` (${json.reason})` : ""}`);
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
    console.log("❌ Request aborted (expected)");
  } else {
    console.error("❌ Error:", err.message);
  }
} finally {
  const elapsed = Date.now() - start;
  console.log(`\n⏱️  Total elapsed: ${elapsed}ms`);
}
