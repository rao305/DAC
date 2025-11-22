"""
Enhanced Collaboration Service

Uses the new schema for robust multi-agent collaboration with proper:
- Conversation threading
- Run tracking
- Step execution
- Message storage
- Follow-up context
"""

from typing import Dict, Any, List, Optional, Tuple
import time
import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from app.models.collaboration import (
    Conversation, CollabRun, CollabStep, CollabMessage,
    MessageRole, CollabMode, CollabStatus, CollabRole, MessageContentType
)
from app.services.collaboration_engine import CollaborationEngine, AgentRole
from app.models.provider_key import ProviderType


class CollaborationService:
    """Enhanced collaboration service using the new schema"""
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.engine = CollaborationEngine()
    
    async def create_conversation(
        self,
        org_id: str,
        user_id: Optional[str] = None,
        title: Optional[str] = None,
        description: Optional[str] = None
    ) -> Conversation:
        """Create a new conversation"""
        conversation = Conversation(
            org_id=org_id,
            user_id=user_id,
            title=title,
            description=description
        )
        
        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)
        
        return conversation
    
    async def start_collaboration(
        self,
        conversation_id: str,
        user_message: str,
        api_keys: Dict[str, str],
        mode: CollabMode = CollabMode.AUTO
    ) -> CollabRun:
        """
        Start a new collaboration run.
        
        Args:
            conversation_id: Target conversation
            user_message: User's message to collaborate on
            api_keys: Available API keys for providers
            mode: Collaboration mode (auto/manual)
            
        Returns:
            CollabRun object with tracking info
        """
        # Get conversation
        conversation = await self.get_conversation(conversation_id)
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")
        
        # Create user message
        sequence = await self._get_next_sequence(conversation_id)
        user_msg = CollabMessage(
            conversation_id=conversation.id,
            role=MessageRole.USER,
            content_text=user_message,
            sequence=sequence,
            content_type=MessageContentType.MARKDOWN
        )
        
        self.db.add(user_msg)
        await self.db.flush()
        
        # Create collaboration run
        collab_run = CollabRun(
            conversation_id=conversation.id,
            user_message_id=user_msg.id,
            mode=mode,
            status=CollabStatus.RUNNING
        )
        
        self.db.add(collab_run)
        await self.db.flush()
        
        # Create steps for each agent
        agent_configs = [
            (1, CollabRole.ANALYST, ProviderType.GEMINI, "gemini-2.0-flash-exp"),
            (2, CollabRole.RESEARCHER, ProviderType.PERPLEXITY, "sonar-pro"),
            (3, CollabRole.CREATOR, ProviderType.OPENAI, "gpt-4o"),
            (4, CollabRole.CRITIC, ProviderType.OPENAI, "gpt-4o"),
            (5, CollabRole.SYNTHESIZER, ProviderType.OPENAI, "gpt-4o")
        ]
        
        for step_index, role, provider, model in agent_configs:
            step = CollabStep(
                collab_run_id=collab_run.id,
                step_index=step_index,
                role=role,
                provider=provider.value,
                model=model,
                mode=mode,
                status=CollabStatus.PENDING
            )
            self.db.add(step)
        
        await self.db.commit()
        
        # Execute the collaboration
        try:
            await self._execute_collaboration_run(collab_run, api_keys)
        except Exception as e:
            # Mark run as failed
            collab_run.status = CollabStatus.ERROR
            collab_run.error = {"message": str(e), "type": "execution_error"}
            collab_run.completed_at = datetime.utcnow()
            await self.db.commit()
            raise
        
        return collab_run
    
    async def _execute_collaboration_run(
        self,
        collab_run: CollabRun,
        api_keys: Dict[str, str]
    ):
        """Execute all steps in a collaboration run"""
        start_time = time.perf_counter()
        
        # Get steps in order
        steps_result = await self.db.execute(
            select(CollabStep)
            .where(CollabStep.collab_run_id == collab_run.id)
            .order_by(CollabStep.step_index)
        )
        steps = list(steps_result.scalars().all())
        
        # Build context progressively
        context_parts = []
        
        for i, step in enumerate(steps):
            step.status = CollabStatus.RUNNING
            step.started_at = datetime.utcnow()
            step.execution_order = i + 1
            
            # Build context for this step
            if i == 0:
                # First step: just user query
                step.input_context = f"User Query: {collab_run.user_message.content_text}"
                context = step.input_context
            else:
                # Include previous outputs
                context = f"User Query: {collab_run.user_message.content_text}\n\n"
                context += "\n\n".join(context_parts)
                step.input_context = context[:2000]  # Truncate for storage
            
            try:
                # Execute the agent
                output = await self._execute_agent_step(step, context, api_keys)
                
                step.output_draft = output
                step.output_final = output
                step.status = CollabStatus.DONE
                step.completed_at = datetime.utcnow()
                
                # Add to context for next step
                role_name = step.role.value.upper()
                context_parts.append(f"{role_name} OUTPUT:\n{output}")
                
                # Create message for this agent output
                sequence = await self._get_next_sequence(str(collab_run.conversation_id))
                agent_role = self._collab_role_to_message_role(step.role)
                
                agent_msg = CollabMessage(
                    conversation_id=collab_run.conversation_id,
                    role=agent_role,
                    content_text=output,
                    provider=step.provider,
                    author_model=step.model,
                    collab_run_id=collab_run.id,
                    collab_step_id=step.id,
                    sequence=sequence,
                    content_type=MessageContentType.MARKDOWN
                )
                
                self.db.add(agent_msg)
                
            except Exception as e:
                step.status = CollabStatus.ERROR
                step.error = {"message": str(e), "type": "agent_error"}
                step.completed_at = datetime.utcnow()
                raise
        
        # Create final assistant message (synthesizer output)
        final_step = steps[-1]  # Synthesizer
        final_sequence = await self._get_next_sequence(str(collab_run.conversation_id))
        
        final_msg = CollabMessage(
            conversation_id=collab_run.conversation_id,
            role=MessageRole.ASSISTANT,
            content_text=final_step.output_final,
            provider=final_step.provider,
            author_model=final_step.model,
            collab_run_id=collab_run.id,
            sequence=final_sequence,
            content_type=MessageContentType.MARKDOWN
        )
        
        self.db.add(final_msg)
        
        # Mark run as complete
        total_time = (time.perf_counter() - start_time) * 1000
        collab_run.status = CollabStatus.DONE
        collab_run.completed_at = datetime.utcnow()
        collab_run.total_time_ms = int(total_time)
        
        await self.db.commit()
    
    async def _execute_agent_step(
        self,
        step: CollabStep,
        context: str,
        api_keys: Dict[str, str]
    ) -> str:
        """Execute a single agent step"""
        # Convert CollabRole to AgentRole
        agent_role_map = {
            CollabRole.ANALYST: AgentRole.ANALYST,
            CollabRole.RESEARCHER: AgentRole.RESEARCHER,
            CollabRole.CREATOR: AgentRole.CREATOR,
            CollabRole.CRITIC: AgentRole.CRITIC,
            CollabRole.SYNTHESIZER: AgentRole.SYNTHESIZER
        }
        
        agent_role = agent_role_map[step.role]
        
        # Use the existing collaboration engine
        output = await self.engine._run_agent(
            role=agent_role,
            user_query="",  # Not used in context mode
            turn_id=str(step.collab_run_id),
            api_keys=api_keys,
            context=context
        )
        
        return output.content
    
    async def get_conversation_history(
        self,
        conversation_id: str,
        limit: int = 20,
        include_agent_outputs: bool = False
    ) -> List[CollabMessage]:
        """Get conversation history for context building"""
        query = select(CollabMessage).where(
            CollabMessage.conversation_id == conversation_id
        )
        
        if not include_agent_outputs:
            query = query.where(
                CollabMessage.role.in_([MessageRole.USER, MessageRole.ASSISTANT])
            )
        
        result = await self.db.execute(
            query.order_by(CollabMessage.sequence.desc()).limit(limit)
        )
        
        messages = list(result.scalars().all())
        messages.reverse()  # Return in chronological order
        return messages
    
    async def get_recent_agent_outputs(
        self,
        conversation_id: str,
        role: Optional[MessageRole] = None,
        limit: int = 10
    ) -> List[CollabMessage]:
        """Get recent agent outputs for meta-questions"""
        agent_roles = [
            MessageRole.AGENT_ANALYST,
            MessageRole.AGENT_RESEARCHER,
            MessageRole.AGENT_CREATOR,
            MessageRole.AGENT_CRITIC,
            MessageRole.AGENT_SYNTH
        ]
        
        query = select(CollabMessage).where(
            CollabMessage.conversation_id == conversation_id,
            CollabMessage.role.in_(agent_roles if not role else [role])
        )
        
        result = await self.db.execute(
            query.order_by(CollabMessage.created_at.desc()).limit(limit)
        )
        
        return list(result.scalars().all())
    
    async def get_latest_final_report(
        self,
        conversation_id: str
    ) -> Optional[CollabMessage]:
        """Get the most recent final report (assistant message)"""
        result = await self.db.execute(
            select(CollabMessage)
            .where(
                CollabMessage.conversation_id == conversation_id,
                CollabMessage.role == MessageRole.ASSISTANT
            )
            .order_by(CollabMessage.created_at.desc())
            .limit(1)
        )
        
        return result.scalar_one_or_none()
    
    async def get_collaboration_run(
        self,
        run_id: str,
        include_steps: bool = True,
        include_messages: bool = True
    ) -> Optional[CollabRun]:
        """Get a collaboration run with related data"""
        options = []
        if include_steps:
            options.append(selectinload(CollabRun.steps))
        if include_messages:
            options.append(selectinload(CollabRun.messages))
        
        result = await self.db.execute(
            select(CollabRun)
            .options(*options)
            .where(CollabRun.id == run_id)
        )
        
        return result.scalar_one_or_none()
    
    async def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        """Get conversation by ID"""
        result = await self.db.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        
        return result.scalar_one_or_none()
    
    async def search_conversations(
        self,
        org_id: str,
        user_id: Optional[str] = None,
        limit: int = 50
    ) -> List[Conversation]:
        """Search conversations for an org/user"""
        query = select(Conversation).where(Conversation.org_id == org_id)
        
        if user_id:
            query = query.where(Conversation.user_id == user_id)
        
        result = await self.db.execute(
            query.order_by(Conversation.updated_at.desc()).limit(limit)
        )
        
        return list(result.scalars().all())
    
    async def _get_next_sequence(self, conversation_id: str) -> int:
        """Get next sequence number for a conversation"""
        result = await self.db.execute(
            select(func.max(CollabMessage.sequence))
            .where(CollabMessage.conversation_id == conversation_id)
        )
        
        max_sequence = result.scalar()
        return (max_sequence or 0) + 1
    
    def _collab_role_to_message_role(self, collab_role: CollabRole) -> MessageRole:
        """Convert CollabRole to MessageRole"""
        role_map = {
            CollabRole.ANALYST: MessageRole.AGENT_ANALYST,
            CollabRole.RESEARCHER: MessageRole.AGENT_RESEARCHER,
            CollabRole.CREATOR: MessageRole.AGENT_CREATOR,
            CollabRole.CRITIC: MessageRole.AGENT_CRITIC,
            CollabRole.SYNTHESIZER: MessageRole.AGENT_SYNTH
        }
        return role_map[collab_role]


