"""Token Tracking: Normalize usage across providers.

Unifies token counts and usage metadata from different provider responses.
"""
from typing import Dict, Any, Optional


def normalize_usage(raw: Optional[Dict[str, Any]], provider: str) -> Dict[str, Any]:
    """
    Normalize usage data from different providers into a unified format.
    
    Returns:
        Dict with: {input_tokens, output_tokens, cost_est, truncated}
    """
    if not raw:
        return {
            "input_tokens": None,
            "output_tokens": None,
            "cost_est": 0.0,
            "truncated": False
        }
    
    if provider == "openai":
        # OpenAI responses: {"usage": {"prompt_tokens":.., "completion_tokens":.., "total_tokens":..}, ...}
        u = raw.get("usage", raw)
        return {
            "input_tokens": u.get("prompt_tokens"),
            "output_tokens": u.get("completion_tokens"),
            "cost_est": raw.get("cost_est", 0.0),
            "truncated": bool(raw.get("meta", {}).get("truncated", False))
        }
    
    if provider == "gemini":
        # Gemini: usageMetadata or usage dict
        u = raw.get("usageMetadata", raw.get("usage", {}))
        return {
            "input_tokens": u.get("promptTokenCount") or u.get("input_tokens"),
            "output_tokens": u.get("candidatesTokenCount") or u.get("output_tokens"),
            "cost_est": raw.get("cost_est", 0.0),
            "truncated": bool(raw.get("truncated", False))
        }
    
    if provider == "perplexity":
        # Perplexity: OpenAI-compatible format
        u = raw.get("usage", {})
        return {
            "input_tokens": u.get("prompt_tokens"),
            "output_tokens": u.get("completion_tokens"),
            "cost_est": raw.get("cost_est", 0.0),
            "truncated": bool(raw.get("truncated", False))
        }
    
    if provider == "kimi":
        # Kimi: OpenAI-compatible format
        u = raw.get("usage", {})
        return {
            "input_tokens": u.get("prompt_tokens"),
            "output_tokens": u.get("completion_tokens"),
            "cost_est": raw.get("cost_est", 0.0),
            "truncated": bool(raw.get("truncated", False))
        }
    
    # Default: try common field names
    return {
        "input_tokens": raw.get("input_tokens") or raw.get("prompt_tokens"),
        "output_tokens": raw.get("output_tokens") or raw.get("completion_tokens"),
        "cost_est": raw.get("cost_est", 0.0),
        "truncated": bool(raw.get("truncated", False))
    }

