"""Query classification for intelligent LLM routing.

This service analyzes user queries to determine:
1. Query type/domain (factual, reasoning, code, creative, etc.)
2. Complexity level
3. Recommended provider and model

Based on the Collaborative Memory paper's concept of domain-specialist agents.
"""
from __future__ import annotations

import re
from typing import Dict, List, Optional, Tuple
from enum import Enum
from dataclasses import dataclass

from app.models.provider_key import ProviderType


class QueryType(str, Enum):
    """Types of queries for classification."""

    FACTUAL = "factual"  # Needs web search, citations, current info
    REASONING = "reasoning"  # Complex logic, chain-of-thought
    CODE = "code"  # Programming, debugging
    CREATIVE = "creative"  # Writing, brainstorming
    MULTILINGUAL = "multilingual"  # Non-English queries
    SIMPLE = "simple"  # Quick Q&A
    ANALYSIS = "analysis"  # Data analysis, comparison
    CONVERSATION = "conversation"  # Casual chat


class ComplexityLevel(str, Enum):
    """Query complexity assessment."""

    LOW = "low"  # Simple, quick answer
    MEDIUM = "medium"  # Moderate reasoning required
    HIGH = "high"  # Complex, multi-step reasoning


@dataclass
class QueryClassification:
    """Result of query classification."""

    query_type: QueryType
    complexity: ComplexityLevel
    recommended_provider: ProviderType
    recommended_model: str
    reason: str
    confidence: float  # 0.0 to 1.0


