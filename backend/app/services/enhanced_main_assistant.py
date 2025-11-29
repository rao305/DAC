"""
Enhanced Main Assistant with Anonymous Collaborative AI

Integrates all collaboration modes:
1. Enhanced Collaborative Thinking (thinking together with shared insights)
2. Anonymous Collaboration (bias-free with quality selection)
3. Next-Gen Intelligent Swarming (adaptive model coordination)
4. Legacy Sequential Collaboration (backward compatibility)
"""

from typing import Dict, Any, List, Optional, Union
import time
import asyncio
from enum import Enum

# Import all collaboration engines
from app.services.anonymous_collaboration_engine import (
    AnonymousCollaborationEngine,
    AnonymousCollaborationResult
)
from app.services.enhanced_collaboration_engine import (
    EnhancedCollaborationEngine,
    EnhancedCollaborationResult
)
from app.services.nextgen_collaboration_engine import (
    NextGenCollaborationEngine,
    CollaborationMode,
    NextGenCollaborationResult
)
from app.services.collaboration_engine import (
    CollaborationEngine,
    CollaborationResult
)


class CollaborationStrategy(Enum):
    """Available collaboration strategies"""
    ANONYMOUS = "anonymous"           # Anonymous collaboration with bias elimination
    ENHANCED_THINKING = "enhanced"    # Enhanced thinking with explicit reasoning
    NEXTGEN_SWARM = "nextgen"        # Next-gen intelligent swarming
    LEGACY_SEQUENTIAL = "legacy"     # Original 5-agent sequential


