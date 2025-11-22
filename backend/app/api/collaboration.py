"""
Collaboration API endpoints

Dedicated endpoints for multi-agent collaboration functionality,
including follow-up questions and meta-queries about the collaboration process.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.database import get_db
from app.security import set_rls_context
from app.api.deps import require_org_id
from app.services.provider_keys import get_api_key_for_org
from app.models.provider_key import ProviderType
from app.services.main_assistant import main_assistant
from app.services.conversation_storage import ConversationStorageService, ConversationContextManager
from app.services.collaboration_engine import AgentRole


router = APIRouter()


class CollaborationRequest(BaseModel):
    """Request for multi-agent collaboration"""
    user_id: Optional[str] = None
    message: str = Field(..., description="User's message or question")
    thread_id: Optional[str] = Field(None, description="Thread ID for context")


class MetaQuestionRequest(BaseModel):
    """Request for meta-questions about collaboration"""
    user_id: Optional[str] = None
    question: str = Field(..., description="Meta-question about the collaboration process")
    thread_id: str = Field(..., description="Thread ID to reference")
    turn_id: Optional[str] = Field(None, description="Specific turn ID to reference")


class AgentOutputResponse(BaseModel):
    """Agent output for API responses"""
    role: str
    provider: str
    content: str
    timestamp: datetime
    turn_id: str


class CollaborationStatsResponse(BaseModel):
    """Collaboration statistics"""
    total_turns: int
    avg_time_ms: float
    mode_distribution: Dict[str, int]
    agent_role_distribution: Dict[str, int]
    total_agent_outputs: int


@router.post("/collaborate")
async def collaborate(
    request: CollaborationRequest,
    org_id: str = Depends(require_org_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Run multi-agent collaboration on a user message.
    
    This endpoint triggers the full 5-agent collaboration pipeline:
    1. Analyst (Gemini) - Problem breakdown and structure
    2. Researcher (Perplexity) - Web research and citations
    3. Creator (GPT) - Main solution draft
    4. Critic (GPT) - Flaws and improvement suggestions  
    5. Synthesizer (GPT) - Final integrated report
    """
    await set_rls_context(db, org_id)
    
    # Collect API keys for all providers
    api_keys = {}
    for provider in [ProviderType.OPENAI, ProviderType.GEMINI, ProviderType.PERPLEXITY]:
        try:
            key = await get_api_key_for_org(db, org_id, provider)
            if key:
                api_keys[provider.value] = key
        except Exception:
            continue  # Skip if provider not configured
    
    if not api_keys:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No API keys configured for collaboration providers"
        )
    
    # Generate unique turn ID
    import uuid
    turn_id = str(uuid.uuid4())
    
    # Get chat history if thread_id provided
    chat_history = []
    if request.thread_id:
        storage_service = ConversationStorageService(db)
        stored_turns = storage_service.get_thread_history(request.thread_id)
        # Convert to simple format for main_assistant
        for turn in stored_turns:
            chat_history.extend([
                {"role": "user", "content": turn.user_query},
                {"role": "assistant", "content": turn.final_report}
            ])
    
    # Run collaboration
    result = await main_assistant.handle_message(
        user_message=request.message,
        turn_id=turn_id,
        api_keys=api_keys,
        collaboration_mode=True,
        chat_history=chat_history
    )
    
    # Store collaboration results
    if result.get("type") == "collaboration" and result.get("agent_outputs"):
        storage_service = ConversationStorageService(db)
        
        # Convert agent outputs back to AgentOutput objects for storage
        from app.services.collaboration_engine import AgentOutput, AgentRole
        agent_outputs = []
        for output_dict in result["agent_outputs"]:
            agent_outputs.append(AgentOutput(
                role=AgentRole(output_dict["role"]),
                provider=output_dict["provider"],
                content=output_dict["content"],
                timestamp=output_dict["timestamp"],
                turn_id=turn_id
            ))
        
        storage_service.store_collaboration_turn(
            turn_id=turn_id,
            thread_id=request.thread_id or f"collab_{turn_id}",
            user_query=request.message,
            final_report=result["content"],
            agent_outputs=agent_outputs,
            total_time_ms=result.get("total_time_ms", 0),
            collaboration_mode="full"
        )
    
    return {
        "final_report": result["content"],
        "turn_id": turn_id,
        "agent_outputs": [
            AgentOutputResponse(
                role=output["role"],
                provider=output["provider"], 
                content=output["content"],
                timestamp=datetime.fromtimestamp(output["timestamp"]),
                turn_id=output.get("turn_id", turn_id)
            )
            for output in result.get("agent_outputs", [])
        ],
        "total_time_ms": result.get("total_time_ms", 0),
        "type": result.get("type", "collaboration")
    }


