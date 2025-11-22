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

    Supports multimodal content:
    - If content is a string, creates text part
    - If content is a list, handles both text and image_url parts
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
            if isinstance(content, str):
                content = f"[System Context]\n{content}"

        # Handle multimodal content (list format)
        parts = []
        if isinstance(content, list):
            for item in content:
                if isinstance(item, dict):
                    if item.get("type") == "text":
                        parts.append({"text": item.get("text", "")})
                    elif item.get("type") == "image_url":
                        image_url = item.get("image_url", {})
                        url = image_url.get("url", "") if isinstance(image_url, dict) else image_url
                        if url:
                            # Check if it's a data URL (base64)
                            if url.startswith("data:"):
                                # Extract mime type and base64 data
                                # Format: data:image/png;base64,iVBORw0KG...
                                try:
                                    header, data = url.split(",", 1)
                                    mime_type = header.split(";")[0].split(":")[1]
                                    parts.append({
                                        "inline_data": {
                                            "mime_type": mime_type,
                                            "data": data
                                        }
                                    })
                                except Exception:
                                    # Fallback to fileData if parsing fails
                                    parts.append({
                                        "fileData": {
                                            "fileUri": url
                                        }
                                    })
                            else:
                                # Regular URL - use fileData
                                parts.append({
                                    "fileData": {
                                        "fileUri": url
                                    }
                                })
        else:
            # Simple string content
            parts.append({"text": content if isinstance(content, str) else str(content)})

        contents.append({
            "role": role,
            "parts": parts,
        })
    return contents


async def call_gemini(
    messages: List[Dict[str, str]],
    model: str,
    api_key: str,
    *,
    max_output_tokens: int = 4096,
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
    max_output_tokens: int = 4096,
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

    finish_reason = None
    usage: Dict | None = None

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
                finish_reason = candidates[0].get("finishReason") or finish_reason
            usage_meta = data.get("usageMetadata")
            if usage_meta:
                usage = {
                    "input_tokens": usage_meta.get("promptTokenCount"),
                    "output_tokens": usage_meta.get("candidatesTokenCount"),
                    "total_tokens": usage_meta.get("totalTokenCount"),
                }
        
    yield {
        "type": "done",
        "finish_reason": finish_reason,
        "usage": usage,
    }
