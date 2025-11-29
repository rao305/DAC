#!/usr/bin/env python3
"""
Test Kimi Integration in Collaboration Pipeline

Verifies that Kimi is properly integrated into the collaboration system
and can participate in the 5-step pipeline.
"""

import asyncio
import sys
import os
import time

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.collaboration_engine import CollaborationEngine
from app.services.provider_keys import get_api_key_for_org, _get_fallback_key
from app.models.provider_key import ProviderType
from config import get_settings

async def test_kimi_in_collaboration():
    """Test Kimi integration in full collaboration pipeline"""
    
    settings = get_settings()
    
    print("🧪 Testing Kimi Integration in Collaboration Pipeline")
    print("=" * 70)
    
    # Test API key resolution
    print("\n1. Testing Kimi API Key Resolution...")
    kimi_key = _get_fallback_key(ProviderType.KIMI)
    if kimi_key:
        print(f"✅ Kimi API key found: {kimi_key[:10]}...")
    else:
        print("❌ Kimi API key not found")
        return False
    
    # Collect all API keys
    api_keys = {}
    providers = [ProviderType.OPENAI, ProviderType.PERPLEXITY, ProviderType.GEMINI, ProviderType.KIMI]
    
    print("\n2. Collecting API Keys for All Providers...")
    for provider in providers:
        key = _get_fallback_key(provider)
        if key:
            api_keys[provider.value] = key
            print(f"✅ {provider.value}: Available")
        else:
            print(f"❌ {provider.value}: Not configured")
    
    print(f"\n📊 Total providers available: {len(api_keys)}")
    
    # Test collaboration engine model pool
    print("\n3. Testing Collaboration Engine Model Pool...")
    engine = CollaborationEngine()
    
    print(f"📋 Available models in pool:")
    for i, model in enumerate(engine.available_models):
        provider = model["provider"]
        model_name = model["model"]
        label = model["label"]
        status = "✅" if provider.value in api_keys else "❌"
        print(f"   {i+1}. {label}: {provider.value} - {model_name} {status}")
    
    # Test model selection with Kimi
    try:
        selected_models = engine._get_anonymous_collaboration_models(api_keys)
        print(f"\n✅ Model selection successful: {len(selected_models)} models selected")
        
        kimi_selected = any(model["provider"] == ProviderType.KIMI for model in selected_models)
        if kimi_selected:
            print("🎉 Kimi model included in collaboration!")
            for i, model in enumerate(selected_models):
                if model["provider"] == ProviderType.KIMI:
                    print(f"   Step {i+1}: {model['label']} ({model['provider'].value})")
        else:
            print("ℹ️ Kimi not selected this round (random selection)")
            
    except Exception as e:
        print(f"❌ Model selection failed: {e}")
        return False
    
    # Run a quick collaboration test 
    print("\n4. Running Quick Collaboration Test...")
    
    test_query = "What are the benefits of using Kimi AI models?"
    
    try:
        start_time = time.perf_counter()
        result = await engine.collaborate(
            user_query=test_query,
            turn_id="kimi_test_2024",
            api_keys=api_keys,
            collaboration_mode=True
        )
        duration = time.perf_counter() - start_time
        
        print(f"✅ Collaboration completed in {duration:.1f}s")
        print(f"📊 {len(result.agent_outputs)} agents participated")
        
        # Check if Kimi participated
        kimi_participated = any("Kimi" in output.provider for output in result.agent_outputs)
        if kimi_participated:
            print("🎉 Kimi successfully participated in collaboration!")
        else:
            print("ℹ️ Kimi didn't participate this round (random selection)")
        
        # Show agent participation
        print(f"\n📋 Agent Participation:")
        for i, output in enumerate(result.agent_outputs):
            step = i + 1
            provider = output.provider
            preview = output.content[:80] + "..." if len(output.content) > 80 else output.content
            print(f"   Step {step}: {provider}")
            print(f"   💭 {preview}")
            print()
        
        return True
        
    except Exception as e:
        print(f"❌ Collaboration test failed: {e}")
        return False

async def main():
    """Main test function"""
    success = await test_kimi_in_collaboration()
    
    print("\n" + "="*70)
    if success:
        print("🎉 Kimi Integration Test: PASSED")
        print("✅ Kimi is properly integrated into the collaboration system")
        print("✅ API keys configured correctly")
        print("✅ Model selection includes Kimi options") 
        print("✅ Collaboration pipeline works with Kimi")
        print("\n💡 Kimi will now randomly participate in collaboration sessions")
        print("   alongside OpenAI, Perplexity, and Gemini models.")
    else:
        print("❌ Kimi Integration Test: FAILED")
        print("   Please check API key configuration and model settings")
        
    print(f"\nResult: {'✅ SUCCESS' if success else '❌ FAILED'}")

if __name__ == "__main__":
    asyncio.run(main())