"""
Main DAC Assistant - Next-Gen Version

Handles user messages across turns with access to:
- Next-generation intelligent collaboration orchestration
- Memory lattice with cross-model shared intelligence
- Truth arbitration and conflict resolution
- Dynamic task orchestration and workflow building

Supports both legacy sequential mode and advanced AI orchestration modes.
"""

from typing import Dict, Any, List, Optional
import time

from app.services.nextgen_collaboration_engine import (
    nextgen_collaboration_engine, 
    CollaborationMode,
    NextGenCollaborationResult
)
# Keep legacy engine for compatibility
from app.services.collaboration_engine import (
    CollaborationEngine, 
    ConversationMemory, 
    AgentRole, 
    AgentOutput,
    conversation_memory
)
from app.services.syntra_persona import SYNTRA_SYSTEM_PROMPT
from app.models.provider_key import ProviderType


class MainAssistant:
    """Main DAC voice with access to collaboration context"""
    
    def __init__(self):
        # Next-gen collaboration engine (primary)
        self.nextgen_engine = nextgen_collaboration_engine
        # Legacy engine (fallback compatibility)
        self.collaboration_engine = CollaborationEngine()
        self.conversation_memory = conversation_memory
        self.system_prompt = self._get_main_system_prompt()
    
    def _get_main_system_prompt(self) -> str:
        return """You are **DAC**, a multi-model assistant with access to:
- Regular chat history (user and assistant messages), and
- Internal collaboration logs from previous turns:
  - Analyst (Gemini) outputs
  - Researcher (Perplexity) outputs
  - Creator (GPT) outputs
  - Critic (GPT) outputs
  - Synthesizer (final report) outputs

These internal logs are provided as messages with roles like:
- `agent_analyst`
- `agent_researcher`
- `agent_creator`
- `agent_critic`
- `agent_synth`

Treat them as **extra context**, not as things you need to re-generate.

### Your responsibilities

1. **Normal answers**
   - When the user asks a question (whether Collaborative Mode is currently ON or OFF), answer as a normal assistant.
   - Always prefer the most recent Synthesizer output when it exists for that user query.

2. **Meta-questions about the collaboration**
   - The user may ask things like:
     - "What did the Researcher find for my last query?"
     - "What were the Critic's concerns again?"
     - "Compare what Analyst and Critic thought."
     - "Regenerate the final answer but address the Critic's objections."
   - In those cases:
     - Read the relevant `agent_*` messages from the last run (or the run they mention).
     - Quote or summarize them in user-friendly form.
     - You may explicitly refer to roles: "The Researcher found…", "The Critic pointed out…".

3. **Collab ON vs OFF**
   - If Collaborative Mode is OFF for the current query, you STILL have access to historical `agent_*` messages from earlier collab runs.
   - The user can continue to ask questions about those past runs even in non-collab mode. Always use that stored context when relevant.

4. **Referencing sections of the final report**
   - If the user refers to a particular part of the final answer (e.g., "In the solution architecture, can you expand the roadmap?"), locate the relevant part of the Synthesizer's previous output and build on it rather than starting from scratch.
   - Preserve the structure and style of the existing final report when extending or editing it.

5. **Never expose raw scratchpad**
   - You can explain what each agent concluded, but do not dump low-level chain-of-thought or internal prompts.
   - Summaries and selective quotes are fine; avoid long verbatim internal logs unless the user explicitly asks for them.

6. **Quality expectation**
   - Follow-up answers must maintain or exceed the quality of the original final report.
   - When editing or refining, keep the document cohesive; don't produce contradictory sections.

In short:  
You are DAC's main voice.  
You always have the previous multi-agent thinking available, and you can reference it, compare it, and build on it, regardless of whether Collaborative Mode is on or off for the current turn."""

    async def handle_message(
        self,
        user_message: str,
        turn_id: str,
        api_keys: Dict[str, str],
        collaboration_mode: bool = False,
        chat_history: List[Dict[str, str]] = None,
        nextgen_mode: str = "auto"  # "auto", "intelligent_swarm", "task_workflow", "parallel", "legacy"
    ) -> Dict[str, Any]:
        """
        Handle a user message with next-gen collaboration intelligence.
        
        Args:
            nextgen_mode: Controls collaboration strategy
                - "auto": Intelligent mode selection based on query complexity
                - "intelligent_swarm": Full adaptive model swarming with truth arbitration
                - "task_workflow": DAG-based task orchestration  
                - "parallel": Simple parallel model execution
                - "legacy": Original sequential 5-agent pipeline
        
        Args:
            user_message: The user's message
            turn_id: Unique identifier for this turn
            api_keys: Available API keys
            collaboration_mode: Whether to run full collaboration pipeline
            chat_history: Previous chat messages
            
        Returns:
            Response dict with content and metadata
        """
        start_time = time.perf_counter()
        
        # Check if this is a meta-question about collaboration
        if self._is_meta_question(user_message):
            return await self._handle_meta_question(
                user_message, 
                turn_id, 
                api_keys,
                chat_history or []
            )
        
        # Check if this references a specific part of previous output
        if self._references_previous_output(user_message):
            return await self._handle_followup_question(
                user_message,
                turn_id,
                api_keys, 
                chat_history or []
            )
        
        # New query - run collaboration if enabled
        if collaboration_mode:
            # Determine collaboration mode
            if nextgen_mode == "legacy":
                # Use legacy sequential engine
                result = await self.collaboration_engine.collaborate(
                    user_query=user_message,
                    turn_id=turn_id,
                    api_keys=api_keys,
                    collaboration_mode=True
                )
                
                # Store agent outputs for future reference
                self.conversation_memory.store_collaboration(
                    turn_id, 
                    result.agent_outputs
                )
                
                return {
                    "content": result.final_report,
                    "type": "collaboration",
                    "agent_outputs": [
                        {
                            "role": output.role.value,
                            "provider": output.provider,
                            "content": output.content,
                            "timestamp": output.timestamp,
                            "turn_id": output.turn_id
                        }
                        for output in result.agent_outputs
                    ],
                    "total_time_ms": result.total_time_ms,
                    "mode": "legacy_sequential"
                }
            
            else:
                # Use next-gen collaboration engine
                collab_mode_map = {
                    "auto": CollaborationMode.INTELLIGENT_SWARM,
                    "intelligent_swarm": CollaborationMode.INTELLIGENT_SWARM,
                    "task_workflow": CollaborationMode.TASK_WORKFLOW,
                    "parallel": CollaborationMode.PARALLEL_MODELS
                }
                
                selected_mode = collab_mode_map.get(nextgen_mode, CollaborationMode.INTELLIGENT_SWARM)
                
                # Build context from chat history
                context = self._build_context_from_history(chat_history or [])
                
                result = await self.nextgen_engine.collaborate(
                    user_query=user_message,
                    turn_id=turn_id, 
                    api_keys=api_keys,
                    collaboration_mode=selected_mode,
                    context=context
                )
                
                return {
                    "content": result.final_output,
                    "type": "nextgen_collaboration",
                    "collaboration_mode": result.collaboration_mode.value,
                    "intent_analysis": {
                        "needs": dict(result.intent_analysis.needs) if result.intent_analysis else {},
                        "complexity": result.intent_analysis.complexity if result.intent_analysis else 0.0,
                        "urgency": result.intent_analysis.urgency if result.intent_analysis else 0.0
                    },
                    "model_executions": result.model_executions or [],
                    "active_contradictions": result.active_contradictions or [],
                    "convergence_score": result.convergence_score,
                    "insights_generated": result.insights_generated,
                    "conflicts_resolved": result.conflicts_resolved,
                    "total_time_ms": result.total_time_ms,
                    "performance_metrics": {
                        "parallelization_efficiency": result.parallelization_efficiency,
                        "model_utilization": result.model_utilization or {}
                    }
                }
        
        else:
            # Direct mode - single model response with context awareness
            return await self._handle_direct_mode(
                user_message,
                turn_id, 
                api_keys,
                chat_history or []
            )
    
    def _build_context_from_history(self, chat_history: List[Dict[str, str]]) -> str:
        """Build context string from chat history for next-gen collaboration"""
        if not chat_history:
            return ""
        
        context_parts = ["**Recent Chat History:**"]
        
        # Take last 5 exchanges to avoid token overflow
        recent_history = chat_history[-10:] if len(chat_history) > 10 else chat_history
        
        for message in recent_history:
            role = message.get("role", "unknown")
            content = message.get("content", "")
            
            if role == "user":
                context_parts.append(f"User: {content[:200]}...")
            elif role == "assistant":
                context_parts.append(f"Assistant: {content[:200]}...")
        
        return "\n".join(context_parts)
    
    def _is_meta_question(self, message: str) -> bool:
        """Check if message is asking about the collaboration process"""
        meta_keywords = [
            "what did the researcher find",
            "what were the critic's concerns", 
            "what did the analyst",
            "what did the creator",
            "what did the synthesizer",
            "show me the critic",
            "show me the researcher",
            "compare what analyst and critic",
            "what did perplexity find",
            "what did gemini think",
            "what were the flaws"
        ]
        
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in meta_keywords)
    
    def _references_previous_output(self, message: str) -> bool:
        """Check if message references a specific part of previous output"""
        reference_patterns = [
            "in the solution architecture",
            "in the implementation details", 
            "in the roadmap",
            "in the security section",
            "expand on",
            "more details about",
            "explain further",
            "dive deeper into"
        ]
        
        message_lower = message.lower()
        return any(pattern in message_lower for pattern in reference_patterns)
    
    async def _handle_meta_question(
        self,
        message: str,
        turn_id: str,
        api_keys: Dict[str, str],
        chat_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Handle questions about the collaboration process"""
        
        # Get recent agent outputs
        recent_outputs = self.conversation_memory.get_recent_outputs(limit=10)
        
        if not recent_outputs:
            return {
                "content": "I don't have any collaboration history to reference. Try running a query with Collaborative Mode enabled first.",
                "type": "meta_response",
                "turn_id": turn_id
            }
        
        # Build context with agent outputs
        context_parts = ["Recent collaboration outputs:\n"]
        
        for output in recent_outputs[-5:]:  # Last 5 outputs
            context_parts.append(f"\n{output.role.value.upper()} ({output.provider}):")
            context_parts.append(output.content[:500] + "..." if len(output.content) > 500 else output.content)
        
        context = "\n".join(context_parts)
        
        # Use OpenAI to answer the meta-question
        from app.adapters.openai_adapter import call_openai
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"{context}\n\nUser question: {message}"}
        ]
        
        api_key = api_keys.get(ProviderType.OPENAI.value)
        if not api_key:
            return {
                "content": "No OpenAI API key available for meta-question processing.",
                "type": "error",
                "turn_id": turn_id
            }
        
        response = await call_openai(
            messages=messages,
            model="gpt-4o",
            api_key=api_key,
            temperature=0.3
        )
        
        return {
            "content": response.content,
            "type": "meta_response", 
            "turn_id": turn_id,
            "referenced_outputs": len(recent_outputs)
        }
    
    async def _handle_followup_question(
        self,
        message: str,
        turn_id: str,
        api_keys: Dict[str, str],
        chat_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Handle follow-up questions that reference previous output"""
        
        # Get most recent synthesizer output (final report)
        recent_outputs = self.conversation_memory.get_recent_outputs(limit=5)
        synthesizer_output = None
        
        for output in recent_outputs:
            if output.role == AgentRole.SYNTHESIZER:
                synthesizer_output = output
                break
        
        if not synthesizer_output:
            return {
                "content": "I don't have a recent final report to reference. Please run a new collaboration or ask a new question.",
                "type": "followup_response",
                "turn_id": turn_id
            }
        
        # Build context with the final report and follow-up question
        context = f"""Previous final report:
{synthesizer_output.content}

User follow-up question: {message}

Please provide a detailed response that builds on the existing final report. Maintain the same quality and structure while addressing the specific follow-up question."""
        
        # Use OpenAI to handle the follow-up
        from app.adapters.openai_adapter import call_openai
        
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": context}
        ]
        
        api_key = api_keys.get(ProviderType.OPENAI.value)
        if not api_key:
            return {
                "content": "No OpenAI API key available for follow-up processing.",
                "type": "error",
                "turn_id": turn_id
            }
        
        response = await call_openai(
            messages=messages,
            model="gpt-4o",
            api_key=api_key,
            temperature=0.3
        )
        
        return {
            "content": response.content,
            "type": "followup_response",
            "turn_id": turn_id,
            "referenced_report": synthesizer_output.turn_id
        }
    
    async def _handle_direct_mode(
        self,
        message: str,
        turn_id: str,
        api_keys: Dict[str, str],
        chat_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Handle direct mode (no collaboration) with context awareness"""
        
        # Use existing routing logic for direct responses
        from app.services.route_and_call import route_and_call
        
        # Create a temporary thread_id for routing
        import uuid
        temp_thread_id = str(uuid.uuid4())
        
        # Mock database session (you may need to adjust this)
        db = None
        
        routing_result = await route_and_call(
            thread_id=temp_thread_id,
            user_text=message,
            org_id="dac_org",
            api_key_map=api_keys,
            db=db
        )
        
        # Extract content from streaming result if needed
        if "stream" in routing_result["result"]:
            content_chunks = []
            async for chunk in routing_result["result"]["stream"]:
                content_chunks.append(chunk)
            content = "".join(content_chunks)
        else:
            content = routing_result["result"].get("text", "No response generated")
        
        return {
            "content": content,
            "type": "direct_response",
            "turn_id": turn_id,
            "intent": routing_result["intent"],
            "provider": routing_result["result"].get("provider"),
            "model": routing_result["result"].get("model")
        }


# Global assistant instance
main_assistant = MainAssistant()