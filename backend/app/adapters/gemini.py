"""Gemini adapter."""
from __future__ import annotations

import time
import json
from typing import List, Dict, AsyncIterator
import httpx

from app.adapters.base import ProviderResponse, ProviderAdapterError
from app.adapters._client import get_client

API_URL_TEMPLATE = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
API_STREAM_URL_TEMPLATE = "https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent"


def _to_gemini_contents(messages: List[Dict[str, str]]) -> List[Dict[str, object]]:
    """Convert OpenAI-style messages to Gemini content blocks.

    Gemini only supports 'user' and 'model' roles.
    - 'assistant' -> 'model'
    - 'system' -> 'user' (with prepended marker)
    """
    contents: List[Dict[str, object]] = []
    for message in messages:
        role = message.get("role", "user")
        content = message.get("content", "")

        if role == "assistant":
            role = "model"
        elif role == "system":
            # Gemini doesn't support system role, convert to user message
            role = "user"
            # Prepend system marker to preserve context
            content = f"[System Context]\n{content}"

        contents.append({
            "role": role,
            "parts": [{"text": content}],
        })
    return contents


async def call_gemini(
    messages: List[Dict[str, str]],
    model: str,
    api_key: str,
    *,
    max_output_tokens: int = 800,
) -> ProviderResponse:
    """Invoke Gemini generateContent API."""
    params = {"key": api_key}
    payload = {
        "contents": _to_gemini_contents(messages),
        "generationConfig": {
            "maxOutputTokens": max_output_tokens,
            "temperature": 0.4,
        },
    }

    start = time.perf_counter()

    client = await get_client()
    response = await client.post(
        API_URL_TEMPLATE.format(model=model),
        params=params,
        json=payload,
    )

    latency_ms = (time.perf_counter() - start) * 1000

    if response.status_code != 200:
        raise ProviderAdapterError("gemini", response.text)

    data = response.json()
    candidates = data.get("candidates") or []
    content_parts = (candidates[0].get("content", {}).get("parts") if candidates else None) or []
    text = " ".join(part.get("text", "") for part in content_parts).strip()

    usage = data.get("usageMetadata", {})

    return ProviderResponse(
        content=text,
        provider_message_id=candidates[0].get("id") if candidates else None,
        prompt_tokens=usage.get("promptTokenCount"),
        completion_tokens=usage.get("candidatesTokenCount"),
        latency_ms=latency_ms,
        request_id=None,
        raw=data,
    )


async def call_gemini_streaming(
    messages: List[Dict[str, str]],
    model: str,
    api_key: str,
    *,
    max_output_tokens: int = 800,
) -> AsyncIterator[Dict]:
    """Invoke Gemini streamGenerateContent API."""
    params = {"key": api_key, "alt": "sse"}
    payload = {
        "contents": _to_gemini_contents(messages),
        "generationConfig": {
            "maxOutputTokens": max_output_tokens,
            "temperature": 0.4,
        },
    }

    client = await get_client()
    start = time.perf_counter()
    ttft_sent = False

    async with client.stream(
        'POST',
        API_STREAM_URL_TEMPLATE.format(model=model),
        params=params,
        json=payload
    ) as response:
        response.raise_for_status()
        
        async for line in response.aiter_lines():
            if not line or not line.startswith("data: "):
                continue
            
            try:
                data = json.loads(line[6:].strip())
            except Exception:
                continue
            
            # Normalize to {"type":"delta","delta": "..."} when text arrives
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts and parts[0].get("text"):
                    text = parts[0]["text"]
                    if not ttft_sent:
                        ttft_ms = int((time.perf_counter() - start) * 1000)
                        yield {"type": "meta", "ttft_ms": ttft_ms}
                        ttft_sent = True
                    yield {"type": "delta", "delta": text}
        
        yield {"type": "done"}
