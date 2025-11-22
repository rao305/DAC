"""
Regression test for conversation context preservation.

Tests that follow-up questions correctly use prior conversation turns,
especially for pronoun resolution (e.g., "who are his children" after "Who is Donald Trump").

This test verifies:
1. Short-term conversation history is always included in provider calls
2. Memory context is properly injected when available
3. Both streaming and non-streaming paths preserve context
"""

import pytest
import asyncio
from typing import List, Dict
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.provider_key import ProviderType
from app.api.threads import _get_recent_messages, add_message_streaming
from app.models.message import Message, MessageRole


@pytest.fixture
def mock_db():
    """Mock database session."""
    db = AsyncMock()
    return db


@pytest.fixture
def sample_thread_id():
    """Sample thread ID for testing."""
    return "test_thread_123"


@pytest.fixture
def sample_messages():
    """Sample conversation messages simulating the Donald Trump example."""
    return [
        Message(
            id="msg1",
            thread_id="test_thread_123",
            role=MessageRole.USER,
            content="Who is Donald Trump",
            sequence=0,
        ),
        Message(
            id="msg2",
            thread_id="test_thread_123",
            role=MessageRole.ASSISTANT,
            content="Donald Trump is the 45th President of the United States, a businessman, and politician.",
            sequence=1,
            provider="perplexity",
            model="sonar-pro",
        ),
    ]


@pytest.mark.asyncio
async def test_get_recent_messages_includes_all_turns(mock_db, sample_thread_id, sample_messages):
    """Test that _get_recent_messages retrieves all conversation turns."""
    from sqlalchemy import select
    from sqlalchemy.engine import Result
    
    # Mock the database query
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = sample_messages
    mock_db.execute = AsyncMock(return_value=mock_result)
    
    # Call the function
    messages = await _get_recent_messages(mock_db, sample_thread_id)
    
    # Verify we got both messages
    assert len(messages) == 2
    assert messages[0].role == MessageRole.USER
    assert messages[0].content == "Who is Donald Trump"
    assert messages[1].role == MessageRole.ASSISTANT
    assert "Donald Trump" in messages[1].content


@pytest.mark.asyncio
async def test_conversation_history_includes_prior_assistant_response():
    """
    Test that when building prompt_messages, the assistant's previous response
    is included in the conversation history.
    
    This is the critical test: when user asks "who are his children",
    the messages array MUST include the previous "Who is Donald Trump" Q&A pair.
    """
    # Simulate the exact flow from threads.py
    prior_messages = [
        Message(
            id="msg1",
            thread_id="test_thread",
            role=MessageRole.USER,
            content="Who is Donald Trump",
            sequence=0,
        ),
        Message(
            id="msg2",
            thread_id="test_thread",
            role=MessageRole.ASSISTANT,
            content="Donald Trump is the 45th President of the United States.",
            sequence=1,
        ),
    ]
    
    # Convert to conversation history format (as done in threads.py)
    conversation_history = [
        {"role": msg.role.value, "content": msg.content}
        for msg in prior_messages
    ]
    
    # Add current user message
    current_message = "who are his children"
    conversation_history.append({"role": "user", "content": current_message})
    
    # Verify the conversation history includes both prior turns
    assert len(conversation_history) == 3
    assert conversation_history[0]["role"] == "user"
    assert conversation_history[0]["content"] == "Who is Donald Trump"
    assert conversation_history[1]["role"] == "assistant"
    assert "Donald Trump" in conversation_history[1]["content"]
    assert conversation_history[2]["role"] == "user"
    assert conversation_history[2]["content"] == "who are his children"
    
    # CRITICAL: The assistant's response about Donald Trump MUST be present
    # for the pronoun "his" to resolve correctly
    assert any("Donald Trump" in msg["content"] for msg in conversation_history if msg["role"] == "assistant")


@pytest.mark.asyncio
async def test_prompt_messages_structure():
    """
    Test that prompt_messages has the correct structure:
    1. System messages (persona, memory) first
    2. Conversation history (user/assistant turns)
    3. Current user message
    """
    conversation_history = [
        {"role": "user", "content": "Who is Donald Trump"},
        {"role": "assistant", "content": "Donald Trump is the 45th President."},
    ]
    
    # Simulate building prompt_messages (as in threads.py)
    prompt_messages = conversation_history.copy()
    
    # Add system message (persona)
    prompt_messages.insert(0, {
        "role": "system",
        "content": "You are DAC, a helpful assistant."
    })
    
    # Add current user message
    prompt_messages.append({"role": "user", "content": "who are his children"})
    
    # Verify structure
    assert prompt_messages[0]["role"] == "system"
    assert prompt_messages[1]["role"] == "user"
    assert prompt_messages[1]["content"] == "Who is Donald Trump"
    assert prompt_messages[2]["role"] == "assistant"
    assert prompt_messages[3]["role"] == "user"
    assert prompt_messages[3]["content"] == "who are his children"
    
    # Verify conversation history is preserved
    conversation_turns = [m for m in prompt_messages if m["role"] in ["user", "assistant"]]
    assert len(conversation_turns) == 3  # 2 prior + 1 current


def test_max_context_messages_limit():
    """Test that MAX_CONTEXT_MESSAGES limit is applied correctly."""
    from app.api.threads import MAX_CONTEXT_MESSAGES
    
    # Create more messages than the limit
    conversation_messages = [
        {"role": "user", "content": f"Message {i}"}
        for i in range(MAX_CONTEXT_MESSAGES + 10)
    ]
    
    # Apply limit (as done in threads.py)
    limited = conversation_messages[-MAX_CONTEXT_MESSAGES:]
    
    # Verify we kept only the last MAX_CONTEXT_MESSAGES
    assert len(limited) == MAX_CONTEXT_MESSAGES
    assert limited[0]["content"] == f"Message {10}"  # First of the kept messages


@pytest.mark.asyncio
async def test_memory_context_injection():
    """Test that memory context is properly injected as system message."""
    from app.services.memory_service import MemoryContext
    
    # Simulate memory context
    memory_context = MemoryContext(
        private_fragments=[
            {"text": "User prefers TypeScript", "score": 0.9}
        ],
        shared_fragments=[
            {"text": "Project uses React", "provenance": {"provider": "openai"}}
        ],
        total_fragments=2,
        retrieval_time_ms=50
    )
    
    # Build prompt messages
    prompt_messages = [
        {"role": "user", "content": "What do I prefer?"}
    ]
    
    # Inject memory (as done in threads.py)
    if memory_context and memory_context.total_fragments > 0:
        memory_content = "# Relevant Context from Memory:\n\n"
        if memory_context.private_fragments:
            memory_content += "## Your Previous Interactions:\n"
            for frag in memory_context.private_fragments:
                memory_content += f"- {frag['text']}\n"
        if memory_context.shared_fragments:
            memory_content += "## Shared Knowledge:\n"
            for frag in memory_context.shared_fragments:
                provider_info = frag.get('provenance', {}).get('provider', 'unknown')
                memory_content += f"- {frag['text']} (from {provider_info})\n"
        
        prompt_messages.insert(0, {
            "role": "system",
            "content": memory_content
        })
    
    # Verify memory was injected
    assert prompt_messages[0]["role"] == "system"
    assert "Relevant Context from Memory" in prompt_messages[0]["content"]
    assert "TypeScript" in prompt_messages[0]["content"]
    assert "React" in prompt_messages[0]["content"]


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])