@router.post("/meta-question")
async def ask_meta_question(
    request: MetaQuestionRequest,
    org_id: str = Depends(require_org_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Ask meta-questions about previous collaboration turns.
    
    Examples:
    - "What did the Researcher find in my last query?"
    - "What were the Critic's concerns about the solution?"
    - "Show me what the Analyst concluded about the problem structure"
    """
    await set_rls_context(db, org_id)
    
    # Get API key for OpenAI (used for meta-question processing)
    api_keys = {}
    try:
        openai_key = await get_api_key_for_org(db, org_id, ProviderType.OPENAI)
        if openai_key:
            api_keys[ProviderType.OPENAI.value] = openai_key
    except Exception:
        pass
    
    if not api_keys:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OpenAI API key required for meta-question processing"
        )
    
    # Generate unique turn ID for this meta-question
    import uuid
    turn_id = str(uuid.uuid4())
    
    # Handle meta-question
    result = await main_assistant.handle_message(
        user_message=request.question,
        turn_id=turn_id,
        api_keys=api_keys,
        collaboration_mode=False,  # Meta-questions don't need full collaboration
        chat_history=[]  # Meta-questions use stored context instead
    )
    
    return {
        "answer": result["content"],
        "turn_id": turn_id,
        "type": result.get("type", "meta_response"),
        "referenced_outputs": result.get("referenced_outputs", 0)
    }


@router.get("/threads/{thread_id}/agent-outputs")
async def get_agent_outputs(
    thread_id: str,
    org_id: str = Depends(require_org_id),
    db: AsyncSession = Depends(get_db),
    role: Optional[str] = None,
    limit: int = 20
):
    """Get agent outputs for a specific thread, optionally filtered by role"""
    await set_rls_context(db, org_id)
    
    storage_service = ConversationStorageService(db)
    
    if role:
        try:
            agent_role = AgentRole(role)
            outputs = storage_service.search_agent_outputs(
                agent_role=agent_role,
                limit=limit
            )
            # Filter by thread_id
            outputs = [o for o in outputs if o.turn.thread_id == thread_id]
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid agent role: {role}"
            )
    else:
        outputs = storage_service.get_recent_outputs_for_thread(thread_id, limit)
    
    return [
        AgentOutputResponse(
            role=output.agent_role,
            provider=output.provider,
            content=output.content,
            timestamp=output.timestamp,
            turn_id=output.turn_id
        )
        for output in outputs
    ]


@router.get("/turns/{turn_id}")
async def get_collaboration_turn(
    turn_id: str,
    org_id: str = Depends(require_org_id),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific collaboration turn with all agent outputs"""
    await set_rls_context(db, org_id)
    
    storage_service = ConversationStorageService(db)
    
    turn = storage_service.get_turn_by_id(turn_id)
    if not turn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collaboration turn {turn_id} not found"
        )
    
    agent_outputs = storage_service.get_all_outputs_for_turn(turn_id)
    
    return {
        "turn_id": turn.turn_id,
        "thread_id": turn.thread_id,
        "user_query": turn.user_query,
        "final_report": turn.final_report,
        "collaboration_mode": turn.collaboration_mode,
        "total_time_ms": turn.total_time_ms,
        "created_at": turn.created_at,
        "agent_outputs": [
            AgentOutputResponse(
                role=output.agent_role,
                provider=output.provider,
                content=output.content,
                timestamp=output.timestamp,
                turn_id=output.turn_id
            )
            for output in agent_outputs
        ]
    }


@router.get("/threads/{thread_id}/stats")
async def get_collaboration_stats(
    thread_id: str,
    org_id: str = Depends(require_org_id),
    db: AsyncSession = Depends(get_db)
):
    """Get collaboration statistics for a specific thread"""
    await set_rls_context(db, org_id)
    
    storage_service = ConversationStorageService(db)
    stats = storage_service.get_collaboration_stats(thread_id)
    
    return CollaborationStatsResponse(**stats)


@router.get("/stats")
async def get_global_collaboration_stats(
    org_id: str = Depends(require_org_id),
    db: AsyncSession = Depends(get_db)
):
    """Get global collaboration statistics across all threads"""
    await set_rls_context(db, org_id)
    
    storage_service = ConversationStorageService(db)
    stats = storage_service.get_collaboration_stats()
    
    return CollaborationStatsResponse(**stats)


@router.post("/follow-up")
async def ask_follow_up_question(
    request: CollaborationRequest,
    org_id: str = Depends(require_org_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Ask follow-up questions that reference previous collaboration output.
    
    Examples:
    - "In the solution architecture, can you expand the roadmap?"
    - "Explain more details about the security considerations"
    - "Dive deeper into the performance optimization section"
    """
    await set_rls_context(db, org_id)
    
    if not request.thread_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="thread_id is required for follow-up questions"
        )
    
    # Get API key for OpenAI (used for follow-up processing)
    api_keys = {}
    try:
        openai_key = await get_api_key_for_org(db, org_id, ProviderType.OPENAI)
        if openai_key:
            api_keys[ProviderType.OPENAI.value] = openai_key
    except Exception:
        pass
    
    if not api_keys:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OpenAI API key required for follow-up question processing"
        )
    
    # Generate unique turn ID
    import uuid
    turn_id = str(uuid.uuid4())
    
    # Handle follow-up question
    result = await main_assistant.handle_message(
        user_message=request.message,
        turn_id=turn_id,
        api_keys=api_keys,
        collaboration_mode=False,  # Follow-ups use previous context
        chat_history=[]  # Follow-ups use stored context instead
    )
    
    return {
        "answer": result["content"],
        "turn_id": turn_id,
        "type": result.get("type", "followup_response"),
        "referenced_report": result.get("referenced_report")
    }