"""
Collaboration models using the new schema.

These models work with the enhanced schema that supports:
- Proper conversation threading
- Multi-agent collaboration runs
- Agent step tracking  
- Enhanced message storage
"""

from sqlalchemy import Column, String, Text, Integer, Boolean, ForeignKey, DateTime, JSON, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ENUM
from datetime import datetime
import enum
import uuid

Base = declarative_base()

# Enums matching the database enums
class MessageRole(enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    AGENT_ANALYST = "agent_analyst"
    AGENT_RESEARCHER = "agent_researcher"
    AGENT_CREATOR = "agent_creator"
    AGENT_CRITIC = "agent_critic"
    AGENT_SYNTH = "agent_synth"

class MessageContentType(enum.Enum):
    MARKDOWN = "markdown"
    JSON = "json"
    TOOL_RESULT = "tool_result"

class CollabMode(enum.Enum):
    AUTO = "auto"
    MANUAL = "manual"

class CollabStatus(enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    AWAITING_USER = "awaiting_user"
    DONE = "done"
    ERROR = "error"
    CANCELLED = "cancelled"

class CollabRole(enum.Enum):
    ANALYST = "analyst"
    RESEARCHER = "researcher"
    CREATOR = "creator"
    CRITIC = "critic"
    SYNTHESIZER = "synthesizer"


class Conversation(Base):
    """
    Main conversation thread for multi-agent collaboration.
    Replaces the concept of threads but focused on collaborative workflows.
    """
    __tablename__ = 'conversations'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True)  # Optional for anonymous users
    org_id = Column(String(255), nullable=False)  # Match existing org pattern
    title = Column(Text)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    collab_runs = relationship("CollabRun", back_populates="conversation", cascade="all, delete-orphan")
    messages = relationship("CollabMessage", back_populates="conversation", cascade="all, delete-orphan")


class CollabRun(Base):
    """
    Individual collaboration run within a conversation.
    Tracks one complete cycle through the 5-agent pipeline.
    """
    __tablename__ = 'collab_runs'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False)
    
    # The user message that triggered this run
    user_message_id = Column(UUID(as_uuid=True), ForeignKey('collab_messages.id', ondelete='CASCADE'), nullable=False)
    
    mode = Column(ENUM(CollabMode, name='collab_mode'), nullable=False, default=CollabMode.AUTO)
    status = Column(ENUM(CollabStatus, name='collab_status'), nullable=False, default=CollabStatus.RUNNING)
    
    started_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime(timezone=True))
    total_time_ms = Column(Integer)
    error = Column(JSON)  # { message, provider, step_id, type }
    run_metadata = Column(JSON)  # cost, tokens, etc.
    
    # Relationships
    conversation = relationship("Conversation", back_populates="collab_runs")
    user_message = relationship("CollabMessage", foreign_keys=[user_message_id])
    steps = relationship("CollabStep", back_populates="collab_run", cascade="all, delete-orphan")
    messages = relationship("CollabMessage", back_populates="collab_run", foreign_keys="CollabMessage.collab_run_id")


class CollabStep(Base):
    """
    Individual agent step within a collaboration run.
    Tracks each of the 5 agents: analyst, researcher, creator, critic, synthesizer.
    """
    __tablename__ = 'collab_steps'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    collab_run_id = Column(UUID(as_uuid=True), ForeignKey('collab_runs.id', ondelete='CASCADE'), nullable=False)
    
    step_index = Column(Integer, nullable=False)  # 1..5
    role = Column(ENUM(CollabRole, name='collab_role'), nullable=False)
    provider = Column(Text, nullable=False)  # 'openai' | 'gemini' | 'perplexity' | 'kimi'
    model = Column(Text)  # 'gpt-4o', 'gemini-2.0-flash-exp', etc.
    mode = Column(ENUM(CollabMode, name='collab_mode'), nullable=False, default=CollabMode.AUTO)
    
    status = Column(ENUM(CollabStatus, name='collab_status'), nullable=False, default=CollabStatus.PENDING)
    is_mock = Column(Boolean, nullable=False, default=False)
    
    input_context = Column(Text)  # compressed prompt/context used
    output_draft = Column(Text)  # raw model output
    output_final = Column(Text)  # after any processing/edits
    error = Column(JSON)  # { message, type, provider }
    
    execution_order = Column(Integer)  # order of actual execution
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    
    # Relationships
    collab_run = relationship("CollabRun", back_populates="steps")
    message = relationship("CollabMessage", back_populates="collab_step", uselist=False)


