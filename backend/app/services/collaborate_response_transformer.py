"""
Response transformer for Enhanced Collaboration API.

Converts the enhanced collaboration service response into the frontend-friendly
API contract format with proper type structure and metadata.
"""

import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.models.collaboration import CollabRun, CollabStep, CollabRole
from app.models.provider_key import ProviderType

class CollaborateResponseTransformer:
    """Transforms enhanced collaboration results into API-friendly format."""
    
    def __init__(self):
        # Map internal CollabRole to frontend InternalStageRole
        self.role_mapping = {
            CollabRole.ANALYST: "analyst",
            CollabRole.RESEARCHER: "researcher", 
            CollabRole.CREATOR: "creator",
            CollabRole.CRITIC: "critic",
            CollabRole.SYNTHESIZER: "internal_synth"
        }
        
        # Map providers to frontend ProviderName
        self.provider_mapping = {
            "openai": "openai",
            "gemini": "google",
            "perplexity": "perplexity", 
            "kimi": "kimi",
            "openrouter": "openrouter"
        }
        
        # Role display names
        self.role_titles = {
            "analyst": "Analyst",
            "researcher": "Researcher",
            "creator": "Creator", 
            "critic": "Critic",
            "internal_synth": "Internal Report"
        }
        
        # Model display names
        self.model_display_names = {
            "gpt-4o": "GPT-4o",
            "gpt-4o-mini": "GPT-4o Mini",
            "gemini-1.5-pro": "Gemini 1.5 Pro",
            "gemini-2.5-flash": "Gemini 2.5 Flash",
            "llama-3.1-sonar-large-128k-online": "Perplexity Sonar",
            "moonshot-v1-8k": "Kimi K2",
            "deepseek/deepseek-chat": "DeepSeek Chat",
            "meta-llama/llama-3.1-70b-instruct": "Llama 3.1 70B"
        }
        
        # External reviewer source mapping
        self.reviewer_source_mapping = {
            "Factual Expert": "perplexity",
            "Perspective Analyst": "gemini", 
            "Clarity Specialist": "gpt",
            "Alternative Perspective": "kimi",
            "Technical Depth": "openrouter",
            "Systematic Analysis": "openrouter"
        }
    
    def transform_collaboration_response(
        self, 
        enhanced_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Transform enhanced collaboration result into API contract format.
        
        Args:
            enhanced_result: Result from CollaborationService.start_collaboration
            
        Returns:
            Dict matching CollaborateResponse TypeScript interface
        """
        
        collab_run = enhanced_result["collab_run"]
        
        # Build final answer
        final_answer = self._build_final_answer(enhanced_result)
        
        # Build internal pipeline
        internal_pipeline = self._build_internal_pipeline(
            collab_run=collab_run,
            compressed_report=enhanced_result.get("compressed_report")
        )
        
        # Build external reviews
        external_reviews = self._build_external_reviews(
            enhanced_result.get("external_critiques", [])
        )
        
        # Build metadata
        meta = self._build_run_metadata(
            collab_run=collab_run,
            enhanced_result=enhanced_result
        )
        
        return {
            "final_answer": final_answer,
            "internal_pipeline": internal_pipeline,
            "external_reviews": external_reviews,
            "meta": meta
        }
    
    def _build_final_answer(self, enhanced_result: Dict[str, Any]) -> Dict[str, Any]:
        """Build final answer section."""
        
        synthesis_metadata = enhanced_result.get("synthesis_metadata", {})
        
        # Determine confidence level from synthesis metadata
        confidence_level = "medium"  # default
        if synthesis_metadata:
            synth_confidence = synthesis_metadata.get("confidence_level", "medium")
            confidence_level = synth_confidence
        
        explanation = {
            "used_internal_report": True,
            "external_reviews_considered": enhanced_result.get("reviewers_consulted", 0),
            "confidence_level": confidence_level
        }
        
        # Use meta-synthesis model (GPT-4o by default)
        model_info = self._build_model_info("openai", "gpt-4o")
        
        return {
            "content": enhanced_result["final_answer"],
            "model": model_info,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "explanation": explanation
        }
    
    def _build_internal_pipeline(
        self,
        collab_run: CollabRun,
        compressed_report: Optional[str]
    ) -> Dict[str, Any]:
        """Build internal pipeline section."""
        
        stages = []
        
        # Convert collaboration steps to internal stages
        for step in collab_run.steps:
            stage = {
                "id": f"stage_{step.role.value}",
                "role": self.role_mapping.get(step.role, step.role.value),
                "title": self.role_titles.get(
                    self.role_mapping.get(step.role, step.role.value), 
                    step.role.value.title()
                ),
                "model": self._build_model_info(step.provider, step.model),
                "content": step.output_final or step.output_draft or "",
                "created_at": (step.completed_at or datetime.utcnow()).isoformat() + "Z",
                "used_in_final_answer": True  # Assume all stages contribute
            }
            
            # Add timing if available
            if step.started_at and step.completed_at:
                duration = (step.completed_at - step.started_at).total_seconds() * 1000
                stage["latency_ms"] = int(duration)
            
            stages.append(stage)
        
        pipeline = {"stages": stages}
        
        # Add compressed report if available
        if compressed_report:
            pipeline["compressed_report"] = {
                "model": self._build_model_info("openai", "gpt-4o-mini"),
                "content": compressed_report
            }
        
        return pipeline
    
    def _build_external_reviews(
        self, 
        external_critiques: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Build external reviews section."""
        
        reviews = []
        
        for idx, critique in enumerate(external_critiques):
            if critique.get("status") != "success" or not critique.get("critique"):
                continue
                
            reviewer_name = critique.get("reviewer", f"External Expert {idx + 1}")
            provider = critique.get("provider", "openai")
            model = critique.get("model", "gpt-4o")
            
            # Map reviewer to source
            source = self.reviewer_source_mapping.get(reviewer_name, "gpt")
            
            # Determine stance (simplified - you could add NLP analysis here)
            stance = self._analyze_review_stance(critique["critique"])
            
            review = {
                "id": f"rev_{idx + 1}",
                "source": source,
                "model": self._build_model_info(provider, model),
                "stance": stance,
                "content": critique["critique"],
                "created_at": datetime.utcnow().isoformat() + "Z"
            }
            
            reviews.append(review)
        
        return reviews
    
    def _build_run_metadata(
        self,
        collab_run: CollabRun,
        enhanced_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build collaboration run metadata."""
        
        # Collect all models involved
        models_involved = []
        
        # Internal pipeline models
        for step in collab_run.steps:
            model_info = self._build_model_info(step.provider, step.model)
            if model_info not in models_involved:
                models_involved.append(model_info)
        
        # External review models (if available)
        for critique in enhanced_result.get("external_critiques", []):
            if critique.get("status") == "success":
                provider = critique.get("provider", "openai")
                model = critique.get("model", "gpt-4o")
                model_info = self._build_model_info(provider, model)
                if model_info not in models_involved:
                    models_involved.append(model_info)
        
        # Meta-synthesis model
        meta_model = self._build_model_info("openai", "gpt-4o")
        if meta_model not in models_involved:
            models_involved.append(meta_model)
        
        return {
            "run_id": str(collab_run.id),
            "mode": "auto",  # Default mode
            "started_at": (collab_run.started_at or datetime.utcnow()).isoformat() + "Z",
            "finished_at": (collab_run.completed_at or datetime.utcnow()).isoformat() + "Z",
            "total_latency_ms": enhanced_result.get("total_time_ms"),
            "models_involved": models_involved
        }
    
    def _build_model_info(self, provider: str, model_slug: str) -> Dict[str, Any]:
        """Build model info object."""
        
        # Map provider to frontend format
        frontend_provider = self.provider_mapping.get(provider, provider)
        
        # Get display name
        display_name = self.model_display_names.get(model_slug, model_slug)
        
        return {
            "provider": frontend_provider,
            "model_slug": model_slug,
            "display_name": display_name
        }
    
    def _analyze_review_stance(self, review_content: str) -> str:
        """
        Simple heuristic to determine review stance.
        You could replace this with a more sophisticated NLP analysis.
        """
        
        content_lower = review_content.lower()
        
        # Look for disagreement indicators
        disagree_indicators = [
            "incorrect", "wrong", "error", "disagree", "missing", "lacks",
            "fails to", "overlooks", "ignores", "significant issues"
        ]
        
        # Look for agreement indicators  
        agree_indicators = [
            "correct", "accurate", "agree", "good", "solid", "comprehensive",
            "well done", "appropriate", "suitable"
        ]
        
        # Look for mixed indicators
        mixed_indicators = [
            "however", "but", "although", "partially", "some issues",
            "mostly correct", "generally good"
        ]
        
        disagree_count = sum(1 for indicator in disagree_indicators if indicator in content_lower)
        agree_count = sum(1 for indicator in agree_indicators if indicator in content_lower)
        mixed_count = sum(1 for indicator in mixed_indicators if indicator in content_lower)
        
        # Determine stance based on counts
        if mixed_count > 0 or (disagree_count > 0 and agree_count > 0):
            return "mixed"
        elif disagree_count > agree_count:
            return "disagree"
        elif agree_count > disagree_count:
            return "agree"
        else:
            return "unknown"


# Convenience function for the API endpoint
def transform_enhanced_collaboration_response(enhanced_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform enhanced collaboration result into frontend API format.
    
    Args:
        enhanced_result: Result from CollaborationService.start_collaboration
        
    Returns:
        Dict matching CollaborateResponse TypeScript interface
    """
    transformer = CollaborateResponseTransformer()
    return transformer.transform_collaboration_response(enhanced_result)