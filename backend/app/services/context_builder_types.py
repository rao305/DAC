"""
Type definitions for the centralized context builder.

These types match the TypeScript blueprint structure to ensure consistency
across the codebase and make the context building process explicit.
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class StoredMessage:
    """A stored message from the database."""
    id: str
    thread_id: str
    user_id: Optional[str] = None
    role: str  # "user", "assistant", "system", "tool"
    content: str
    created_at: Optional[Any] = None  # datetime or timestamp


@dataclass
class QueryRewriterInput:
    """Input to the query rewriter."""
    thread_id: str
    user_id: Optional[str]
    latest_user_message: str
    recent_history: List[Dict[str, str]]  # Already ordered oldest -> newest
    memory_snippet: Optional[str] = None


@dataclass
class QueryRewriterResult:
    """Result from the query rewriter."""
    rewritten_query: str  # Explicit, context-aware formulation
    reasoning_steps: Optional[List[str]] = None  # Optional for debugging
    entities: Optional[List[str]] = None  # Optional: extracted entities like ["Donald Trump"]


@dataclass
class BuildContextOptions:
    """Options for building contextual messages."""
    thread_id: str
    user_id: Optional[str]
    latest_user_message: str
    max_history_messages: int = 20  # Default 20 (matches MAX_CONTEXT_MESSAGES)
    max_memory_chars: int = 2000  # Default ~2000 chars for memory snippet
    use_memory: bool = True
    use_query_rewriter: bool = True
    provider: Optional[Any] = None  # Provider type for memory access graph


@dataclass
class BuildContextResult:
    """Result from building contextual messages."""
    messages: List[Dict[str, str]]  # Final messages array for LLM
    rewritten: Optional[QueryRewriterResult] = None
    memory_snippet: Optional[str] = None
    short_term_history: List[Dict[str, str]] = None
    entities: Optional[List[Dict[str, Any]]] = None
    is_ambiguous: bool = False
    disambiguation_data: Optional[Dict[str, Any]] = None

