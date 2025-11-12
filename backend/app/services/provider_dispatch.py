"""Routes provider calls to the right adapter."""
from __future__ import annotations

from typing import List, Dict, AsyncIterator

from app.adapters.base import ProviderResponse
from app.adapters.perplexity import call_perplexity, call_perplexity_streaming
from app.adapters.openai_adapter import call_openai, call_openai_streaming
from app.adapters.gemini import call_gemini, call_gemini_streaming
from app.adapters.openrouter import call_openrouter, call_openrouter_streaming
from app.adapters.kimi import call_kimi, call_kimi_streaming
from app.models.provider_key import ProviderType


async def call_provider_adapter(
    provider: ProviderType,
    model: str,
    messages: List[Dict[str, str]],
    api_key: str,
) -> ProviderResponse:
    """Call the appropriate adapter."""
    if provider == ProviderType.PERPLEXITY:
        return await call_perplexity(messages, model, api_key)

    if provider == ProviderType.OPENAI:
        return await call_openai(messages, model, api_key)

    if provider == ProviderType.GEMINI:
        return await call_gemini(messages, model, api_key)

    if provider == ProviderType.OPENROUTER:
        return await call_openrouter(messages, model, api_key)

    if provider == ProviderType.KIMI:
        return await call_kimi(messages, model, api_key)

    raise ValueError(f"Unsupported provider: {provider.value}")


async def call_provider_adapter_streaming(
    provider: ProviderType,
    model: str,
    messages: List[Dict[str, str]],
    api_key: str,
) -> AsyncIterator[Dict]:
    """Call the appropriate adapter with streaming."""
    if provider == ProviderType.PERPLEXITY:
        async for chunk in call_perplexity_streaming(messages, model, api_key):
            yield chunk

    elif provider == ProviderType.OPENAI:
        async for chunk in call_openai_streaming(messages, model, api_key):
            yield chunk

    elif provider == ProviderType.GEMINI:
        async for chunk in call_gemini_streaming(messages, model, api_key):
            yield chunk

    elif provider == ProviderType.OPENROUTER:
        async for chunk in call_openrouter_streaming(messages, model, api_key):
            yield chunk

    elif provider == ProviderType.KIMI:
        async for chunk in call_kimi_streaming(messages, model, api_key):
            yield chunk

    else:
        raise ValueError(f"Unsupported provider: {provider.value}")
