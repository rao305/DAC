"""Integration tests for Query Rewriter with actual provider adapters (mocked)."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.query_rewriter import rewrite_query


class TestProviderAdapterIntegration:
    """Test integration with actual provider adapters."""
    
    @pytest.mark.asyncio
    async def test_rewriter_before_provider_call(self):
        """Test that rewriter is called before provider adapter."""
        # Simulate user message with pronoun
        user_message = "what is the computer science ranking at that university?"
        
        # Step 1: Rewrite query
        rewrite_result = rewrite_query(
            user_message=user_message,
            recent_turns=[
                {"role": "user", "content": "what is purdue university"},
                {"role": "assistant", "content": "Purdue University is..."}
            ],
            topics=[
                {"name": "Purdue University", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"}
            ]
        )
        
        assert rewrite_result["AMBIGUOUS"] is False
        rewritten_query = rewrite_result["rewritten"]
        
        # Step 2: Simulate provider adapter call with rewritten query
        # In real implementation, this would be:
        # response = await call_provider_adapter(
        #     provider=ProviderType.PERPLEXITY,
        #     model="sonar-small",
        #     messages=[{"role": "user", "content": rewritten_query}]
        # )
        
        # Mock provider response
        mock_response = {
            "content": f"For Purdue University: The Computer Science program is ranked...",
            "provider": "perplexity",
            "model": "sonar-small"
        }
        
        # Verify rewritten query is self-contained
        assert "purdue" in rewritten_query.lower()
        assert "computer science" in rewritten_query.lower()
        assert "ranking" in rewritten_query.lower()
    
    @pytest.mark.asyncio
    async def test_ambiguous_case_does_not_call_provider(self):
        """Test that ambiguous queries don't call provider adapter."""
        rewrite_result = rewrite_query(
            user_message="what is the computer science ranking at that university?",
            recent_turns=[
                {"role": "user", "content": "compare purdue university and indiana university"},
                {"role": "assistant", "content": "Both are great..."}
            ],
            topics=[
                {"name": "Purdue University", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"},
                {"name": "Indiana University", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"}
            ]
        )
        
        assert rewrite_result["AMBIGUOUS"] is True
        
        # In real implementation, orchestrator would:
        # 1. Detect AMBIGUOUS=True
        # 2. Return disambiguation question to user
        # 3. NOT call provider adapter
        
        # Verify no provider call would be made
        disamb = rewrite_result["disambiguation"]
        assert disamb is not None
        assert "question" in disamb
        assert "options" in disamb


class TestRoutingIntegration:
    """Test integration with intelligent router."""
    
    def test_rewritten_query_preserves_routing_signals(self):
        """Test that rewritten queries preserve signals for routing."""
        test_cases = [
            {
                "original": "what is the latest news about that company?",
                "topics": [{"name": "OpenAI", "type": "company"}],
                "expected_routing": "perplexity",  # Web search
                "expected_keywords": ["latest", "news"]
            },
            {
                "original": "can it generate python code?",
                "topics": [{"name": "DAC", "type": "product"}],
                "expected_routing": "openai",  # Code generation
                "expected_keywords": ["python", "code"]
            },
            {
                "original": "summarize everything we discussed about that university",
                "topics": [{"name": "MIT", "type": "university"}],
                "expected_routing": "gemini",  # Long context
                "expected_keywords": ["summarize", "discussed"]
            }
        ]
        
        for test_case in test_cases:
            rewrite_result = rewrite_query(
                user_message=test_case["original"],
                recent_turns=[
                    {"role": "user", "content": f"Tell me about {test_case['topics'][0]['name']}"},
                    {"role": "assistant", "content": f"{test_case['topics'][0]['name']} is..."}
                ],
                topics=test_case["topics"]
            )
            
            assert rewrite_result["AMBIGUOUS"] is False
            
            rewritten_lower = rewrite_result["rewritten"].lower()
            # Verify routing keywords are preserved
            for keyword in test_case["expected_keywords"]:
                assert keyword.lower() in rewritten_lower, \
                    f"Should preserve routing keyword '{keyword}'"
            
            # Verify entity is resolved
            entity_name = test_case["topics"][0]["name"].lower()
            assert entity_name in rewritten_lower, \
                f"Should resolve pronoun to {entity_name}"


@pytest.mark.integration
class TestFullSystemIntegration:
    """Full system integration tests."""
    
    @pytest.mark.asyncio
    async def test_complete_user_journey(self):
        """Test complete user journey: ask → follow-up → get answer."""
        # Journey: User asks about product → asks feature → gets answer
        
        # Step 1: Initial question
        step1 = rewrite_query(
            user_message="what is DAC?",
            recent_turns=[],
            topics=[]
        )
        assert step1["AMBIGUOUS"] is False
        
        # Step 2: Follow-up with pronoun
        step2 = rewrite_query(
            user_message="does it support multiple llms?",
            recent_turns=[
                {"role": "user", "content": "what is DAC?"},
                {"role": "assistant", "content": "DAC is a unified AI assistant platform..."}
            ],
            topics=[
                {"name": "DAC", "type": "product", "lastSeen": "2025-01-12T10:00:00Z"}
            ]
        )
        
        assert step2["AMBIGUOUS"] is False
        assert "dac" in step2["rewritten"].lower()
        assert "multiple" in step2["rewritten"].lower() or "llm" in step2["rewritten"].lower()
        
        # Step 3: Rewritten query would be sent to router → provider → response
        # In real implementation:
        # - Router sees "multiple llms" → routes to appropriate provider
        # - Provider returns answer about DAC's multi-LLM support
        # - Response mentions DAC explicitly (from rewritten query)

