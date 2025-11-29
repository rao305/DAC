"""
External reviewer service - Multi-model critique system for collaboration reports.
Uses all available providers (Perplexity, Gemini, GPT, Kimi, OpenRouter) to review and critique reports.
"""

from typing import List, Dict, Any, Optional
import logging
import asyncio
from app.adapters.openai_adapter import call_openai
from app.adapters.gemini import call_gemini
from app.api.providers import get_provider_status

logger = logging.getLogger(__name__)

# External reviewer prompt template
EXTERNAL_REVIEWER_PROMPT = """You are an external expert reviewing a report written by another AI system.
Your job is to *critically evaluate and improve it*, not to rewrite it from scratch.

**User Question:**
{question}

**Report to review (compressed):**
{compressed_report}

In **max 200-250 tokens**, do the following:

1. List any likely factual mistakes or overconfident claims.
2. List important missing points, edge cases, or alternate perspectives.
3. If you mostly agree with the report, say so briefly and focus on improvements.

Answer as bullet points. Do **not** rewrite the whole answer."""

class ExternalReviewer:
    def __init__(self, name: str, provider: str, model: str):
        self.name = name
        self.provider = provider
        self.model = model
        
    async def review(self, question: str, compressed_report: str) -> Dict[str, Any]:
        """Get a critique from this reviewer."""
        prompt = EXTERNAL_REVIEWER_PROMPT.format(
            question=question,
            compressed_report=compressed_report
        )
        
        try:
            if self.provider == "openai":
                response = await self._review_with_openai(prompt)
            elif self.provider == "gemini":
                response = await self._review_with_gemini(prompt)
            elif self.provider == "perplexity":
                response = await self._review_with_perplexity(prompt)
            elif self.provider == "kimi":
                response = await self._review_with_kimi(prompt)
            elif self.provider == "openrouter":
                response = await self._review_with_openrouter(prompt)
            else:
                raise ValueError(f"Unknown provider: {self.provider}")
                
            return {
                "reviewer": self.name,
                "provider": self.provider,
                "model": self.model,
                "critique": response.strip(),
                "status": "success"
            }
            
        except Exception as e:
            logger.error(f"External reviewer {self.name} failed: {e}")
            return {
                "reviewer": self.name,
                "provider": self.provider,
                "model": self.model,
                "critique": None,
                "status": "failed",
                "error": str(e)
            }
    
    async def _review_with_openai(self, prompt: str) -> str:
        """Review using OpenAI models."""
        response = await call_openai(
            messages=[{"role": "user", "content": prompt}],
            model=self.model,
            temperature=0.4,
            max_tokens=300
        )
        return response
    
    async def _review_with_gemini(self, prompt: str) -> str:
        """Review using Gemini models."""
        response = await call_gemini(
            prompt=prompt,
            model=self.model,
            temperature=0.4,
            max_output_tokens=300
        )
        return response
    
    async def _review_with_perplexity(self, prompt: str) -> str:
        """Review using Perplexity models."""
        # Import here to avoid circular imports
        import aiohttp
        from app.services.provider_keys import get_perplexity_key
        
        headers = {
            "Authorization": f"Bearer {get_perplexity_key()}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.4,
            "max_tokens": 300
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.perplexity.ai/chat/completions",
                headers=headers,
                json=data
            ) as response:
                result = await response.json()
                if response.status != 200:
                    raise Exception(f"Perplexity API error: {result}")
                return result["choices"][0]["message"]["content"]
    
    async def _review_with_kimi(self, prompt: str) -> str:
        """Review using Kimi models."""
        # Import here to avoid circular imports
        import aiohttp
        from app.services.provider_keys import get_kimi_key
        
        headers = {
            "Authorization": f"Bearer {get_kimi_key()}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.4,
            "max_tokens": 300
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.moonshot.cn/v1/chat/completions",
                headers=headers,
                json=data
            ) as response:
                result = await response.json()
                if response.status != 200:
                    raise Exception(f"Kimi API error: {result}")
                return result["choices"][0]["message"]["content"]
    
    async def _review_with_openrouter(self, prompt: str) -> str:
        """Review using OpenRouter models."""
        # Import here to avoid circular imports
        import aiohttp
        from app.services.provider_keys import get_openrouter_key
        
        headers = {
            "Authorization": f"Bearer {get_openrouter_key()}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://syntra.ai",
            "X-Title": "Syntra AI"
        }
        
        data = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.4,
            "max_tokens": 300
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=data
            ) as response:
                result = await response.json()
                if response.status != 200:
                    raise Exception(f"OpenRouter API error: {result}")
                return result["choices"][0]["message"]["content"]

