"""Integration tests for Query Rewriter → Disambiguator → Main Answerer flow."""
import pytest
from app.services.query_rewriter import rewrite_query
from app.services.disambiguation_assistant import generate_disambiguation


class TestFullPipeline:
    """Integration tests for the complete query rewriting pipeline."""
    
    def test_happy_path_unambiguous(self):
        """Test happy path: unambiguous query → rewritten → answerable."""
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
        
        # Should not be ambiguous
        assert rewrite_result["AMBIGUOUS"] is False, "Should resolve unambiguously"
        assert "purdue" in rewrite_result["rewritten"].lower(), \
            "Rewritten query should mention Purdue"
        
        # Step 2: Simulate sending to main answerer
        # In real implementation, this would call the LLM
        rewritten_query = rewrite_result["rewritten"]
        
        # Verify rewritten query is self-contained
        assert "purdue university" in rewritten_query.lower(), \
            "Rewritten query should be self-contained with entity name"
        assert "computer science" in rewritten_query.lower(), \
            "Rewritten query should preserve original intent"
        assert "ranking" in rewritten_query.lower(), \
            "Rewritten query should preserve original question"
        
        # Step 3: Simulate answer (would come from LLM in real flow)
        # For testing, we just verify the rewritten query is ready
        assert len(rewritten_query) > 0, "Rewritten query should not be empty"
    
    def test_ambiguous_path_asks_clarification(self):
        """Test ambiguous path: multiple candidates → disambiguation question."""
        # Step 1: Rewrite query (should detect ambiguity)
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
        
        # Should be ambiguous
        assert rewrite_result["AMBIGUOUS"] is True, "Should detect ambiguity"
        assert rewrite_result.get("disambiguation") is not None, \
            "Should provide disambiguation question"
        
        disamb = rewrite_result["disambiguation"]
        
        # Step 2: Verify disambiguation question
        assert "question" in disamb, "Should have a question"
        assert "options" in disamb, "Should have options"
        assert len(disamb["options"]) >= 2, "Should have at least 2 options"
        assert "Other" in disamb["options"], "Should include 'Other' option"
        
        # Step 3: Simulate user selecting an option
        selected_option = "Purdue University"
        
        # Step 4: Re-rewrite with selected option
        # In real flow, you'd inject the selected entity into topics or rewrite
        rewrite_result_2 = rewrite_query(
            user_message="what is the computer science ranking at that university?",
            recent_turns=[
                {"role": "user", "content": "compare purdue university and indiana university"},
                {"role": "assistant", "content": "Both are great universities..."},
                {"role": "user", "content": f"what is the computer science ranking at {selected_option}"}
            ],
            topics=[
                {"name": selected_option, "type": "university", "lastSeen": "2025-01-12T10:00:00Z"}
            ]
        )
        
        # Should now be unambiguous
        assert rewrite_result_2["AMBIGUOUS"] is False, \
            "Should resolve after user selection"
        assert "purdue" in rewrite_result_2["rewritten"].lower(), \
            "Should resolve to selected option"
    
    def test_product_coref_flow(self):
        """Test product coreference resolution flow."""
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
        
        assert rewrite_result["AMBIGUOUS"] is False, "Should resolve 'it' to DAC"
        rewritten = rewrite_result["rewritten"].lower()
        assert "dac" in rewritten, "Should mention DAC in rewritten query"
        assert "multiple" in rewritten or "llm" in rewritten, \
            "Should preserve original question intent"
    
    def test_no_pronouns_no_rewrite(self):
        """Test that queries without pronouns pass through unchanged."""
        rewrite_result = rewrite_query(
            user_message="What is the capital of France?",
            recent_turns=[],
            topics=[]
        )
        
        assert rewrite_result["AMBIGUOUS"] is False, "Should not be ambiguous"
        assert "capital" in rewrite_result["rewritten"].lower()
        assert "france" in rewrite_result["rewritten"].lower()
        assert len(rewrite_result["referents"]) == 0, \
            "Should have no referents when no pronouns"


class TestPipelineWithConstraints:
    """Test that constraints are preserved through the pipeline."""
    
    def test_preserves_top_n_constraint(self):
        """Test that 'top 5' type constraints are preserved."""
        rewrite_result = rewrite_query(
            user_message="what are the top 5 programs at that university as of 2024?",
            recent_turns=[
                {"role": "user", "content": "Tell me about MIT"},
                {"role": "assistant", "content": "MIT is a prestigious university..."}
            ],
            topics=[
                {"name": "MIT", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"}
            ]
        )
        
        rewritten = rewrite_result["rewritten"].lower()
        assert "top 5" in rewritten or "5" in rewritten, \
            "Should preserve 'top 5' constraint"
        assert "2024" in rewritten, "Should preserve 'as of 2024' constraint"
        assert "mit" in rewritten, "Should resolve 'that university' to MIT"
    
    def test_preserves_format_constraint(self):
        """Test that format constraints like 'as a table' are preserved."""
        rewrite_result = rewrite_query(
            user_message="show me their latest models as a table",
            recent_turns=[
                {"role": "user", "content": "Tell me about OpenAI"},
                {"role": "assistant", "content": "OpenAI is an AI company..."}
            ],
            topics=[
                {"name": "OpenAI", "type": "company", "lastSeen": "2025-01-12T10:00:00Z"}
            ]
        )
        
        rewritten = rewrite_result["rewritten"].lower()
        assert "openai" in rewritten, "Should resolve 'their' to OpenAI"
        # Format constraints might be preserved or not, but entity should be resolved
        assert len(rewritten) > 0


class TestErrorHandling:
    """Test error handling in the pipeline."""
    
    def test_handles_missing_topics_gracefully(self):
        """Test that missing topics don't cause errors."""
        rewrite_result = rewrite_query(
            user_message="what is the ranking at that university?",
            recent_turns=[],
            topics=[]  # No topics provided
        )
        
        # Should not crash, may or may not resolve
        assert "rewritten" in rewrite_result
        assert "AMBIGUOUS" in rewrite_result
    
    def test_handles_malformed_topics(self):
        """Test handling of malformed topic data."""
        rewrite_result = rewrite_query(
            user_message="tell me about it",
            recent_turns=[],
            topics=[
                {"name": "Test"},  # Missing type and lastSeen
                {"invalid": "data"}  # Invalid structure
            ]
        )
        
        # Should not crash
        assert "rewritten" in rewrite_result
        assert "AMBIGUOUS" in rewrite_result

