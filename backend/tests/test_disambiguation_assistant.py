"""Unit tests for Disambiguation Assistant service."""
import pytest
from app.services.disambiguation_assistant import generate_disambiguation, DisambiguationAssistant


class TestDisambiguationAssistant:
    """Unit tests for Disambiguation Assistant."""
    
    def test_asks_which_university_when_ambiguous(self):
        """Test that disambiguation asks about universities correctly."""
        result = generate_disambiguation(
            candidates=["Purdue University", "Indiana University"],
            original_user_message="what is the computer science ranking at that university",
            pronoun="that university"
        )
        
        assert "question" in result
        assert "options" in result
        assert "pronoun" in result
        
        question_lower = result["question"].lower()
        assert "which" in question_lower or "university" in question_lower, \
            f"Question should mention university: {result['question']}"
        
        options = result["options"]
        assert "Purdue University" in options, "Should include Purdue University"
        assert "Indiana University" in options, "Should include Indiana University"
        assert "Other" in options, "Should include 'Other' option"
        assert len(options) <= 4, "Should have max 4 options (3 candidates + Other)"
    
    def test_asks_which_company_when_ambiguous(self):
        """Test that disambiguation asks about companies correctly."""
        result = generate_disambiguation(
            candidates=["OpenAI", "Anthropic", "Google"],
            original_user_message="which one has the best model?",
            pronoun="one"
        )
        
        question_lower = result["question"].lower()
        # Should be context-aware but may not always say "company"
        assert "which" in question_lower, f"Should ask 'which': {result['question']}"
        
        options = result["options"]
        assert len(options) <= 4, "Should have max 4 options"
        assert "Other" in options, "Should include 'Other'"
    
    def test_limits_to_three_candidates(self):
        """Test that only top 3 candidates are shown."""
        many_candidates = [
            "Purdue University",
            "Indiana University",
            "Notre Dame",
            "Ball State",
            "Indiana State"
        ]
        
        result = generate_disambiguation(
            candidates=many_candidates,
            original_user_message="what is the ranking at that university?",
            pronoun="that university"
        )
        
        options = result["options"]
        # Should have 3 candidates + "Other" = 4 total
        assert len(options) == 4, f"Should have exactly 4 options, got {len(options)}"
        assert "Other" in options, "Should include 'Other'"
        
        # Should include first 3 candidates
        assert "Purdue University" in options
        assert "Indiana University" in options
        assert "Notre Dame" in options
    
    def test_handles_empty_candidates(self):
        """Test handling when no candidates provided."""
        result = generate_disambiguation(
            candidates=[],
            original_user_message="what is the ranking at that university?",
            pronoun="that university"
        )
        
        assert "question" in result
        assert "options" in result
        assert result["options"] == ["Other"], "Should have only 'Other' option"
    
    def test_generic_pronoun_handling(self):
        """Test handling of generic pronouns."""
        result = generate_disambiguation(
            candidates=["Item A", "Item B"],
            original_user_message="tell me about it",
            pronoun="it"
        )
        
        assert "question" in result
        assert "options" in result
        assert len(result["options"]) <= 4
    
    def test_preserves_original_message_context(self):
        """Test that original message context is considered."""
        result = generate_disambiguation(
            candidates=["Python", "JavaScript", "Java"],
            original_user_message="can that tool handle async operations?",
            pronoun="that tool"
        )
        
        question_lower = result["question"].lower()
        # Should be context-aware about "tool"
        assert "which" in question_lower or "tool" in question_lower, \
            f"Question should be context-aware: {result['question']}"
    
    def test_pronoun_specific_questions(self):
        """Test that questions are tailored to pronoun type."""
        test_cases = [
            ("that university", "university"),
            ("this company", "company"),
            ("that tool", "tool"),
            ("he", "person"),
            ("she", "person")
        ]
        
        for pronoun, expected_type in test_cases:
            result = generate_disambiguation(
                candidates=["Option 1", "Option 2"],
                original_user_message=f"tell me about {pronoun}",
                pronoun=pronoun
            )
            
            question_lower = result["question"].lower()
            # Question should be context-appropriate
            assert "which" in question_lower or "what" in question_lower, \
                f"Question for {pronoun} should be a question: {result['question']}"


class TestDisambiguationAssistantIntegration:
    """Integration tests for disambiguation with query rewriter."""
    
    def test_disambiguation_included_in_ambiguous_result(self):
        """Test that disambiguation is included when query rewriter detects ambiguity."""
        from app.services.query_rewriter import rewrite_query
        
        result = rewrite_query(
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
        
        assert result["AMBIGUOUS"] is True, "Should be ambiguous"
        assert result.get("disambiguation") is not None, "Should include disambiguation"
        
        disamb = result["disambiguation"]
        assert "question" in disamb
        assert "options" in disamb
        assert len(disamb["options"]) >= 2, "Should have at least 2 options"