class ExternalReviewCouncil:
    """Manages the multi-model external review process."""
    
    def __init__(self, org_id: Optional[str] = None):
        self.org_id = org_id
        self.reviewers = None  # Lazy initialization
    
    def _get_default_reviewers(self) -> List[ExternalReviewer]:
        """Get default reviewers assuming all providers are available."""
        reviewers = []
        
        # Perplexity reviewer (factual/web-aware critique)
        reviewers.append(ExternalReviewer(
            name="Factual Expert",
            provider="perplexity",
            model="llama-3.1-sonar-large-128k-online"
        ))
        
        # Gemini reviewer (perspectives/risks)
        reviewers.append(ExternalReviewer(
            name="Perspective Analyst",
            provider="gemini",
            model="gemini-1.5-pro"
        ))
        
        # GPT reviewer (style, clarity, reasoning gaps)
        reviewers.append(ExternalReviewer(
            name="Clarity Specialist",
            provider="openai",
            model="gpt-4"
        ))
        
        # Kimi reviewer (technical/specialist perspective)
        reviewers.append(ExternalReviewer(
            name="Technical Specialist",
            provider="kimi",
            model="moonshot-v1-8k"
        ))
        
        # OpenRouter reviewer (diverse perspective)
        reviewers.append(ExternalReviewer(
            name="Alternative Perspective",
            provider="openrouter",
            model="anthropic/claude-3.5-sonnet"
        ))
        
        return reviewers
    
    async def get_reviewers(self) -> List[ExternalReviewer]:
        """Get reviewers, initializing them if needed."""
        if self.reviewers is None:
            self.reviewers = self._get_default_reviewers()
        return self.reviewers
    
    async def conduct_external_review(
        self, 
        question: str, 
        compressed_report: str,
        max_reviewers: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Conduct external review with all available reviewers.
        
        Args:
            question: Original user question
            compressed_report: Compressed internal report
            max_reviewers: Optional limit on number of reviewers (for cost control)
            
        Returns:
            List of review results from external models
        """
        
        reviewers = await self.get_reviewers()
        active_reviewers = reviewers[:max_reviewers] if max_reviewers else reviewers
        
        if not active_reviewers:
            logger.warning("No external reviewers available")
            return []
        
        logger.info(f"Starting external review with {len(active_reviewers)} reviewers")
        
        # Run all reviews in parallel
        review_tasks = [
            reviewer.review(question, compressed_report) 
            for reviewer in active_reviewers
        ]
        
        reviews = await asyncio.gather(*review_tasks, return_exceptions=True)
        
        # Filter out failed reviews and exceptions
        successful_reviews = []
        for i, review in enumerate(reviews):
            if isinstance(review, Exception):
                logger.error(f"Reviewer {active_reviewers[i].name} raised exception: {review}")
            elif isinstance(review, dict) and review.get("status") == "success":
                successful_reviews.append(review)
            else:
                logger.warning(f"Reviewer {active_reviewers[i].name} failed: {review}")
        
        logger.info(f"Completed external review: {len(successful_reviews)}/{len(active_reviewers)} reviewers successful")
        
        return successful_reviews
    
    async def should_conduct_external_review(
        self, 
        confidence_score: float, 
        user_mode: str = "auto"
    ) -> bool:
        """
        Determine if external review is needed based on confidence and user preferences.
        
        Args:
            confidence_score: Confidence score from internal critic (0.0-1.0)
            user_mode: "auto", "high_fidelity", or "expert"
            
        Returns:
            True if external review should be conducted
        """
        
        if user_mode == "high_fidelity" or user_mode == "expert":
            return True
        
        if user_mode == "auto":
            # Conduct external review for low confidence reports
            return confidence_score < 0.6
        
        return False