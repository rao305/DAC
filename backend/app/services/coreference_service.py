"""Coreference Resolution Service.

This service implements comprehensive context-aware behavior for DAC,
ensuring pronouns and vague references are correctly resolved using
conversation history.
"""

from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import re


@dataclass
class Entity:
    """Represents an entity mentioned in conversation."""

    name: str
    type: str  # person, university, model, company, product, location, date, etc.
    first_mentioned: float = field(default_factory=lambda: datetime.now().timestamp())
    last_mentioned: float = field(default_factory=lambda: datetime.now().timestamp())
    mention_count: int = 1
    context: str = ""  # Brief context about the entity
    aliases: List[str] = field(default_factory=list)  # Alternative names

    def update_mention(self):
        """Update the last mentioned timestamp and increment count."""
        self.last_mentioned = datetime.now().timestamp()
        self.mention_count += 1


@dataclass
class ConversationContext:
    """Maintains conversation context for coreference resolution."""

    thread_id: str
    entities: List[Entity] = field(default_factory=list)
    recent_topics: List[str] = field(default_factory=list)  # For topic tracking

    def add_entity(self, entity: Entity):
        """Add or update an entity in the context."""
        # Check if entity already exists (by name or alias)
        for existing in self.entities:
            if (entity.name.lower() == existing.name.lower() or
                entity.name.lower() in [a.lower() for a in existing.aliases] or
                existing.name.lower() in [a.lower() for a in entity.aliases]):
                # Update existing entity
                existing.update_mention()
                existing.context = entity.context or existing.context
                # Merge aliases
                for alias in entity.aliases:
                    if alias.lower() not in [a.lower() for a in existing.aliases]:
                        existing.aliases.append(alias)
                return

        # New entity
        self.entities.append(entity)

    def get_recent_entities_by_type(self, entity_type: str, limit: int = 5) -> List[Entity]:
        """Get most recently mentioned entities of a specific type."""
        matching = [e for e in self.entities if e.type.lower() == entity_type.lower()]
        # Sort by last mentioned (most recent first)
        matching.sort(key=lambda e: e.last_mentioned, reverse=True)
        return matching[:limit]

    def get_most_recent_entity_by_type(self, entity_type: str) -> Optional[Entity]:
        """Get the single most recently mentioned entity of a type."""
        recent = self.get_recent_entities_by_type(entity_type, limit=1)
        return recent[0] if recent else None

    def find_entity_by_name(self, name: str) -> Optional[Entity]:
        """Find entity by name or alias (case-insensitive)."""
        name_lower = name.lower()
        for entity in self.entities:
            if (entity.name.lower() == name_lower or
                name_lower in [a.lower() for a in entity.aliases]):
                return entity
        return None


# In-memory store for conversation contexts (swap for Redis in production)
_context_store: Dict[str, ConversationContext] = {}


def get_conversation_context(thread_id: str) -> ConversationContext:
    """Get or create conversation context for a thread."""
    if thread_id not in _context_store:
        _context_store[thread_id] = ConversationContext(thread_id=thread_id)
    return _context_store[thread_id]


