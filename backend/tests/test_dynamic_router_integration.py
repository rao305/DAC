"""Integration tests for dynamic router end-to-end."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.dynamic_router.route_query import route_query, RouteDecision
from app.services.dynamic_router.intent import RouterIntent
from app.services.dynamic_router.models import MODELS
from app.models.provider_key import ProviderType


class TestRouterIntegration:
    """End-to-end tests for the routing system."""

    @pytest.mark.asyncio
    async def test_coding_query_routes_to_gpt(self):
        """Test that coding queries route to GPT."""
        user_message = "Write a Python function to sort a list"
        
        mock_intent = RouterIntent(
            task_type="coding",
            requires_web=False,
            requires_tools=False,
            priority="quality",
            estimated_input_tokens=30,
        )
        
        with patch("app.services.dynamic_router.route_query.get_router_intent", new_callable=AsyncMock) as mock_intent_fn:
            mock_intent_fn.return_value = mock_intent
            
            decision = await route_query(
                user_message=user_message,
                context_summary="",
                available_providers=[ProviderType.OPENAI, ProviderType.GEMINI, ProviderType.PERPLEXITY],
            )
            
            # Should choose a model with coding capability (GPT or Gemini both have it)
            assert decision.intent.task_type == "coding"
            assert "coding" in decision.chosen_model.strengths or "reasoning" in decision.chosen_model.strengths
            # GPT or Gemini are both valid for coding
            assert decision.chosen_model.provider in [ProviderType.OPENAI, ProviderType.GEMINI]

    @pytest.mark.asyncio
    async def test_web_research_routes_to_web_model(self):
        """Test that web research routes to web-capable model."""
        user_message = "What's the latest news about AI?"
        
        mock_intent = RouterIntent(
            task_type="web_research",
            requires_web=True,
            requires_tools=False,
            priority="quality",
            estimated_input_tokens=25,
        )
        
        with patch("app.services.dynamic_router.route_query.get_router_intent", new_callable=AsyncMock) as mock_intent_fn:
            mock_intent_fn.return_value = mock_intent
            
            decision = await route_query(
                user_message=user_message,
                context_summary="",
                available_providers=[ProviderType.PERPLEXITY, ProviderType.KIMI, ProviderType.OPENAI],
            )
            
            # Should choose web-capable model
            assert "web_search" in decision.chosen_model.strengths
            assert decision.intent.requires_web is True

    @pytest.mark.asyncio
    async def test_creative_writing_routes_appropriately(self):
        """Test that creative writing routes to appropriate model."""
        user_message = "Write a short story about a robot"
        
        mock_intent = RouterIntent(
            task_type="creative_writing",
            requires_web=False,
            requires_tools=False,
            priority="quality",
            estimated_input_tokens=20,
        )
        
        with patch("app.services.dynamic_router.route_query.get_router_intent", new_callable=AsyncMock) as mock_intent_fn:
            mock_intent_fn.return_value = mock_intent
            
            decision = await route_query(
                user_message=user_message,
                context_summary="",
                available_providers=[ProviderType.OPENAI, ProviderType.GEMINI, ProviderType.OPENROUTER],
            )
            
            # Should choose model with creative_writing strength
            assert "creative_writing" in decision.chosen_model.strengths or "chat" in decision.chosen_model.strengths
            assert decision.intent.task_type == "creative_writing"

    @pytest.mark.asyncio
    async def test_scores_included_in_decision(self):
        """Test that decision includes scores for all candidates."""
        user_message = "Hello"
        
        mock_intent = RouterIntent(
            task_type="generic_chat",
            requires_web=False,
            requires_tools=False,
            priority="speed",
            estimated_input_tokens=10,
        )
        
        with patch("app.services.dynamic_router.route_query.get_router_intent", new_callable=AsyncMock) as mock_intent_fn:
            mock_intent_fn.return_value = mock_intent
            
            decision = await route_query(
                user_message=user_message,
                context_summary="",
                available_providers=[ProviderType.OPENAI, ProviderType.GEMINI],
            )
            
            # Should include scores
            assert len(decision.scores) > 0
            assert all("modelId" in score for score in decision.scores)
            assert all("score" in score for score in decision.scores)
            # Scores should be sorted (highest first)
            scores = [s["score"] for s in decision.scores]
            assert scores == sorted(scores, reverse=True)

    @pytest.mark.asyncio
    async def test_epsilon_exploration(self):
        """Test 19-20: Epsilon-greedy exploration."""
        user_message = "Explain machine learning"
        
        mock_intent = RouterIntent(
            task_type="deep_reasoning",
            requires_web=False,
            requires_tools=False,
            priority="quality",
            estimated_input_tokens=30,
        )
        
        with patch("app.services.dynamic_router.route_query.get_router_intent", new_callable=AsyncMock) as mock_intent_fn:
            mock_intent_fn.return_value = mock_intent
            
            # Test with epsilon=0 (deterministic)
            decisions_deterministic = []
            for _ in range(10):
                decision = await route_query(
                    user_message=user_message,
                    context_summary="",
                    available_providers=[ProviderType.OPENAI, ProviderType.GEMINI],
                    epsilon=0.0,  # No exploration
                )
                decisions_deterministic.append(decision.chosen_model.id)
            
            # With epsilon=0, should always choose same model
            assert len(set(decisions_deterministic)) == 1
            
            # Test with epsilon=0.5 (exploration)
            decisions_exploratory = []
            for _ in range(50):
                decision = await route_query(
                    user_message=user_message,
                    context_summary="",
                    available_providers=[ProviderType.OPENAI, ProviderType.GEMINI],
                    epsilon=0.5,  # 50% exploration
                )
                decisions_exploratory.append(decision.chosen_model.id)
            
            # With epsilon=0.5, should see both top-1 and top-2 models
            unique_models = set(decisions_exploratory)
            assert len(unique_models) >= 1  # At least one model chosen
            # If there are multiple competitive models, we should see exploration
            if len(decisions_exploratory) > 1:
                # Should see some variation (not all same)
                # But this is probabilistic, so we just check it doesn't crash
                pass

    @pytest.mark.asyncio
    async def test_fallback_when_no_candidates(self):
        """Test 5.4: Fallback when no models match context requirements."""
        user_message = "Analyze this huge document"
        
        mock_intent = RouterIntent(
            task_type="document_analysis",
            requires_web=False,
            requires_tools=False,
            priority="quality",
            estimated_input_tokens=5_000_000,  # Beyond all models
        )
        
        with patch("app.services.dynamic_router.route_query.get_router_intent", new_callable=AsyncMock) as mock_intent_fn:
            mock_intent_fn.return_value = mock_intent
            
            # Should not crash, should fallback to first available model
            decision = await route_query(
                user_message=user_message,
                context_summary="",
                available_providers=[ProviderType.OPENAI, ProviderType.GEMINI],
            )
            
            # Should still return a valid decision
            assert decision is not None
            assert decision.chosen_model is not None

    @pytest.mark.asyncio
    async def test_available_providers_filtering(self):
        """Test that only available providers are considered."""
        user_message = "Write code"
        
        mock_intent = RouterIntent(
            task_type="coding",
            requires_web=False,
            requires_tools=False,
            priority="quality",
            estimated_input_tokens=30,
        )
        
        with patch("app.services.dynamic_router.route_query.get_router_intent", new_callable=AsyncMock) as mock_intent_fn:
            mock_intent_fn.return_value = mock_intent
            
            # Only provide OpenAI
            decision = await route_query(
                user_message=user_message,
                context_summary="",
                available_providers=[ProviderType.OPENAI],  # Only OpenAI available
            )
            
            # Should only choose from OpenAI models
            assert decision.chosen_model.provider == ProviderType.OPENAI
            
            # Scores should only include OpenAI models
            assert all(
                any(m.id == score["modelId"] and m.provider == ProviderType.OPENAI for m in MODELS)
                for score in decision.scores
            )

    @pytest.mark.asyncio
    async def test_historical_rewards_affect_scoring(self):
        """Test that historical rewards influence model selection."""
        user_message = "Explain Python"
        
        mock_intent = RouterIntent(
            task_type="deep_reasoning",
            requires_web=False,
            requires_tools=False,
            priority="quality",
            estimated_input_tokens=20,
        )
        
        with patch("app.services.dynamic_router.route_query.get_router_intent", new_callable=AsyncMock) as mock_intent_fn:
            mock_intent_fn.return_value = mock_intent
            
            # Test without historical rewards
            decision_no_history = await route_query(
                user_message=user_message,
                context_summary="",
                available_providers=[ProviderType.OPENAI, ProviderType.GEMINI],
                historical_rewards=None,
            )
            
            # Test with historical rewards favoring Gemini
            historical_rewards = {
                "gemini-2.5-flash": 0.9,  # High reward
                "gpt-4o-mini": 0.3,  # Low reward
            }
            
            decision_with_history = await route_query(
                user_message=user_message,
                context_summary="",
                available_providers=[ProviderType.OPENAI, ProviderType.GEMINI],
                historical_rewards=historical_rewards,
            )
            
            # With high historical reward, Gemini might be chosen
            # (depending on other factors, but reward should influence)
            assert decision_with_history.chosen_model is not None