class CollabMessage(Base):
    """
    Enhanced messages table for everything you render (and agent logs).
    Stores user messages, assistant responses, and individual agent outputs.
    """
    __tablename__ = 'collab_messages'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False)
    
    role = Column(ENUM(MessageRole, name='message_role'), nullable=False)
    author_model = Column(Text)  # 'gpt-4o', 'gemini-2.0-flash-exp'
    provider = Column(Text)  # 'openai' | 'gemini' | 'perplexity' | 'kimi' | 'dac'
    
    collab_run_id = Column(UUID(as_uuid=True), ForeignKey('collab_runs.id', ondelete='SET NULL'))
    collab_step_id = Column(UUID(as_uuid=True), ForeignKey('collab_steps.id', ondelete='SET NULL'))
    
    content_type = Column(ENUM(MessageContentType, name='message_content_type'), nullable=False, default=MessageContentType.MARKDOWN)
    content_text = Column(Text)  # for markdown / plain text
    content_json = Column(JSON)  # for structured/tool outputs if needed
    
    parent_message_id = Column(UUID(as_uuid=True), ForeignKey('collab_messages.id', ondelete='SET NULL'))
    
    # Token usage tracking
    prompt_tokens = Column(Integer)
    completion_tokens = Column(Integer)
    total_tokens = Column(Integer)
    
    # Citations and metadata
    citations = Column(JSON)  # URLs/sources from research steps
    msg_metadata = Column(JSON)  # { isMock, latencyMs, tokens, collabRole, collabStepIndex, ... }
    
    sequence = Column(Integer)  # display order within conversation
    
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    collab_run = relationship("CollabRun", back_populates="messages", foreign_keys=[collab_run_id])
    collab_step = relationship("CollabStep", back_populates="message")
    parent_message = relationship("CollabMessage", remote_side=[id])
    child_messages = relationship("CollabMessage", back_populates="parent_message")
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': str(self.id),
            'role': self.role.value,
            'content': self.content_text,
            'provider': self.provider,
            'model': self.author_model,
            'sequence': self.sequence,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'citations': self.citations,
            'metadata': self.msg_metadata
        }


# Helper classes for API responses
class CollabRunSummary:
    """Summary view of a collaboration run"""
    
    def __init__(self, run: CollabRun):
        self.id = str(run.id)
        self.conversation_id = str(run.conversation_id)
        self.status = run.status.value
        self.mode = run.mode.value
        self.started_at = run.started_at.isoformat() if run.started_at else None
        self.completed_at = run.completed_at.isoformat() if run.completed_at else None
        self.total_time_ms = run.total_time_ms
        self.total_steps = len(run.steps)
        self.completed_steps = len([s for s in run.steps if s.status == CollabStatus.DONE])
        self.user_query = run.user_message.content_text if run.user_message else None
        
        # Find final assistant response
        final_response = None
        for msg in run.messages:
            if msg.role == MessageRole.ASSISTANT:
                final_response = msg.content_text
                break
        self.final_response = final_response


class AgentOutputSummary:
    """Summary of an agent's output"""
    
    def __init__(self, message: CollabMessage):
        self.id = str(message.id)
        self.role = message.role.value
        self.provider = message.provider
        self.model = message.author_model
        self.content = message.content_text
        self.created_at = message.created_at.isoformat() if message.created_at else None
        self.collab_run_id = str(message.collab_run_id) if message.collab_run_id else None
        self.step_index = message.collab_step.step_index if message.collab_step else None