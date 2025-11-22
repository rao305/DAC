// sse_ttft_p95.mjs
const BASE_URL = "http://localhost:8000";
const ORG_ID = "org_demo";

// Provider switching support
const TTFT_PROVIDER = process.env.TTFT_PROVIDER || process.env.DAC_DEFAULT_PROVIDER || "perplexity";
const TTFT_MODEL = process.env.TTFT_MODEL || process.env.DAC_DEFAULT_MODEL || "llama-3.1-sonar-small-128k-online";

async function createThread() {
  const res = await fetch(`${BASE_URL}/api/threads/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-org-id": ORG_ID },
    body: JSON.stringify({ title: "TTFT Test" })
  });
  const data = await res.json();
  return data.thread_id;
}

async function once(threadId) {
  const ac = new AbortController();
  const t0 = Date.now();
  let ttft = null, seenDelta = false;

  const url = `${BASE_URL}/api/threads/${threadId}/messages/stream`;
  const body = {
    role: "user",
    content: "Quick TTFT check.",
    provider: "perplexity",
    model: "llama-3.1-sonar-small-128k-online",
    reason: "ttft-test",
    scope: "private"
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "text/event-stream", "x-org-id": ORG_ID },
    body: JSON.stringify(body),
    signal: ac.signal,
  });
  if (!res.ok || !res.body) throw new Error("Bad response " + res.status);
  const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });

    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const frame = buf.slice(0, i); buf = buf.slice(i + 2);
      let ev = "message", data = "{}";
      for (const L of frame.split("\n")) {
        if (L.startsWith("event:")) ev = L.slice(6).trim();
        if (L.startsWith("data:")) data = L.slice(5).trim();
      }
      try {
        const json = JSON.parse(data || "{}");
        if (ev === "meta" && typeof json.ttft_ms === "number") ttft = json.ttft_ms;
        if (ev === "delta" && !seenDelta && !ttft && json.delta) {
          ttft = Date.now() - t0; // fallback if meta missing
          seenDelta = true;
        }
        if (ev === "done") { ac.abort(); return ttft ?? (Date.now() - t0); }
      } catch { /* ignore */ }
    }
  }
  return ttft ?? (Date.now() - t0);
}

function p95(arr){ const a=[...arr].sort((x,y)=>x-y); const i=Math.ceil(0.95*a.length)-1; return a[Math.max(0,i)]; }

(async()=>{
  const runs = 20, conc = 5;
  const pending = new Set();
  const results = [];
  
  // Create threads upfront for all runs
  const threads = [];
  for (let i = 0; i < runs; i++) {
    threads.push(await createThread());
  }
  
  async function enqueue(threadId){ const v = await once(threadId); results.push(v); }
  for (let i=0;i<runs;i++){
    const task = enqueue(threads[i]).finally(()=>pending.delete(task));
    pending.add(task);
    if (pending.size >= conc) await Promise.race(pending);
  }
  await Promise.all(pending);
  console.log("TTFT ms (all):", results);
  console.log("TTFT p95:", p95(results), "ms");
  console.log("TTFT min:", Math.min(...results), "ms");
  console.log("TTFT max:", Math.max(...results), "ms");
  console.log("TTFT avg:", Math.round(results.reduce((a,b)=>a+b,0)/results.length), "ms");
})();

