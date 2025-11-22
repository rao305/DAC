"""Query Rewriter Service.

Resolves pronouns and makes user queries self-contained using conversation context.
"""
import json
import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.services.disambiguation_assistant import generate_disambiguation


class QueryRewriter:
    """Rewrites user queries to be self-contained by resolving pronouns."""
    
    # Common pronouns and their typical referents
    PRONOUN_PATTERNS = {
        "it": ["thing", "item", "product", "system", "tool", "service", "company", "organization"],
        "that": ["thing", "item", "product", "system", "tool", "service", "company", "organization", "university", "school", "place"],
        "this": ["thing", "item", "product", "system", "tool", "service", "company", "organization", "university", "school", "place"],
        "they": ["people", "team", "company", "organization", "group"],
        "them": ["people", "team", "company", "organization", "group"],
        "he": ["person", "man", "individual"],
        "she": ["person", "woman", "individual"],
        "his": ["person", "man", "individual"],
        "her": ["person", "woman", "individual"],
    }
    
    # Context window for entity resolution (how far back to look)
    CONTEXT_WINDOW_HOURS = 72  # 3 days - optimized for cross-LLM conversations
    
    def __init__(self):
        pass
    
    def rewrite(
        self,
        user_message: str,
        recent_turns: List[Dict[str, str]],
        topics: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Rewrite user message to be self-contained.
        
        Args:
            user_message: The latest user message
            recent_turns: List of recent conversation turns [{"role": "user|assistant", "content": "..."}]
            topics: List of named entities [{"name": "...", "type": "...", "lastSeen": "..."}]
        
        Returns:
            {
                "rewritten": "<self-contained message>",
                "AMBIGUOUS": true|false,
                "referents": [{"pronoun": "...", "resolved_to": "..."}]
            }
        """
        if not user_message or not user_message.strip():
            return {"rewritten": user_message, "AMBIGUOUS": False, "referents": []}
        
        rewritten = user_message
        referents = []
        is_ambiguous = False
        ambiguous_pronouns = []  # Store ambiguous cases with candidates
        
        # Extract all text from recent turns for context
        context_text = self._extract_context(recent_turns)
        
        # Filter topics by recency
        recent_topics = self._filter_recent_topics(topics)
        
        # Find pronouns in the message
        pronouns_found = self._find_pronouns(user_message)
        
        for pronoun_match in pronouns_found:
            pronoun = pronoun_match["pronoun"]
            position = pronoun_match["position"]
            context_before = user_message[:position].lower()
            
            # Try to resolve the pronoun
            resolution = self._resolve_pronoun(
                pronoun=pronoun,
                context_before=context_before,
                context_text=context_text,
                topics=recent_topics
            )
            
            if resolution:
                if resolution.get("ambiguous", False):
                    is_ambiguous = True
                    # Store ambiguous case with candidates
                    candidates = resolution.get("candidates", [])
                    ambiguous_pronouns.append({
                        "pronoun": pronoun,
                        "candidates": candidates
                    })
                    # Don't resolve, keep original
                else:
                    resolved_to = resolution["entity"]
                    # Replace pronoun with resolved entity
                    # Handle "that university" -> "Purdue University"
                    if len(pronoun) > 1:  # Multi-word like "that university"
                        rewritten = rewritten.replace(pronoun, resolved_to, 1)
                    else:  # Single word pronoun
                        # Replace with article + entity if needed
                        if context_before.endswith(" "):
                            rewritten = rewritten.replace(f" {pronoun} ", f" {resolved_to} ", 1)
                        else:
                            rewritten = rewritten.replace(pronoun, resolved_to, 1)
                    
                    referents.append({
                        "pronoun": pronoun,
                        "resolved_to": resolved_to
                    })
        
        # Generate disambiguation question if ambiguous
        disambiguation = None
        if is_ambiguous and ambiguous_pronouns:
            # Use the first ambiguous pronoun for disambiguation
            first_ambiguous = ambiguous_pronouns[0]
            disambiguation = generate_disambiguation(
                candidates=first_ambiguous["candidates"],
                original_user_message=user_message,
                pronoun=first_ambiguous["pronoun"]
            )
        
        return {
            "rewritten": rewritten.strip(),
            "AMBIGUOUS": is_ambiguous,
            "referents": referents,
            "disambiguation": disambiguation
        }
    
    def _extract_context(self, recent_turns: List[Dict[str, str]]) -> str:
        """Extract all text from recent turns for context."""
        if not recent_turns:
            return ""
        
        context_parts = []
        for turn in recent_turns:
            role = turn.get("role", "")
            content = turn.get("content", "")
            if content:
                context_parts.append(content)
        
        return " ".join(context_parts)
    
    def _filter_recent_topics(self, topics: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter topics to only recent ones within context window."""
        if not topics:
            return []
        
        cutoff_time = datetime.now() - timedelta(hours=self.CONTEXT_WINDOW_HOURS)
        recent = []
        
        for topic in topics:
            last_seen = topic.get("lastSeen")
            if last_seen:
                try:
                    # Parse timestamp (assuming ISO format or Unix timestamp)
                    if isinstance(last_seen, (int, float)):
                        topic_time = datetime.fromtimestamp(last_seen)
                    elif isinstance(last_seen, str):
                        # Try ISO format
                        topic_time = datetime.fromisoformat(last_seen.replace("Z", "+00:00"))
                    else:
                        continue
                    
                    if topic_time >= cutoff_time:
                        recent.append(topic)
                except (ValueError, TypeError):
                    # If parsing fails, include it anyway (be permissive)
                    recent.append(topic)
            else:
                # If no timestamp, include it (be permissive)
                recent.append(topic)
        
        return recent
    
    def _find_pronouns(self, text: str) -> List[Dict[str, Any]]:
        """Find pronouns in the text with their positions."""
        pronouns = []
        
        # Pattern for common pronouns (case-insensitive)
        # Include multi-word patterns like "that university", "this company"
        # Order matters: multi-word patterns first, then single words
        # Added "college/colleges" to handle typos
        patterns = [
            (r'\bthat\s+(university|school|college|colleges|company|organization|tool|system|product|service)\b', 'multi'),
            (r'\bthis\s+(university|school|college|colleges|company|organization|tool|system|product|service)\b', 'multi'),
            (r'\btheir\b', 'single'),
            (r'\bthat\b', 'single'),
            (r'\bthis\b', 'single'),
            (r'\bit\b', 'single'),
            (r'\bthey\b', 'single'),
            (r'\bthem\b', 'single'),
            (r'\bhe\b', 'single'),
            (r'\bshe\b', 'single'),
            (r'\bhis\b', 'single'),
            (r'\bher\b', 'single'),
            (r'\bone\b', 'single'),  # "which one", "that one"
        ]
        
        for pattern, ptype in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                pronouns.append({
                    "pronoun": match.group(0),
                    "position": match.start(),
                    "type": ptype
                })
        
        # Sort by position (left to right)
        pronouns.sort(key=lambda x: x["position"])
        
        return pronouns
    
    def _resolve_pronoun(
        self,
        pronoun: str,
        context_before: str,
        context_text: str,
        topics: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Attempt to resolve a pronoun to a specific entity.
        
        Returns:
            {"entity": "...", "ambiguous": False} if resolved
            {"ambiguous": True} if ambiguous
            None if no resolution possible
        """
        pronoun_lower = pronoun.lower().strip()
        
        # Determine what type of entity we're looking for
        entity_types = self._get_expected_entity_types(pronoun_lower, context_before)
        
        # Find matching topics
        candidates = []
        for topic in topics:
            topic_name = topic.get("name", "")
            topic_type = topic.get("type", "").lower() if topic.get("type") else ""
            
            # If we have specific entity types, try to match
            if entity_types:
                # Check if topic type matches
                type_matches = topic_type in entity_types or any(et in topic_type for et in entity_types)
                
                # Also check if topic name appears in context (stronger signal)
                name_in_context = topic_name.lower() in context_text.lower()
                
                if type_matches or name_in_context:
                    candidates.append(topic_name)
            else:
                # If no specific type expected, check if topic appears in context
                # This handles generic pronouns like "it" and "their"
                if topic_name.lower() in context_text.lower():
                    candidates.append(topic_name)
                # If topic is very recent and no other candidates, include it
                elif len(candidates) == 0:
                    candidates.append(topic_name)
        
        # Check context text for explicit mentions (only if we don't have topic matches)
        # This helps avoid false positives from context extraction
        if len(candidates) == 0:
            context_candidates = self._find_entities_in_context(context_text, entity_types)
            candidates.extend(context_candidates)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_candidates = []
        for cand in candidates:
            if cand and cand.lower() not in seen:
                # Skip candidates that look like full sentences
                if len(cand.split()) <= 6:  # Reasonable entity name length
                    seen.add(cand.lower())
                    unique_candidates.append(cand)
        
        # Resolution logic
        if len(unique_candidates) == 0:
            # No candidates found - not ambiguous, just unresolved
            return None
        
        elif len(unique_candidates) == 1:
            # Exactly one candidate - resolve it
            return {
                "entity": unique_candidates[0],
                "ambiguous": False
            }
        
        else:
            # Multiple candidates - ambiguous
            # Store candidates for disambiguation
            return {
                "ambiguous": True,
                "candidates": unique_candidates
            }
    
    def _get_expected_entity_types(self, pronoun: str, context_before: str) -> List[str]:
        """Determine what type of entity the pronoun likely refers to."""
        types = []
        
        # Check for explicit type hints in context
        if "university" in pronoun or "school" in pronoun:
            types.extend(["university", "school", "institution", "college"])
        
        if "company" in pronoun or "organization" in pronoun:
            types.extend(["company", "organization", "corporation", "business", "firm"])
        
        if "tool" in pronoun or "system" in pronoun or "product" in pronoun:
            types.extend(["tool", "system", "product", "software", "application"])
        
        # Check context for hints
        context_lower = context_before.lower()
        
        if any(word in context_lower for word in ["university", "college", "school"]):
            types.append("university")
        
        if any(word in context_lower for word in ["company", "organization", "corporation"]):
            types.append("company")
        
        if any(word in context_lower for word in ["person", "individual", "researcher", "scientist"]):
            types.extend(["person", "individual"])
        
        # Default types based on pronoun
        if pronoun in ["it", "that", "this", "their"]:
            # Could be anything, but check context for hints
            if not types:
                # Check if context mentions product/platform/tool
                if any(word in context_lower for word in ["platform", "product", "tool", "system", "service"]):
                    types.extend(["product", "tool", "system", "platform"])
                # Check if context mentions company/organization
                elif any(word in context_lower for word in ["company", "organization", "corporation"]):
                    types.extend(["company", "organization"])
                else:
                    types = ["thing", "item", "entity", "product", "company", "tool"]
        
        return types
    
    def _find_entities_in_context(self, context_text: str, entity_types: List[str]) -> List[str]:
        """Find named entities mentioned in context text."""
        if not context_text:
            return []
        
        entities = []
        
        # Simple pattern matching for common entity patterns
        # University names often have "University" in them
        if "university" in " ".join(entity_types) or "school" in " ".join(entity_types):
            # Find patterns like "Purdue University", "Carnegie Mellon University", etc.
            # More specific pattern to avoid matching full sentences
            university_pattern = r'\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*(?:\s+(?:University|College|Institute|School)))\b'
            matches = re.findall(university_pattern, context_text)
            # Filter out very long matches (likely full sentences)
            for match in matches:
                if len(match.split()) <= 5:  # Reasonable entity name length
                    entities.append(match.strip())
        
        # Company names
        if "company" in " ".join(entity_types) or "organization" in " ".join(entity_types):
            # Find capitalized phrases that might be company names
            company_pattern = r'\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*(?:\s+(?:Inc|LLC|Corp|Corporation|Ltd|Company))?)\b'
            matches = re.findall(company_pattern, context_text)
            # Filter out very long matches
            for match in matches:
                if len(match.split()) <= 4:  # Reasonable company name length
                    entities.append(match.strip())
        
        return entities


def rewrite_query(
    user_message: str,
    recent_turns: List[Dict[str, str]],
    topics: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Public API for query rewriting.
    
    Args:
        user_message: Latest user message
        recent_turns: Recent conversation turns
        topics: Named entities from conversation
    
    Returns:
        {
            "rewritten": "<self-contained message>",
            "AMBIGUOUS": true|false,
            "referents": [{"pronoun": "...", "resolved_to": "..."}]
        }
    """
    rewriter = QueryRewriter()
    return rewriter.rewrite(user_message, recent_turns, topics)

