"""
DAC Memory Lattice - Cross-Model Shared Memory System

Every model run produces insights, facts, tasks, and contradictions that get stored
in a local memory lattice. Each new model gets compressed context, contradiction
notes, previous outputs, and critical warnings.

This turns "multiple LLMs" into an Interconnected Intelligence Network.
"""

from typing import Dict, List, Any, Optional, Tuple, Set
from dataclasses import dataclass, field
from enum import Enum
import asyncio
import json
import time
import hashlib
from collections import defaultdict
from app.services.intent_classifier import IntentType

class InsightType(Enum):
    """Categories of insights stored in memory lattice"""
    FACT = "fact"                    # Verified factual information
    HYPOTHESIS = "hypothesis"        # Unverified claims or theories
    TASK = "task"                   # Action items or next steps
    CONTRADICTION = "contradiction"  # Conflicting information
    WARNING = "warning"             # Important cautions or risks
    PATTERN = "pattern"             # Recurring themes or structures
    DEPENDENCY = "dependency"       # Relationships between concepts
    METRIC = "metric"               # Quantitative measurements

@dataclass
class Insight:
    """Individual piece of knowledge in the memory lattice"""
    id: str = ""
    content: str = ""
    insight_type: InsightType = InsightType.FACT
    source_model: str = ""
    confidence: float = 0.0
    intent_types: List[IntentType] = field(default_factory=list)
    context: str = ""
    timestamp: float = field(default_factory=time.time)
    citations: List[str] = field(default_factory=list)
    related_insights: List[str] = field(default_factory=list)  # IDs of related insights
    contradicts: List[str] = field(default_factory=list)       # IDs of contradicted insights
    validation_count: int = 0  # How many models have validated this
    tags: Set[str] = field(default_factory=set)

    def __post_init__(self):
        if not self.id:
            self.id = self._generate_id()
    
    def _generate_id(self) -> str:
        """Generate unique ID based on content hash"""
        content_hash = hashlib.md5(self.content.encode()).hexdigest()
        return f"insight_{content_hash[:8]}_{int(self.timestamp)}"

@dataclass
class Contradiction:
    """Represents conflicting information in the memory lattice"""
    id: str = ""
    insight_a_id: str = ""
    insight_b_id: str = ""
    conflict_type: str = "factual"  # factual, methodological, interpretive
    severity: float = 0.5           # 0-1, how serious the contradiction is
    resolution_status: str = "unresolved"  # unresolved, investigating, resolved
    resolution: Optional[str] = None
    detected_by: str = ""
    timestamp: float = field(default_factory=time.time)

    def __post_init__(self):
        if not self.id:
            self.id = f"contradiction_{hashlib.md5(f'{self.insight_a_id}_{self.insight_b_id}'.encode()).hexdigest()[:8]}"

@dataclass
class ContextSnapshot:
    """Compressed context for new model executions"""
    relevant_insights: List[Insight]
    active_contradictions: List[Contradiction]
    key_facts: List[str]
    warnings: List[str]
    previous_outputs: List[str]
    session_summary: str
    complexity_level: float
    estimated_tokens: int