def extract_entity_type_from_phrase(phrase: str) -> Optional[str]:
    """
    Extract entity type from vague reference phrases.

    Examples:
        "that university" -> "university"
        "that model" -> "model"
        "that company" -> "company"
    """
    # Common patterns for vague references
    patterns = [
        r"that\s+(\w+)",
        r"this\s+(\w+)",
        r"the\s+(\w+)",
        r"which\s+(\w+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, phrase.lower())
        if match:
            return match.group(1)

    return None


def resolve_vague_reference(
    phrase: str,
    context: ConversationContext,
    conversation_history: List[Dict[str, str]]
) -> Tuple[Optional[str], Optional[str]]:
    """
    Resolve vague references like "that university", "this model", etc.

    Returns:
        (resolved_name, reasoning) or (None, error_message)
    """
    phrase_lower = phrase.lower().strip()

    # Extract entity type from phrase
    entity_type = extract_entity_type_from_phrase(phrase)

    # Handle pronoun references
    pronoun_to_types = {
        "it": ["product", "model", "tool", "company", "university", "concept"],
        "he": ["person"],
        "she": ["person"],
        "they": ["organization", "company", "group", "people"],
        "them": ["organization", "company", "group", "people"],
    }

    if phrase_lower in pronoun_to_types:
        # Try each possible type in order
        for possible_type in pronoun_to_types[phrase_lower]:
            most_recent = context.get_most_recent_entity_by_type(possible_type)
            if most_recent:
                return (
                    most_recent.name,
                    f"Resolved '{phrase}' to '{most_recent.name}' (most recent {possible_type} mentioned)"
                )

    # Handle specific type references
    if entity_type:
        most_recent = context.get_most_recent_entity_by_type(entity_type)
        if most_recent:
            return (
                most_recent.name,
                f"Resolved '{phrase}' to '{most_recent.name}' (most recent {entity_type} mentioned)"
            )
        else:
            return (
                None,
                f"No {entity_type} found in recent conversation"
            )

    # Cannot resolve
    return (None, f"Cannot determine what '{phrase}' refers to")


def should_ask_for_clarification(
    candidates: List[Entity],
    entity_type: str
) -> bool:
    """
    Determine if we should ask for clarification based on ambiguity.

    Rules:
    - Only ask if there are 2+ realistic candidates of the same type
    - AND the choice would significantly change the answer
    """
    # If only one candidate, no need to ask
    if len(candidates) <= 1:
        return False

    # If candidates were mentioned very close in time (within 60 seconds),
    # it's likely ambiguous
    if len(candidates) >= 2:
        time_diff = abs(candidates[0].last_mentioned - candidates[1].last_mentioned)
        if time_diff < 60:  # Less than 60 seconds apart
            return True

    # If one candidate was mentioned much more recently, prefer it
    if len(candidates) >= 2:
        recency_diff = candidates[0].last_mentioned - candidates[1].last_mentioned
        if recency_diff > 300:  # More than 5 minutes apart
            return False  # Clear winner by recency

    return len(candidates) >= 2


# Context-awareness system prompt (comprehensive rules)
CONTEXT_AWARENESS_SYSTEM_PROMPT = """You are DAC, a highly context-aware AI assistant.

Your TOP PRIORITY is to correctly use the conversation history to interpret the user's latest message. You must resolve pronouns and vague references (like "he", "she", "they", "it", "that university", "that model", "this one") using prior turns, and you must NOT randomly switch to unrelated entities from search results.

=============================
1. Conversation & Context
=============================

- Treat each conversation as a continuous thread unless the user explicitly starts a new topic (e.g., "new topic", "different question", "ignore above").
- Always read the recent messages (both user and assistant) before answering.
- Assume the latest user message depends on what was said just before it, unless it is clearly standalone.

=============================
2. Pronouns & Vague References
=============================

When you see references like:
- "he", "she", "they", "it"
- "that university", "that company", "that model", "that person"
- "this one", "that one", "the previous one"

You MUST:

1. Look back at recent turns and identify the most recently mentioned entity of the correct type.
   - Example: If the user previously asked "Who is Donald Trump?" and then asks "When was he born?", you MUST interpret "he" as **Donald Trump**, even if external search results mention other people like Luis Miguel.

2. Prefer **recency + type match**:
   - Pick the most recently mentioned entity that matches the pronoun's type (person, university, company, model, etc.).
   - If there is exactly one clear match, use it without asking the user.

3. Do NOT override context with search:
   - If the conversation clearly indicates a specific entity (e.g., Donald Trump), you must continue referring to that entity even if web search results talk about someone else.
   - Never replace the active subject from context with a new, unrelated person from search results unless the user explicitly changes the subject.

4. Only ask for clarification when:
   - There are two or more equally plausible entities in the recent history, AND
   - Choosing the wrong one would significantly change the answer.
   - In that case, ask a short, precise question:
     - "Do you mean Donald Trump or Joe Biden?"

=============================
3. Using Previous Information
=============================

- Reuse details from the conversation instead of asking the user to repeat them.
  - If earlier messages mention the entity, name, or topic, you can assume follow-up questions refer to the same thing unless the user clearly switches topics.
- Respect corrections: if the user corrects an entity (e.g., "Actually I meant Purdue University Northwest"), you must use the corrected version in all future turns.

=============================
4. Answering Behavior
=============================

- When you resolve a pronoun or vague reference, make the entity explicit at least once in your answer so the user can see what you inferred.
  - Example: "Donald Trump was born on June 14, 1946." instead of only "He was born on June 14, 1946."
- Be concise, accurate, and grounded in the conversation plus any tools/search.
- If you genuinely cannot resolve a reference after checking the history, briefly explain the ambiguity and ask a concise clarifying question.

=============================
5. Safety & Honesty
=============================

- Never invent context that is not in the conversation.
- Never arbitrarily introduce a new person or entity (such as a random celebrity) when the user is clearly referring to someone already in the conversation.
- Follow all higher-level safety and system instructions provided with this prompt.

Reminder:
Your main job is to be **context-aware and consistent**.
Correctly track "who" and "what" the user is talking about across turns, and do not let external search distract you from the entities already established in the conversation.
"""


def get_context_awareness_system_message() -> Dict[str, str]:
    """Get the context-awareness system message."""
    return {
        "role": "system",
        "content": CONTEXT_AWARENESS_SYSTEM_PROMPT
    }
