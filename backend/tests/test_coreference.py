"""Tests for coreference resolution service."""

import pytest
from app.services.coreference_service import (
    Entity,
    ConversationContext,
    get_conversation_context,
    extract_entity_type_from_phrase,
    resolve_vague_reference,
    should_ask_for_clarification,
)


class TestEntity:
    """Test Entity class."""

    def test_entity_creation(self):
        """Test creating an entity."""
        entity = Entity(
            name="Purdue University",
            type="university",
            context="A large public university in Indiana"
        )
        assert entity.name == "Purdue University"
        assert entity.type == "university"
        assert entity.context == "A large public university in Indiana"
        assert entity.mention_count == 1

    def test_entity_update_mention(self):
        """Test updating entity mention count and timestamp."""
        entity = Entity(name="Test", type="test")
        initial_time = entity.last_mentioned
        entity.update_mention()
        assert entity.mention_count == 2
        assert entity.last_mentioned >= initial_time


class TestConversationContext:
    """Test ConversationContext class."""

    def test_add_entity(self):
        """Test adding an entity to context."""
        context = ConversationContext(thread_id="test-thread")
        entity = Entity(name="Purdue University", type="university")
        context.add_entity(entity)
        assert len(context.entities) == 1
        assert context.entities[0].name == "Purdue University"

    def test_add_duplicate_entity(self):
        """Test adding a duplicate entity updates the existing one."""
        context = ConversationContext(thread_id="test-thread")
        entity1 = Entity(name="Purdue University", type="university", context="First mention")
        entity2 = Entity(name="Purdue University", type="university", context="Second mention")

        context.add_entity(entity1)
        context.add_entity(entity2)

        # Should still be only one entity
        assert len(context.entities) == 1
        # Mention count should be updated
        assert context.entities[0].mention_count == 2
        # Context should be updated
        assert context.entities[0].context == "Second mention"

    def test_get_recent_entities_by_type(self):
        """Test retrieving entities by type."""
        context = ConversationContext(thread_id="test-thread")

        # Add multiple entities of different types
        context.add_entity(Entity(name="Purdue University", type="university"))
        context.add_entity(Entity(name="MIT", type="university"))
        context.add_entity(Entity(name="GPT-4", type="model"))

        # Get universities
        universities = context.get_recent_entities_by_type("university")
        assert len(universities) == 2
        assert all(e.type == "university" for e in universities)

    def test_get_most_recent_entity_by_type(self):
        """Test getting the most recent entity of a type."""
        context = ConversationContext(thread_id="test-thread")

        entity1 = Entity(name="Purdue University", type="university")
        entity2 = Entity(name="MIT", type="university")

        context.add_entity(entity1)
        context.add_entity(entity2)

        # MIT should be most recent
        most_recent = context.get_most_recent_entity_by_type("university")
        assert most_recent.name == "MIT"

    def test_find_entity_by_name(self):
        """Test finding entity by name."""
        context = ConversationContext(thread_id="test-thread")
        context.add_entity(Entity(name="Purdue University", type="university"))

        # Find by exact name
        found = context.find_entity_by_name("Purdue University")
        assert found is not None
        assert found.name == "Purdue University"

        # Find by case-insensitive name
        found = context.find_entity_by_name("purdue university")
        assert found is not None

        # Not found
        not_found = context.find_entity_by_name("Stanford")
        assert not_found is None


class TestEntityTypeExtraction:
    """Test entity type extraction from phrases."""

    def test_extract_entity_type_that_pattern(self):
        """Test extracting entity type from 'that X' pattern."""
        assert extract_entity_type_from_phrase("that university") == "university"
        assert extract_entity_type_from_phrase("that model") == "model"
        assert extract_entity_type_from_phrase("that company") == "company"

    def test_extract_entity_type_this_pattern(self):
        """Test extracting entity type from 'this X' pattern."""
        assert extract_entity_type_from_phrase("this school") == "school"
        assert extract_entity_type_from_phrase("this tool") == "tool"

    def test_extract_entity_type_the_pattern(self):
        """Test extracting entity type from 'the X' pattern."""
        assert extract_entity_type_from_phrase("the person") == "person"
        assert extract_entity_type_from_phrase("the product") == "product"

    def test_extract_entity_type_no_match(self):
        """Test when no entity type can be extracted."""
        assert extract_entity_type_from_phrase("what?") is None
        assert extract_entity_type_from_phrase("hello") is None


