"""Service for auto-generating thread titles based on user messages."""
import re
from typing import Optional


def generate_thread_title(user_message: str, max_length: int = 60) -> str:
    """
    Generate a concise thread title from the user's first message.

    Args:
        user_message: The user's first message in the thread
        max_length: Maximum length of the title (default 60 chars)

    Returns:
        A concise title for the thread
    """
    # Clean up the message
    cleaned = user_message.strip()

    # Remove excessive whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned)

    # If the message is short enough, use it as-is
    if len(cleaned) <= max_length:
        return cleaned

    # Try to find a natural break point (sentence end, comma, etc.)
    # Look for the last sentence ending before max_length
    sentence_endings = ['. ', '! ', '? ']
    best_break = -1

    for ending in sentence_endings:
        pos = cleaned[:max_length].rfind(ending)
        if pos > best_break and pos > max_length // 2:  # At least halfway through
            best_break = pos + 1  # Include the punctuation

    if best_break > 0:
        return cleaned[:best_break].strip()

    # If no sentence ending, try to break at a word boundary
    if len(cleaned) > max_length:
        # Find the last space before max_length
        space_pos = cleaned[:max_length].rfind(' ')
        if space_pos > max_length // 2:  # At least halfway through
            return cleaned[:space_pos].strip() + "..."

    # Last resort: hard truncate with ellipsis
    return cleaned[:max_length - 3].strip() + "..."


def should_auto_title(thread_title: Optional[str], message_count: int) -> bool:
    """
    Determine if we should auto-generate a title for this thread.

    Args:
        thread_title: Current thread title (may be None)
        message_count: Number of messages in the thread

    Returns:
        True if we should auto-generate a title
    """
    # Auto-title if:
    # 1. No title exists
    # 2. This is the first user message (message_count would be 0 before adding)
    return thread_title is None and message_count == 0
