"""
Advanced Intent Classifier for Next-Gen Collaborate Mode

Fast intent classification that converts user messages into vectors of needs
and maps each need to the optimal model based on historical accuracy.
"""

from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum
import re
import time
import asyncio
from collections import defaultdict
import json

class IntentType(Enum):
    """Core intent categories for model routing"""
    RESEARCH = "research"           # Find current information, citations
    CRITIQUE = "critique"           # Find flaws, risks, improvements  
    REFACTOR = "refactor"          # Improve existing code/content
    GENERATE = "generate"          # Create new content/code
    VERIFY = "verify"              # Check accuracy, validate
    COMPUTE = "compute"            # Mathematical, logical operations
    FETCH_DATA = "fetch_data"      # Extract structured information
    ANALYZE = "analyze"            # Deep analysis and breakdown
    SYNTHESIZE = "synthesize"      # Combine multiple sources
    DEBUG = "debug"                # Find and fix issues

@dataclass
class IntentVector:
    """Vector representation of user intent needs"""
    needs: Dict[IntentType, float]  # Intent -> confidence score (0-1)
    complexity: float               # Overall complexity (0-1)
    urgency: float                 # How urgent/real-time (0-1)
    creativity: float              # Creative vs analytical (0-1)
    context_dependency: float      # Needs previous context (0-1)

@dataclass
class ModelSkills:
    """Skills and capabilities of each model"""
    model_id: str
    provider: str
    skills: Dict[IntentType, float]  # Intent -> skill level (0-10)
    performance_metrics: Dict[str, float]  # latency, accuracy, etc.
    cost_per_token: float
    context_window: int
    specialties: List[str]  # Free-form specialties

