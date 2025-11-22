"""Entity and Coreference API endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.api.deps import require_org_id
from app.services.coreference_service import (
    get_conversation_context,
    Entity as CoreferenceEntity,
)


router = APIRouter()


class EntityResponse(BaseModel):
    """Entity response model."""

    name: str
    type: str
    first_mentioned: float
    last_mentioned: float
    mention_count: int
    context: str
    aliases: List[str]


class ConversationContextResponse(BaseModel):
    """Conversation context response."""

    thread_id: str
    entities: List[EntityResponse]
    recent_topics: List[str]


class EntityCreateRequest(BaseModel):
    """Request to manually add an entity."""

    name: str
    type: str
    context: Optional[str] = ""
    aliases: Optional[List[str]] = []


@router.get("/threads/{thread_id}/entities", response_model=ConversationContextResponse)
async def get_thread_entities(
    thread_id: str,
    org_id: str = Depends(require_org_id)
):
    """
    Get all entities tracked for a thread.

    This endpoint returns the conversation context including all entities
    that have been mentioned and tracked during the conversation.
    """
    context = get_conversation_context(thread_id)

    entities = [
        EntityResponse(
            name=e.name,
            type=e.type,
            first_mentioned=e.first_mentioned,
            last_mentioned=e.last_mentioned,
            mention_count=e.mention_count,
            context=e.context,
            aliases=e.aliases
        )
        for e in context.entities
    ]

    return ConversationContextResponse(
        thread_id=thread_id,
        entities=entities,
        recent_topics=context.recent_topics
    )


@router.get("/threads/{thread_id}/entities/by-type/{entity_type}", response_model=List[EntityResponse])
async def get_entities_by_type(
    thread_id: str,
    entity_type: str,
    limit: int = 10,
    org_id: str = Depends(require_org_id)
):
    """
    Get entities of a specific type from a thread.

    Entities are returned in order of most recent mention first.

    Args:
        thread_id: Thread ID
        entity_type: Type of entity (e.g., "university", "person", "model", "company")
        limit: Maximum number of entities to return
    """
    context = get_conversation_context(thread_id)
    entities = context.get_recent_entities_by_type(entity_type, limit=limit)

    return [
        EntityResponse(
            name=e.name,
            type=e.type,
            first_mentioned=e.first_mentioned,
            last_mentioned=e.last_mentioned,
            mention_count=e.mention_count,
            context=e.context,
            aliases=e.aliases
        )
        for e in entities
    ]


@router.post("/threads/{thread_id}/entities", response_model=EntityResponse)
async def add_entity(
    thread_id: str,
    request: EntityCreateRequest,
    org_id: str = Depends(require_org_id)
):
    """
    Manually add an entity to the conversation context.

    This can be useful for:
    - Pre-populating context before a conversation
    - Adding entities that weren't automatically detected
    - Correcting entity information
    """
    context = get_conversation_context(thread_id)

    entity = CoreferenceEntity(
        name=request.name,
        type=request.type,
        context=request.context or "",
        aliases=request.aliases or []
    )

    context.add_entity(entity)

    return EntityResponse(
        name=entity.name,
        type=entity.type,
        first_mentioned=entity.first_mentioned,
        last_mentioned=entity.last_mentioned,
        mention_count=entity.mention_count,
        context=entity.context,
        aliases=entity.aliases
    )


@router.delete("/threads/{thread_id}/entities")
async def clear_entities(
    thread_id: str,
    org_id: str = Depends(require_org_id)
):
    """
    Clear all entities for a thread.

    This resets the conversation context, useful for:
    - Starting a fresh conversation
    - Clearing outdated context
    - Testing/debugging
    """
    context = get_conversation_context(thread_id)
    context.entities.clear()
    context.recent_topics.clear()

    return {"status": "success", "message": f"Cleared entities for thread {thread_id}"}


@router.get("/threads/{thread_id}/entities/search/{name}", response_model=Optional[EntityResponse])
async def search_entity(
    thread_id: str,
    name: str,
    org_id: str = Depends(require_org_id)
):
    """
    Search for an entity by name or alias.

    Returns None if not found.
    """
    context = get_conversation_context(thread_id)
    entity = context.find_entity_by_name(name)

    if not entity:
        return None

    return EntityResponse(
        name=entity.name,
        type=entity.type,
        first_mentioned=entity.first_mentioned,
        last_mentioned=entity.last_mentioned,
        mention_count=entity.mention_count,
        context=entity.context,
        aliases=entity.aliases
    )
