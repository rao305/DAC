"""
Unit tests for thread store - ensures threads persist correctly across calls.

These tests verify the core invariant: threads and their turns must persist
across multiple function calls, and read paths must never overwrite existing threads.
"""
import pytest

from app.services.threads_store import (
    THREADS,
    Thread,
    Turn,
    get_thread,
    get_or_create_thread,
    add_turn,
    get_history,
)


@pytest.fixture(autouse=True)
def clear_thread_store():
    """
    Clear the THREADS dict before and after each test so tests are isolated.
    """
    THREADS.clear()
    yield
    THREADS.clear()


def test_get_or_create_thread_does_not_overwrite_existing_thread():
    """Verify that get_or_create_thread returns the same object, not a new one."""
    thread_id = "test-thread-1"
    
    # First creation
    t1 = get_or_create_thread(thread_id)
    t1.turns.append(Turn(role="user", content="Hello"))
    
    # Second call should return same object, not overwrite
    t2 = get_or_create_thread(thread_id)
    
    # Same Python object (identity check)
    assert t1 is t2, "get_or_create_thread should return the same Thread object, not create a new one"
    # Turns should be preserved
    assert len(t2.turns) == 1, "Turns should be preserved across calls"
    assert t2.turns[0].content == "Hello", "Turn content should be preserved"


def test_add_turn_persists_across_calls():
    """Verify that turns added via add_turn persist and can be retrieved via get_history."""
    thread_id = "test-thread-2"
    
    # Simulate first request: user + assistant
    add_turn(thread_id, Turn(role="user", content="Who is Donald Trump?"))
    add_turn(thread_id, Turn(role="assistant", content="Trump is the 45th president of the United States."))
    
    # Simulate new request: we "forget everything" except global THREADS
    # Now simply call get_history as context builder would
    history = get_history(thread_id, max_turns=12)
    
    assert len(history) == 2, "Should retrieve 2 turns from history"
    assert history[0].role == "user", "First turn should be user"
    assert "Donald Trump" in history[0].content, "First turn should contain 'Donald Trump'"
    assert history[1].role == "assistant", "Second turn should be assistant"
    assert "Trump" in history[1].content, "Second turn should contain 'Trump'"


def test_get_history_returns_empty_for_unknown_thread():
    """Verify that get_history returns empty list for non-existent threads."""
    history = get_history("non-existent-thread", max_turns=12)
    assert history == [], "get_history should return empty list for unknown thread"


def test_get_history_respects_max_turns():
    """Verify that get_history respects max_turns parameter and returns sliding window."""
    thread_id = "test-thread-3"
    
    # Add 10 turns
    for i in range(10):
        add_turn(thread_id, Turn(role="user", content=f"msg-{i}"))
    
    # Request only last 3
    history = get_history(thread_id, max_turns=3)
    
    # Only last 3 messages should be returned
    assert len(history) == 3, "Should return exactly 3 turns when max_turns=3"
    assert history[0].content == "msg-7", "First returned turn should be msg-7"
    assert history[1].content == "msg-8", "Second returned turn should be msg-8"
    assert history[2].content == "msg-9", "Third returned turn should be msg-9"


def test_get_thread_returns_none_for_unknown_thread():
    """Verify that get_thread (read-only) returns None for non-existent threads."""
    thread = get_thread("non-existent-thread-2")
    assert thread is None, "get_thread should return None for unknown thread, not create one"


def test_get_thread_does_not_create_thread():
    """Verify that get_thread (read-only) never creates a thread."""
    thread_id = "test-thread-4"
    
    # Call get_thread on non-existent thread
    thread1 = get_thread(thread_id)
    assert thread1 is None, "get_thread should return None, not create thread"
    
    # Verify thread was NOT created
    assert thread_id not in THREADS, "get_thread should not create thread in THREADS"
    
    # Now create it via get_or_create_thread
    thread2 = get_or_create_thread(thread_id)
    assert thread2 is not None, "get_or_create_thread should create thread"
    assert thread_id in THREADS, "get_or_create_thread should add thread to THREADS"
    
    # Now get_thread should find it
    thread3 = get_thread(thread_id)
    assert thread3 is not None, "get_thread should find existing thread"
    assert thread3 is thread2, "get_thread should return same object as get_or_create_thread"


def test_thread_persistence_across_multiple_requests():
    """Simulate multiple requests to same thread - turns should accumulate."""
    thread_id = "test-thread-5"
    
    # Request 1: user + assistant
    add_turn(thread_id, Turn(role="user", content="Question 1"))
    add_turn(thread_id, Turn(role="assistant", content="Answer 1"))
    
    # Verify we have 2 turns
    history1 = get_history(thread_id, max_turns=12)
    assert len(history1) == 2
    
    # Request 2: another user + assistant
    add_turn(thread_id, Turn(role="user", content="Question 2"))
    add_turn(thread_id, Turn(role="assistant", content="Answer 2"))
    
    # Verify we now have 4 turns
    history2 = get_history(thread_id, max_turns=12)
    assert len(history2) == 4, "Should have 4 turns after second request"
    assert history2[0].content == "Question 1", "First turn should be preserved"
    assert history2[1].content == "Answer 1", "Second turn should be preserved"
    assert history2[2].content == "Question 2", "Third turn should be new"
    assert history2[3].content == "Answer 2", "Fourth turn should be new"

