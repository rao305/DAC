"""Observability: Per-turn logging and metrics.

Logs intent, routing decisions, latency, tokens, cost, and safety flags
for production monitoring and analytics.
"""
from typing import Dict, Any, Optional
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)


async def log_turn(
    thread_id: str,
    turn_id: str,
    intent: str,
    router_decision: Dict[str, str],
    provider: str,
    model: str,
    latency_ms: float,
    input_tokens: Optional[int] = None,
    output_tokens: Optional[int] = None,
    cost_est: Optional[float] = None,
    cache_hit: bool = False,
    fallback_used: bool = False,
    safety_flags: Optional[Dict[str, Any]] = None,
    truncated: bool = False,
    error: Optional[str] = None
) -> None:
    """
    Log a complete turn with all observability fields.
    
    Args:
        thread_id: Thread identifier
        turn_id: Unique turn identifier
        intent: Detected intent (social_chat, coding_help, etc.)
        router_decision: Router decision dict with provider/model/reason
        provider: Actual provider used
        model: Actual model used
        latency_ms: Request latency in milliseconds
        input_tokens: Input token count
        output_tokens: Output token count
        cost_est: Estimated cost in USD
        cache_hit: Whether this was a cache hit
        fallback_used: Whether fallback provider was used
        safety_flags: Dict of safety-related flags
        truncated: Whether response was truncated
        error: Error message if request failed
    """
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "thread_id": thread_id,
        "turn_id": turn_id,
        "intent": intent,
        "router_decision": router_decision,
        "provider": provider,
        "model": model,
        "latency_ms": latency_ms,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cost_est": cost_est,
        "cache_hit": cache_hit,
        "fallback_used": fallback_used,
        "safety_flags": safety_flags or {},
        "truncated": truncated,
        "error": error,
    }
    
    # Log as JSON for structured logging
    logger.info(f"TURN_LOG: {json.dumps(log_entry)}")


def calculate_cost_estimate(
    provider: str,
    model: str,
    input_tokens: int,
    output_tokens: int
) -> float:
    """
    Calculate estimated cost in USD.
    
    Rough pricing (2025):
    - Gemini 1.5 Flash: $0.075/$0.30 per 1M tokens (input/output)
    - GPT-4o-mini: $0.15/$0.60 per 1M tokens
    - Perplexity Sonar: $1.00/$5.00 per 1M tokens
    - Perplexity Sonar Pro: $3.00/$15.00 per 1M tokens
    """
    # Pricing per 1M tokens (input, output)
    pricing = {
        ("gemini", "gemini-1.5-flash"): (0.075, 0.30),
        ("gemini", "gemini-1.5-pro"): (0.125, 0.50),
        ("openai", "gpt-4o-mini"): (0.15, 0.60),
        ("openai", "gpt-4o"): (2.50, 10.00),
        ("perplexity", "sonar"): (1.00, 5.00),
        ("perplexity", "sonar-pro"): (3.00, 15.00),
        ("kimi", "kimi-k2-turbo-preview"): (0.10, 0.40),
    }
    
    key = (provider.lower(), model.lower())
    if key in pricing:
        input_price, output_price = pricing[key]
        cost = (input_tokens / 1_000_000 * input_price) + (output_tokens / 1_000_000 * output_price)
        return round(cost, 6)
    
    # Default estimate
    return (input_tokens + output_tokens) / 1_000_000 * 1.0


def generate_weekly_rollup(turns: list[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate weekly rollup metrics from turn logs.
    
    Args:
        turns: List of turn log dictionaries
    
    Returns:
        Rollup metrics dict
    """
    if not turns:
        return {}
    
    # Intent mix
    intent_counts = {}
    for turn in turns:
        intent = turn.get("intent", "unknown")
        intent_counts[intent] = intent_counts.get(intent, 0) + 1
    
    # Latency metrics
    latencies = [t.get("latency_ms", 0) for t in turns if t.get("latency_ms")]
    latencies.sort()
    p50 = latencies[len(latencies) // 2] if latencies else 0
    p95 = latencies[int(len(latencies) * 0.95)] if latencies else 0
    
    # Cost metrics
    total_cost = sum(t.get("cost_est", 0) or 0 for t in turns)
    total_turns = len(turns)
    cost_per_turn = total_cost / total_turns if total_turns > 0 else 0
    
    # Cache hit rate
    cache_hits = sum(1 for t in turns if t.get("cache_hit"))
    cache_hit_rate = cache_hits / total_turns if total_turns > 0 else 0
    
    # Fallback usage
    fallback_used = sum(1 for t in turns if t.get("fallback_used"))
    fallback_rate = fallback_used / total_turns if total_turns > 0 else 0
    
    return {
        "period": "weekly",
        "total_turns": total_turns,
        "intent_mix": intent_counts,
        "latency_p50_ms": p50,
        "latency_p95_ms": p95,
        "total_cost_usd": round(total_cost, 4),
        "cost_per_turn_usd": round(cost_per_turn, 6),
        "cache_hit_rate": round(cache_hit_rate, 3),
        "fallback_rate": round(fallback_rate, 3),
    }