class EnhancedMainAssistant:
    """Main assistant with access to all collaboration modes"""
    
    def __init__(self):
        # Initialize all collaboration engines
        self.anonymous_engine = AnonymousCollaborationEngine()
        self.enhanced_engine = EnhancedCollaborationEngine()
        self.nextgen_engine = NextGenCollaborationEngine()
        self.legacy_engine = CollaborationEngine()
        
        # Collaboration strategy selection
        self.strategy_selector = CollaborationStrategySelector()
    
    async def handle_message(
        self,
        user_message: str,
        turn_id: str,
        api_keys: Dict[str, str],
        collaboration_mode: bool = True,
        chat_history: List[Dict[str, str]] = None,
        collaboration_strategy: Optional[CollaborationStrategy] = None,
        user_preferences: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Enhanced message handling with intelligent collaboration strategy selection.
        
        Args:
            user_message: User's input message
            turn_id: Unique turn identifier
            api_keys: Provider API keys
            collaboration_mode: Whether to use collaboration
            chat_history: Previous conversation context
            collaboration_strategy: Specific strategy to use (optional)
            user_preferences: User preferences for collaboration
            
        Returns:
            Enhanced collaboration result with strategy information
        """
        start_time = time.perf_counter()
        
        # If not using collaboration, return simple response
        if not collaboration_mode:
            return await self._handle_simple_message(user_message, api_keys)
        
        # Determine collaboration strategy
        if not collaboration_strategy:
            collaboration_strategy = await self.strategy_selector.select_strategy(
                user_message, chat_history, user_preferences
            )
        
        # Route to appropriate collaboration engine
        result = await self._execute_collaboration_strategy(
            strategy=collaboration_strategy,
            user_message=user_message,
            turn_id=turn_id,
            api_keys=api_keys,
            chat_history=chat_history
        )
        
        # Format enhanced result
        return await self._format_enhanced_result(result, collaboration_strategy, start_time)
    
    async def _execute_collaboration_strategy(
        self,
        strategy: CollaborationStrategy,
        user_message: str,
        turn_id: str,
        api_keys: Dict[str, str],
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Union[AnonymousCollaborationResult, EnhancedCollaborationResult, NextGenCollaborationResult, CollaborationResult]:
        """Execute the selected collaboration strategy"""
        
        if strategy == CollaborationStrategy.ANONYMOUS:
            return await self.anonymous_engine.collaborate_anonymously(
                user_query=user_message,
                session_id=turn_id,
                api_keys=api_keys,
                enable_quality_selection=True
            )
        
        elif strategy == CollaborationStrategy.ENHANCED_THINKING:
            return await self.enhanced_engine.collaborate_with_thinking(
                user_query=user_message,
                turn_id=turn_id,
                api_keys=api_keys,
                show_thinking=True
            )
        
        elif strategy == CollaborationStrategy.NEXTGEN_SWARM:
            return await self.nextgen_engine.collaborate(
                query=user_message,
                mode=CollaborationMode.INTELLIGENT_SWARM
            )
        
        elif strategy == CollaborationStrategy.LEGACY_SEQUENTIAL:
            return await self.legacy_engine.collaborate(
                user_query=user_message,
                turn_id=turn_id,
                api_keys=api_keys,
                collaboration_mode=True
            )
        
        else:
            # Default to enhanced thinking
            return await self.enhanced_engine.collaborate_with_thinking(
                user_query=user_message,
                turn_id=turn_id,
                api_keys=api_keys,
                show_thinking=True
            )
    
    async def _format_enhanced_result(
        self,
        result: Any,
        strategy: CollaborationStrategy,
        start_time: float
    ) -> Dict[str, Any]:
        """Format result from any collaboration strategy into unified response"""
        
        total_time_ms = (time.perf_counter() - start_time) * 1000
        
        # Base response format
        response = {
            "type": "enhanced_collaboration",
            "collaboration_strategy": strategy.value,
            "total_time_ms": total_time_ms
        }
        
        # Strategy-specific formatting
        if strategy == CollaborationStrategy.ANONYMOUS:
            response.update({
                "content": result.final_response,
                "selected_expert": result.selected_expert,
                "selection_reasoning": result.selection_reasoning,
                "quality_metrics": {
                    "depth_score": result.quality_metrics.depth_score,
                    "innovation_score": result.quality_metrics.innovation_score,
                    "synthesis_score": result.quality_metrics.synthesis_score,
                    "clarity_score": result.quality_metrics.clarity_score,
                    "overall_quality": result.quality_metrics.overall_quality
                },
                "bias_elimination_report": result.bias_elimination_report,
                "collaboration_timeline": result.collaboration_timeline,
                "anonymous_contributions": [
                    {
                        "expert_id": contrib.expert_id,
                        "role_focus": contrib.role_focus,
                        "main_contribution": contrib.main_contribution,
                        "quality_indicators": contrib.quality_indicators
                    }
                    for contrib in result.anonymous_contributions
                ]
            })
        
        elif strategy == CollaborationStrategy.ENHANCED_THINKING:
            response.update({
                "content": result.final_response,
                "thinking_journey": result.thinking_journey,
                "key_insights": [
                    {
                        "agent_role": insight.agent_role.value if hasattr(insight.agent_role, 'value') else str(insight.agent_role),
                        "insight_type": insight.insight_type,
                        "content": insight.content,
                        "confidence": insight.confidence
                    }
                    for insight in result.key_insights_discovered
                ],
                "collaboration_quality_score": result.collaboration_quality_score,
                "collaborative_outputs": [
                    {
                        "role": output.role.value if hasattr(output.role, 'value') else str(output.role),
                        "thinking_process": output.thinking_process,
                        "main_contribution": output.main_content,
                        "builds_on_agents": output.builds_on_agents
                    }
                    for output in result.collaborative_outputs
                ]
            })
        
        elif strategy == CollaborationStrategy.NEXTGEN_SWARM:
            response.update({
                "content": result.final_output,
                "collaboration_mode": result.collaboration_mode.value,
                "swarm_result": result.swarm_result.__dict__ if result.swarm_result else None,
                "memory_updates": [
                    {
                        "content": update.content,
                        "insight_type": update.insight_type.value if hasattr(update.insight_type, 'value') else str(update.insight_type),
                        "confidence": update.confidence
                    }
                    for update in (result.memory_updates or [])
                ],
                "conflicts_resolved": result.conflicts_resolved
            })
        
        elif strategy == CollaborationStrategy.LEGACY_SEQUENTIAL:
            response.update({
                "content": result.final_report,
                "agent_outputs": [
                    {
                        "role": output.role.value,
                        "provider": output.provider,
                        "content": output.content,
                        "timestamp": output.timestamp
                    }
                    for output in result.agent_outputs
                ]
            })
        
        return response
    
    async def _handle_simple_message(self, user_message: str, api_keys: Dict[str, str]) -> Dict[str, Any]:
        """Handle non-collaborative messages"""
        # Simple direct response (could use any single model)
        return {
            "type": "simple_response",
            "content": f"Simple response to: {user_message}",
            "collaboration_strategy": "none"
        }


class CollaborationStrategySelector:
    """Intelligent selection of collaboration strategy based on context"""
    
    async def select_strategy(
        self,
        user_message: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
        user_preferences: Optional[Dict[str, Any]] = None
    ) -> CollaborationStrategy:
        """
        Intelligently select the best collaboration strategy.
        
        Args:
            user_message: User's current message
            chat_history: Previous conversation
            user_preferences: User's collaboration preferences
            
        Returns:
            Recommended collaboration strategy
        """
        
        # Check user preferences first
        if user_preferences:
            preferred_strategy = user_preferences.get("collaboration_strategy")
            if preferred_strategy:
                try:
                    return CollaborationStrategy(preferred_strategy)
                except ValueError:
                    pass  # Invalid preference, continue with auto-selection
        
        # Analyze message characteristics
        message_analysis = self._analyze_message(user_message)
        
        # Strategy selection logic
        if message_analysis["requires_unbiased_analysis"]:
            return CollaborationStrategy.ANONYMOUS
        
        elif message_analysis["requires_deep_thinking"]:
            return CollaborationStrategy.ENHANCED_THINKING
        
        elif message_analysis["requires_intelligent_swarming"]:
            return CollaborationStrategy.NEXTGEN_SWARM
        
        else:
            # Default to enhanced thinking for complex queries
            if message_analysis["complexity"] > 0.5:
                return CollaborationStrategy.ENHANCED_THINKING
            else:
                return CollaborationStrategy.LEGACY_SEQUENTIAL
    
    def _analyze_message(self, user_message: str) -> Dict[str, Any]:
        """Analyze message to determine collaboration requirements"""
        
        message_lower = user_message.lower()
        
        # Bias elimination indicators
        unbiased_keywords = [
            "analyze", "compare", "evaluate", "recommend", "choose",
            "best option", "which should", "pros and cons", "objective"
        ]
        requires_unbiased = any(keyword in message_lower for keyword in unbiased_keywords)
        
        # Deep thinking indicators
        thinking_keywords = [
            "explain why", "how does", "break down", "step by step",
            "reasoning", "think through", "analyze deeply"
        ]
        requires_thinking = any(keyword in message_lower for keyword in thinking_keywords)
        
        # Intelligent swarming indicators
        swarming_keywords = [
            "complex system", "enterprise", "architecture", "strategy",
            "comprehensive", "multi-faceted", "various perspectives"
        ]
        requires_swarming = any(keyword in message_lower for keyword in swarming_keywords)
        
        # Complexity assessment
        complexity_indicators = [
            "design", "implement", "build", "create", "solve",
            "optimize", "improve", "fix", "debug"
        ]
        complexity = len([k for k in complexity_indicators if k in message_lower]) / len(complexity_indicators)
        
        return {
            "requires_unbiased_analysis": requires_unbiased,
            "requires_deep_thinking": requires_thinking,
            "requires_intelligent_swarming": requires_swarming,
            "complexity": complexity,
            "word_count": len(user_message.split()),
            "question_marks": user_message.count("?")
        }


# Create the enhanced main assistant instance
enhanced_main_assistant = EnhancedMainAssistant()


# Backward compatibility function
async def collaborate_with_strategy(
    user_message: str,
    turn_id: str,
    api_keys: Dict[str, str],
    strategy: str = "auto",
    show_thinking: bool = False,
    enable_anonymity: bool = False
) -> Dict[str, Any]:
    """
    Convenient function for collaboration with strategy selection.
    
    Args:
        user_message: User's message
        turn_id: Turn identifier
        api_keys: API keys
        strategy: "auto", "anonymous", "enhanced", "nextgen", or "legacy"
        show_thinking: Whether to show thinking processes
        enable_anonymity: Whether to use anonymous collaboration
        
    Returns:
        Collaboration result
    """
    
    # Determine strategy
    if enable_anonymity or strategy == "anonymous":
        selected_strategy = CollaborationStrategy.ANONYMOUS
    elif strategy == "enhanced":
        selected_strategy = CollaborationStrategy.ENHANCED_THINKING
    elif strategy == "nextgen":
        selected_strategy = CollaborationStrategy.NEXTGEN_SWARM
    elif strategy == "legacy":
        selected_strategy = CollaborationStrategy.LEGACY_SEQUENTIAL
    else:  # auto
        selected_strategy = None  # Let the assistant decide
    
    return await enhanced_main_assistant.handle_message(
        user_message=user_message,
        turn_id=turn_id,
        api_keys=api_keys,
        collaboration_mode=True,
        collaboration_strategy=selected_strategy,
        user_preferences={"show_thinking": show_thinking}
    )