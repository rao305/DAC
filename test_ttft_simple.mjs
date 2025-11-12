// Simple TTFT test - measures time to first token
const THREAD = process.argv[2] || (await fetch("http://localhost:8000/api/threads/", {
  method: "POST",
  headers: {"Content-Type": "application/json", "x-org-id": "org_demo"},
  body: JSON.stringify({title: "TTFT"})
}).then(r => r.json()).then(d => d.thread_id));

const url = `http://localhost:8000/api/threads/${THREAD}/messages/stream`;
const body = {
  content: "What is DAC?",
  provider: "perplexity",
  model: "llama-3.1-sonar-small-128k-online",
  reason: "ttft-test",
  scope: "private"
};

const start = Date.now();
let ttft = null;
let firstChunk = false;

try {
  const res = await fetch(url, {
    method: "POST",
    headers: {"Content-Type": "application/json", "x-org-id": "org_demo"},
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";

  while (true) {
    const {value, done} = await reader.read();
    if (done) break;
    
    buf += dec.decode(value, {stream: true});
    
    // Parse SSE frames
    while (buf.includes("\n\n")) {
      const idx = buf.indexOf("\n\n");
      const frame = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      
      let data = "";
      for (const line of frame.split("\n")) {
        if (line.startsWith("data:")) {
          data = line.slice(5).trim();
        }
      }
      
      if (data) {
        try {
          const json = JSON.parse(data);
          
          // Check for TTFT in meta event
          if (json.type === "meta" && json.ttft_ms) {
            ttft = json.ttft_ms;
            console.log(`TTFT: ${ttft}ms`);
            break;
          }
          
          // Check for first content/delta
          if (!firstChunk && (json.type === "delta" || json.content || json.delta)) {
            ttft = Date.now() - start;
            console.log(`TTFT (first chunk): ${ttft}ms`);
            firstChunk = true;
            break;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
    
    if (ttft !== null) break;
  }
  
  if (ttft === null) {
    console.log("TTFT: Not measured");
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}

