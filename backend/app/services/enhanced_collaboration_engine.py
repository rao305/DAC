"""
Enhanced Multi-Agent Collaboration Engine with Deep Thinking Integration

This enhanced version ensures LLMs are truly thinking together, building on each other's insights,
and generating progressively better responses through collaborative intelligence.
"""

from typing import Dict, Any, List, Optional, Tuple
import time
import asyncio
from dataclasses import dataclass, field
from enum import Enum

from app.models.provider_key import ProviderType
from app.adapters.openai_adapter import call_openai
from app.adapters.perplexity import call_perplexity
from app.adapters.gemini import call_gemini
from app.adapters.kimi import call_kimi


class CollaborativeRole(Enum):
    """Enhanced roles that emphasize collaborative thinking"""
    STRATEGIC_ANALYST = "strategic_analyst"      # Deep problem analysis & solution architecture
    KNOWLEDGE_RESEARCHER = "knowledge_researcher"  # Research with thinking synthesis
    CREATIVE_ARCHITECT = "creative_architect"    # Solution design with innovative thinking
    CRITICAL_REVIEWER = "critical_reviewer"     # Deep critique with improvement thinking
    MASTER_SYNTHESIZER = "master_synthesizer"   # Final synthesis with collaborative wisdom


@dataclass
class ThinkingInsight:
    """Represents a thinking insight from an agent"""
    agent_role: CollaborativeRole
    insight_type: str  # "analysis", "idea", "concern", "improvement", "synthesis"
    content: str
    confidence: float
    builds_on: List[str] = field(default_factory=list)  # Which previous insights this builds on
    reasoning: str = ""  # Why this insight is important


@dataclass
class CollaborativeOutput:
    """Enhanced output that captures collaborative thinking"""
    role: CollaborativeRole
    provider: str
    thinking_process: str  # The agent's internal reasoning
    main_content: str     # The main output/contribution
    key_insights: List[ThinkingInsight]  # Structured insights for other agents
    timestamp: float
    turn_id: str
    builds_on_agents: List[str] = field(default_factory=list)  # Which agents this builds on


@dataclass
class EnhancedCollaborationResult:
    """Result that shows the collaborative thinking journey"""
    final_response: str
    collaborative_outputs: List[CollaborativeOutput]
    thinking_journey: List[str]  # Step-by-step collaborative thinking
    key_insights_discovered: List[ThinkingInsight]
    collaboration_quality_score: float  # How well agents built on each other
    total_time_ms: float
    turn_id: str


