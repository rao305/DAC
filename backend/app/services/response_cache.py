"""Response Cache for Cost Control.

Caches responses based on normalized prompt + context fingerprint.
"""
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import hashlib
import json

# In-memory cache (swap for Redis in production)
_cache: Dict[str, Dict[str, Any]] = {}

# Cache TTL (default 1 hour)
CACHE_TTL_SECONDS = 3600


def normalize_prompt(messages: list[Dict[str, str]], top_k_context: int = 5) -> str:
    """
    Normalize prompt for caching.
    
    Args:
        messages: List of message dicts
        top_k_context: Number of recent messages to include in fingerprint
    
    Returns:
        Normalized string for hashing
    """
    # Extract system messages (persona, summary, facts)
    system_parts = []
    conversation_parts = []
    
    for msg in messages:
        role = msg.get("role", "")
        content = msg.get("content", "")
        
        if role == "system":
            # Include system messages (but normalize)
            system_parts.append(content.lower().strip())
        else:
            conversation_parts.append(f"{role}:{content}")
    
    # Take last top_k_context conversation messages
    recent_context = conversation_parts[-top_k_context:] if len(conversation_parts) > top_k_context else conversation_parts
    
    # Combine for fingerprint
    normalized = "\n".join(system_parts) + "\n" + "\n".join(recent_context)
    return normalized


def make_cache_key(
    thread_id: str,
    user_text: str,
    intent: Optional[str] = None,
    top_k_context: int = 5
) -> str:
    """
    Generate cache key from thread_id and user text.
    
    Args:
        thread_id: Thread identifier
        user_text: User message text
        intent: Optional intent for cache partitioning
        top_k_context: Number of recent messages to include
    
    Returns:
        Cache key (SHA256 hash)
    """
    # Normalize user text
    normalized_text = user_text.lower().strip()
    
    # Include intent if provided (for cache partitioning)
    key_string = f"{thread_id}:{normalized_text}"
    if intent:
        key_string += f":{intent}"
    
    return hashlib.sha256(key_string.encode()).hexdigest()


def generate_cache_key(
    messages: list[Dict[str, str]],
    provider: str,
    model: str,
    top_k_context: int = 5
) -> str:
    """
    Generate cache key from prompt + provider + model.
    
    Args:
        messages: List of message dicts
        provider: Provider name
        model: Model name
        top_k_context: Number of recent messages to include
    
    Returns:
        Cache key (SHA256 hash)
    """
    normalized = normalize_prompt(messages, top_k_context)
    key_string = f"{provider}:{model}:{normalized}"
    return hashlib.sha256(key_string.encode()).hexdigest()


def get_cached(cache_key: str) -> Optional[Dict[str, Any]]:
    """Alias for get_cached_response (for compatibility)."""
    return get_cached_response(cache_key)


def set_cached(cache_key: str, payload: Dict[str, Any], ttl_seconds: int = CACHE_TTL_SECONDS) -> None:
    """Alias for set_cached_response (for compatibility)."""
    set_cached_response(cache_key, payload, ttl_seconds)


def get_cached_response(cache_key: str) -> Optional[Dict[str, Any]]:
    """
    Get cached response if available and not expired.
    
    Args:
        cache_key: Cache key
    
    Returns:
        Cached response dict or None
    """
    if cache_key not in _cache:
        return None
    
    entry = _cache[cache_key]
    expires_at = entry.get("expires_at")
    
    if expires_at and datetime.utcnow() > expires_at:
        # Expired, remove from cache
        del _cache[cache_key]
        return None
    
    return entry.get("response")


def set_cached_response(
    cache_key: str,
    response: Dict[str, Any],
    ttl_seconds: int = CACHE_TTL_SECONDS
) -> None:
    """
    Cache a response.
    
    Args:
        cache_key: Cache key
        response: Response dict to cache
        ttl_seconds: Time to live in seconds
    """
    expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)
    _cache[cache_key] = {
        "response": response,
        "expires_at": expires_at,
        "cached_at": datetime.utcnow().isoformat(),
    }


def clear_cache() -> None:
    """Clear all cached responses."""
    _cache.clear()


def get_cache_stats() -> Dict[str, Any]:
    """Get cache statistics."""
    now = datetime.utcnow()
    valid_entries = sum(1 for entry in _cache.values() if not entry.get("expires_at") or now <= entry.get("expires_at"))
    expired_entries = len(_cache) - valid_entries
    
    return {
        "total_entries": len(_cache),
        "valid_entries": valid_entries,
        "expired_entries": expired_entries,
    }

