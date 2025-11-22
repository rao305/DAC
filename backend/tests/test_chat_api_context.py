"""
End-to-end API test for conversation context preservation.

This test hits the actual chat endpoint and verifies that the model
receives and uses previous conversation context correctly.

Tests the "Trump / his children" scenario at the API level.
"""
import pytest
import json
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient

from main import app
from app.services.threads_store import THREADS, Turn, add_turn
from app.services.provider_dispatch import call_provider_adapter_streaming


@pytest.fixture(autouse=True)
def clear_thread_store():
    """Clear the THREADS dict before and after each test."""
    THREADS.clear()
    yield
    THREADS.clear()


@pytest.fixture
def mock_provider_streaming():
    """
    Mock the provider streaming function to return controlled responses.
    
    This allows us to test the API flow without hitting real LLM providers.
    """
    async def fake_streaming(provider, model, messages, api_key):
        """Fake streaming response based on the messages content."""
        # Extract the last user message to determine response
        # Also check all messages to see if we have previous context about Trump
        last_user_msg = None
        all_content = " ".join([m.get("content", "") for m in messages]).lower()
        
        for msg in reversed(messages):
            if msg.get("role") == "user":
                last_user_msg = msg.get("content", "").lower()
                break
        
        # Determine response based on content
        # Check if this is about Trump (original or rewritten query)
        is_trump_question = (
            "donald trump" in all_content or 
            "trump" in all_content or
            "who is donald trump" in last_user_msg or
            "who is the former president" in last_user_msg
        )
        
        is_children_question = (
            "who are his children" in last_user_msg or 
            "who are the children" in last_user_msg or
            "who are donald trump's children" in last_user_msg
        )
        
        if is_children_question and is_trump_question:
            # Second question: should mention Trump's children
            response_text = "Donald Trump has five children: Donald Trump Jr., Ivanka Trump, Eric Trump, Tiffany Trump, and Barron Trump."
        elif is_trump_question:
            # First question: answer about Trump
            response_text = "Donald Trump is the 45th president of the United States. He served from 2017 to 2021."
        else:
            response_text = "I'm not sure how to answer that question."
        
        # Simulate streaming by yielding chunks
        words = response_text.split()
        for i, word in enumerate(words):
            chunk = {
                "type": "delta",
                "delta": word + (" " if i < len(words) - 1 else ""),
            }
            yield chunk
        
        # Yield final metadata
        yield {
            "type": "meta",
            "usage": {
                "prompt_tokens": 100,
                "completion_tokens": len(words),
                "total_tokens": 100 + len(words),
            }
        }
        yield {"type": "done"}
    
    return fake_streaming