class TestVagueReferenceResolution:
    """Test vague reference resolution."""

    def test_resolve_university_reference(self):
        """Test resolving 'that university' to most recent university."""
        context = ConversationContext(thread_id="test-thread")
        context.add_entity(Entity(name="Purdue University", type="university"))

        resolved, reasoning = resolve_vague_reference(
            "that university",
            context,
            []
        )

        assert resolved == "Purdue University"
        assert "Purdue University" in reasoning

    def test_resolve_pronoun_it(self):
        """Test resolving pronoun 'it' to most recent compatible entity."""
        context = ConversationContext(thread_id="test-thread")
        context.add_entity(Entity(name="GPT-4", type="model"))

        resolved, reasoning = resolve_vague_reference(
            "it",
            context,
            []
        )

        assert resolved == "GPT-4"
        assert "GPT-4" in reasoning

    def test_resolve_pronoun_they(self):
        """Test resolving pronoun 'they' to organization/company."""
        context = ConversationContext(thread_id="test-thread")
        context.add_entity(Entity(name="OpenAI", type="company"))

        resolved, reasoning = resolve_vague_reference(
            "they",
            context,
            []
        )

        assert resolved == "OpenAI"

    def test_resolve_no_match(self):
        """Test when no entity can be resolved."""
        context = ConversationContext(thread_id="test-thread")
        # Empty context

        resolved, reasoning = resolve_vague_reference(
            "that university",
            context,
            []
        )

        assert resolved is None
        assert "No university found" in reasoning


class TestClarificationDecision:
    """Test when to ask for clarification."""

    def test_should_clarify_multiple_recent(self):
        """Test that we ask for clarification with multiple recent entities."""
        entity1 = Entity(name="Purdue", type="university")
        entity2 = Entity(name="MIT", type="university")
        # Set them to be mentioned close in time
        entity1.last_mentioned = 100.0
        entity2.last_mentioned = 110.0  # 10 seconds apart

        should_clarify = should_ask_for_clarification([entity1, entity2], "university")
        assert should_clarify is True

    def test_should_not_clarify_single_entity(self):
        """Test that we don't ask for clarification with single entity."""
        entity1 = Entity(name="Purdue", type="university")

        should_clarify = should_ask_for_clarification([entity1], "university")
        assert should_clarify is False

    def test_should_not_clarify_clear_recency(self):
        """Test that we don't ask when one entity is clearly more recent."""
        entity1 = Entity(name="Purdue", type="university")
        entity2 = Entity(name="MIT", type="university")
        # Set them to be mentioned far apart (> 5 minutes)
        entity1.last_mentioned = 100.0
        entity2.last_mentioned = 500.0  # 400 seconds apart

        should_clarify = should_ask_for_clarification([entity2, entity1], "university")
        assert should_clarify is False


class TestConversationContextIntegration:
    """Integration tests for conversation context management."""

    def test_conversation_flow(self):
        """Test a typical conversation flow with entity tracking."""
        # Start a conversation about universities
        context = get_conversation_context("test-thread-1")

        # User asks about Purdue
        context.add_entity(Entity(
            name="Purdue University",
            type="university",
            context="User asked about this university"
        ))

        # User says "that university" - should resolve to Purdue
        resolved, _ = resolve_vague_reference("that university", context, [])
        assert resolved == "Purdue University"

        # User mentions MIT
        context.add_entity(Entity(
            name="MIT",
            type="university",
            context="User mentioned this university"
        ))

        # User says "that university" - should now resolve to MIT (most recent)
        resolved, _ = resolve_vague_reference("that university", context, [])
        assert resolved == "MIT"

    def test_multi_type_conversation(self):
        """Test conversation with multiple entity types."""
        context = get_conversation_context("test-thread-2")

        # Add entities of different types
        context.add_entity(Entity(name="Purdue University", type="university"))
        context.add_entity(Entity(name="GPT-4", type="model"))
        context.add_entity(Entity(name="OpenAI", type="company"))

        # Test resolving each type
        university, _ = resolve_vague_reference("that university", context, [])
        assert university == "Purdue University"

        model, _ = resolve_vague_reference("that model", context, [])
        assert model == "GPT-4"

        company, _ = resolve_vague_reference("that company", context, [])
        assert company == "OpenAI"


# Run tests with: pytest tests/test_coreference.py -v
