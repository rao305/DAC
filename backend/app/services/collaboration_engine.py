"""
Multi-Agent Collaboration Engine

Implements the 5-agent collaboration pipeline:
1. Analyst (Gemini) - Problem breakdown, user archetypes, structure
2. Researcher (Perplexity) - Web findings & citations  
3. Creator (GPT) - Main solution draft
4. Critic (Kimi/GPT) - Flaws, risks, improvements
5. Synthesizer (GPT) - Final integrated report

Supports conversation continuity with stored agent outputs for follow-up questions.
"""

from typing import Dict, Any, List, Optional, Tuple
import time
import asyncio
from dataclasses import dataclass
from enum import Enum

from app.models.provider_key import ProviderType
from app.adapters.openai_adapter import call_openai
from app.adapters.perplexity import call_perplexity
from app.adapters.gemini import call_gemini


class AgentRole(Enum):
    ANALYST = "agent_analyst"
    RESEARCHER = "agent_researcher" 
    CREATOR = "agent_creator"
    CRITIC = "agent_critic"
    SYNTHESIZER = "agent_synth"


@dataclass
class AgentOutput:
    role: AgentRole
    provider: str
    content: str
    timestamp: float
    turn_id: str


@dataclass
class CollaborationResult:
    final_report: str
    agent_outputs: List[AgentOutput]
    total_time_ms: float
    turn_id: str


