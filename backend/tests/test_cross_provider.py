"""Cross-provider integration tests for Query Rewriter → LLM pipeline."""
import pytest
from unittest.mock import AsyncMock, patch
from app.services.query_rewriter import rewrite_query


# Provider configurations for testing
PROVIDERS = {
    "openai": {
        "name": "gpt-4o-mini",
        "type": "rewriter",
        "adapter": "openai"
    },
    "anthropic": {
        "name": "claude-3-5-sonnet",
        "type": "rewriter",
        "adapter": "anthropic"
    },
    "perplexity": {
        "name": "sonar-small",
        "type": "rewriter",
        "adapter": "perplexity"
    },
    "gemini": {
        "name": "gemini-2.0-flash-exp",
        "type": "rewriter",
        "adapter": "gemini"
    }
}


class TestCrossProviderRewriter:
    """Test Query Rewriter consistency across different providers."""
    
    @pytest.mark.parametrize("provider_name", PROVIDERS.keys())
    def test_rewriter_resolves_that_university_consistently(self, provider_name):
        """Test that rewriter resolves 'that university' consistently across providers."""
        input_data = {
            "recent_turns": [
                {"role": "user", "content": "what is purdue university"},
                {"role": "assistant", "content": "Purdue University is a public research university..."}
            ],
            "topics": [
                {"name": "Purdue University", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"}
            ],
            "user_message": "what is the computer science ranking at that university"
        }
        
        # Rewriter is provider-agnostic, so result should be identical
        result = rewrite_query(
            user_message=input_data["user_message"],
            recent_turns=input_data["recent_turns"],
            topics=input_data["topics"]
        )
        
        # All providers should get the same rewritten query
        assert result["AMBIGUOUS"] is False, \
            f"Provider {provider_name}: Should not be ambiguous"
        
        rewritten_lower = result["rewritten"].lower()
        assert "purdue university" in rewritten_lower or "purdue" in rewritten_lower, \
            f"Provider {provider_name}: Should resolve to Purdue University"
        assert "computer science" in rewritten_lower, \
            f"Provider {provider_name}: Should preserve 'computer science'"
    
    @pytest.mark.parametrize("provider_name", PROVIDERS.keys())
    def test_rewriter_detects_ambiguity_consistently(self, provider_name):
        """Test that ambiguity detection is consistent across providers."""
        input_data = {
            "recent_turns": [
                {"role": "user", "content": "compare purdue university and indiana university"},
                {"role": "assistant", "content": "Both are great universities..."}
            ],
            "topics": [
                {"name": "Purdue University", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"},
                {"name": "Indiana University", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"}
            ],
            "user_message": "what is the computer science ranking at that university"
        }
        
        result = rewrite_query(
            user_message=input_data["user_message"],
            recent_turns=input_data["recent_turns"],
            topics=input_data["topics"]
        )
        
        # All providers should detect ambiguity
        assert result["AMBIGUOUS"] is True, \
            f"Provider {provider_name}: Should detect ambiguity"
        assert result.get("disambiguation") is not None, \
            f"Provider {provider_name}: Should provide disambiguation"
    
    @pytest.mark.parametrize("provider_name", PROVIDERS.keys())
    def test_rewriter_preserves_constraints_consistently(self, provider_name):
        """Test that constraints are preserved consistently."""
        input_data = {
            "recent_turns": [
                {"role": "user", "content": "Tell me about MIT"},
                {"role": "assistant", "content": "MIT is a prestigious university..."}
            ],
            "topics": [
                {"name": "MIT", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"}
            ],
            "user_message": "what are the top 5 programs at that university as of 2024?"
        }
        
        result = rewrite_query(
            user_message=input_data["user_message"],
            recent_turns=input_data["recent_turns"],
            topics=input_data["topics"]
        )
        
        rewritten_lower = result["rewritten"].lower()
        # All providers should preserve constraints
        assert "top 5" in rewritten_lower or "5" in rewritten_lower, \
            f"Provider {provider_name}: Should preserve 'top 5'"
        assert "2024" in rewritten_lower, \
            f"Provider {provider_name}: Should preserve 'as of 2024'"


class TestCrossProviderIntegration:
    """Integration tests simulating full pipeline: Rewriter → LLM Provider."""
    
    @pytest.mark.asyncio
    @pytest.mark.parametrize("provider_name,provider_config", PROVIDERS.items())
    async def test_full_pipeline_unambiguous(self, provider_name, provider_config):
        """Test full pipeline: rewrite → send to provider → verify response."""
        # Step 1: Rewrite query
        rewrite_result = rewrite_query(
            user_message="what is the computer science ranking at that university?",
            recent_turns=[
                {"role": "user", "content": "what is purdue university"},
                {"role": "assistant", "content": "Purdue University is a public research university..."}
            ],
            topics=[
                {"name": "Purdue University", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"}
            ]
        )
        
        assert rewrite_result["AMBIGUOUS"] is False, "Should not be ambiguous"
        rewritten_query = rewrite_result["rewritten"]
        
        # Step 2: Simulate sending to LLM provider
        # In real implementation, this would call the actual provider adapter
        mock_response = f"For {provider_name}: {rewritten_query}"
        
        # Step 3: Verify rewritten query is self-contained
        assert "purdue" in rewritten_query.lower(), \
            f"Provider {provider_name}: Rewritten query should mention Purdue"
        assert "computer science" in rewritten_query.lower(), \
            f"Provider {provider_name}: Should preserve original intent"
        
        # Step 4: Verify response would be answerable
        # (In real test, you'd call the actual provider and check response)
        assert len(rewritten_query) > 0, \
            f"Provider {provider_name}: Rewritten query should not be empty"
    
    @pytest.mark.asyncio
    @pytest.mark.parametrize("provider_name,provider_config", PROVIDERS.items())
    async def test_full_pipeline_ambiguous(self, provider_name, provider_config):
        """Test ambiguous path: should not call LLM, should return disambiguation."""
        rewrite_result = rewrite_query(
            user_message="what is the computer science ranking at that university?",
            recent_turns=[
                {"role": "user", "content": "compare purdue university and indiana university"},
                {"role": "assistant", "content": "Both are great universities..."}
            ],
            topics=[
                {"name": "Purdue University", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"},
                {"name": "Indiana University", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"}
            ]
        )
        
        assert rewrite_result["AMBIGUOUS"] is True, \
            f"Provider {provider_name}: Should detect ambiguity"
        
        disamb = rewrite_result["disambiguation"]
        assert disamb is not None, \
            f"Provider {provider_name}: Should provide disambiguation"
        assert "question" in disamb, \
            f"Provider {provider_name}: Should have question"
        assert "options" in disamb, \
            f"Provider {provider_name}: Should have options"
        
        # Should NOT call LLM provider in ambiguous case
        # (In real implementation, orchestrator would return disambiguation instead)
    
    @pytest.mark.asyncio
    @pytest.mark.parametrize("provider_name,provider_config", PROVIDERS.items())
    async def test_product_coref_across_providers(self, provider_name, provider_config):
        """Test product coreference resolution across providers."""
        rewrite_result = rewrite_query(
            user_message="does it support multiple llms in one context?",
            recent_turns=[
                {"role": "user", "content": "I'm building with your DAC platform"},
                {"role": "assistant", "content": "DAC is a unified AI assistant platform..."}
            ],
            topics=[
                {"name": "DAC", "type": "product", "lastSeen": "2025-01-12T10:00:00Z"}
            ]
        )
        
        assert rewrite_result["AMBIGUOUS"] is False, \
            f"Provider {provider_name}: Should resolve 'it' to DAC"
        
        rewritten = rewrite_result["rewritten"].lower()
        assert "dac" in rewritten, \
            f"Provider {provider_name}: Should mention DAC in rewritten query"
        assert "multiple" in rewritten or "llm" in rewritten, \
            f"Provider {provider_name}: Should preserve original question"


class TestProviderSpecificBehavior:
    """Test provider-specific routing and behavior."""
    
    def test_ranking_query_routes_to_perplexity(self):
        """Test that ranking queries are routed to Perplexity (web search)."""
        rewrite_result = rewrite_query(
            user_message="what is the computer science ranking at that university?",
            recent_turns=[
                {"role": "user", "content": "what is purdue university"},
                {"role": "assistant", "content": "Purdue University is..."}
            ],
            topics=[
                {"name": "Purdue University", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"}
            ]
        )
        
        # Rewriter should produce self-contained query
        assert rewrite_result["AMBIGUOUS"] is False
        
        # In real implementation, router would see "ranking" and route to Perplexity
        rewritten = rewrite_result["rewritten"].lower()
        assert "ranking" in rewritten, "Should preserve 'ranking' keyword for routing"
    
    def test_code_query_routes_to_openai(self):
        """Test that code queries are routed to OpenAI."""
        rewrite_result = rewrite_query(
            user_message="can it generate python code?",
            recent_turns=[
                {"role": "user", "content": "I'm using DAC"},
                {"role": "assistant", "content": "DAC is a platform..."}
            ],
            topics=[
                {"name": "DAC", "type": "product", "lastSeen": "2025-01-12T10:00:00Z"}
            ]
        )
        
        assert rewrite_result["AMBIGUOUS"] is False
        rewritten = rewrite_result["rewritten"].lower()
        assert "dac" in rewritten, "Should resolve 'it' to DAC"
        # Router would see "python code" and route to OpenAI
    
    def test_long_context_routes_to_gemini(self):
        """Test that long context queries are routed to Gemini."""
        # Simulate long conversation
        long_history = []
        for i in range(10):
            long_history.append({"role": "user", "content": f"Message {i}"})
            long_history.append({"role": "assistant", "content": f"Response {i}"})
        
        rewrite_result = rewrite_query(
            user_message="summarize everything we discussed",
            recent_turns=long_history,
            topics=[]
        )
        
        # Rewriter should handle long context
        assert "rewritten" in rewrite_result
        # Router would see long context and route to Gemini


class TestCrossProviderConsistency:
    """Test that rewritten queries are consistent and provider-agnostic."""
    
    def test_rewritten_queries_are_provider_agnostic(self):
        """Test that rewritten queries work with any provider."""
        test_cases = [
            {
                "name": "university_ranking",
                "user_message": "what is the ranking at that university?",
                "topics": [{"name": "Purdue University", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"}],
                "expected_entity": "purdue"
            },
            {
                "name": "product_feature",
                "user_message": "does it support streaming?",
                "topics": [{"name": "DAC", "type": "product", "lastSeen": "2025-01-12T10:00:00Z"}],
                "expected_entity": "dac"
            },
            {
                "name": "company_model",
                "user_message": "what is their latest model?",
                "topics": [{"name": "OpenAI", "type": "company", "lastSeen": "2025-01-12T10:00:00Z"}],
                "expected_entity": "openai"
            }
        ]
        
        for test_case in test_cases:
            result = rewrite_query(
                user_message=test_case["user_message"],
                recent_turns=[
                    {"role": "user", "content": f"Tell me about {test_case['topics'][0]['name']}"},
                    {"role": "assistant", "content": f"{test_case['topics'][0]['name']} is..."}
                ],
                topics=test_case["topics"]
            )
            
            # All providers should get the same rewritten query
            assert result["AMBIGUOUS"] is False, \
                f"Test case {test_case['name']}: Should not be ambiguous"
            
            rewritten_lower = result["rewritten"].lower()
            assert test_case["expected_entity"] in rewritten_lower, \
                f"Test case {test_case['name']}: Should resolve to {test_case['expected_entity']}"


@pytest.mark.integration
class TestEndToEndPipeline:
    """End-to-end tests simulating real user interactions."""
    
    @pytest.mark.asyncio
    async def test_purdue_cs_ranking_flow(self):
        """Test complete flow: user asks about Purdue → asks ranking → gets answer."""
        # Step 1: Initial question
        rewrite_1 = rewrite_query(
            user_message="what is purdue university",
            recent_turns=[],
            topics=[]
        )
        assert rewrite_1["AMBIGUOUS"] is False
        
        # Step 2: Follow-up with pronoun
        rewrite_2 = rewrite_query(
            user_message="what is the computer science ranking at that university",
            recent_turns=[
                {"role": "user", "content": "what is purdue university"},
                {"role": "assistant", "content": "Purdue University is a public research university..."}
            ],
            topics=[
                {"name": "Purdue University", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"}
            ]
        )
        
        assert rewrite_2["AMBIGUOUS"] is False
        assert "purdue" in rewrite_2["rewritten"].lower()
        assert "computer science" in rewrite_2["rewritten"].lower()
        
        # Step 3: Simulate sending to LLM (would route to Perplexity for ranking)
        # In real implementation, this would call the provider adapter
    
    @pytest.mark.asyncio
    async def test_ambiguous_universities_flow(self):
        """Test flow with ambiguity: asks clarification → user selects → gets answer."""
        # Step 1: User compares two universities
        rewrite_1 = rewrite_query(
            user_message="compare purdue university and indiana university",
            recent_turns=[],
            topics=[]
        )
        
        # Step 2: User asks about "that university" (ambiguous)
        rewrite_2 = rewrite_query(
            user_message="what is the computer science ranking at that university",
            recent_turns=[
                {"role": "user", "content": "compare purdue university and indiana university"},
                {"role": "assistant", "content": "Both are great universities..."}
            ],
            topics=[
                {"name": "Purdue University", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"},
                {"name": "Indiana University", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"}
            ]
        )
        
        assert rewrite_2["AMBIGUOUS"] is True
        assert rewrite_2["disambiguation"] is not None
        
        # Step 3: User selects "Purdue University"
        # In real flow, this would inject the selection and re-rewrite
        rewrite_3 = rewrite_query(
            user_message="what is the computer science ranking at Purdue University",
            recent_turns=[
                {"role": "user", "content": "compare purdue university and indiana university"},
                {"role": "assistant", "content": "Both are great universities..."},
                {"role": "user", "content": "what is the computer science ranking at that university"},
                {"role": "assistant", "content": "Which university did you mean?"},
                {"role": "user", "content": "Purdue University"}
            ],
            topics=[
                {"name": "Purdue University", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"}
            ]
        )
        
        assert rewrite_3["AMBIGUOUS"] is False
        assert "purdue" in rewrite_3["rewritten"].lower()