@pytest.mark.asyncio
async def test_trump_children_flow_uses_context(mock_provider_streaming):
    """
    Full API-level test:
    
    1) Call streaming endpoint with "Who is Donald Trump?"
    2) Simulate assistant answer
    3) Call streaming endpoint again with "who are his children"
    4) Assert the second response mentions Trump's children and not some random John.
    """
    # Mock the provider streaming function
    # Patch at the import location in threads.py
    with patch('app.services.provider_dispatch.call_provider_adapter_streaming', mock_provider_streaming):
        # Also need to mock API key retrieval and other dependencies
        with patch('app.api.threads.get_api_key_for_org', new_callable=AsyncMock) as mock_api_key:
            mock_api_key.return_value = "fake-api-key"
            
            with patch('app.api.threads.set_rls_context', new_callable=AsyncMock):
                with patch('app.api.threads._get_thread', new_callable=AsyncMock) as mock_get_thread:
                    # Mock thread object
                    from app.models.thread import Thread
                    from datetime import datetime
                    mock_thread = Thread(
                        id="test-thread-123",
                        org_id="org_demo",
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    mock_get_thread.return_value = mock_thread
                    
                    with patch('app.api.threads._get_org', new_callable=AsyncMock) as mock_get_org:
                        # Mock org object
                        from app.models.org import Org
                        mock_org = Org(
                            id="org_demo",
                            requests_per_day=1000,
                            tokens_per_day=1000000,
                            created_at=datetime.now()
                        )
                        mock_get_org.return_value = mock_org
                        
                        # Mock intelligent router
                        with patch('app.api.threads.intelligent_router') as mock_router:
                            from app.models.provider_key import ProviderType
                            mock_router.route = AsyncMock(return_value=type('obj', (object,), {
                                'provider': ProviderType.PERPLEXITY,
                                'model': 'sonar-pro',
                                'reason': 'Factual question'
                            })())
                            
                            async with AsyncClient(app=app, base_url="http://test", timeout=30.0) as client:
                                # Headers needed for the endpoint
                                headers = {
                                    "X-Org-Id": "org_demo",
                                    "Content-Type": "application/json",
                                }
                                
                                thread_id = "test-thread-123"
                                
                                # --- Step 1: First message ---
                                resp1 = await client.post(
                                    f"/api/threads/{thread_id}/messages/stream",
                                    json={
                                        "content": "Who is Donald Trump?",
                                        "role": "user",
                                    },
                                    headers=headers,
                                )
                                
                                assert resp1.status_code == 200, f"First request failed: {resp1.status_code} {resp1.text[:500]}"
                                assert "text/event-stream" in resp1.headers.get("content-type", ""), \
                                    f"Expected SSE content type, got: {resp1.headers.get('content-type')}"
                                
                                # Parse SSE stream
                                content1 = ""
                                async for line in resp1.aiter_lines():
                                    if line.startswith("data: "):
                                        data_str = line[6:]  # Remove "data: " prefix
                                        try:
                                            data = json.loads(data_str)
                                            if data.get("type") == "delta" and "delta" in data:
                                                content1 += data["delta"]
                                        except json.JSONDecodeError:
                                            pass
                                    elif line.strip() == "":
                                        continue
                                
                                # Verify first response mentions Trump
                                assert "donald trump" in content1.lower() or "trump" in content1.lower(), \
                                    f"First response should mention Trump, got: {content1[:200]}"
                                
                                # Verify thread store has the first turn
                                assert thread_id in THREADS, "Thread should exist in store after first message"
                                assert len(THREADS[thread_id].turns) >= 1, "Thread should have at least 1 turn"
                                
                                # --- Step 2: Second message (same thread) ---
                                resp2 = await client.post(
                                    f"/api/threads/{thread_id}/messages/stream",
                                    json={
                                        "content": "who are his children",
                                        "role": "user",
                                    },
                                    headers=headers,
                                )
                                
                                assert resp2.status_code == 200, f"Second request failed: {resp2.status_code} {resp2.text[:500]}"
                                
                                # Parse SSE stream
                                content2 = ""
                                async for line in resp2.aiter_lines():
                                    if line.startswith("data: "):
                                        data_str = line[6:]
                                        try:
                                            data = json.loads(data_str)
                                            if data.get("type") == "delta" and "delta" in data:
                                                content2 += data["delta"]
                                        except json.JSONDecodeError:
                                            pass
                                    elif line.startswith("event: done"):
                                        break
                                    elif line.strip() == "":
                                        continue
                                
                                # The key regression checks:
                                content2_lower = content2.lower()
                                
                                # Should mention Trump (not John Doe/Smith)
                                assert "donald" in content2_lower or "trump" in content2_lower, \
                                    f"Second response should mention Trump, got: {content2[:200]}"
                                
                                # Should NOT mention John Doe or John Smith
                                assert "john doe" not in content2_lower, \
                                    f"Second response should NOT mention John Doe, got: {content2[:200]}"
                                assert "john smith" not in content2_lower, \
                                    f"Second response should NOT mention John Smith, got: {content2[:200]}"
                                
                                # Should mention children (ideally Trump's children)
                                assert "children" in content2_lower or "child" in content2_lower, \
                                    f"Second response should mention children, got: {content2[:200]}"
                                
                                # Verify thread store has both turns
                                assert len(THREADS[thread_id].turns) >= 3, \
                                    f"Thread should have at least 3 turns (2 user + 1 assistant), got {len(THREADS[thread_id].turns)}"


@pytest.mark.asyncio
async def test_api_context_builder_sees_previous_turns(mock_provider_streaming):
    """
    Test that the context builder is actually called with previous turns.
    
    This test verifies that when we make a second request, the context builder
    receives the previous conversation history.
    """
    # Pre-populate thread store with first Q&A
    thread_id = "test-thread-context"
    add_turn(thread_id, Turn(role="user", content="Who is Donald Trump?"))
    add_turn(thread_id, Turn(role="assistant", content="Donald Trump is the 45th president."))
    
    # Verify it's in the store
    assert len(THREADS[thread_id].turns) == 2
    
    # Mock provider streaming
    with patch('app.services.provider_dispatch.call_provider_adapter_streaming', mock_provider_streaming):
        with patch('app.api.threads.get_api_key_for_org', new_callable=AsyncMock) as mock_api_key:
            mock_api_key.return_value = "fake-api-key"
            
            with patch('app.api.threads.set_rls_context', new_callable=AsyncMock):
                with patch('app.api.threads._get_thread', new_callable=AsyncMock) as mock_get_thread:
                    from app.models.thread import Thread
                    from datetime import datetime
                    mock_thread = Thread(
                        id=thread_id,
                        org_id="org_demo",
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    mock_get_thread.return_value = mock_thread
                    
                    with patch('app.api.threads._get_org', new_callable=AsyncMock) as mock_get_org:
                        from app.models.org import Org
                        mock_org = Org(
                            id="org_demo",
                            requests_per_day=1000,
                            tokens_per_day=1000000,
                            created_at=datetime.now()
                        )
                        mock_get_org.return_value = mock_org
                        
                        # Mock intelligent router
                        with patch('app.api.threads.intelligent_router') as mock_router:
                            from app.models.provider_key import ProviderType
                            mock_router.route = AsyncMock(return_value=type('obj', (object,), {
                                'provider': ProviderType.PERPLEXITY,
                                'model': 'sonar-pro',
                                'reason': 'Factual question'
                            })())
                        
                        # Capture what messages are sent to the provider
                        captured_messages = []
                        
                        async def capture_streaming(provider, model, messages, api_key):
                            """Capture messages and then stream response."""
                            captured_messages.append(messages)
                            async for chunk in mock_provider_streaming(provider, model, messages, api_key):
                                yield chunk
                        
                        with patch('app.services.provider_dispatch.call_provider_adapter_streaming', capture_streaming):
                            async with AsyncClient(app=app, base_url="http://test") as client:
                                headers = {
                                    "X-Org-Id": "org_demo",
                                    "Content-Type": "application/json",
                                }
                                
                                # Make second request
                                resp = await client.post(
                                    f"/api/threads/{thread_id}/messages/stream",
                                    json={
                                        "content": "who are his children",
                                        "role": "user",
                                    },
                                    headers=headers,
                                )
                                
                                assert resp.status_code == 200
                                
                                # Verify messages were captured
                                assert len(captured_messages) > 0, "Provider should have been called"
                                
                                # Get the messages sent to provider
                                provider_messages = captured_messages[0]
                                
                                # Extract conversation messages (non-system)
                                convo_msgs = [m for m in provider_messages if m.get("role") in ("user", "assistant")]
                                contents = [m.get("content", "") for m in convo_msgs]
                                
                                # Verify previous turns are included
                                assert any("Who is Donald Trump" in c for c in contents), \
                                    f"Previous user question should be in context. Contents: {contents}"
                                assert any("Donald Trump is the 45th president" in c for c in contents), \
                                    f"Previous assistant answer should be in context. Contents: {contents}"
                                # The query rewriter may rewrite "who are his children" to "Who are Donald Trump's children?"
                                # So check for either the original or rewritten version
                                assert any("who are his children" in c.lower() or "who are the children of donald trump" in c.lower() or "who are donald trump's children" in c.lower() for c in contents), \
                                    f"Current user question should be in context (original or rewritten). Contents: {contents}"

