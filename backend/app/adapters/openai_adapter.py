"""OpenAI adapter (Responses API compatible)."""
from __future__ import annotations

import time
import json
from typing import List, Dict, AsyncIterator
import httpx

from app.adapters.base import ProviderResponse, ProviderAdapterError
from app.adapters._client import get_client

API_URL = "https://api.openai.com/v1/chat/completions"


async def call_openai(
    messages: List[Dict],
    model: str,
    api_key: str,
    *,
    temperature: float = 0.2,
    max_tokens: int = 4096,
    streaming: bool = False,
) -> ProviderResponse:
    """Invoke OpenAI chat completions (compatible with Responses payload)."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    start = time.perf_counter()

    client = await get_client()
    response = await client.post(API_URL, headers=headers, json=payload)

    latency_ms = (time.perf_counter() - start) * 1000

    if response.status_code != 200:
        raise ProviderAdapterError("openai", response.text)

    data = response.json()
    choice = (data.get("choices") or [{}])[0]
    message = choice.get("message", {})
    usage = data.get("usage", {})

    return ProviderResponse(
        content=message.get("content", "").strip(),
        provider_message_id=choice.get("id"),
        prompt_tokens=usage.get("prompt_tokens"),
        completion_tokens=usage.get("completion_tokens"),
        latency_ms=latency_ms,
        request_id=response.headers.get("x-request-id"),
        raw=data,
    )


async def call_openai_streaming(
    messages: List[Dict],
    model: str,
    api_key: str,
    *,
    temperature: float = 0.2,
    max_tokens: int = 4096,
) -> AsyncIterator[Dict]:
    """Invoke OpenAI chat completions with streaming."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True,
    }

    client = await get_client()
    start = time.perf_counter()
    ttft_sent = False

    finish_reason = None
    usage: Dict | None = None

    async with client.stream('POST', API_URL, headers=headers, json=payload) as response:
        response.raise_for_status()
        
        async for line in response.aiter_lines():
            if not line or not line.startswith("data: "):
                continue
            
            raw = line[6:].strip()
            if raw == "[DONE]":
                break
            
            try:
                data = json.loads(raw)
            except Exception:
                continue
            
            # Normalize to {"type":"delta","delta": "..."} when content arrives
            choice = (data.get("choices") or [{}])[0]
            delta = choice.get("delta", {}).get("content")
            if delta:
                if not ttft_sent:
                    ttft_ms = int((time.perf_counter() - start) * 1000)
                    yield {"type": "meta", "ttft_ms": ttft_ms}
                    ttft_sent = True
                yield {"type": "delta", "delta": delta}
            
            finish_reason = choice.get("finish_reason") or finish_reason
            if data.get("usage"):
                usage = data["usage"]
        
    yield {
        "type": "done",
        "finish_reason": finish_reason,
        "usage": usage,
    }
