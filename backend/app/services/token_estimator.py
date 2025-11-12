"""Rudimentary token estimation helpers."""
from __future__ import annotations

from typing import List, Dict


def estimate_text_tokens(text: str) -> int:
    """Approximate tokens for a text chunk (chars/4 heuristic)."""
    if not text:
        return 0
    return max(1, len(text) // 4)


def estimate_messages_tokens(messages: List[Dict[str, str]]) -> int:
    """Estimate tokens for a list of chat messages."""
    total = 0
    for message in messages:
        total += estimate_text_tokens(message.get("content", ""))
    return total
