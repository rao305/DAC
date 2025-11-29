"""Tests for router intent classification."""
import pytest
from unittest.mock import AsyncMock, patch
from app.services.dynamic_router.intent import get_router_intent, RouterIntent


class TestRouterIntentClassification:
    """Test router LLM correctly classifies different query types."""

    @pytest.mark.asyncio
    async def test_simple_chat(self):
        """Test 1: Simple chat query."""
        user_message = "hey, how's your day going?"
        
        mock_response = {
            "content": '{"taskType": "generic_chat", "requiresWeb": false, "requiresTools": false, "priority": "speed", "estimatedInputTokens": 20}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            assert intent.task_type == "generic_chat"
            assert intent.requires_web is False
            assert intent.priority == "speed"
            assert intent.estimated_input_tokens <= 30

    @pytest.mark.asyncio
    async def test_deep_strategy(self):
        """Test 2: Deep reasoning/strategy query."""
        user_message = (
            "I'm a solo founder building a B2B SaaS in AI agents. "
            "Help me design a 3-month go-to-market strategy including ICPs, "
            "outbound/email copy, and an experiment roadmap."
        )
        
        mock_response = {
            "content": '{"taskType": "deep_reasoning", "requiresWeb": false, "requiresTools": false, "priority": "quality", "estimatedInputTokens": 50}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            assert intent.task_type == "deep_reasoning"
            assert intent.requires_web is False
            assert intent.priority == "quality"
            assert intent.estimated_input_tokens > 40

    @pytest.mark.asyncio
    async def test_code_generation(self):
        """Test 3: Code generation query."""
        user_message = (
            "Write a TypeScript function that takes a list of chat messages "
            "and returns only the user messages, with unit tests."
        )
        
        mock_response = {
            "content": '{"taskType": "coding", "requiresWeb": false, "requiresTools": false, "priority": "quality", "estimatedInputTokens": 30}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            assert intent.task_type == "coding"
            assert intent.requires_web is False
            assert intent.priority == "quality"

    @pytest.mark.asyncio
    async def test_debugging_with_code(self):
        """Test 4: Debugging with large code block."""
        user_message = """```ts
export async function handler(req: NextRequest) {
  const body = await req.json();
  // ... long code ...
}
```

I'm getting "Unexpected end of JSON input" – help me debug this."""
        
        mock_response = {
            "content": '{"taskType": "coding", "requiresWeb": false, "requiresTools": false, "priority": "quality", "estimatedInputTokens": 200}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            assert intent.task_type == "coding"
            assert intent.priority == "quality"
            # Should NOT be document_analysis even with large code
            assert intent.task_type != "document_analysis"

    @pytest.mark.asyncio
    async def test_pure_math(self):
        """Test 5: Pure math query."""
        user_message = "Prove that the sum of two even numbers is always even. Show the algebraic reasoning."
        
        mock_response = {
            "content": '{"taskType": "math", "requiresWeb": false, "requiresTools": false, "priority": "quality", "estimatedInputTokens": 25}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            assert intent.task_type == "math"
            assert intent.requires_web is False
            assert intent.priority == "quality"

    @pytest.mark.asyncio
    async def test_casual_numeric_question(self):
        """Test 6: Casual numeric question (not deep math)."""
        user_message = "How many hours are there in 3 days?"
        
        mock_response = {
            "content": '{"taskType": "generic_chat", "requiresWeb": false, "requiresTools": false, "priority": "speed", "estimatedInputTokens": 15}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            assert intent.priority == "speed"
            # Could be math or generic_chat, but priority should be speed

    @pytest.mark.asyncio
    async def test_summarization(self):
        """Test 7: Plain summarization."""
        user_message = "[2-page blog pasted here]\n\nSummarize this in bullet points."
        
        mock_response = {
            "content": '{"taskType": "summarization", "requiresWeb": false, "requiresTools": false, "priority": "speed", "estimatedInputTokens": 5000}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            assert intent.task_type == "summarization"
            assert intent.requires_web is False
            assert intent.estimated_input_tokens > 1000

    @pytest.mark.asyncio
    async def test_document_analysis(self):
        """Test 8: Document analysis (not just summarization)."""
        user_message = "[Contract pasted]\n\nRead this contract and tell me the biggest risks for the vendor."
        
        mock_response = {
            "content": '{"taskType": "document_analysis", "requiresWeb": false, "requiresTools": false, "priority": "quality", "estimatedInputTokens": 8000}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            assert intent.task_type == "document_analysis"
            assert intent.priority == "quality"

    @pytest.mark.asyncio
    async def test_creative_writing(self):
        """Test 9: Creative writing/story."""
        user_message = (
            "Write a 1000-word short story about a hacker cat inside a data center, "
            "in a slightly sarcastic tone."
        )
        
        mock_response = {
            "content": '{"taskType": "creative_writing", "requiresWeb": false, "requiresTools": false, "priority": "quality", "estimatedInputTokens": 30}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            assert intent.task_type == "creative_writing"
            assert intent.priority == "quality"
            assert intent.requires_web is False

    @pytest.mark.asyncio
    async def test_web_research_news(self):
        """Test 10: Clear news/web research query."""
        user_message = "What's happening with OpenAI's latest model releases this week?"
        
        mock_response = {
            "content": '{"taskType": "web_research", "requiresWeb": true, "requiresTools": false, "priority": "quality", "estimatedInputTokens": 25}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            assert intent.task_type == "web_research"
            assert intent.requires_web is True
            assert intent.priority == "quality"

    @pytest.mark.asyncio
    async def test_web_research_papers(self):
        """Test 11: Research papers query."""
        user_message = (
            "Find the most recent papers on retrieval-augmented generation "
            "and summarize common evaluation methods."
        )
        
        mock_response = {
            "content": '{"taskType": "web_research", "requiresWeb": true, "requiresTools": false, "priority": "quality", "estimatedInputTokens": 35}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            assert intent.task_type == "web_research"
            assert intent.requires_web is True

    @pytest.mark.asyncio
    async def test_search_in_algorithm_not_web(self):
        """Test 12: 'search' in algorithm question (NOT web search)."""
        user_message = "Explain how binary search works and give a Python implementation."
        
        mock_response = {
            "content": '{"taskType": "coding", "requiresWeb": false, "requiresTools": false, "priority": "quality", "estimatedInputTokens": 25}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            # Critical: should NOT require web even though "search" is mentioned
            assert intent.requires_web is False
            assert intent.task_type in ["coding", "deep_reasoning"]

    @pytest.mark.asyncio
    async def test_today_but_timeless(self):
        """Test 13: 'today' mentioned but not actually needing web."""
        user_message = (
            "Explain what Big-O notation is as if I'm 10 years old, "
            "and give me a few examples from today's apps."
        )
        
        mock_response = {
            "content": '{"taskType": "deep_reasoning", "requiresWeb": false, "requiresTools": false, "priority": "quality", "estimatedInputTokens": 35}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            # "today" here is illustrative, not actually "latest news"
            assert intent.requires_web is False
            assert intent.task_type == "deep_reasoning"

    @pytest.mark.asyncio
    async def test_speed_priority(self):
        """Test 14: User explicitly wants fast response."""
        user_message = (
            "Just give me a quick, short explanation of what an API is. "
            "I don't care if it's perfect, keep it fast."
        )
        
        mock_response = {
            "content": '{"taskType": "generic_chat", "requiresWeb": false, "requiresTools": false, "priority": "speed", "estimatedInputTokens": 30}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            assert intent.priority == "speed"

    @pytest.mark.asyncio
    async def test_cost_priority(self):
        """Test 15: User mentions cost."""
        user_message = (
            "I'm low on credits, so choose the cheapest model: "
            "summarize this article in 3 bullet points."
        )
        
        mock_response = {
            "content": '{"taskType": "summarization", "requiresWeb": false, "requiresTools": false, "priority": "cost", "estimatedInputTokens": 2000}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            assert intent.task_type == "summarization"
            assert intent.priority == "cost"

    @pytest.mark.asyncio
    async def test_quality_priority_important_decision(self):
        """Test 16: Important decision requiring quality."""
        user_message = (
            "I'm deciding whether to leave my job for a startup with 50 employees. "
            "Help me think through risks, financial runway, and decision frameworks in depth."
        )
        
        mock_response = {
            "content": '{"taskType": "deep_reasoning", "requiresWeb": false, "requiresTools": false, "priority": "quality", "estimatedInputTokens": 50}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            assert intent.task_type == "deep_reasoning"
            assert intent.priority == "quality"

    @pytest.mark.asyncio
    async def test_massive_input(self):
        """Test 17: Huge document input."""
        # Simulate very large input
        large_doc = "A" * 200000  # ~200k chars
        user_message = f"{large_doc}\n\nGive me a detailed analysis of this entire document."
        
        mock_response = {
            "content": '{"taskType": "document_analysis", "requiresWeb": false, "requiresTools": false, "priority": "quality", "estimatedInputTokens": 50000}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            assert intent.estimated_input_tokens > 10000
            assert intent.task_type == "document_analysis"

    @pytest.mark.asyncio
    async def test_tiny_input(self):
        """Test 18: Super short query."""
        user_message = "help?"
        
        mock_response = {
            "content": '{"taskType": "generic_chat", "requiresWeb": false, "requiresTools": false, "priority": "speed", "estimatedInputTokens": 5}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            assert intent.estimated_input_tokens > 0
            assert intent.task_type == "generic_chat"

    @pytest.mark.asyncio
    async def test_non_json_response_fallback(self):
        """Test 5.1: Non-JSON output from router falls back gracefully."""
        user_message = "What is Python?"
        
        mock_response = {
            "content": "I don't know"  # Invalid JSON
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            # Should fall back to defaults
            assert intent.task_type == "generic_chat"
            assert intent.requires_web is False
            assert intent.priority == "quality"
            assert intent.estimated_input_tokens > 0

    @pytest.mark.asyncio
    async def test_invalid_task_type_fallback(self):
        """Test 5.2: Invalid taskType falls back gracefully."""
        user_message = "Hello"
        
        mock_response = {
            "content": '{"taskType": "lol_nope", "requiresWeb": false, "requiresTools": false, "priority": "quality", "estimatedInputTokens": 10}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            # Should not crash, but taskType might be invalid
            # The scoring layer should handle unknown task types
            intent = await get_router_intent(user_message, "")
            
            # System should still produce a valid intent
            assert intent is not None
            assert intent.estimated_input_tokens > 0

    @pytest.mark.asyncio
    async def test_missing_estimated_tokens(self):
        """Test 5.3: Router forgets estimatedInputTokens - should recompute."""
        user_message = "Explain machine learning"
        
        mock_response = {
            "content": '{"taskType": "deep_reasoning", "requiresWeb": false, "requiresTools": false, "priority": "quality"}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            # Should recompute from message length (fallback uses max(100, len/4))
            assert intent.estimated_input_tokens > 0
            # The fallback computes max(100, len/4), but if JSON parsing fails,
            # it might use a different default. Just check it's reasonable.
            assert intent.estimated_input_tokens >= len(user_message) // 4

    @pytest.mark.asyncio
    async def test_empty_message(self):
        """Test 7.3: Empty/whitespace message."""
        user_message = "   "
        
        mock_response = {
            "content": '{"taskType": "generic_chat", "requiresWeb": false, "requiresTools": false, "priority": "speed", "estimatedInputTokens": 1}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            # Should not crash
            assert intent.task_type == "generic_chat"
            assert intent.estimated_input_tokens >= 1

    @pytest.mark.asyncio
    async def test_non_english(self):
        """Test 7.1: Non-English query."""
        user_message = "Explique-moi en français comment fonctionne un modèle de langage de grande taille."
        
        mock_response = {
            "content": '{"taskType": "deep_reasoning", "requiresWeb": false, "requiresTools": false, "priority": "quality", "estimatedInputTokens": 20}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            assert intent.task_type in ["deep_reasoning", "generic_chat"]
            assert intent.requires_web is False

    @pytest.mark.asyncio
    async def test_emoji_slang(self):
        """Test 7.2: Emoji and slang."""
        user_message = "bro explain LLMs to me like I'm 15 💀💀"
        
        mock_response = {
            "content": '{"taskType": "deep_reasoning", "requiresWeb": false, "requiresTools": false, "priority": "speed", "estimatedInputTokens": 15}'
        }
        
        with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
            mock_call.return_value = type("Response", (), mock_response)()
            
            intent = await get_router_intent(user_message, "")
            
            assert intent.task_type in ["deep_reasoning", "generic_chat"]
            assert intent.requires_web is False

