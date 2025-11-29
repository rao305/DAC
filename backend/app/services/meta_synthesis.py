"""
Meta-synthesis service for combining internal reports with external reviews.
This is the "director" that produces the final unified answer from all sources.
"""

from typing import List, Dict, Any
import logging
from app.adapters.openai_adapter import call_openai
from app.adapters.gemini import call_gemini

logger = logging.getLogger(__name__)

class MetaSynthesizer:
    """Combines internal team reports with external multi-model reviews into a final answer."""
    
    def __init__(self, preferred_model: str = "gpt-4o"):
        """
        Initialize meta-synthesizer.
        
        Args:
            preferred_model: Model to use for final synthesis (gpt-4o or gemini-1.5-pro)
        """
        self.preferred_model = preferred_model
    
    async def synthesize_final_answer(
        self,
        question: str,
        internal_report: str,
        external_critiques: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Synthesize final answer from internal report and external reviews.
        
        Args:
            question: Original user question
            internal_report: Full report from internal team pipeline
            external_critiques: List of critiques from external reviewers
            
        Returns:
            Dict containing final answer and metadata
        """
        
        # Format external critiques for the synthesis prompt
        formatted_critiques = self._format_critiques(external_critiques)
        
        synthesis_prompt = self._create_synthesis_prompt(
            question=question,
            internal_report=internal_report,
            external_critiques=formatted_critiques
        )
        
        try:
            if self.preferred_model.startswith("gpt"):
                final_answer = await self._synthesize_with_openai(synthesis_prompt)
            elif self.preferred_model.startswith("gemini"):
                final_answer = await self._synthesize_with_gemini(synthesis_prompt)
            else:
                # Fallback to GPT-4o
                final_answer = await self._synthesize_with_openai(synthesis_prompt)
            
            # Analyze the synthesis for metadata
            metadata = await self._analyze_synthesis(
                internal_report=internal_report,
                external_critiques=external_critiques,
                final_answer=final_answer
            )
            
            return {
                "final_answer": final_answer,
                "synthesis_metadata": metadata,
                "reviewers_consulted": len(external_critiques),
                "successful_reviews": len([c for c in external_critiques if c.get("status") == "success"])
            }
            
        except Exception as e:
            logger.error(f"Error in meta-synthesis: {e}")
            # Fallback to internal report if synthesis fails
            return {
                "final_answer": internal_report,
                "synthesis_metadata": {
                    "synthesis_status": "failed",
                    "fallback_used": True,
                    "error": str(e)
                },
                "reviewers_consulted": len(external_critiques),
                "successful_reviews": len([c for c in external_critiques if c.get("status") == "success"])
            }
    
    def _format_critiques(self, external_critiques: List[Dict[str, Any]]) -> str:
        """Format external critiques for inclusion in synthesis prompt."""
        if not external_critiques:
            return "No external reviews were conducted."
        
        formatted = []
        for i, critique in enumerate(external_critiques, 1):
            if critique.get("status") == "success" and critique.get("critique"):
                reviewer_name = critique.get("reviewer", f"External Expert {i}")
                critique_text = critique["critique"]
                formatted.append(f"**{reviewer_name}:**\n{critique_text}")
        
        return "\n\n---\n\n".join(formatted) if formatted else "No successful external reviews."
    
    def _create_synthesis_prompt(
        self, 
        question: str, 
        internal_report: str, 
        external_critiques: str
    ) -> str:
        """Create the synthesis prompt for the director model."""
        
        return f"""You are the director of a team of AI experts.
An internal multi-step pipeline wrote a detailed report.
Multiple external experts from different models reviewed it.
Your job is to produce the **best possible final answer** by combining all of this.

**User Question:**
{question}

**Internal Report (team pipeline):**
{internal_report}

**External Reviews (multi-model):**
{external_critiques}

**Tasks:**

1. Start from the Internal Report as a base. Keep what is correct and well explained.
2. Apply valid corrections suggested by reviewers.
3. Integrate genuinely valuable new perspectives, edge cases, or risks they mention.
4. If reviewers clearly disagree on something important, surface that as an **area of uncertainty or debate** instead of hiding it.
5. Produce a **single final answer** that is:
   * accurate and up-to-date
   * well-structured and easy to read
   * transparent about any major uncertainties or disagreements

Do **not** mention individual model names or providers.
Speak as one unified system.

**Important:** If the external reviews are mostly positive and suggest only minor improvements, don't over-revise. Keep the strong elements of the internal report and make targeted enhancements."""
    
    async def _synthesize_with_openai(self, prompt: str) -> str:
        """Synthesize using OpenAI models."""
        response = await call_openai(
            messages=[{"role": "user", "content": prompt}],
            model=self.preferred_model,
            temperature=0.3,  # Lower temperature for consistent synthesis
            max_tokens=4000   # Allow for comprehensive final answer
        )
        return response.strip()
    
    async def _synthesize_with_gemini(self, prompt: str) -> str:
        """Synthesize using Gemini models."""
        response = await call_gemini(
            prompt=prompt,
            model=self.preferred_model,
            temperature=0.3,
            max_output_tokens=4000
        )
        return response.strip()
    
    async def _analyze_synthesis(
        self,
        internal_report: str,
        external_critiques: List[Dict[str, Any]],
        final_answer: str
    ) -> Dict[str, Any]:
        """
        Analyze the synthesis to provide metadata about the process.
        
        Returns metadata about what changed, what was preserved, etc.
        """
        
        analysis_prompt = f"""Analyze this synthesis process and provide a brief summary of what happened.

INTERNAL REPORT LENGTH: {len(internal_report.split())} words
EXTERNAL CRITIQUES: {len(external_critiques)} reviewers
FINAL ANSWER LENGTH: {len(final_answer.split())} words

Based on the word counts and typical synthesis patterns, categorize this synthesis:

1. "minimal_changes" - Final answer is very similar to internal report
2. "moderate_integration" - Some external suggestions incorporated  
3. "major_revision" - Significant changes based on external input
4. "uncertainty_highlighted" - Major disagreements or gaps surfaced

Also estimate:
- Primary improvement: factual_correction | perspective_added | clarity_enhanced | uncertainty_noted
- Confidence in final answer: high | medium | low

Return a JSON object with these fields:
{{"synthesis_type": "...", "primary_improvement": "...", "confidence_level": "..."}}"""

        try:
            response = await call_openai(
                messages=[{"role": "user", "content": analysis_prompt}],
                model="gpt-4o-mini",  # Use cheaper model for analysis
                temperature=0.1,
                max_tokens=200
            )
            
            # Try to parse as JSON, fallback to default structure
            import json
            try:
                metadata = json.loads(response.strip())
                return {
                    **metadata,
                    "synthesis_status": "success",
                    "analysis_available": True
                }
            except json.JSONDecodeError:
                return {
                    "synthesis_status": "success",
                    "synthesis_type": "unknown",
                    "analysis_available": False,
                    "raw_analysis": response.strip()
                }
                
        except Exception as e:
            logger.error(f"Error analyzing synthesis: {e}")
            return {
                "synthesis_status": "success",
                "analysis_available": False,
                "error": str(e)
            }

# Convenience function for the collaboration service
async def synthesize_collaboration_result(
    question: str,
    internal_report: str,
    external_critiques: List[Dict[str, Any]],
    preferred_model: str = "gpt-4o"
) -> Dict[str, Any]:
    """
    Convenience function to synthesize collaboration results.
    
    Args:
        question: Original user question
        internal_report: Internal team pipeline report
        external_critiques: External reviewer critiques
        preferred_model: Model to use for synthesis
        
    Returns:
        Synthesized result with metadata
    """
    
    synthesizer = MetaSynthesizer(preferred_model=preferred_model)
    return await synthesizer.synthesize_final_answer(
        question=question,
        internal_report=internal_report,
        external_critiques=external_critiques
    )