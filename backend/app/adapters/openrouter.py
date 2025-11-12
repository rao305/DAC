"""OpenRouter adapter."""
from __future__ import annotations

import time
import json
from typing import List, Dict, AsyncIterator
import httpx

from app.adapters.base import ProviderResponse, ProviderAdapterError
from app.adapters._client import get_client

API_URL = "https://openrouter.ai/api/v1/chat/completions"


async def call_openrouter(
    messages: List[Dict[str, str]],
    model: str,
    api_key: str,
    *,
    temperature: float = 0.3,
) -> ProviderResponse:
    """Invoke OpenRouter chat completions."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cross-llm-thread-hub",
        "X-Title": "Cross-LLM Thread Hub",
    }

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }

    start = time.perf_counter()

    client = await get_client()
    response = await client.post(API_URL, headers=headers, json=payload)

    latency_ms = (time.perf_counter() - start) * 1000

    if response.status_code != 200:
        # Try to parse error response for better error messages
        try:
            error_data = response.json()
            error_message = error_data.get("error", {})
            if isinstance(error_message, dict):
                error_text = error_message.get("message", str(error_message))
            else:
                error_text = str(error_message)
            # Include status code and model in error for debugging
            error_detail = f"Status {response.status_code}: {error_text} (model: {model})"
        except Exception:
            # Fallback to raw text if JSON parsing fails
            error_detail = response.text
        
        raise ProviderAdapterError("openrouter", error_detail)

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


async def call_openrouter_streaming(
    messages: List[Dict[str, str]],
    model: str,
    api_key: str,
    *,
    temperature: float = 0.3,
) -> AsyncIterator[Dict]:
    """Invoke OpenRouter chat completions with streaming."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cross-llm-thread-hub",
        "X-Title": "Cross-LLM Thread Hub",
    }

    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "stream": True,
    }

    client = await get_client()
    start = time.perf_counter()
    ttft_sent = False

    async with client.stream('POST', API_URL, headers=headers, json=payload) as response:
        response.raise_for_status()
        
        async for line in response.aiter_lines():
            if not line or not line.startswith("data: "):
                continue
            
            raw = line[6:].strip()
            if raw == "[DONE]":
                yield {"type": "done"}
                break
            
            try:
                data = json.loads(raw)
            except Exception:
                continue
            
            # Normalize to {"type":"delta","delta": "..."} when content arrives
            delta = data.get("choices", [{}])[0].get("delta", {}).get("content")
            if delta:
                if not ttft_sent:
                    ttft_ms = int((time.perf_counter() - start) * 1000)
                    yield {"type": "meta", "ttft_ms": ttft_ms}
                    ttft_sent = True
                yield {"type": "delta", "delta": delta}
        
        yield {"type": "done"}
