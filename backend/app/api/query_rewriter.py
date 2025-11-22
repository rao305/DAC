"""Query Rewriter API endpoint."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.query_rewriter import rewrite_query

router = APIRouter(prefix="/api/query-rewriter", tags=["query-rewriter"])


class Topic(BaseModel):
    """Named entity topic."""
    name: str
    type: Optional[str] = None
    lastSeen: Optional[str] = None  # ISO timestamp or Unix timestamp


class Turn(BaseModel):
    """Conversation turn."""
    role: str  # "user" or "assistant"
    content: str


class RewriteRequest(BaseModel):
    """Request to rewrite a query."""
    user_message: str
    recent_turns: List[Turn]
    topics: List[Topic]


class Referent(BaseModel):
    """Pronoun resolution."""
    pronoun: str
    resolved_to: str


class Disambiguation(BaseModel):
    """Disambiguation question."""
    question: str
    options: List[str]
    pronoun: Optional[str] = None


class RewriteResponse(BaseModel):
    """Response from query rewriter."""
    rewritten: str
    AMBIGUOUS: bool
    referents: List[Referent]
    disambiguation: Optional[Disambiguation] = None


@router.post("/rewrite", response_model=RewriteResponse)
async def rewrite(
    request: RewriteRequest
) -> RewriteResponse:
    """
    Rewrite a user query to be self-contained by resolving pronouns.
    
    Example:
    ```json
    {
      "user_message": "what is the computer science ranking at that university?",
      "recent_turns": [
        {"role": "user", "content": "Tell me about Purdue University"},
        {"role": "assistant", "content": "Purdue University is a public research university..."}
      ],
      "topics": [
        {"name": "Purdue University", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"}
      ]
    }
    ```
    
    Returns:
    ```json
    {
      "rewritten": "What is Purdue University's current Computer Science ranking?",
      "AMBIGUOUS": false,
      "referents": [
        {"pronoun": "that university", "resolved_to": "Purdue University"}
      ]
    }
    ```
    """
    try:
        # Convert Pydantic models to dicts for service
        recent_turns_dict = [
            {"role": turn.role, "content": turn.content}
            for turn in request.recent_turns
        ]
        
        topics_dict = [
            {
                "name": topic.name,
                "type": topic.type,
                "lastSeen": topic.lastSeen
            }
            for topic in request.topics
        ]
        
        # Call rewriter service
        result = rewrite_query(
            user_message=request.user_message,
            recent_turns=recent_turns_dict,
            topics=topics_dict
        )
        
        # Convert referents to Pydantic models
        referents = [
            Referent(pronoun=r["pronoun"], resolved_to=r["resolved_to"])
            for r in result.get("referents", [])
        ]
        
        # Convert disambiguation if present
        disambiguation = None
        if result.get("disambiguation"):
            disamb_data = result["disambiguation"]
            disambiguation = Disambiguation(
                question=disamb_data.get("question", "Which did you mean?"),
                options=disamb_data.get("options", []),
                pronoun=disamb_data.get("pronoun")
            )
        
        return RewriteResponse(
            rewritten=result.get("rewritten", request.user_message),
            AMBIGUOUS=result.get("AMBIGUOUS", False),
            referents=referents,
            disambiguation=disambiguation
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Query rewriting failed: {str(e)}"
        )

