"""
Integration test for context builder - ensures it sees previous turns.

This test simulates the actual flow:
1. First request: user + assistant turns are added to in-memory store
2. Second request: build_contextual_messages is called BEFORE adding the second user turn
3. Assert that it includes the first Q&A in the context
"""
import pytest
from unittest.mock import AsyncMock, MagicMock

from app.services.threads_store import (
    THREADS,
    Turn,
    add_turn,
)
from app.services.context_builder import ContextBuilder


@pytest.fixture(autouse=True)
def clear_thread_store():
    """Clear the THREADS dict before and after each test."""
    THREADS.clear()
    yield
    THREADS.clear()


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    db = MagicMock()
    return db


@pytest.fixture
def context_builder():
    """Create a ContextBuilder instance."""
    return ContextBuilder()


@pytest.mark.asyncio
async def test_build_contextual_messages_sees_previous_turns(context_builder, mock_db):
    """
    Simulate two-turn conversation and ensure build_contextual_messages
    sees the 2 previous turns before the new user message.
    """
    thread_id = "test-thread-trump"
    user_id = "user-123"
    org_id = "org-demo"
    
    # --- Simulate first request: user + assistant already happened ---
    add_turn(thread_id, Turn(role="user", content="Who is Donald Trump?"))
    add_turn(thread_id, Turn(role="assistant", content="Donald Trump is the 45th president of the United States."))
    
    # Verify turns are in store
    assert len(THREADS[thread_id].turns) == 2, "Should have 2 turns in store"
    
    # --- Now simulate second request: "who are his children" ---
    # CRITICAL: Call build_contextual_messages BEFORE adding the second user turn
    # This is how the actual flow works - context builder runs first
    latest_user_message = "who are his children"
    
    # Build contextual messages (this should see the 2 previous turns)
    result = await context_builder.build_contextual_messages(
        db=mock_db,
        thread_id=thread_id,
        user_id=user_id,
        org_id=org_id,
        latest_user_message=latest_user_message,
        provider=None,
        use_memory=False,  # Disable supermemory for this test
        use_query_rewriter=False,  # Disable query rewriter for this test
        base_system_prompt="You are a helpful assistant.",
    )
    
    # Extract messages
    messages = result.messages
    
    # Extract only non-system messages for easier checking
    convo_msgs = [m for m in messages if m.get("role") in ("user", "assistant")]
    
    # We expect at least:
    #  - 1 user msg: "Who is Donald Trump?"
    #  - 1 assistant msg: "Donald Trump is ..."
    #  - 1 user msg: the new "who are his children"
    roles = [m.get("role") for m in convo_msgs]
    contents = [m.get("content", "") for m in convo_msgs]
    
    # Basic shape - should have at least 2 user messages and 1 assistant message
    user_count = roles.count("user")
    assistant_count = roles.count("assistant")
    
    assert user_count >= 2, f"Expected at least 2 user messages, got {user_count}. Messages: {convo_msgs}"
    assert assistant_count >= 1, f"Expected at least 1 assistant message, got {assistant_count}. Messages: {convo_msgs}"
    
    # Check that the first user question appears somewhere in the context
    assert any("Who is Donald Trump" in c for c in contents), \
        f"First user question 'Who is Donald Trump?' should appear in context. Contents: {contents}"
    
    # Check that the first assistant answer appears somewhere
    assert any("Donald Trump" in c and "president" in c.lower() for c in contents), \
        f"First assistant answer about Trump should appear in context. Contents: {contents}"
    
    # And that the latest question appears too
    assert any("who are his children" in c.lower() for c in contents), \
        f"Latest user question 'who are his children' should appear in context. Contents: {contents}"
    
    # Verify short_term_history was loaded correctly
    # Note: short_term_history might be None if not set, so check if it exists
    if result.short_term_history is not None:
        assert len(result.short_term_history) == 2, \
            f"short_term_history should have 2 turns, got {len(result.short_term_history)}"


@pytest.mark.asyncio
async def test_build_contextual_messages_empty_thread(context_builder, mock_db):
    """Test that build_contextual_messages handles empty thread gracefully."""
    thread_id = "test-thread-empty"
    user_id = "user-123"
    org_id = "org-demo"
    
    # No turns added - thread doesn't exist yet
    
    result = await context_builder.build_contextual_messages(
        db=mock_db,
        thread_id=thread_id,
        user_id=user_id,
        org_id=org_id,
        latest_user_message="Hello",
        provider=None,
        use_memory=False,
        use_query_rewriter=False,
        base_system_prompt="You are a helpful assistant.",
    )
    
    # Should still work, just with no history
    if result.short_term_history is not None:
        assert len(result.short_term_history) == 0, "Empty thread should have no history"
    assert len(result.messages) >= 1, "Should have at least the current user message"
    
    # Find the user message
    user_msgs = [m for m in result.messages if m.get("role") == "user"]
    assert len(user_msgs) >= 1, "Should have at least one user message"
    assert any("Hello" in m.get("content", "") for m in user_msgs), "Should include the current user message"


@pytest.mark.asyncio
async def test_build_contextual_messages_multiple_turns(context_builder, mock_db):
    """Test that build_contextual_messages sees all previous turns."""
    thread_id = "test-thread-multi"
    user_id = "user-123"
    org_id = "org-demo"
    
    # Add multiple turns
    add_turn(thread_id, Turn(role="user", content="Turn 1"))
    add_turn(thread_id, Turn(role="assistant", content="Response 1"))
    add_turn(thread_id, Turn(role="user", content="Turn 2"))
    add_turn(thread_id, Turn(role="assistant", content="Response 2"))
    
    # Now build context for a new message
    result = await context_builder.build_contextual_messages(
        db=mock_db,
        thread_id=thread_id,
        user_id=user_id,
        org_id=org_id,
        latest_user_message="Turn 3",
        provider=None,
        use_memory=False,
        use_query_rewriter=False,
        base_system_prompt="You are a helpful assistant.",
    )
    
    # Should see all 4 previous turns
    if result.short_term_history is not None:
        assert len(result.short_term_history) == 4, \
            f"Should have 4 turns in history, got {len(result.short_term_history)}"
    
    # Extract conversation messages
    convo_msgs = [m for m in result.messages if m.get("role") in ("user", "assistant")]
    contents = [m.get("content", "") for m in convo_msgs]
    
    # Should contain all previous turns
    assert any("Turn 1" in c for c in contents), "Should contain Turn 1"
    assert any("Response 1" in c for c in contents), "Should contain Response 1"
    assert any("Turn 2" in c for c in contents), "Should contain Turn 2"
    assert any("Response 2" in c for c in contents), "Should contain Response 2"
    assert any("Turn 3" in c for c in contents), "Should contain Turn 3 (current message)"

