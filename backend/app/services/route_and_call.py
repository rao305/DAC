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
from app.services.intent_rules import route_for_intent, pick_pipeline, is_social_greeting
from app.services.web_orchestrator import web_multisearch_answer
from app.services.style_normalizer import normalize_if_needed
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
    
    # Check for social greeting override
    if is_social_greeting(safe_text):
        intent = "social_chat"
    
    # Apply intent smoothing if thread_id provided
    if thread_id:
        smoothed_intent = smooth_intent(intent, thread_id, safe_text)
        if smoothed_intent != intent:
            intent = smoothed_intent
        update_last_intent(thread_id, intent)
    
    # Check for hard routing override (e.g., social greetings)
    routing_override = route_for_intent(intent, safe_text)
    if routing_override:
        # Override provider/model for this intent
        provider_override = ProviderType(routing_override["provider"])
        model_override = routing_override["model"]
        behavior = routing_override.get("behavior")
    else:
        provider_override = None
        model_override = None
        behavior = None
    
    # Check pipeline (web_multisearch vs direct_llm)
    pipeline = pick_pipeline(intent, safe_text)
    
    # Handle web_multisearch pipeline for time-sensitive queries
    if pipeline == "web_multisearch":
        return await handle_web_multisearch(
            thread_id=thread_id,
            user_text=safe_text,
            intent=intent,
            api_key_map=api_key_map,
            get_api_key_fn=get_api_key_fn
        )
    
    # 3) Get fallback chain for intent
    try:
        intent_enum = IntentType(intent)
    except ValueError:
        intent_enum = IntentType.AMBIGUOUS
    
    fallback_chain = await get_fallback_chain(intent)
    
    # Override first provider in chain if routing override exists
    if provider_override and model_override:
        fallback_chain = [(provider_override, model_override, "Hard override")] + fallback_chain[1:]
    
    # 4) Build shared context for ALL providers
    from app.services.dac_persona import DAC_SYSTEM_PROMPT, inject_dac_persona
    base_messages = build_prompt_for_model(thread_id, DAC_SYSTEM_PROMPT)
    # Inject persona with intent awareness
    prompt_messages = inject_dac_persona(base_messages, qa_mode=False, intent=intent)
    
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
            raw_text_buffer = ""
            async for chunk in call_provider_adapter_streaming(
                provider=provider,
                model=model,
                messages=prompt_messages,
                api_key=api_key
            ):
                # Collect delta chunks
                if chunk.get("type") == "delta" and "delta" in chunk:
                    delta_text = chunk["delta"]
                    stream_chunks.append(delta_text)
                    raw_text_buffer += delta_text
                    yield chunk["delta"]
                
                # Collect usage/metadata
                if chunk.get("type") == "meta":
                    if "usage" in chunk:
                        usage_data.update(chunk["usage"])
                    if "prompt_tokens" in chunk:
                        usage_data["prompt_tokens"] = chunk["prompt_tokens"]
                    if "completion_tokens" in chunk:
                        usage_data["completion_tokens"] = chunk["completion_tokens"]
            
            # Post-process: Style normalization for social_chat or dictionary-style responses
            if behavior == "chat_only" or intent == "social_chat":
                # Create LLM call function for normalization
                async def llm_call_for_norm(prompt: str, max_tokens: int) -> str:
                    from app.adapters.openai_adapter import call_openai
                    norm_messages = [{"role": "user", "content": prompt}]
                    response = await call_openai(
                        messages=norm_messages,
                        model="gpt-4o-mini",
                        api_key=api_key_map.get(ProviderType.OPENAI.value) or (await get_api_key_fn(ProviderType.OPENAI) if get_api_key_fn else None),
                        max_tokens=max_tokens
                    )
                    return response.content
                
                # Note: This normalization happens after streaming completes
                # For real-time normalization, we'd need to buffer and rewrite mid-stream
                # For now, we'll apply normalization in the style_normalizer module when needed
        
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


async def handle_web_multisearch(
    thread_id: str,
    user_text: str,
    intent: str,
    api_key_map: Dict[str, str],
    get_api_key_fn=None
) -> Dict[str, Any]:
    """
    Handle time-sensitive queries with web multi-search pipeline.
    
    Args:
        thread_id: Thread identifier
        user_text: User query text
        intent: Detected intent
        api_key_map: Map of provider -> api_key
        get_api_key_fn: Lazy API key fetching function
    
    Returns:
        Dict with routing result including synthesized answer
    """
    # Get Perplexity API key for search
    perplexity_key = api_key_map.get(ProviderType.PERPLEXITY.value)
    if not perplexity_key and get_api_key_fn:
        perplexity_key = await get_api_key_fn(ProviderType.PERPLEXITY)
    
    if not perplexity_key:
        return {
            "intent": intent,
            "result": {
                "provider": None,
                "model": None,
                "stream": None,
                "usage": {},
                "latency_ms": 0,
                "error": "No Perplexity API key for web search",
                "fallback_used": False
            },
            "safety_flags": {}
        }
    
    # Get OpenAI API key for synthesis
    openai_key = api_key_map.get(ProviderType.OPENAI.value)
    if not openai_key and get_api_key_fn:
        openai_key = await get_api_key_fn(ProviderType.OPENAI)
    
    if not openai_key:
        return {
            "intent": intent,
            "result": {
                "provider": None,
                "model": None,
                "stream": None,
                "usage": {},
                "latency_ms": 0,
                "error": "No OpenAI API key for synthesis",
                "fallback_used": False
            },
            "safety_flags": {}
        }
    
    # Create LLM call function for synthesis
    async def synthesis_llm_call(prompt: str, temperature: float = 0.2, max_tokens: int = 400) -> str:
        from app.adapters.openai_adapter import call_openai
        messages = [{"role": "user", "content": prompt}]
        response = await call_openai(
            messages=messages,
            model="gpt-4o-mini",
            api_key=openai_key,
            temperature=temperature,
            max_tokens=max_tokens
        )
        return response.content
    
    # Run web multi-search pipeline
    import time
    start_time = time.perf_counter()
    
    try:
        ans = await web_multisearch_answer(
            user_text=user_text,
            api_key=perplexity_key,
            llm_call=synthesis_llm_call,
            perplexity_model="sonar-pro"
        )
        
        latency_ms = (time.perf_counter() - start_time) * 1000
        
        # Wrap answer as single-chunk async iterator for streaming compatibility
        async def one_shot_stream(text: str):
            yield text
        
        return {
            "intent": intent,
            "result": {
                "provider": "web+openai",
                "model": "gpt-4o-mini",
                "stream": one_shot_stream(ans["text"]),
                "usage": {"cost_est": len(ans["text"]) / 4},  # Rough token estimate
                "latency_ms": latency_ms,
                "error": None,
                "fallback_used": False,
                "citations": ans.get("citations", [])
            },
            "safety_flags": {}
        }
    
    except Exception as e:
        latency_ms = (time.perf_counter() - start_time) * 1000
        return {
            "intent": intent,
            "result": {
                "provider": None,
                "model": None,
                "stream": None,
                "usage": {},
                "latency_ms": latency_ms,
                "error": str(e),
                "fallback_used": False
            },
            "safety_flags": {}
        }

