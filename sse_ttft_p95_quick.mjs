// sse_ttft_p95_quick.mjs - Faster version with fewer samples
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
    provider: TTFT_PROVIDER,
    model: TTFT_MODEL,
    reason: "ttft-test",
    scope: "private"
  };

  // 10 second timeout per request
  const timeout = setTimeout(() => ac.abort(), 10000);

  try {
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
          if (ev === "meta" && typeof json.ttft_ms === "number") {
            ttft = json.ttft_ms;
            clearTimeout(timeout);
            ac.abort();
            return ttft;
          }
          if (ev === "delta" && !seenDelta && !ttft && json.delta) {
            ttft = Date.now() - t0;
            seenDelta = true;
            clearTimeout(timeout);
            ac.abort();
            return ttft;
          }
          if (ev === "done") {
            clearTimeout(timeout);
            ac.abort();
            return ttft ?? (Date.now() - t0);
          }
        } catch { /* ignore */ }
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') throw err;
  } finally {
    clearTimeout(timeout);
  }
  return ttft ?? (Date.now() - t0);
}

function p95(arr){ const a=[...arr].sort((x,y)=>x-y); const i=Math.ceil(0.95*a.length)-1; return a[Math.max(0,i)]; }

(async()=>{
  const runs = 10, conc = 3; // Reduced: 10 samples, 3 parallel
  const pending = new Set();
  const results = [];
  
  console.log(`Running ${runs} samples (parallel ${conc})...`);
  
  // Create threads upfront
  const threads = [];
  for (let i = 0; i < runs; i++) {
    threads.push(await createThread());
  }
  
  async function enqueue(threadId){ 
    try {
      const v = await once(threadId); 
      results.push(v);
      process.stdout.write(`✓ `);
    } catch (err) {
      process.stdout.write(`✗ `);
      results.push(null);
    }
  }
  
  for (let i=0;i<runs;i++){
    const task = enqueue(threads[i]).finally(()=>pending.delete(task));
    pending.add(task);
    if (pending.size >= conc) await Promise.race(pending);
  }
  await Promise.all(pending);
  
  const valid = results.filter(x => x !== null);
  console.log(`\n\nTTFT ms (valid ${valid.length}/${runs}):`, valid);
  if (valid.length > 0) {
    console.log("TTFT p95:", p95(valid), "ms");
    console.log("TTFT min:", Math.min(...valid), "ms");
    console.log("TTFT max:", Math.max(...valid), "ms");
    console.log("TTFT avg:", Math.round(valid.reduce((a,b)=>a+b,0)/valid.length), "ms");
  } else {
    console.log("❌ No valid results");
  }
})();