class QueryClassifier:
    """Classifies queries to determine optimal LLM routing."""

    # Keywords for different query types
    FACTUAL_KEYWORDS = [
        "what is", "who is", "when did", "where is", "latest", "current",
        "news", "recent", "update", "happening", "search", "find",
        "what happened", "define", "explain", "tell me about"
    ]

    REASONING_KEYWORDS = [
        "analyze", "compare", "evaluate", "why", "how does", "reasoning",
        "logic", "prove", "deduce", "infer", "conclude", "justify",
        "chain of thought", "step by step", "think through"
    ]

    CODE_KEYWORDS = [
        "code", "program", "debug", "function", "class", "algorithm",
        "python", "javascript", "java", "c++", "rust", "sql",
        "api", "implement", "refactor", "bug", "error", "syntax"
    ]

    CREATIVE_KEYWORDS = [
        "write", "create", "story", "poem", "essay", "brainstorm",
        "creative", "imagine", "invent", "design", "compose"
    ]

    ANALYSIS_KEYWORDS = [
        "analyze", "comparison", "versus", "vs", "compare", "contrast",
        "pros and cons", "advantages", "disadvantages", "evaluate",
        "assess", "review", "examine"
    ]

    # Language patterns for multilingual detection
    CHINESE_PATTERN = re.compile(r'[\u4e00-\u9fff]+')
    JAPANESE_PATTERN = re.compile(r'[\u3040-\u309f\u30a0-\u30ff]+')
    KOREAN_PATTERN = re.compile(r'[\uac00-\ud7af]+')
    ARABIC_PATTERN = re.compile(r'[\u0600-\u06ff]+')

    def classify(
        self,
        query: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> QueryClassification:
        """
        Classify a query to determine optimal LLM routing.

        Args:
            query: The user's query
            conversation_history: Previous messages for context

        Returns:
            QueryClassification with routing recommendation
        """
        query_lower = query.lower()

        # Check for multilingual first
        if self._is_multilingual(query):
            return self._classify_multilingual(query)

        # Detect query type based on keywords
        query_type = self._detect_query_type(query_lower)

        # Assess complexity
        complexity = self._assess_complexity(query, conversation_history)

        # Get routing recommendation
        provider, model, reason = self._get_routing_recommendation(
            query_type, complexity, query_lower
        )

        # Calculate confidence
        confidence = self._calculate_confidence(query_lower, query_type)

        return QueryClassification(
            query_type=query_type,
            complexity=complexity,
            recommended_provider=provider,
            recommended_model=model,
            reason=reason,
            confidence=confidence
        )

    def _is_multilingual(self, query: str) -> bool:
        """Check if query contains non-English characters."""
        return bool(
            self.CHINESE_PATTERN.search(query) or
            self.JAPANESE_PATTERN.search(query) or
            self.KOREAN_PATTERN.search(query) or
            self.ARABIC_PATTERN.search(query)
        )

    def _classify_multilingual(self, query: str) -> QueryClassification:
        """Handle multilingual queries."""
        # Kimi is excellent for Chinese
        if self.CHINESE_PATTERN.search(query):
            return QueryClassification(
                query_type=QueryType.MULTILINGUAL,
                complexity=ComplexityLevel.MEDIUM,
                recommended_provider=ProviderType.KIMI,
                recommended_model="moonshot-v1-32k",
                reason="Chinese language detected, Kimi specializes in Chinese",
                confidence=0.95
            )

        # Gemini is strong for multilingual
        return QueryClassification(
            query_type=QueryType.MULTILINGUAL,
            complexity=ComplexityLevel.MEDIUM,
            recommended_provider=ProviderType.GEMINI,
            recommended_model="gemini-2.5-pro",
            reason="Multilingual query detected, Gemini has strong multilingual support",
            confidence=0.85
        )

    def _detect_query_type(self, query_lower: str) -> QueryType:
        """Detect the primary type of query."""
        scores = {
            QueryType.FACTUAL: self._count_keywords(query_lower, self.FACTUAL_KEYWORDS),
            QueryType.REASONING: self._count_keywords(query_lower, self.REASONING_KEYWORDS),
            QueryType.CODE: self._count_keywords(query_lower, self.CODE_KEYWORDS),
            QueryType.CREATIVE: self._count_keywords(query_lower, self.CREATIVE_KEYWORDS),
            QueryType.ANALYSIS: self._count_keywords(query_lower, self.ANALYSIS_KEYWORDS),
        }

        # Find highest score
        max_score = max(scores.values())

        if max_score == 0:
            # No keywords matched, assume simple conversation
            return QueryType.SIMPLE

        # Return type with highest score
        for query_type, score in scores.items():
            if score == max_score:
                return query_type

        return QueryType.SIMPLE

    def _count_keywords(self, query_lower: str, keywords: List[str]) -> int:
        """Count how many keywords appear in the query."""
        return sum(1 for keyword in keywords if keyword in query_lower)

    def _assess_complexity(
        self,
        query: str,
        conversation_history: Optional[List[Dict[str, str]]]
    ) -> ComplexityLevel:
        """Assess the complexity of the query."""
        # Simple heuristics
        word_count = len(query.split())

        # Check for complexity indicators
        has_multiple_questions = query.count('?') > 1
        has_conditions = any(word in query.lower() for word in ['if', 'when', 'unless', 'given'])
        has_comparison = any(word in query.lower() for word in ['compare', 'versus', 'vs', 'difference'])

        # Long context increases complexity
        long_context = conversation_history and len(conversation_history) > 3

        complexity_score = 0

        if word_count > 50:
            complexity_score += 2
        elif word_count > 20:
            complexity_score += 1

        if has_multiple_questions:
            complexity_score += 1
        if has_conditions:
            complexity_score += 1
        if has_comparison:
            complexity_score += 1
        if long_context:
            complexity_score += 1

        if complexity_score >= 4:
            return ComplexityLevel.HIGH
        elif complexity_score >= 2:
            return ComplexityLevel.MEDIUM
        else:
            return ComplexityLevel.LOW

    def _get_routing_recommendation(
        self,
        query_type: QueryType,
        complexity: ComplexityLevel,
        query_lower: str
    ) -> Tuple[ProviderType, str, str]:
        """
        Get provider and model recommendation based on query type and complexity.

        ROUTING STRATEGY: Use what each model is BEST at
        - OpenAI: Best for code, reasoning, creative writing
        - Perplexity: Best for factual queries (has web search & citations)
        - Gemini: Best for simple queries, speed, large context
        - Kimi: Best for multilingual content

        Cost is secondary - quality and capability come first.

        Returns: (provider, model, reason)
        """
        # FACTUAL queries: Perplexity is BEST (web search + citations)
        if query_type == QueryType.FACTUAL:
            if complexity == ComplexityLevel.HIGH:
                return (
                    ProviderType.PERPLEXITY,
                    "sonar-pro",
                    "Factual query - Perplexity Sonar Pro excels with web search and citations"
                )
            else:
                return (
                    ProviderType.PERPLEXITY,
                    "sonar",
                    "Factual query - Perplexity Sonar provides real-time web search"
                )

        # CODE queries: OpenAI is BEST at code generation
        if query_type == QueryType.CODE:
            if complexity == ComplexityLevel.HIGH:
                return (
                    ProviderType.OPENAI,
                    "gpt-4o-mini",
                    "Code generation - OpenAI excels at complex programming tasks"
                )
            else:
                # Even simple code - OpenAI is better at code than Gemini
                return (
                    ProviderType.OPENAI,
                    "gpt-4o-mini",
                    "Code generation - OpenAI's strong programming capabilities"
                )

        # CREATIVE queries: OpenAI is BEST at creative writing
        if query_type == QueryType.CREATIVE:
            return (
                ProviderType.OPENAI,
                "gpt-4o-mini",
                "Creative writing - OpenAI excels at storytelling and creative content"
            )

        # REASONING queries: OpenAI is BEST at logical reasoning
        if query_type == QueryType.REASONING:
            if complexity == ComplexityLevel.HIGH:
                return (
                    ProviderType.OPENAI,
                    "gpt-4o-mini",
                    "Complex reasoning - OpenAI's superior logical capabilities"
                )
            else:
                return (
                    ProviderType.OPENAI,
                    "gpt-4o-mini",
                    "Reasoning task - OpenAI's strong analytical abilities"
                )

        # ANALYSIS queries: OpenAI is BEST at structured analysis
        if query_type == QueryType.ANALYSIS:
            return (
                ProviderType.OPENAI,
                "gpt-4o-mini",
                "Analysis task - OpenAI's structured reasoning and depth"
            )

        # SIMPLE queries: Gemini is GOOD ENOUGH and fast
        if query_type == QueryType.SIMPLE or query_type == QueryType.CONVERSATION:
            return (
                ProviderType.GEMINI,
                "gemini-2.5-flash",
                "Simple conversation - Gemini Flash for quick responses"
            )

        # Default fallback: OpenAI for general capability
        return (
            ProviderType.OPENAI,
            "gpt-4o-mini",
            "General query - OpenAI for balanced performance"
        )

    def _calculate_confidence(self, query_lower: str, query_type: QueryType) -> float:
        """Calculate confidence score for the classification."""
        # Count matching keywords for the detected type
        keyword_lists = {
            QueryType.FACTUAL: self.FACTUAL_KEYWORDS,
            QueryType.REASONING: self.REASONING_KEYWORDS,
            QueryType.CODE: self.CODE_KEYWORDS,
            QueryType.CREATIVE: self.CREATIVE_KEYWORDS,
            QueryType.ANALYSIS: self.ANALYSIS_KEYWORDS,
        }

        if query_type not in keyword_lists:
            return 0.5  # Moderate confidence for simple queries

        keywords = keyword_lists[query_type]
        matches = self._count_keywords(query_lower, keywords)

        # Higher matches = higher confidence
        if matches >= 3:
            return 0.95
        elif matches == 2:
            return 0.85
        elif matches == 1:
            return 0.70
        else:
            return 0.60


# Singleton instance
query_classifier = QueryClassifier()
