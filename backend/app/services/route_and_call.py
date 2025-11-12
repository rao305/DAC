"""Route and Call: Integration layer for router + fallback ladder.

This service combines intent detection, fallback ladder, and shared context
to provide a unified routing and calling interface.
"""
from typing import Dict, Any, Optional
import time

from app.services.fallback_ladder import get_fallback_chain, call_with_fallback, IntentType
from app.services.guardrails import sanitize_user_input
from app.services.memory_manager import build_prompt_for_model
from app.services.memory_manager import smooth_intent, update_last_intent
from app.services.provider_dispatch import call_provider_adapter
from app.models.provider_key import ProviderType


def detect_intent_from_reason(reason: str) -> str:
    """
    Extract intent from router reason string.
    
    Returns one of: coding_help, qa_retrieval, editing/writing, reasoning/math, social_chat, ambiguous_or_other
    """
    reason_lower = reason.lower()
    
    intent_keywords = {
        "coding_help": ["code generation", "code", "function", "algorithm", "python", "javascript"],
        "qa_retrieval": ["explanation", "explain", "what", "how", "why", "question", "factual"],
        "editing/writing": ["rewrite", "edit", "writing", "article", "story", "creative"],
        "reasoning/math": ["solve", "calculate", "math", "reasoning", "complex"],
        "social_chat": ["greeting", "hello", "thanks", "general chat", "casual"],
    }
    
    for intent, keywords in intent_keywords.items():
        if any(kw in reason_lower for kw in keywords):
            return intent
    
    return "ambiguous_or_other"


async def route_and_call(
    thread_id: str,
    user_text: str,
    org_id: str,
    api_key_map: Dict[str, str],
    db,
    get_api_key_fn=None  # Lazy API key fetching function
) -> Dict[str, Any]:
    """
    Route request with fallback ladder and shared context.
    
    Args:
        thread_id: Thread identifier
        user_text: User message text
        org_id: Organization ID
        api_key_map: Map of provider -> api_key
        db: Database session
    
    Returns:
        Dict with: {intent, result: {text, provider, model, usage, latency_ms, error, fallback_used}, safety_flags}
    """
    # 1) Sanitize input
    safe_text, safety_flags = sanitize_user_input(user_text)
    
    # 2) Get initial routing decision (use existing router logic)
    from app.api.router import analyze_content
    provider_str, model, reason = analyze_content(safe_text, 0)
    
    # Extract intent from reason
    intent = detect_intent_from_reason(reason)
    
    # Apply intent smoothing if thread_id provided
    if thread_id:
        smoothed_intent = smooth_intent(intent, thread_id, safe_text)
        if smoothed_intent != intent:
            intent = smoothed_intent
        update_last_intent(thread_id, intent)
    
    # 3) Get fallback chain for intent
    try:
        intent_enum = IntentType(intent)
    except ValueError:
        intent_enum = IntentType.AMBIGUOUS
    
    fallback_chain = await get_fallback_chain(intent)
    
    # 4) Build shared context for ALL providers
    from app.services.dac_persona import DAC_SYSTEM_PROMPT
    prompt_messages = build_prompt_for_model(thread_id, DAC_SYSTEM_PROMPT)
    
    # 5) Create call function that uses provider dispatch (streaming)
    async def call_provider(provider: ProviderType, model: str):
        # Lazy API key fetching - only fetch when needed
        api_key = api_key_map.get(provider.value)
        if not api_key and get_api_key_fn:
            api_key = await get_api_key_fn(provider)
            if api_key:
                api_key_map[provider.value] = api_key
        
        if not api_key:
            raise ValueError(f"No API key for provider {provider.value}")
        
        # Call provider adapter streaming
        from app.services.provider_dispatch import call_provider_adapter_streaming
        
        # Collect stream chunks and usage
        stream_chunks = []
        usage_data = {}
        
        async def stream_wrapper():
            """Wrap streaming adapter to collect chunks and usage."""
            async for chunk in call_provider_adapter_streaming(
                provider=provider,
                model=model,
                messages=prompt_messages,
                api_key=api_key
            ):
                # Collect delta chunks
                if chunk.get("type") == "delta" and "delta" in chunk:
                    stream_chunks.append(chunk["delta"])
                    yield chunk["delta"]
                
                # Collect usage/metadata
                if chunk.get("type") == "meta":
                    if "usage" in chunk:
                        usage_data.update(chunk["usage"])
                    if "prompt_tokens" in chunk:
                        usage_data["prompt_tokens"] = chunk["prompt_tokens"]
                    if "completion_tokens" in chunk:
                        usage_data["completion_tokens"] = chunk["completion_tokens"]
        
        # Return result dict with stream iterator
        return {
            "stream": stream_wrapper(),
            "usage": usage_data,
            "raw": usage_data  # For normalize_usage
        }
    
    # 6) Call with fallback
    result = await call_with_fallback(
        call_provider,
        fallback_chain,
        timeout_seconds=12.0,
        max_retries=1
    )
    
    return {
        "intent": intent,
        "result": result,
        "safety_flags": {
            "has_pii": safety_flags.has_pii,
            "pii_types": safety_flags.pii_types,
            "prompt_injection_risk": safety_flags.prompt_injection_risk,
        }
    }

