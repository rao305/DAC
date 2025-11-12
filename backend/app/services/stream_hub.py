import asyncio
import time
from typing import Dict


class StreamHub:
    def __init__(self, ttl_sec=30):
        self.ttl = ttl_sec
        self._h: Dict[str, dict] = {}
        self._lock = asyncio.Lock()
    
    async def subscribe(self, key: str):
        async with self._lock:
            ent = self._h.get(key)
            if ent and (time.monotonic() - ent["ts"]) < self.ttl and not ent["done"]:
                q = asyncio.Queue(maxsize=256)
                ent["subs"].append(q)
                return q, False, None
            # create a new entry
            q = asyncio.Queue(maxsize=256)
            self._h[key] = {"ts": time.monotonic(), "subs": [q], "done": False}
            
            async def _mark_done():
                async with self._lock:
                    ent = self._h.get(key)
                    if ent:
                        ent["done"] = True
                        ent["ts"] = time.monotonic()
            
            return q, True, _mark_done
    
    async def publish(self, key: str, item: dict):
        ent = self._h.get(key)
        if not ent:
            return
        for q in list(ent["subs"]):
            try:
                q.put_nowait(item)
            except asyncio.QueueFull:
                pass
    
    async def complete(self, key: str):
        ent = self._h.get(key)
        if not ent:
            return
        for q in list(ent["subs"]):
            await q.put({"type": "done"})


stream_hub = StreamHub(ttl_sec=30)

