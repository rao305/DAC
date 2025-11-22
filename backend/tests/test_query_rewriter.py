"""Unit tests for Query Rewriter service."""
import pytest
import json
from pathlib import Path
from datetime import datetime, timedelta
from app.services.query_rewriter import rewrite_query, QueryRewriter


# Load test scenarios
TEST_SCENARIOS_PATH = Path(__file__).parent / "test_scenarios.json"


def load_test_scenarios():
    """Load test scenarios from JSON file."""
    with open(TEST_SCENARIOS_PATH) as f:
        return json.load(f)


@pytest.fixture
def test_scenarios():
    """Fixture providing test scenarios."""
    return load_test_scenarios()


class TestQueryRewriter:
    """Unit tests for Query Rewriter."""
    
    def test_resolves_that_university_to_purdue(self, test_scenarios):
        """Test that 'that university' resolves to Purdue University."""
        scenario = next(s for s in test_scenarios if s["name"] == "purdue_cs_ranking")
        
        recent_turns = [
            {"role": turn["role"], "content": turn["content"]}
            for turn in scenario["history"]
        ]
        
        topics = [
            {
                "name": topic["name"],
                "type": topic.get("type"),
                "lastSeen": topic.get("lastSeen")
            }
            for topic in scenario["topics"]
        ]
        
        result = rewrite_query(
            user_message=scenario["user_message"],
            recent_turns=recent_turns,
            topics=topics
        )
        
        assert result["AMBIGUOUS"] == scenario["expected"]["AMBIGUOUS"], \
            f"Expected AMBIGUOUS={scenario['expected']['AMBIGUOUS']}, got {result['AMBIGUOUS']}"
        
        rewritten_lower = result["rewritten"].lower()
        for phrase in scenario["expected"]["should_contain"]:
            assert phrase.lower() in rewritten_lower, \
                f"Expected '{phrase}' in rewritten message: {result['rewritten']}"
        
        # Check referents
        if not result["AMBIGUOUS"]:
            assert len(result["referents"]) > 0, "Should have at least one referent"
            assert any("purdue" in r["resolved_to"].lower() for r in result["referents"]), \
                "Should resolve to Purdue University"
    
    def test_detects_ambiguity_with_two_universities(self, test_scenarios):
        """Test that ambiguity is detected when multiple universities exist."""
        scenario = next(s for s in test_scenarios if s["name"] == "two_universities_ambiguous")
        
        recent_turns = [
            {"role": turn["role"], "content": turn["content"]}
            for turn in scenario["history"]
        ]
        
        topics = [
            {
                "name": topic["name"],
                "type": topic.get("type"),
                "lastSeen": topic.get("lastSeen")
            }
            for topic in scenario["topics"]
        ]
        
        result = rewrite_query(
            user_message=scenario["user_message"],
            recent_turns=recent_turns,
            topics=topics
        )
        
        assert result["AMBIGUOUS"] is True, "Should detect ambiguity with two universities"
        assert result.get("disambiguation") is not None, "Should provide disambiguation question"
        
        disamb = result["disambiguation"]
        assert "question" in disamb, "Disambiguation should have a question"
        assert "options" in disamb, "Disambiguation should have options"
        assert len(disamb["options"]) >= 2, "Should have at least 2 options"
        assert "Other" in disamb["options"], "Should include 'Other' option"
    
    def test_resolves_product_coref(self, test_scenarios):
        """Test that 'it' resolves to DAC product."""
        scenario = next(s for s in test_scenarios if s["name"] == "product_coref")
        
        recent_turns = [
            {"role": turn["role"], "content": turn["content"]}
            for turn in scenario["history"]
        ]
        
        topics = [
            {
                "name": topic["name"],
                "type": topic.get("type"),
                "lastSeen": topic.get("lastSeen")
            }
            for topic in scenario["topics"]
        ]
        
        result = rewrite_query(
            user_message=scenario["user_message"],
            recent_turns=recent_turns,
            topics=topics
        )
        
        assert result["AMBIGUOUS"] is False, "Should not be ambiguous"
        
        rewritten_lower = result["rewritten"].lower()
        for phrase in scenario["expected"]["should_contain"]:
            assert phrase.lower() in rewritten_lower, \
                f"Expected '{phrase}' in rewritten message: {result['rewritten']}"
    
    def test_preserves_constraints(self, test_scenarios):
        """Test that constraints like 'top 5' and 'as of 2024' are preserved."""
        scenario = next(s for s in test_scenarios if s["name"] == "preserve_constraints")
        
        recent_turns = [
            {"role": turn["role"], "content": turn["content"]}
            for turn in scenario["history"]
        ]
        
        topics = [
            {
                "name": topic["name"],
                "type": topic.get("type"),
                "lastSeen": topic.get("lastSeen")
            }
            for topic in scenario["topics"]
        ]
        
        result = rewrite_query(
            user_message=scenario["user_message"],
            recent_turns=recent_turns,
            topics=topics
        )
        
        rewritten_lower = result["rewritten"].lower()
        for phrase in scenario["expected"]["should_contain"]:
            assert phrase.lower() in rewritten_lower, \
                f"Expected constraint '{phrase}' preserved in: {result['rewritten']}"
    
    def test_no_context_no_rewrite(self, test_scenarios):
        """Test that queries without context are not rewritten unnecessarily."""
        scenario = next(s for s in test_scenarios if s["name"] == "no_context_no_rewrite")
        
        result = rewrite_query(
            user_message=scenario["user_message"],
            recent_turns=[],
            topics=[]
        )
        
        assert result["AMBIGUOUS"] is False, "Should not be ambiguous"
        # Should preserve original message structure
        assert "capital" in result["rewritten"].lower()
        assert "france" in result["rewritten"].lower()
    
    def test_multi_word_pronoun_resolution(self, test_scenarios):
        """Test that multi-word pronouns like 'that university' are resolved."""
        scenario = next(s for s in test_scenarios if s["name"] == "multi_word_pronoun")
        
        recent_turns = [
            {"role": turn["role"], "content": turn["content"]}
            for turn in scenario["history"]
        ]
        
        topics = [
            {
                "name": topic["name"],
                "type": topic.get("type"),
                "lastSeen": topic.get("lastSeen")
            }
            for topic in scenario["topics"]
        ]
        
        result = rewrite_query(
            user_message=scenario["user_message"],
            recent_turns=recent_turns,
            topics=topics
        )
        
        assert result["AMBIGUOUS"] is False, "Should not be ambiguous"
        rewritten_lower = result["rewritten"].lower()
        assert "carnegie mellon" in rewritten_lower or "cmu" in rewritten_lower, \
            "Should resolve 'that university' to Carnegie Mellon"
    
    def test_three_companies_ambiguous(self, test_scenarios):
        """Test ambiguity detection with three companies."""
        scenario = next(s for s in test_scenarios if s["name"] == "three_companies_ambiguous")
        
        recent_turns = [
            {"role": turn["role"], "content": turn["content"]}
            for turn in scenario["history"]
        ]
        
        topics = [
            {
                "name": topic["name"],
                "type": topic.get("type"),
                "lastSeen": topic.get("lastSeen")
            }
            for topic in scenario["topics"]
        ]
        
        result = rewrite_query(
            user_message=scenario["user_message"],
            recent_turns=recent_turns,
            topics=topics
        )
        
        assert result["AMBIGUOUS"] is True, "Should detect ambiguity with three companies"
        assert result.get("disambiguation") is not None, "Should provide disambiguation"
        
        disamb = result["disambiguation"]
        options = disamb["options"]
        # Should have up to 3 candidates plus "Other"
        assert len(options) <= 4, f"Should have max 4 options, got {len(options)}"
        assert "Other" in options, "Should include 'Other' option"
    
    def test_company_reference_resolution(self, test_scenarios):
        """Test that 'their' resolves to company name."""
        scenario = next(s for s in test_scenarios if s["name"] == "company_reference")
        
        recent_turns = [
            {"role": turn["role"], "content": turn["content"]}
            for turn in scenario["history"]
        ]
        
        topics = [
            {
                "name": topic["name"],
                "type": topic.get("type"),
                "lastSeen": topic.get("lastSeen")
            }
            for topic in scenario["topics"]
        ]
        
        result = rewrite_query(
            user_message=scenario["user_message"],
            recent_turns=recent_turns,
            topics=topics
        )
        
        assert result["AMBIGUOUS"] is False, "Should not be ambiguous"
        rewritten_lower = result["rewritten"].lower()
        assert "openai" in rewritten_lower, "Should resolve 'their' to OpenAI"
    
    @pytest.mark.parametrize("scenario_name", [
        "purdue_cs_ranking",
        "product_coref",
        "company_reference",
        "that_tool_reference",
        "preserve_constraints",
        "multi_word_pronoun"
    ])
    def test_all_unambiguous_scenarios(self, test_scenarios, scenario_name):
        """Parametrized test for all unambiguous scenarios."""
        scenario = next(s for s in test_scenarios if s["name"] == scenario_name)
        
        recent_turns = [
            {"role": turn["role"], "content": turn["content"]}
            for turn in scenario["history"]
        ]
        
        topics = [
            {
                "name": topic["name"],
                "type": topic.get("type"),
                "lastSeen": topic.get("lastSeen")
            }
            for topic in scenario["topics"]
        ]
        
        result = rewrite_query(
            user_message=scenario["user_message"],
            recent_turns=recent_turns,
            topics=topics
        )
        
        assert result["AMBIGUOUS"] is False, \
            f"Scenario {scenario_name} should not be ambiguous"
        
        if "should_contain" in scenario["expected"]:
            rewritten_lower = result["rewritten"].lower()
            for phrase in scenario["expected"]["should_contain"]:
                assert phrase.lower() in rewritten_lower, \
                    f"Expected '{phrase}' in rewritten message for {scenario_name}"


