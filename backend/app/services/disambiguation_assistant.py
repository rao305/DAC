"""Disambiguation Assistant Service.

Asks clarifying questions when pronoun resolution is ambiguous.
"""
from typing import List, Dict, Any, Optional


class DisambiguationAssistant:
    """Generates disambiguation questions for ambiguous pronoun references."""
    
    def generate_question(
        self,
        candidates: List[str],
        original_user_message: str,
        pronoun: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a disambiguation question.
        
        Args:
            candidates: List of candidate entities that could match
            original_user_message: The user's original message
            pronoun: The ambiguous pronoun (optional, for context)
        
        Returns:
            {
                "question": "Which did you mean?",
                "options": ["Option 1", "Option 2", "Option 3", "Other"],
                "pronoun": "that university" (if provided)
            }
        """
        if not candidates:
            return {
                "question": "Could you clarify what you're referring to?",
                "options": ["Other"],
                "pronoun": pronoun or "it"
            }
        
        # Limit to 3 candidates (plus "Other")
        display_candidates = candidates[:3]
        
        # Generate context-aware question
        question = self._generate_question_text(pronoun, original_user_message)
        
        # Add "Other" option
        options = display_candidates + ["Other"]
        
        return {
            "question": question,
            "options": options,
            "pronoun": pronoun or "it",
            "candidates": display_candidates
        }
    
    def _generate_question_text(
        self,
        pronoun: Optional[str],
        original_message: str
    ) -> str:
        """Generate a context-aware disambiguation question."""
        if pronoun:
            # Use pronoun in question for context
            pronoun_lower = pronoun.lower()
            
            if "university" in pronoun_lower or "school" in pronoun_lower:
                return "Which university did you mean?"
            elif "company" in pronoun_lower or "organization" in pronoun_lower:
                return "Which company did you mean?"
            elif "tool" in pronoun_lower or "system" in pronoun_lower:
                return "Which tool did you mean?"
            elif "person" in pronoun_lower or pronoun_lower in ["he", "she"]:
                return "Which person did you mean?"
            else:
                return f"Which {pronoun} did you mean?"
        else:
            # Generic question
            return "Which did you mean?"


def generate_disambiguation(
    candidates: List[str],
    original_user_message: str,
    pronoun: Optional[str] = None
) -> Dict[str, Any]:
    """
    Public API for generating disambiguation questions.
    
    Args:
        candidates: List of candidate entities
        original_user_message: User's original message
        pronoun: The ambiguous pronoun (optional)
    
    Returns:
        {
            "question": "...",
            "options": ["...", "..."],
            "pronoun": "..."
        }
    """
    assistant = DisambiguationAssistant()
    return assistant.generate_question(candidates, original_user_message, pronoun)