class ContextManager:
    """Helper for building context from conversations"""
    
    def __init__(self, service: CollaborationService):
        self.service = service
    
    async def build_meta_context(
        self,
        conversation_id: str,
        limit: int = 5
    ) -> str:
        """Build context for meta-questions about collaboration"""
        outputs = await self.service.get_recent_agent_outputs(conversation_id, limit=limit)
        
        if not outputs:
            return "No collaboration history found."
        
        context_parts = ["Recent collaboration outputs:\n"]
        
        for output in outputs:
            role_name = output.role.value.replace('agent_', '').upper()
            context_parts.append(f"\n{role_name} ({output.provider}):")
            
            # Truncate long content for context
            content = output.content_text[:500] + "..." if len(output.content_text) > 500 else output.content_text
            context_parts.append(content)
        
        return "\n".join(context_parts)
    
    async def build_followup_context(
        self,
        conversation_id: str,
        user_question: str
    ) -> Optional[str]:
        """Build context for follow-up questions"""
        final_report = await self.service.get_latest_final_report(conversation_id)
        
        if not final_report:
            return None
        
        return f"""Previous final report:
{final_report.content_text}

User follow-up question: {user_question}

Please provide a detailed response that builds on the existing final report. Maintain the same quality and structure while addressing the specific follow-up question."""