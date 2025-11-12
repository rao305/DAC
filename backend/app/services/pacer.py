# backend/app/services/pacer.py
import asyncio, os, time
import threading

class AdaptiveRps:
    """
    AIMD (Additive Increase Multiplicative Decrease) rate pacer.

    On 429 (or other rate-limit signal):
      - Multiplicative decrease: rps *= 0.7, floor at 0.2
      - Penalty period: 60 seconds

    Recovery:
      - Additive increase: rps += 0.1 per second back to base
    """
    def __init__(self, base: float):
        self.base = float(base)
        self.curr = float(base)
        self._until = 0.0
        self._lock = threading.Lock()

    def penalize(self, secs: int = 60):
        """Penalize for rate limiting: reduce RPS and set penalty period"""
        with self._lock:
            self.curr = max(0.2, self.curr * 0.7)
            self._until = time.monotonic() + float(secs)

    def value(self) -> float:
        """Get current RPS, with additive recovery if penalty expired"""
        now = time.monotonic()
        with self._lock:
            if now > self._until and self.curr < self.base:
                # Additive increase: +0.1/s
                elapsed = now - self._until
                self.curr = min(self.base, self.curr + 0.1 * elapsed)
                self._until = now
            return self.curr

class _TokenBucket:
    def __init__(self, rps: float, burst: int):
        self.capacity = max(1, burst)
        self.tokens = float(self.capacity)
        self.rps = max(0.01, rps)
        self._t = time.monotonic()
        self._lock = asyncio.Lock()

    async def take(self):
        async with self._lock:
            now = time.monotonic()
            # refill
            self.tokens = min(self.capacity, self.tokens + (now - self._t) * self.rps)
            self._t = now
            if self.tokens < 1.0:
                # wait until a full token is available
                await asyncio.sleep((1.0 - self.tokens) / self.rps)
                self._t = time.monotonic()
                self.tokens = 0.0
            self.tokens -= 1.0

class ProviderPacer:
    """
    Limits upstream calls by:
      - max in-flight concurrency (Semaphore)
      - smooth RPS with small burst (token bucket)
    Records queue wait in milliseconds (for UX + metrics).
    """
    def __init__(self, rps: float, burst: int, concurrency: int):
        self.bucket = _TokenBucket(rps, burst)
        self.sem = asyncio.Semaphore(max(1, concurrency))
        self.queue_wait_ms = 0

    async def __aenter__(self):
        t0 = time.monotonic()
        await self.sem.acquire()
        await self.bucket.take()
        self.queue_wait_ms = int((time.monotonic() - t0) * 1000)
        return self

    async def __aexit__(self, exc_type, exc, tb):
        self.sem.release()

def build_pacer(provider: str) -> ProviderPacer:
    key = provider.upper()
    rps = float(os.getenv(f"{key}_RPS", "1"))
    burst = int(os.getenv(f"{key}_BURST", "2"))
    conc = int(os.getenv(f"{key}_CONCURRENCY", "3"))
    return ProviderPacer(rps=rps, burst=burst, concurrency=conc)
