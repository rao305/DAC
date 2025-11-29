"""
Report compression service for multi-model collaboration.
Compresses internal reports into concise summaries for external reviewers.
"""

from typing import Dict, Any
import logging
from app.adapters.openai_adapter import call_openai

logger = logging.getLogger(__name__)

async def compress_internal_report(internal_report: str, user_question: str) -> str:
    """
    Compress an internal collaboration report into a 250-400 token summary
    suitable for external model review.
    
    Args:
        internal_report: Full detailed report from internal pipeline
        user_question: Original user question for context
        
    Returns:
        Compressed report (250-400 tokens)
    """
    
    compression_prompt = f"""You are a report compression specialist. Your job is to condense a detailed AI report into a clear, comprehensive summary of exactly 250-400 tokens.

ORIGINAL USER QUESTION:
{user_question}

FULL INTERNAL REPORT:
{internal_report}

COMPRESSION REQUIREMENTS:
1. Preserve all key findings, conclusions, and recommendations
2. Maintain technical accuracy and important nuances
3. Keep essential data, numbers, and specific examples
4. Preserve any important caveats or limitations mentioned
5. Target exactly 250-400 tokens (be precise with word count)

COMPRESSION STRATEGY:
- Remove redundant explanations and verbose transitions
- Consolidate similar points into bullet format where appropriate
- Keep the logical flow: problem → analysis → solution/conclusion
- Preserve any critical warnings, risks, or uncertainties

Output the compressed report only. Do not include meta-commentary about the compression process."""

    try:
        response = await call_openai(
            messages=[{"role": "user", "content": compression_prompt}],
            model="gpt-4o-mini",  # Use cheaper model for compression
            temperature=0.3,  # Lower temperature for consistent compression
            max_tokens=500  # Allow some buffer for the compression
        )
        
        compressed = response.strip()
        
        # Log compression ratio for monitoring
        original_words = len(internal_report.split())
        compressed_words = len(compressed.split())
        compression_ratio = compressed_words / original_words if original_words > 0 else 0
        
        logger.info(f"Report compressed from {original_words} to {compressed_words} words (ratio: {compression_ratio:.2f})")
        
        return compressed
        
    except Exception as e:
        logger.error(f"Error compressing report: {e}")
        # Fallback: simple truncation if compression fails
        words = internal_report.split()
        if len(words) > 350:
            fallback = " ".join(words[:350]) + "... [truncated]"
            logger.warning("Using fallback truncation for report compression")
            return fallback
        return internal_report

async def extract_confidence_score(critic_response: str) -> float:
    """
    Extract confidence score from critic response to determine if external review is needed.
    
    Args:
        critic_response: Response from the Critic stage
        
    Returns:
        Confidence score between 0.0 and 1.0
    """
    
    confidence_prompt = f"""Analyze this critic's evaluation and extract a confidence score for the overall report quality.

CRITIC EVALUATION:
{critic_response}

Based on the critic's assessment, rate the confidence in the report on a scale of 0.0 to 1.0:

- 0.9-1.0: Excellent, comprehensive, high confidence
- 0.7-0.8: Good quality, minor gaps or uncertainties  
- 0.5-0.6: Moderate quality, notable issues or missing elements
- 0.3-0.4: Concerning gaps, significant improvements needed
- 0.0-0.2: Poor quality, major problems identified

Consider:
- Factual accuracy concerns mentioned
- Gaps in analysis or missing perspectives
- Clarity and completeness issues
- Strength of evidence and reasoning
- Any explicit confidence indicators from the critic

Return only a single number between 0.0 and 1.0 (e.g., 0.75)"""

    try:
        response = await call_openai(
            messages=[{"role": "user", "content": confidence_prompt}],
            model="gpt-4o-mini",
            temperature=0.1,  # Very low temperature for consistent scoring
            max_tokens=10  # Just need a number
        )
        
        # Extract the numeric score
        score_text = response.strip()
        try:
            score = float(score_text)
            # Clamp to valid range
            score = max(0.0, min(1.0, score))
            return score
        except ValueError:
            logger.warning(f"Could not parse confidence score: {score_text}")
            return 0.5  # Default to moderate confidence
            
    except Exception as e:
        logger.error(f"Error extracting confidence score: {e}")
        return 0.5  # Default to moderate confidence on error