class IntentClassifier:
    """Fast intent classification and model routing system"""
    
    def __init__(self):
        self.intent_patterns = self._build_intent_patterns()
        self.model_skills = self._initialize_model_skills()
        self.historical_performance = defaultdict(lambda: defaultdict(float))
        
    def _build_intent_patterns(self) -> Dict[IntentType, List[str]]:
        """Build regex patterns for intent detection"""
        return {
            IntentType.RESEARCH: [
                r'\b(research|find|search|look up|investigate|explore)\b',
                r'\b(current|latest|recent|up.?to.?date|state.?of.?art)\b',
                r'\b(sources?|citations?|references?|papers?|studies?)\b',
                r'\bwhat (is|are) the (latest|current|recent)\b'
            ],
            IntentType.CRITIQUE: [
                r'\b(critique|review|analyze flaws|find (problems|issues|bugs))\b',
                r'\b(what.?s wrong|problems with|issues with|flaws in)\b',
                r'\b(risks?|vulnerabilities|weaknesses|downsides?)\b',
                r'\b(improve|better|optimize|enhance)\b'
            ],
            IntentType.REFACTOR: [
                r'\b(refactor|rewrite|restructure|reorganize|clean up)\b',
                r'\b(improve|optimize|enhance|modernize)\b',
                r'\b(make (it )?better|fix the (code|structure))\b'
            ],
            IntentType.GENERATE: [
                r'\b(create|build|generate|write|make|design)\b',
                r'\b(from scratch|new|fresh)\b',
                r'\b(component|function|class|API|service)\b'
            ],
            IntentType.VERIFY: [
                r'\b(verify|validate|check|confirm|test)\b',
                r'\b(correct|accurate|right|true)\b',
                r'\b(fact.?check|double.?check)\b'
            ],
            IntentType.COMPUTE: [
                r'\b(calculate|compute|solve|math|formula)\b',
                r'\b(algorithm|equation|logic)\b',
                r'\b\d+[\+\-\*/]\d+\b'  # Basic math expressions
            ],
            IntentType.FETCH_DATA: [
                r'\b(extract|get|fetch|pull|scrape)\b',
                r'\b(data|information|details|specs)\b',
                r'\b(from|in|within)\b.*\b(file|document|database|API)\b'
            ],
            IntentType.ANALYZE: [
                r'\b(analyze|examination|breakdown|dissect)\b',
                r'\b(understand|explain|interpret)\b',
                r'\b(why|how|what does)\b'
            ],
            IntentType.SYNTHESIZE: [
                r'\b(combine|merge|integrate|synthesize|unify)\b',
                r'\b(summary|overview|conclusion)\b',
                r'\b(bring together|put together)\b'
            ],
            IntentType.DEBUG: [
                r'\b(debug|fix|troubleshoot|solve|repair)\b',
                r'\b(error|bug|issue|problem|broken)\b',
                r'\b(not working|failing|crash)\b'
            ]
        }
    
    def _initialize_model_skills(self) -> Dict[str, ModelSkills]:
        """Initialize model capabilities based on known strengths"""
        return {
            "gpt-4o": ModelSkills(
                model_id="gpt-4o",
                provider="openai",
                skills={
                    IntentType.RESEARCH: 7.5,
                    IntentType.CRITIQUE: 8.5,
                    IntentType.REFACTOR: 9.0,
                    IntentType.GENERATE: 9.2,
                    IntentType.VERIFY: 8.0,
                    IntentType.COMPUTE: 8.5,
                    IntentType.FETCH_DATA: 7.0,
                    IntentType.ANALYZE: 9.0,
                    IntentType.SYNTHESIZE: 9.5,
                    IntentType.DEBUG: 8.8
                },
                performance_metrics={
                    "avg_latency_ms": 1200,
                    "accuracy_score": 0.92,
                    "context_retention": 0.95
                },
                cost_per_token=0.00003,
                context_window=128000,
                specialties=["code_generation", "reasoning", "synthesis"]
            ),
            "claude-3-5-sonnet": ModelSkills(
                model_id="claude-3-5-sonnet", 
                provider="anthropic",
                skills={
                    IntentType.RESEARCH: 8.0,
                    IntentType.CRITIQUE: 9.5,
                    IntentType.REFACTOR: 9.2,
                    IntentType.GENERATE: 8.8,
                    IntentType.VERIFY: 9.0,
                    IntentType.COMPUTE: 8.0,
                    IntentType.FETCH_DATA: 7.5,
                    IntentType.ANALYZE: 9.8,
                    IntentType.SYNTHESIZE: 9.0,
                    IntentType.DEBUG: 9.0
                },
                performance_metrics={
                    "avg_latency_ms": 1000,
                    "accuracy_score": 0.94,
                    "context_retention": 0.98
                },
                cost_per_token=0.000015,
                context_window=200000,
                specialties=["analysis", "safety", "reasoning"]
            ),
            "gemini-2.0-flash": ModelSkills(
                model_id="gemini-2.0-flash",
                provider="google", 
                skills={
                    IntentType.RESEARCH: 8.5,
                    IntentType.CRITIQUE: 7.5,
                    IntentType.REFACTOR: 8.0,
                    IntentType.GENERATE: 8.5,
                    IntentType.VERIFY: 8.5,
                    IntentType.COMPUTE: 9.0,
                    IntentType.FETCH_DATA: 9.2,
                    IntentType.ANALYZE: 8.8,
                    IntentType.SYNTHESIZE: 8.0,
                    IntentType.DEBUG: 7.8
                },
                performance_metrics={
                    "avg_latency_ms": 800,
                    "accuracy_score": 0.89,
                    "context_retention": 0.91
                },
                cost_per_token=0.0000075,
                context_window=1000000,
                specialties=["speed", "multimodal", "data_extraction"]
            ),
            "sonar-pro": ModelSkills(
                model_id="sonar-pro",
                provider="perplexity",
                skills={
                    IntentType.RESEARCH: 9.8,
                    IntentType.CRITIQUE: 6.5,
                    IntentType.REFACTOR: 5.0,
                    IntentType.GENERATE: 6.0,
                    IntentType.VERIFY: 9.5,
                    IntentType.COMPUTE: 6.0,
                    IntentType.FETCH_DATA: 9.0,
                    IntentType.ANALYZE: 7.5,
                    IntentType.SYNTHESIZE: 7.0,
                    IntentType.DEBUG: 6.0
                },
                performance_metrics={
                    "avg_latency_ms": 1500,
                    "accuracy_score": 0.96,
                    "context_retention": 0.85
                },
                cost_per_token=0.00001,
                context_window=4000,
                specialties=["web_search", "current_info", "citations"]
            ),
            "kimi": ModelSkills(
                model_id="kimi",
                provider="moonshot",
                skills={
                    IntentType.RESEARCH: 7.0,
                    IntentType.CRITIQUE: 9.8,
                    IntentType.REFACTOR: 8.5,
                    IntentType.GENERATE: 7.5,
                    IntentType.VERIFY: 8.8,
                    IntentType.COMPUTE: 7.0,
                    IntentType.FETCH_DATA: 6.5,
                    IntentType.ANALYZE: 8.5,
                    IntentType.SYNTHESIZE: 7.8,
                    IntentType.DEBUG: 8.0
                },
                performance_metrics={
                    "avg_latency_ms": 1400,
                    "accuracy_score": 0.88,
                    "context_retention": 0.92
                },
                cost_per_token=0.000007,
                context_window=200000,
                specialties=["critique", "long_context", "cost_effective"]
            )
        }

    async def classify_intent(self, user_message: str, context: Optional[str] = None) -> IntentVector:
        """
        Fast intent classification using pattern matching and heuristics.
        
        Returns vector of needs with confidence scores.
        """
        message_lower = user_message.lower()
        needs = {}
        
        # Pattern-based classification
        for intent_type, patterns in self.intent_patterns.items():
            confidence = 0.0
            for pattern in patterns:
                matches = re.findall(pattern, message_lower)
                if matches:
                    confidence = max(confidence, len(matches) * 0.3)
            
            # Cap confidence at 1.0
            needs[intent_type] = min(confidence, 1.0)
        
        # Boost based on specific keywords and context
        needs = self._apply_contextual_boosts(needs, user_message, context)
        
        # Calculate meta-attributes
        complexity = self._calculate_complexity(user_message, needs)
        urgency = self._calculate_urgency(user_message)
        creativity = self._calculate_creativity(user_message, needs)
        context_dependency = self._calculate_context_dependency(context, user_message)
        
        return IntentVector(
            needs=needs,
            complexity=complexity,
            urgency=urgency,
            creativity=creativity,
            context_dependency=context_dependency
        )
    
    def _apply_contextual_boosts(self, needs: Dict[IntentType, float], message: str, context: Optional[str]) -> Dict[IntentType, float]:
        """Apply contextual intelligence to boost relevant intents"""
        message_lower = message.lower()
        
        # Code-related boosts
        if any(keyword in message_lower for keyword in ['code', 'function', 'class', 'api', 'bug']):
            needs[IntentType.REFACTOR] += 0.3
            needs[IntentType.DEBUG] += 0.3
            needs[IntentType.GENERATE] += 0.2
        
        # Research indicators
        if any(keyword in message_lower for keyword in ['latest', 'current', 'research', 'find out']):
            needs[IntentType.RESEARCH] += 0.4
            needs[IntentType.VERIFY] += 0.2
        
        # Quality/improvement indicators
        if any(keyword in message_lower for keyword in ['improve', 'better', 'optimize', 'enhance']):
            needs[IntentType.CRITIQUE] += 0.4
            needs[IntentType.REFACTOR] += 0.3
        
        # Multi-step indicators
        if any(keyword in message_lower for keyword in ['step by step', 'first', 'then', 'finally']):
            needs[IntentType.ANALYZE] += 0.3
            needs[IntentType.SYNTHESIZE] += 0.3
        
        # Cap all values at 1.0
        return {k: min(v, 1.0) for k, v in needs.items()}
    
    def _calculate_complexity(self, message: str, needs: Dict[IntentType, float]) -> float:
        """Calculate overall query complexity"""
        complexity_indicators = 0.0
        
        # Length indicator
        if len(message) > 200:
            complexity_indicators += 0.3
        elif len(message) > 100:
            complexity_indicators += 0.2
        
        # Multiple intent needs
        active_intents = sum(1 for confidence in needs.values() if confidence > 0.3)
        complexity_indicators += min(active_intents * 0.15, 0.5)
        
        # Technical language
        tech_words = ['algorithm', 'architecture', 'optimization', 'implementation', 'framework']
        tech_count = sum(1 for word in tech_words if word in message.lower())
        complexity_indicators += min(tech_count * 0.1, 0.3)
        
        return min(complexity_indicators, 1.0)
    
    def _calculate_urgency(self, message: str) -> float:
        """Calculate urgency level"""
        urgent_words = ['urgent', 'asap', 'quickly', 'fast', 'immediately', 'now', 'emergency']
        urgency = 0.0
        
        for word in urgent_words:
            if word in message.lower():
                urgency += 0.3
        
        # Question marks might indicate uncertainty but not urgency
        if message.count('?') > 1:
            urgency += 0.1
        
        return min(urgency, 1.0)
    
    def _calculate_creativity(self, message: str, needs: Dict[IntentType, float]) -> float:
        """Calculate creativity vs analytical needs"""
        creative_intents = [IntentType.GENERATE, IntentType.DEBUG, IntentType.REFACTOR]
        analytical_intents = [IntentType.ANALYZE, IntentType.VERIFY, IntentType.COMPUTE]
        
        creative_score = sum(needs.get(intent, 0) for intent in creative_intents)
        analytical_score = sum(needs.get(intent, 0) for intent in analytical_intents)
        
        if creative_score + analytical_score == 0:
            return 0.5
        
        return creative_score / (creative_score + analytical_score)
    
    def _calculate_context_dependency(self, context: Optional[str], message: str) -> float:
        """Calculate how much this query depends on previous context"""
        if not context:
            return 0.1
        
        context_words = ['previous', 'earlier', 'above', 'that', 'it', 'this solution', 'the code']
        dependency = 0.0
        
        for word in context_words:
            if word in message.lower():
                dependency += 0.2
        
        return min(dependency, 1.0)

    def route_to_models(
        self, 
        intent_vector: IntentVector, 
        available_models: List[str],
        max_models: int = 5
    ) -> List[Tuple[str, float, List[IntentType]]]:
        """
        Route intent vector to optimal models.
        
        Returns:
            List of (model_id, overall_score, assigned_intents)
        """
        model_scores = []
        
        for model_id in available_models:
            if model_id not in self.model_skills:
                continue
                
            model = self.model_skills[model_id]
            assigned_intents = []
            total_score = 0.0
            
            # Score this model against all active intents
            for intent_type, confidence in intent_vector.needs.items():
                if confidence > 0.1:  # Only consider significant intents
                    skill_level = model.skills.get(intent_type, 0.0)
                    intent_score = confidence * (skill_level / 10.0)
                    
                    if intent_score > 0.3:  # Threshold for assignment
                        assigned_intents.append(intent_type)
                        total_score += intent_score
            
            # Apply performance adjustments
            performance_bonus = (
                (1 - model.performance_metrics.get("avg_latency_ms", 1000) / 2000) * 0.1 +
                model.performance_metrics.get("accuracy_score", 0.8) * 0.1
            )
            
            # Complexity matching
            if intent_vector.complexity > 0.7 and model.context_window > 50000:
                total_score += 0.2
            
            if assigned_intents:  # Only include models with assigned tasks
                model_scores.append((model_id, total_score + performance_bonus, assigned_intents))
        
        # Sort by score and return top models
        model_scores.sort(key=lambda x: x[1], reverse=True)
        return model_scores[:max_models]

    def update_historical_performance(
        self, 
        model_id: str, 
        intent_type: IntentType, 
        performance_score: float
    ):
        """Update historical performance tracking"""
        self.historical_performance[model_id][intent_type] = (
            self.historical_performance[model_id][intent_type] * 0.8 + 
            performance_score * 0.2
        )
        
        # Update model skills based on performance
        if model_id in self.model_skills:
            current_skill = self.model_skills[model_id].skills[intent_type]
            self.model_skills[model_id].skills[intent_type] = (
                current_skill * 0.9 + performance_score * 0.1
            )

    def get_swarm_size_recommendation(self, intent_vector: IntentVector) -> int:
        """Recommend optimal swarm size based on query complexity"""
        if intent_vector.complexity < 0.3:
            return 1  # Simple queries
        elif intent_vector.complexity < 0.6:
            return 3  # Moderate complexity
        elif intent_vector.complexity < 0.8:
            return 5  # High complexity
        else:
            return 7  # Maximum complexity

# Global classifier instance
intent_classifier = IntentClassifier()