class MemoryLattice:
    """Cross-model shared memory system for collaborative intelligence"""
    
    def __init__(self, max_insights: int = 1000, max_context_tokens: int = 4000):
        self.insights: Dict[str, Insight] = {}
        self.contradictions: Dict[str, Contradiction] = {}
        self.insight_graph: Dict[str, Set[str]] = defaultdict(set)  # Relationships
        self.temporal_sequence: List[str] = []  # Chronological insight order
        self.max_insights = max_insights
        self.max_context_tokens = max_context_tokens
        
        # Indexes for fast retrieval
        self.by_intent_type: Dict[IntentType, Set[str]] = defaultdict(set)
        self.by_source_model: Dict[str, Set[str]] = defaultdict(set)
        self.by_insight_type: Dict[InsightType, Set[str]] = defaultdict(set)
        self.by_tags: Dict[str, Set[str]] = defaultdict(set)
    
    async def add_insight(self, insight: Insight) -> str:
        """Add new insight to memory lattice with relationship detection"""
        
        # Check for duplicates
        existing_id = self._find_duplicate_insight(insight)
        if existing_id:
            # Reinforce existing insight
            self.insights[existing_id].validation_count += 1
            self.insights[existing_id].confidence = min(
                1.0, 
                self.insights[existing_id].confidence + 0.1
            )
            return existing_id
        
        # Add new insight
        self.insights[insight.id] = insight
        self.temporal_sequence.append(insight.id)
        
        # Update indexes
        for intent_type in insight.intent_types:
            self.by_intent_type[intent_type].add(insight.id)
        self.by_source_model[insight.source_model].add(insight.id)
        self.by_insight_type[insight.insight_type].add(insight.id)
        for tag in insight.tags:
            self.by_tags[tag].add(insight.id)
        
        # Detect relationships and contradictions
        await self._detect_relationships(insight)
        await self._detect_contradictions(insight)
        
        # Cleanup if needed
        if len(self.insights) > self.max_insights:
            await self._cleanup_old_insights()
        
        return insight.id
    
    async def get_relevant_context(
        self, 
        query: str, 
        intent_vector: Any,
        max_tokens: Optional[int] = None
    ) -> str:
        """Get compressed, relevant context for a new model execution"""
        
        max_tokens = max_tokens or self.max_context_tokens
        
        # Find relevant insights
        relevant_insights = await self._find_relevant_insights(query, intent_vector, limit=20)
        
        # Get active contradictions
        active_contradictions = [
            c for c in self.contradictions.values() 
            if c.resolution_status == "unresolved"
        ]
        
        # Build context snapshot
        context_snapshot = ContextSnapshot(
            relevant_insights=relevant_insights,
            active_contradictions=active_contradictions,
            key_facts=self._extract_key_facts(relevant_insights),
            warnings=self._extract_warnings(relevant_insights),
            previous_outputs=self._get_recent_outputs(limit=3),
            session_summary=self._generate_session_summary(),
            complexity_level=self._estimate_complexity(),
            estimated_tokens=0
        )
        
        # Compress to fit token limit
        compressed_context = await self._compress_context(context_snapshot, max_tokens)
        context_snapshot.estimated_tokens = len(compressed_context.split()) * 1.3  # Rough estimate
        
        return compressed_context
    
    async def update_insight_relationships(self, insight_id: str, related_ids: List[str]):
        """Manually update insight relationships"""
        if insight_id in self.insights:
            for related_id in related_ids:
                if related_id in self.insights:
                    self.insight_graph[insight_id].add(related_id)
                    self.insight_graph[related_id].add(insight_id)
                    
                    # Update insight objects
                    if related_id not in self.insights[insight_id].related_insights:
                        self.insights[insight_id].related_insights.append(related_id)
                    if insight_id not in self.insights[related_id].related_insights:
                        self.insights[related_id].related_insights.append(insight_id)
    
    async def mark_contradiction_resolved(
        self, 
        contradiction_id: str, 
        resolution: str,
        winning_insight_id: Optional[str] = None
    ):
        """Mark a contradiction as resolved with explanation"""
        if contradiction_id in self.contradictions:
            contradiction = self.contradictions[contradiction_id]
            contradiction.resolution_status = "resolved"
            contradiction.resolution = resolution
            
            # If one insight wins, boost its confidence
            if winning_insight_id and winning_insight_id in self.insights:
                self.insights[winning_insight_id].confidence = min(
                    1.0, 
                    self.insights[winning_insight_id].confidence + 0.15
                )
    
    async def get_contradiction_summary(self) -> Dict[str, Any]:
        """Get summary of current contradictions for transparency"""
        active = [c for c in self.contradictions.values() if c.resolution_status == "unresolved"]
        resolved = [c for c in self.contradictions.values() if c.resolution_status == "resolved"]
        
        return {
            "active_contradictions": len(active),
            "resolved_contradictions": len(resolved),
            "high_severity_active": len([c for c in active if c.severity > 0.7]),
            "recent_contradictions": [
                {
                    "id": c.id,
                    "type": c.conflict_type,
                    "severity": c.severity,
                    "insight_a": self.insights.get(c.insight_a_id, {}).get("content", "")[:100],
                    "insight_b": self.insights.get(c.insight_b_id, {}).get("content", "")[:100]
                }
                for c in sorted(active, key=lambda x: x.timestamp, reverse=True)[:3]
            ]
        }
    
    async def get_insights_by_intent(self, intent_type: IntentType, limit: int = 10) -> List[Insight]:
        """Get insights filtered by intent type"""
        insight_ids = list(self.by_intent_type[intent_type])
        
        # Sort by confidence and recency
        insights = [self.insights[id] for id in insight_ids if id in self.insights]
        insights.sort(key=lambda x: (x.confidence, x.timestamp), reverse=True)
        
        return insights[:limit]
    
    async def search_insights(
        self, 
        query: str, 
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Insight]:
        """Search insights with optional filters"""
        
        query_words = set(query.lower().split())
        matching_insights = []
        
        for insight in self.insights.values():
            # Text matching
            insight_words = set(insight.content.lower().split())
            word_overlap = len(query_words & insight_words)
            
            if word_overlap > 0:
                relevance_score = word_overlap / len(query_words)
                
                # Apply filters
                if filters:
                    if filters.get("insight_type") and insight.insight_type != filters["insight_type"]:
                        continue
                    if filters.get("min_confidence") and insight.confidence < filters["min_confidence"]:
                        continue
                    if filters.get("source_model") and insight.source_model != filters["source_model"]:
                        continue
                    if filters.get("tags") and not filters["tags"].intersection(insight.tags):
                        continue
                
                matching_insights.append((insight, relevance_score))
        
        # Sort by relevance and confidence
        matching_insights.sort(key=lambda x: (x[1], x[0].confidence), reverse=True)
        
        return [insight for insight, _ in matching_insights[:20]]
    
    def get_memory_statistics(self) -> Dict[str, Any]:
        """Get comprehensive memory lattice statistics"""
        return {
            "total_insights": len(self.insights),
            "total_contradictions": len(self.contradictions),
            "active_contradictions": len([c for c in self.contradictions.values() if c.resolution_status == "unresolved"]),
            "insight_types": {
                insight_type.value: len(insight_ids) 
                for insight_type, insight_ids in self.by_insight_type.items()
            },
            "source_models": {
                model: len(insight_ids)
                for model, insight_ids in self.by_source_model.items()
            },
            "avg_confidence": sum(i.confidence for i in self.insights.values()) / len(self.insights) if self.insights else 0,
            "memory_utilization": len(self.insights) / self.max_insights,
            "relationship_density": len(self.insight_graph) / len(self.insights) if self.insights else 0
        }
    
    # Private methods
    
    def _find_duplicate_insight(self, insight: Insight) -> Optional[str]:
        """Check for duplicate or very similar insights"""
        for existing_id, existing_insight in self.insights.items():
            if existing_insight.insight_type == insight.insight_type:
                # Simple similarity check (enhance with embeddings in production)
                existing_words = set(existing_insight.content.lower().split())
                new_words = set(insight.content.lower().split())
                
                overlap = len(existing_words & new_words)
                total = len(existing_words | new_words)
                
                if total > 0 and overlap / total > 0.8:  # 80% word overlap
                    return existing_id
        
        return None
    
    async def _detect_relationships(self, new_insight: Insight):
        """Detect relationships with existing insights"""
        
        for existing_id, existing_insight in self.insights.items():
            if existing_id == new_insight.id:
                continue
            
            # Check for relationships
            relationship_score = self._calculate_relationship_score(new_insight, existing_insight)
            
            if relationship_score > 0.5:  # Threshold for relationship
                self.insight_graph[new_insight.id].add(existing_id)
                self.insight_graph[existing_id].add(new_insight.id)
                
                new_insight.related_insights.append(existing_id)
                existing_insight.related_insights.append(new_insight.id)
    
    async def _detect_contradictions(self, new_insight: Insight):
        """Detect contradictions with existing insights"""
        
        for existing_id, existing_insight in self.insights.items():
            if existing_id == new_insight.id:
                continue
            
            # Check for contradictions
            is_contradiction, severity = self._check_contradiction(new_insight, existing_insight)
            
            if is_contradiction:
                contradiction = Contradiction(
                    insight_a_id=existing_id,
                    insight_b_id=new_insight.id,
                    conflict_type="factual",
                    severity=severity,
                    detected_by="automatic"
                )
                
                self.contradictions[contradiction.id] = contradiction
                
                # Update insight objects
                new_insight.contradicts.append(existing_id)
                existing_insight.contradicts.append(new_insight.id)
    
    def _calculate_relationship_score(self, insight1: Insight, insight2: Insight) -> float:
        """Calculate how related two insights are"""
        
        # Intent overlap
        intent_overlap = len(set(insight1.intent_types) & set(insight2.intent_types))
        intent_score = intent_overlap * 0.3
        
        # Content similarity (simple word overlap)
        words1 = set(insight1.content.lower().split())
        words2 = set(insight2.content.lower().split())
        word_overlap = len(words1 & words2)
        word_total = len(words1 | words2)
        word_score = word_overlap / word_total if word_total > 0 else 0
        
        # Tag overlap
        tag_overlap = len(insight1.tags & insight2.tags)
        tag_score = tag_overlap * 0.1
        
        # Same insight type bonus
        type_score = 0.2 if insight1.insight_type == insight2.insight_type else 0
        
        return min(1.0, intent_score + word_score + tag_score + type_score)
    
    def _check_contradiction(self, insight1: Insight, insight2: Insight) -> Tuple[bool, float]:
        """Check if two insights contradict each other"""
        
        # Simple keyword-based contradiction detection
        contradiction_patterns = [
            ("not", "is"), ("cannot", "can"), ("impossible", "possible"),
            ("false", "true"), ("wrong", "correct"), ("never", "always")
        ]
        
        content1 = insight1.content.lower()
        content2 = insight2.content.lower()
        
        contradiction_score = 0.0
        
        for negative, positive in contradiction_patterns:
            if negative in content1 and positive in content2:
                contradiction_score += 0.3
            elif positive in content1 and negative in content2:
                contradiction_score += 0.3
        
        # Check for explicit negation patterns
        if "not " in content1 and any(word in content2 for word in content1.replace("not ", "").split()):
            contradiction_score += 0.4
        
        is_contradiction = contradiction_score > 0.5
        severity = min(contradiction_score, 1.0)
        
        return is_contradiction, severity
    
    async def _find_relevant_insights(
        self, 
        query: str, 
        intent_vector: Any, 
        limit: int
    ) -> List[Insight]:
        """Find insights most relevant to the current query"""
        
        scored_insights = []
        
        for insight in self.insights.values():
            relevance_score = self._calculate_relevance_score(insight, query, intent_vector)
            if relevance_score > 0.1:  # Minimum relevance threshold
                scored_insights.append((insight, relevance_score))
        
        # Sort by relevance score
        scored_insights.sort(key=lambda x: x[1], reverse=True)
        
        return [insight for insight, _ in scored_insights[:limit]]
    
    def _calculate_relevance_score(self, insight: Insight, query: str, intent_vector: Any) -> float:
        """Calculate how relevant an insight is to the current query"""
        
        # Text similarity
        query_words = set(query.lower().split())
        insight_words = set(insight.content.lower().split())
        text_similarity = len(query_words & insight_words) / len(query_words) if query_words else 0
        
        # Intent alignment
        intent_alignment = 0.0
        if hasattr(intent_vector, 'needs'):
            for intent_type in insight.intent_types:
                intent_alignment += intent_vector.needs.get(intent_type, 0)
            intent_alignment = min(intent_alignment, 1.0)
        
        # Recency bonus
        recency_bonus = max(0, 1 - (time.time() - insight.timestamp) / 3600)  # Decay over 1 hour
        
        # Confidence weighting
        confidence_weight = insight.confidence
        
        return (text_similarity * 0.4 + 
                intent_alignment * 0.3 + 
                recency_bonus * 0.1 + 
                confidence_weight * 0.2)
    
    def _extract_key_facts(self, insights: List[Insight]) -> List[str]:
        """Extract key facts from relevant insights"""
        facts = []
        for insight in insights:
            if insight.insight_type == InsightType.FACT and insight.confidence > 0.7:
                facts.append(insight.content)
        return facts[:5]  # Limit to top 5 facts
    
    def _extract_warnings(self, insights: List[Insight]) -> List[str]:
        """Extract warnings from relevant insights"""
        warnings = []
        for insight in insights:
            if insight.insight_type == InsightType.WARNING:
                warnings.append(insight.content)
        return warnings[:3]  # Limit to top 3 warnings
    
    def _get_recent_outputs(self, limit: int) -> List[str]:
        """Get recent synthesis outputs"""
        recent_outputs = []
        
        # Get recent synthesis insights
        for insight_id in reversed(self.temporal_sequence[-20:]):  # Last 20 insights
            insight = self.insights.get(insight_id)
            if insight and insight.source_model == "swarm_synthesis":
                recent_outputs.append(insight.content[:200] + "..." if len(insight.content) > 200 else insight.content)
                if len(recent_outputs) >= limit:
                    break
        
        return recent_outputs
    
    def _generate_session_summary(self) -> str:
        """Generate a brief summary of the current session"""
        if not self.insights:
            return "New session - no previous context."
        
        # Count by insight type
        type_counts = defaultdict(int)
        for insight in self.insights.values():
            type_counts[insight.insight_type] += 1
        
        # Recent activity summary
        recent_insights = [
            self.insights[id] for id in self.temporal_sequence[-5:] 
            if id in self.insights
        ]
        
        summary_parts = [
            f"Session has {len(self.insights)} insights",
            f"Recent activity: {', '.join(insight.insight_type.value for insight in recent_insights)}"
        ]
        
        if self.contradictions:
            active_contradictions = [c for c in self.contradictions.values() if c.resolution_status == "unresolved"]
            if active_contradictions:
                summary_parts.append(f"{len(active_contradictions)} active contradictions need resolution")
        
        return ". ".join(summary_parts) + "."
    
    def _estimate_complexity(self) -> float:
        """Estimate current session complexity"""
        if not self.insights:
            return 0.1
        
        # Base complexity on insights and contradictions
        base_complexity = min(len(self.insights) / 50, 0.5)  # More insights = higher complexity
        
        # Contradiction penalty
        active_contradictions = [c for c in self.contradictions.values() if c.resolution_status == "unresolved"]
        contradiction_penalty = min(len(active_contradictions) * 0.1, 0.3)
        
        # Relationship density (more connected = more complex)
        relationship_density = len(self.insight_graph) / len(self.insights) if self.insights else 0
        
        return min(1.0, base_complexity + contradiction_penalty + relationship_density * 0.2)
    
    async def _compress_context(self, context_snapshot: ContextSnapshot, max_tokens: int) -> str:
        """Compress context snapshot to fit token limit"""
        
        context_parts = []
        
        # Essential warnings (always include)
        if context_snapshot.warnings:
            context_parts.append("⚠️ **WARNINGS:**")
            for warning in context_snapshot.warnings[:2]:
                context_parts.append(f"• {warning}")
        
        # Active contradictions (high priority)
        if context_snapshot.active_contradictions:
            context_parts.append("\n🔥 **ACTIVE CONTRADICTIONS:**")
            for contradiction in context_snapshot.active_contradictions[:2]:
                insight_a = next((i for i in context_snapshot.relevant_insights if i.id == contradiction.insight_a_id), None)
                insight_b = next((i for i in context_snapshot.relevant_insights if i.id == contradiction.insight_b_id), None)
                
                if insight_a and insight_b:
                    context_parts.append(f"• {insight_a.content[:50]}... vs {insight_b.content[:50]}...")
        
        # Key facts
        if context_snapshot.key_facts:
            context_parts.append("\n📊 **KEY FACTS:**")
            for fact in context_snapshot.key_facts[:3]:
                context_parts.append(f"• {fact[:100]}..." if len(fact) > 100 else f"• {fact}")
        
        # Recent insights (compressed)
        if context_snapshot.relevant_insights:
            context_parts.append("\n🧠 **RELEVANT INSIGHTS:**")
            for insight in context_snapshot.relevant_insights[:5]:
                source_info = f"[{insight.source_model}]"
                content = insight.content[:80] + "..." if len(insight.content) > 80 else insight.content
                context_parts.append(f"• {source_info} {content}")
        
        # Session summary
        if context_snapshot.session_summary:
            context_parts.append(f"\n📋 **SESSION:** {context_snapshot.session_summary}")
        
        full_context = "\n".join(context_parts)
        
        # Rough token estimation and truncation
        estimated_tokens = len(full_context.split()) * 1.3
        if estimated_tokens > max_tokens:
            # Truncate to fit
            target_chars = int(len(full_context) * (max_tokens / estimated_tokens))
            full_context = full_context[:target_chars] + "..."
        
        return full_context
    
    async def _cleanup_old_insights(self):
        """Remove oldest insights when memory is full"""
        
        # Remove oldest 10% of insights
        cleanup_count = int(self.max_insights * 0.1)
        oldest_ids = self.temporal_sequence[:cleanup_count]
        
        for insight_id in oldest_ids:
            # Remove from all indexes
            if insight_id in self.insights:
                insight = self.insights[insight_id]
                
                for intent_type in insight.intent_types:
                    self.by_intent_type[intent_type].discard(insight_id)
                
                self.by_source_model[insight.source_model].discard(insight_id)
                self.by_insight_type[insight.insight_type].discard(insight_id)
                
                for tag in insight.tags:
                    self.by_tags[tag].discard(insight_id)
                
                # Remove relationships
                for related_id in self.insight_graph[insight_id]:
                    self.insight_graph[related_id].discard(insight_id)
                del self.insight_graph[insight_id]
                
                # Remove insight
                del self.insights[insight_id]
        
        # Update temporal sequence
        self.temporal_sequence = self.temporal_sequence[cleanup_count:]