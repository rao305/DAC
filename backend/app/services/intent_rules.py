"""Intent Rules: Routing logic for social greetings and time-sensitive queries.

This module implements hard overrides for:
1. Social greetings → chat model (no web, no citations)
2. Time-sensitive queries → web multi-search pipeline
"""
import re
from typing import Dict, Optional
from datetime import datetime

from app.models.provider_key import ProviderType
from app.services.model_registry import validate_and_get_model


def is_social_greeting(text: str) -> bool:
    """Detect if text is a social greeting."""
    text_lower = text.strip().lower()
    
    # Exact matches
    exact_greetings = {"hi", "hello", "hey", "hey there", "hi there", "yo", "greetings"}
    if text_lower in exact_greetings:
        return True
    
    # Starts with greeting words
    if text_lower.startswith(("hi ", "hello ", "hey ")):
        return True
    
    return False


def looks_time_sensitive(text: str) -> bool:
    """Detect if query is time-sensitive (needs real-time web search)."""
    text_lower = text.lower()
    
    # Relative time patterns
    relative_time_pattern = re.compile(
        r"\b(today|yesterday|last\s+\d+\s*(hours?|days?|weeks?)|"
        r"two\s+days\s+ago|past\s+24|past\s+48|recent|latest|current|now|"
        r"this\s+week|this\s+month|breaking|just\s+happened)\b",
        re.I
    )
    
    if relative_time_pattern.search(text_lower):
        return True
    
    # Place names that often indicate news queries
    # Expand this list or use NER in production
    places = [
        "delhi", "mumbai", "bangalore", "chennai", "kolkata", "hyderabad",
        "new york", "london", "paris", "tokyo", "beijing", "singapore",
        "india", "usa", "uk", "china", "japan"
    ]
    
    if any(place in text_lower for place in places):
        # Check if it's combined with time-sensitive words
        time_indicators = ["happened", "news", "event", "incident", "update", "situation"]
        if any(indicator in text_lower for indicator in time_indicators):
            return True
    
    return False


def route_for_intent(intent: str, text: str) -> Optional[Dict[str, str]]:
    """
    Route based on intent with hard overrides.
    
    Returns routing config dict with:
    - provider: Provider name
    - model: Model name
    - behavior: "chat_only" (no web/citations) or None (normal)
    
    Returns None if no override needed (use normal routing).
    """
    # Force greetings → chat model (no web, no citations)
    if intent == "social_chat" or is_social_greeting(text):
        return {
            "provider": ProviderType.OPENAI.value,
            "model": "gpt-4o-mini",
            "behavior": "chat_only"
        }
    
    return None


def pick_pipeline(intent: str, text: str) -> str:
    """
    Choose pipeline for handling the query.
    
    Returns:
    - "web_multisearch": For time-sensitive qa_retrieval queries
    - "direct_llm": For normal queries (use standard routing)
    """
    if intent == "qa_retrieval" and looks_time_sensitive(text):
        return "web_multisearch"
    
    return "direct_llm"