class TestQueryRewriterEdgeCases:
    """Edge case tests for Query Rewriter."""
    
    def test_empty_message(self):
        """Test handling of empty message."""
        result = rewrite_query(
            user_message="",
            recent_turns=[],
            topics=[]
        )
        
        assert result["rewritten"] == ""
        assert result["AMBIGUOUS"] is False
        assert result["referents"] == []
    
    def test_no_pronouns(self):
        """Test message with no pronouns."""
        result = rewrite_query(
            user_message="What is the capital of France?",
            recent_turns=[],
            topics=[]
        )
        
        assert "capital" in result["rewritten"].lower()
        assert result["AMBIGUOUS"] is False
        assert len(result["referents"]) == 0
    
    def test_stale_topics_filtered(self):
        """Test that very old topics are filtered out."""
        old_time = (datetime.now() - timedelta(days=30)).isoformat()
        
        result = rewrite_query(
            user_message="what is the ranking at that university?",
            recent_turns=[
                {"role": "user", "content": "Tell me about Stanford"},
                {"role": "assistant", "content": "Stanford is..."}
            ],
            topics=[
                {"name": "Stanford", "type": "university", "lastSeen": old_time}
            ]
        )
        
        # Should still work but may not resolve if context window expired
        assert "rewritten" in result
        assert "AMBIGUOUS" in result