class CollaborationEngine:
    """Multi-agent collaboration orchestrator"""
    
    def __init__(self):
        self.agent_configs = {
            AgentRole.ANALYST: {
                "provider": ProviderType.GEMINI,
                "model": "gemini-2.0-flash-exp", 
                "system_prompt": self._get_analyst_prompt()
            },
            AgentRole.RESEARCHER: {
                "provider": ProviderType.PERPLEXITY,
                "model": "sonar-pro",
                "system_prompt": self._get_researcher_prompt()
            },
            AgentRole.CREATOR: {
                "provider": ProviderType.OPENAI,
                "model": "gpt-4o",
                "system_prompt": self._get_creator_prompt()
            },
            AgentRole.CRITIC: {
                "provider": ProviderType.OPENAI,  # Fallback from Kimi to GPT
                "model": "gpt-4o",
                "system_prompt": self._get_critic_prompt()
            },
            AgentRole.SYNTHESIZER: {
                "provider": ProviderType.OPENAI,
                "model": "gpt-4o",
                "system_prompt": self._get_synthesizer_prompt()
            }
        }
    
    def _get_analyst_prompt(self) -> str:
        return """You are **DAC Analyst**, the first agent in a 5-agent collaboration.

Your role: Break down the user's query into structured analysis.

Output a concise analysis with these sections:
1. **Problem Breakdown** - Core components and scope
2. **User Archetypes** - Who would benefit from this solution
3. **Success Criteria** - What constitutes a good solution
4. **Structure Recommendation** - How the solution should be organized

Keep analysis under 300 words. Focus on clarity and actionable insights for the downstream agents."""

    def _get_researcher_prompt(self) -> str:
        return """You are **DAC Researcher**, the second agent in a 5-agent collaboration.

Your role: Find up-to-date web information and credible sources.

Based on the user query and analyst breakdown, research:
1. **Current State** - Latest developments, trends, or standards
2. **Best Practices** - Industry-accepted approaches
3. **Tools & Technologies** - Available solutions and frameworks
4. **Citations** - Include URLs and publication dates

Provide factual, current information with proper citations. Keep under 400 words."""

    def _get_creator_prompt(self) -> str:
        return """You are **DAC Creator**, the third agent in a 5-agent collaboration.

Your role: Draft the main solution based on analyst structure and researcher findings.

Create a comprehensive solution that includes:
1. **Core Implementation** - Main approach or code
2. **Architecture** - How components fit together  
3. **User Experience** - How users interact with the solution
4. **Technical Details** - Implementation specifics

Build on the analyst's structure and incorporate researcher's findings. Be practical and detailed."""

    def _get_critic_prompt(self) -> str:
        return """You are **DAC Critic**, the fourth agent in a 5-agent collaboration.

Your role: Identify flaws, risks, and improvements in the creator's solution.

Analyze the proposed solution for:
1. **Technical Flaws** - Implementation issues or bugs
2. **Security Risks** - Vulnerabilities or safety concerns  
3. **Scalability Issues** - Performance or growth problems
4. **Missing Elements** - What's been overlooked
5. **Improvement Suggestions** - Specific actionable fixes

Be constructive but thorough. Focus on making the solution better, not just finding problems."""

    def _get_synthesizer_prompt(self) -> str:
        return """You are **DAC Synthesizer**, the final report writer in a 5-agent collaboration.

Upstream agents:
- Analyst (Gemini) – problem breakdown, user archetypes, structure
- Researcher (Perplexity) – up-to-date web findings & citations
- Creator (GPT) – main solution draft
- Critic (GPT) – flaws, risks, missing perspectives, improvements

Your job is to write **ONE single, high-quality, long final answer** for the user.

### Requirements

1. **Integrate all agents**
   - Use the Analyst's structure for clarity
   - Use the Researcher's facts and URLs as the source of truth
   - Use the Creator's ideas as a starting point
   - Apply the Critic's feedback to FIX problems, not just repeat them

2. **Quality bar**
   - Must be clearly better than anything a single model could write alone
   - Feel like a team of experts collaborated and you're presenting their final report
   - Aim for thorough, detailed answers (unless user asks for brief)
   - High information density over length, but err on comprehensive responses

3. **Structure**
   - Start with short **Executive Summary** (3–8 bullets or 1–2 paragraphs)
   - Use clear sections with headings adapted to the task
   - For technical solutions: Problem Analysis, Research Insights, Solution Architecture, Implementation Details, Security Considerations, Performance & Scalability, Next Steps
   - Adapt section names to the specific request

4. **Tone & style**
   - Write as a single, unified voice
   - Do NOT mention "Analyst/Researcher/Creator/Critic" unless user asks about process
   - Clear, direct language for smart but non-expert users
   - Use citations naturally when research provides URLs

5. **Follow-up friendly**
   - Structure should support follow-up questions
   - Label lists and examples clearly for easy reference
   - Keep logical organization

Your output is the **final user-visible answer**. Treat it like a polished report."""

    async def collaborate(
        self, 
        user_query: str,
        turn_id: str,
        api_keys: Dict[str, str],
        collaboration_mode: bool = True
    ) -> CollaborationResult:
        """
        Run the 5-agent collaboration pipeline.
        
        Args:
            user_query: The user's question/request
            turn_id: Unique identifier for this collaboration turn
            api_keys: Map of provider -> api_key
            collaboration_mode: If False, just return direct answer
            
        Returns:
            CollaborationResult with final report and agent outputs
        """
        start_time = time.perf_counter()
        agent_outputs = []
        
        if not collaboration_mode:
            # Direct answer mode - just use Creator agent
            return await self._direct_answer_mode(user_query, turn_id, api_keys)
        
        # Agent 1: Analyst
        analyst_output = await self._run_agent(
            AgentRole.ANALYST,
            user_query,
            turn_id,
            api_keys,
            context=""
        )
        agent_outputs.append(analyst_output)
        
        # Agent 2: Researcher  
        researcher_context = f"User Query: {user_query}\n\nAnalyst Analysis:\n{analyst_output.content}"
        researcher_output = await self._run_agent(
            AgentRole.RESEARCHER,
            user_query,
            turn_id,
            api_keys,
            context=researcher_context
        )
        agent_outputs.append(researcher_output)
        
        # Agent 3: Creator
        creator_context = f"""User Query: {user_query}

Analyst Analysis:
{analyst_output.content}

Research Findings:
{researcher_output.content}"""
        creator_output = await self._run_agent(
            AgentRole.CREATOR,
            user_query,
            turn_id,
            api_keys,
            context=creator_context
        )
        agent_outputs.append(creator_output)
        
        # Agent 4: Critic
        critic_context = f"""User Query: {user_query}

Analyst Analysis:
{analyst_output.content}

Research Findings:
{researcher_output.content}

Creator's Solution:
{creator_output.content}"""
        critic_output = await self._run_agent(
            AgentRole.CRITIC,
            user_query,
            turn_id,
            api_keys,
            context=critic_context
        )
        agent_outputs.append(critic_output)
        
        # Agent 5: Synthesizer
        synth_context = f"""Original user query: {user_query}

Full internal collaboration transcript:

ANALYST SUMMARY:
{analyst_output.content}

RESEARCHER FINDINGS:
{researcher_output.content}

CREATOR DRAFT:
{creator_output.content}

CRITIC REVIEW:
{critic_output.content}"""
        
        synthesizer_output = await self._run_agent(
            AgentRole.SYNTHESIZER,
            user_query,
            turn_id,
            api_keys,
            context=synth_context
        )
        agent_outputs.append(synthesizer_output)
        
        total_time_ms = (time.perf_counter() - start_time) * 1000
        
        return CollaborationResult(
            final_report=synthesizer_output.content,
            agent_outputs=agent_outputs,
            total_time_ms=total_time_ms,
            turn_id=turn_id
        )
    
    async def _direct_answer_mode(
        self,
        user_query: str,
        turn_id: str, 
        api_keys: Dict[str, str]
    ) -> CollaborationResult:
        """Direct answer without full collaboration pipeline"""
        start_time = time.perf_counter()
        
        creator_output = await self._run_agent(
            AgentRole.CREATOR,
            user_query,
            turn_id,
            api_keys,
            context=""
        )
        
        total_time_ms = (time.perf_counter() - start_time) * 1000
        
        return CollaborationResult(
            final_report=creator_output.content,
            agent_outputs=[creator_output],
            total_time_ms=total_time_ms,
            turn_id=turn_id
        )
    
    async def _run_agent(
        self,
        role: AgentRole,
        user_query: str,
        turn_id: str,
        api_keys: Dict[str, str],
        context: str = ""
    ) -> AgentOutput:
        """Run a single agent with the specified role"""
        config = self.agent_configs[role]
        provider = config["provider"]
        model = config["model"]
        system_prompt = config["system_prompt"]
        
        # Get API key for this provider
        api_key = api_keys.get(provider.value)
        if not api_key:
            raise ValueError(f"No API key for provider {provider.value}")
        
        # Build prompt
        if context:
            full_prompt = f"{context}\n\nPlease analyze the above and provide your {role.value} perspective."
        else:
            full_prompt = user_query
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": full_prompt}
        ]
        
        # Call the appropriate provider
        start_time = time.perf_counter()
        
        if provider == ProviderType.OPENAI:
            response = await call_openai(
                messages=messages,
                model=model,
                api_key=api_key,
                temperature=0.7
            )
            content = response.content
            
        elif provider == ProviderType.GEMINI:
            response = await call_gemini(
                messages=messages,
                model=model,
                api_key=api_key,
                temperature=0.7
            )
            content = response.content
            
        elif provider == ProviderType.PERPLEXITY:
            # For Perplexity, use a search-focused prompt
            search_prompt = f"Research the following query and provide up-to-date information with citations:\n\n{full_prompt}"
            response = await call_perplexity(
                messages=[{"role": "user", "content": search_prompt}],
                model=model,
                api_key=api_key
            )
            content = response.content
            
        else:
            # Fallback to OpenAI for unsupported providers
            response = await call_openai(
                messages=messages,
                model="gpt-4o",
                api_key=api_keys.get(ProviderType.OPENAI.value),
                temperature=0.7
            )
            content = response.content
        
        return AgentOutput(
            role=role,
            provider=provider.value,
            content=content,
            timestamp=time.perf_counter(),
            turn_id=turn_id
        )


# Conversation storage for follow-up questions
class ConversationMemory:
    """Store agent outputs for follow-up questions"""
    
    def __init__(self):
        self._storage: Dict[str, List[AgentOutput]] = {}
    
    def store_collaboration(self, turn_id: str, agent_outputs: List[AgentOutput]):
        """Store all agent outputs for a collaboration turn"""
        self._storage[turn_id] = agent_outputs
    
    def get_agent_output(self, turn_id: str, role: AgentRole) -> Optional[AgentOutput]:
        """Get specific agent output from a turn"""
        outputs = self._storage.get(turn_id, [])
        for output in outputs:
            if output.role == role:
                return output
        return None
    
    def get_all_outputs(self, turn_id: str) -> List[AgentOutput]:
        """Get all agent outputs from a turn"""
        return self._storage.get(turn_id, [])
    
    def get_recent_outputs(self, limit: int = 5) -> List[AgentOutput]:
        """Get recent agent outputs across all turns"""
        all_outputs = []
        for outputs in self._storage.values():
            all_outputs.extend(outputs)
        
        # Sort by timestamp, most recent first
        all_outputs.sort(key=lambda x: x.timestamp, reverse=True)
        return all_outputs[:limit]


# Global memory instance
conversation_memory = ConversationMemory()