class EnhancedCollaborationEngine:
    """Enhanced collaboration engine with deep thinking integration"""
    
    def __init__(self):
        self.agent_configs = {
            CollaborativeRole.STRATEGIC_ANALYST: {
                "provider": ProviderType.GEMINI,
                "model": "gemini-2.5-flash", 
                "system_prompt": self._get_strategic_analyst_prompt()
            },
            CollaborativeRole.KNOWLEDGE_RESEARCHER: {
                "provider": ProviderType.PERPLEXITY,
                "model": "sonar-pro",
                "system_prompt": self._get_knowledge_researcher_prompt()
            },
            CollaborativeRole.CREATIVE_ARCHITECT: {
                "provider": ProviderType.OPENAI,
                "model": "gpt-4o",
                "system_prompt": self._get_creative_architect_prompt()
            },
            CollaborativeRole.CRITICAL_REVIEWER: {
                "provider": ProviderType.OPENAI,
                "model": "gpt-4o",
                "system_prompt": self._get_critical_reviewer_prompt()
            },
            CollaborativeRole.MASTER_SYNTHESIZER: {
                "provider": ProviderType.OPENAI,
                "model": "gpt-4o",
                "system_prompt": self._get_master_synthesizer_prompt()
            }
        }
        
        self.collaboration_memory: List[ThinkingInsight] = []
    
    def _get_strategic_analyst_prompt(self) -> str:
        return """You are the **Strategic Analyst** - the first intelligence in a collaborative AI team.

Your mission: Think deeply about the user's query and provide foundational strategic analysis.

## Your Thinking Process:

1. **Deep Analysis**: Break down the query into core components, hidden complexity, and strategic implications
2. **Solution Architecture**: Think through the overall approach and structure needed
3. **User Understanding**: Consider who the user is, their skill level, and what they really need
4. **Success Framework**: Define what success looks like and how to measure it

## Output Format:

**🧠 THINKING PROCESS:**
[Share your step-by-step analytical thinking - what patterns you see, connections you make, strategic insights you develop]

**📋 STRATEGIC ANALYSIS:**
- **Core Problem**: What is the user really asking for?
- **Complexity Assessment**: Simple/Medium/Complex and why
- **Solution Architecture**: High-level approach and key components needed
- **User Profile**: Who would benefit and what their context likely is
- **Success Criteria**: What constitutes an excellent solution

**💡 KEY INSIGHTS FOR TEAM:**
[List 2-3 key insights that will help downstream agents - things they should know, consider, or build upon]

Remember: Your analysis becomes the foundation for 4 other AI agents. Think strategically and provide insights they can build upon to create something better than any single AI could produce."""

    def _get_knowledge_researcher_prompt(self) -> str:
        return """You are the **Knowledge Researcher** - the research intelligence in a collaborative AI team.

**Previous Agent Context:** You have the Strategic Analyst's foundational analysis to build upon.

Your mission: Find current, credible information and synthesize it with the strategic analysis to create knowledge insights.

## Your Thinking Process:

1. **Research Strategy**: Based on the strategic analysis, determine what specific knowledge is needed
2. **Information Synthesis**: Connect current findings with the analyst's insights
3. **Knowledge Gaps**: Identify what information is missing or where more research is needed
4. **Evidence Building**: Gather facts and citations that support or challenge the strategic approach

## Output Format:

**🧠 THINKING PROCESS:**
[Explain how you're building on the Strategic Analyst's insights, what research strategy you're using, and how you're synthesizing information]

**🔍 RESEARCH FINDINGS:**
- **Current State**: Latest developments, trends, and standards (with URLs and dates)
- **Best Practices**: Industry-accepted approaches that align with the strategic analysis
- **Tools & Technologies**: Available solutions that support the proposed architecture
- **Evidence Base**: Facts and data that validate or challenge the strategic approach

**💡 KNOWLEDGE INSIGHTS FOR TEAM:**
[2-3 insights that combine research findings with strategic analysis - things the creative architect and others should know]

**📚 CITATIONS**: [Include specific URLs and sources]

Remember: You're building on the Strategic Analyst's foundation. Connect your research to their insights and create knowledge that enables better solution design."""

    def _get_creative_architect_prompt(self) -> str:
        return """You are the **Creative Architect** - the solution design intelligence in a collaborative AI team.

**Previous Intelligence Context:** 
- Strategic Analyst provided foundational analysis and solution architecture
- Knowledge Researcher provided current information and evidence base

Your mission: Design and create the core solution by thinking creatively while building on your team's insights.

## Your Thinking Process:

1. **Foundation Integration**: How do you build on the strategic analysis and research findings?
2. **Creative Problem-Solving**: What innovative approaches can you apply within the strategic framework?
3. **Solution Design**: How do you translate strategy + research into practical implementation?
4. **User Experience**: How will users actually interact with and benefit from this solution?

## Output Format:

**🧠 THINKING PROCESS:**
[Show how you're integrating previous insights, your creative reasoning, design decisions, and solution architecture thinking]

**🏗️ SOLUTION DESIGN:**
- **Core Implementation**: Main approach that builds on strategic analysis
- **Architecture**: How components fit together (informed by research findings)
- **User Experience**: Practical interaction design
- **Technical Approach**: Implementation details with research-backed choices
- **Innovation Elements**: Creative aspects that make this solution excellent

**💡 DESIGN INSIGHTS FOR TEAM:**
[2-3 key insights about your solution design that the Critical Reviewer should focus on - potential challenges, innovative elements, or areas needing validation]

Remember: You're the creative force, but you're building on strategic analysis and research. Create something that's both innovative and grounded in the team's collective intelligence."""

    def _get_critical_reviewer_prompt(self) -> str:
        return """You are the **Critical Reviewer** - the validation intelligence in a collaborative AI team.

**Previous Intelligence Context:**
- Strategic Analyst provided foundational analysis
- Knowledge Researcher provided evidence and current information  
- Creative Architect designed the core solution

Your mission: Think critically about the proposed solution and provide constructive improvements that build on the team's work.

## Your Thinking Process:

1. **Holistic Evaluation**: How well does the solution address the original strategic analysis?
2. **Evidence Validation**: Does the solution align with the research findings?
3. **Critical Analysis**: What potential issues, risks, or improvements do you identify?
4. **Enhancement Thinking**: How can you build on the solution to make it even better?

## Output Format:

**🧠 THINKING PROCESS:**
[Show your critical evaluation process - how you're analyzing the solution against strategy and research, what patterns you see, where you identify opportunities for improvement]

**🔍 CRITICAL ANALYSIS:**
- **Alignment Check**: How well does the solution match the strategic analysis?
- **Evidence Validation**: Are research findings properly incorporated?
- **Risk Assessment**: Potential technical, security, or scalability issues
- **Gap Analysis**: What's missing or could be improved?
- **Enhancement Opportunities**: Specific ways to make the solution better

**💡 IMPROVEMENT INSIGHTS FOR TEAM:**
[2-3 specific, actionable improvements that the Master Synthesizer should integrate - focus on building on what's good rather than just finding problems]

Remember: You're not here to tear down the solution, but to make it excellent. Build on your team's intelligence to identify specific improvements that will create the best possible final answer."""

    def _get_master_synthesizer_prompt(self) -> str:
        return """You are the **Master Synthesizer** - the final intelligence that weaves together your team's collective thinking.

**Team Intelligence Available:**
- **Strategic Analyst**: Foundational analysis and solution architecture
- **Knowledge Researcher**: Current information and evidence synthesis  
- **Creative Architect**: Core solution design and implementation
- **Critical Reviewer**: Validation analysis and improvement insights

Your mission: Synthesize the team's collective intelligence into a single, excellent response that's clearly better than any individual AI could produce.

## Your Thinking Process:

1. **Intelligence Integration**: How do you weave together all team insights?
2. **Quality Enhancement**: How do you apply improvements while preserving good elements?
3. **Coherent Synthesis**: How do you create one unified, excellent response?
4. **Value Maximization**: How do you ensure this feels like true team collaboration?

## Output Format:

**🧠 SYNTHESIS THINKING:**
[Show how you're integrating insights from all 4 team members, what patterns you see across their contributions, and how you're creating something greater than the sum of parts]

**📋 FINAL RESPONSE:**
[Create the user's final answer that integrates all team intelligence. Structure this as:]

**Executive Summary** (2-3 key points that capture the essence)

**[Adaptive Sections Based on Query Type]**
- For technical: Problem Analysis → Solution Architecture → Implementation → Considerations
- For business: Strategic Analysis → Market Insights → Recommended Approach → Implementation Plan
- For creative: Understanding the Need → Creative Solution → Implementation Guide → Optimization

**Citations & References** (when research provided URLs)

**💡 COLLABORATIVE VALUE DEMONSTRATION:**
[Briefly explain how this response leverages the team's collective intelligence - what makes it better than a single AI response]

Remember: This is the final user-facing response. It should feel like a team of specialists collaborated to give them the best possible answer. Integrate all insights, apply all improvements, and create something excellent."""

    async def collaborate_with_thinking(
        self,
        user_query: str,
        turn_id: str,
        api_keys: Dict[str, str],
        show_thinking: bool = False
    ) -> EnhancedCollaborationResult:
        """
        Run enhanced collaboration with explicit thinking integration.
        
        Args:
            user_query: The user's question/request
            turn_id: Unique identifier for this collaboration turn
            api_keys: Map of provider -> api_key
            show_thinking: Whether to include thinking processes in output
            
        Returns:
            EnhancedCollaborationResult with collaborative thinking journey
        """
        start_time = time.perf_counter()
        collaborative_outputs = []
        thinking_journey = []
        self.collaboration_memory = []  # Reset for this collaboration
        
        # Phase 1: Strategic Analysis
        analyst_output = await self._run_collaborative_agent(
            CollaborativeRole.STRATEGIC_ANALYST,
            user_query,
            turn_id,
            api_keys,
            previous_context=""
        )
        collaborative_outputs.append(analyst_output)
        thinking_journey.append(f"🧠 Strategic Analysis: {self._extract_key_insight(analyst_output.thinking_process)}")
        self.collaboration_memory.extend(analyst_output.key_insights)
        
        # Phase 2: Knowledge Research (building on analysis)
        research_context = self._build_context_with_thinking([analyst_output])
        researcher_output = await self._run_collaborative_agent(
            CollaborativeRole.KNOWLEDGE_RESEARCHER,
            user_query,
            turn_id,
            api_keys,
            previous_context=research_context
        )
        collaborative_outputs.append(researcher_output)
        thinking_journey.append(f"🔍 Knowledge Synthesis: {self._extract_key_insight(researcher_output.thinking_process)}")
        self.collaboration_memory.extend(researcher_output.key_insights)
        
        # Phase 3: Creative Solution Design (building on analysis + research)
        creative_context = self._build_context_with_thinking([analyst_output, researcher_output])
        architect_output = await self._run_collaborative_agent(
            CollaborativeRole.CREATIVE_ARCHITECT,
            user_query,
            turn_id,
            api_keys,
            previous_context=creative_context
        )
        collaborative_outputs.append(architect_output)
        thinking_journey.append(f"🏗️ Solution Design: {self._extract_key_insight(architect_output.thinking_process)}")
        self.collaboration_memory.extend(architect_output.key_insights)
        
        # Phase 4: Critical Review (building on all previous work)
        critic_context = self._build_context_with_thinking([analyst_output, researcher_output, architect_output])
        critic_output = await self._run_collaborative_agent(
            CollaborativeRole.CRITICAL_REVIEWER,
            user_query,
            turn_id,
            api_keys,
            previous_context=critic_context
        )
        collaborative_outputs.append(critic_output)
        thinking_journey.append(f"🔍 Critical Enhancement: {self._extract_key_insight(critic_output.thinking_process)}")
        self.collaboration_memory.extend(critic_output.key_insights)
        
        # Phase 5: Master Synthesis (building on all team intelligence)
        synthesis_context = self._build_context_with_thinking(collaborative_outputs)
        synthesizer_output = await self._run_collaborative_agent(
            CollaborativeRole.MASTER_SYNTHESIZER,
            user_query,
            turn_id,
            api_keys,
            previous_context=synthesis_context,
            is_final=True
        )
        collaborative_outputs.append(synthesizer_output)
        thinking_journey.append(f"⚡ Team Synthesis: {self._extract_key_insight(synthesizer_output.thinking_process)}")
        
        total_time_ms = (time.perf_counter() - start_time) * 1000
        collaboration_quality = self._calculate_collaboration_quality(collaborative_outputs)
        
        return EnhancedCollaborationResult(
            final_response=synthesizer_output.main_content,
            collaborative_outputs=collaborative_outputs,
            thinking_journey=thinking_journey,
            key_insights_discovered=self.collaboration_memory,
            collaboration_quality_score=collaboration_quality,
            total_time_ms=total_time_ms,
            turn_id=turn_id
        )
    
    async def _run_collaborative_agent(
        self,
        role: CollaborativeRole,
        user_query: str,
        turn_id: str,
        api_keys: Dict[str, str],
        previous_context: str,
        is_final: bool = False
    ) -> CollaborativeOutput:
        """Run a single agent with collaborative thinking integration"""
        
        config = self.agent_configs[role]
        provider = config["provider"]
        model = config["model"]
        system_prompt = config["system_prompt"]
        
        # Build the full prompt with context
        full_prompt = f"""{system_prompt}

## USER QUERY:
{user_query}

## TEAM COLLABORATION CONTEXT:
{previous_context if previous_context else "You are the first agent - no previous context available."}

## YOUR COLLABORATIVE CONTRIBUTION:
Remember: You are part of a team. Build on previous insights, think deeply, and provide value that enables the next agents to create something excellent."""
        
        # Call the appropriate adapter
        api_key = api_keys.get(provider.value, "")
        
        if provider == ProviderType.OPENAI:
            response = await call_openai(
                messages=[{"role": "user", "content": full_prompt}],
                model=model,
                api_key=api_key
            )
            content = response.get("content", "")
        elif provider == ProviderType.GEMINI:
            content = await call_gemini(full_prompt, model=model, api_key=api_key)
        elif provider == ProviderType.PERPLEXITY:
            content = await call_perplexity(full_prompt, model=model, api_key=api_key)
        else:
            content = f"Provider {provider} not implemented"
        
        # Parse the response to extract thinking and main content
        thinking_process, main_content, insights = self._parse_collaborative_response(content, role)
        
        return CollaborativeOutput(
            role=role,
            provider=provider.value,
            thinking_process=thinking_process,
            main_content=main_content,
            key_insights=insights,
            timestamp=time.time(),
            turn_id=turn_id,
            builds_on_agents=self._get_previous_agents(role)
        )
    
    def _build_context_with_thinking(self, previous_outputs: List[CollaborativeOutput]) -> str:
        """Build rich context that includes both content and thinking from previous agents"""
        if not previous_outputs:
            return ""
        
        context_parts = []
        for output in previous_outputs:
            context_parts.append(f"""
**{output.role.value.upper()} CONTRIBUTION:**

🧠 **Their Thinking Process:**
{output.thinking_process}

📋 **Their Main Contribution:**
{output.main_content}

💡 **Key Insights They Discovered:**
{self._format_insights(output.key_insights)}
""")
        
        return "\n".join(context_parts)
    
    def _parse_collaborative_response(self, content: str, role: CollaborativeRole) -> Tuple[str, str, List[ThinkingInsight]]:
        """Parse agent response to extract thinking, main content, and insights"""
        
        thinking_process = ""
        main_content = content  # Default to full content
        insights = []
        
        # Extract thinking process if present
        if "🧠 THINKING PROCESS:" in content:
            parts = content.split("🧠 THINKING PROCESS:", 1)[1]
            if "📋" in parts or "🔍" in parts or "🏗️" in parts:
                # Find the next section
                next_section_markers = ["📋", "🔍", "🏗️", "**"]
                for marker in next_section_markers:
                    if marker in parts:
                        thinking_process = parts.split(marker, 1)[0].strip()
                        break
            else:
                thinking_process = parts.strip()
        
        # Extract key insights if present
        if "💡" in content:
            insight_section = content.split("💡", 1)[1]
            # Simple parsing - in production, this could be more sophisticated
            insights.append(ThinkingInsight(
                agent_role=role,
                insight_type="key_insight",
                content=insight_section[:200],  # First 200 chars as summary
                confidence=0.8,  # Default confidence
                reasoning=f"Insight from {role.value}"
            ))
        
        return thinking_process, content, insights
    
    def _extract_key_insight(self, thinking_process: str) -> str:
        """Extract a key insight summary from thinking process"""
        # Simple extraction - take first meaningful sentence
        sentences = thinking_process.split(".")
        for sentence in sentences:
            if len(sentence.strip()) > 20:  # Skip very short fragments
                return sentence.strip()[:100] + "..." if len(sentence) > 100 else sentence.strip()
        return "Processing collaborative insights..."
    
    def _format_insights(self, insights: List[ThinkingInsight]) -> str:
        """Format insights for context building"""
        if not insights:
            return "No specific insights captured."
        
        formatted = []
        for insight in insights:
            formatted.append(f"- {insight.content[:100]}...")
        return "\n".join(formatted)
    
    def _get_previous_agents(self, current_role: CollaborativeRole) -> List[str]:
        """Get list of agents that ran before the current one"""
        role_order = [
            CollaborativeRole.STRATEGIC_ANALYST,
            CollaborativeRole.KNOWLEDGE_RESEARCHER,
            CollaborativeRole.CREATIVE_ARCHITECT,
            CollaborativeRole.CRITICAL_REVIEWER,
            CollaborativeRole.MASTER_SYNTHESIZER
        ]
        
        current_index = role_order.index(current_role)
        return [role.value for role in role_order[:current_index]]
    
    def _calculate_collaboration_quality(self, outputs: List[CollaborativeOutput]) -> float:
        """Calculate how well agents built on each other's work"""
        # Simple quality metric - in production, this could be more sophisticated
        base_quality = 0.7  # Base collaboration quality
        
        # Add points for each agent that builds on previous agents
        building_bonus = 0.0
        for output in outputs:
            if output.builds_on_agents:
                building_bonus += 0.05 * len(output.builds_on_agents)
        
        # Add points for insights generated
        insight_bonus = len(self.collaboration_memory) * 0.02
        
        return min(1.0, base_quality + building_bonus + insight_bonus)