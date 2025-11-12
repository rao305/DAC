"""Shared HTTP/2 client with connection pooling for provider adapters."""
from __future__ import annotations

import httpx

# HTTP/2 with keepalive for reduced TTFT
DEFAULT_TIMEOUT = httpx.Timeout(connect=5, read=60, write=30, pool=60)
LIMITS = httpx.Limits(max_connections=50, max_keepalive_connections=50)

# Shared client instance (HTTP/2 enabled, connection pooling)
_client = httpx.AsyncClient(
    http2=True,
    timeout=DEFAULT_TIMEOUT,
    limits=LIMITS,
    headers={"Accept-Encoding": "identity"},  # Avoid gzip on SSE
)


async def get_client() -> httpx.AsyncClient:
    """Get the shared HTTP/2 client instance."""
    return _client

