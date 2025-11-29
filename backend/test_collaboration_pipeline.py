#!/usr/bin/env python3
"""
Collaboration Pipeline Test Script

Tests the collaboration mode pipeline to identify step 2 failures.
Checks API keys, provider connections, and individual model responses.
"""

import asyncio
import sys
import os
import time
from typing import Dict, Any, Optional

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.collaboration_engine import CollaborationEngine, AgentRole, ProviderType
from app.adapters.openai_adapter import call_openai
from app.adapters.perplexity import call_perplexity
from app.adapters.gemini import call_gemini
from config import get_settings

# Test configuration
TEST_MESSAGE = "What are the best practices for implementing authentication in a web application?"
TURN_ID = "test_turn_pipeline_2024"

class CollaborationTester:
    def __init__(self):
        self.settings = get_settings()
        self.engine = CollaborationEngine()
        
    def get_test_api_keys(self) -> Dict[str, str]:
        """Get available API keys for testing"""
        api_keys = {}
        
        # Check OpenAI
        if self.settings.openai_api_key:
            api_keys[ProviderType.OPENAI.value] = self.settings.openai_api_key
            print("✅ OpenAI API key found")
        else:
            print("❌ OpenAI API key missing")
        
        # Check Perplexity
        if self.settings.perplexity_api_key:
            api_keys[ProviderType.PERPLEXITY.value] = self.settings.perplexity_api_key
            print("✅ Perplexity API key found")
        else:
            print("❌ Perplexity API key missing")
        
        # Check Gemini/Google
        if self.settings.google_api_key:
            api_keys[ProviderType.GEMINI.value] = self.settings.google_api_key
            print("✅ Gemini API key found")
        else:
            print("❌ Gemini API key missing")
        
        return api_keys
    
    async def test_individual_providers(self, api_keys: Dict[str, str]):
        """Test each provider individually"""
        print("\n🔍 Testing individual provider connections...")
        
        test_prompt = "Respond with 'Hello from [Provider Name]' to confirm connection."
        
        # Test OpenAI
        if ProviderType.OPENAI.value in api_keys:
            try:
                print("\nTesting OpenAI...")
                response = await call_openai(
                    messages=[{"role": "user", "content": test_prompt}],
                    model="gpt-4o",
                    api_key=api_keys[ProviderType.OPENAI.value],
                    temperature=0.1
                )
                print(f"✅ OpenAI: {response.content[:100]}...")
            except Exception as e:
                print(f"❌ OpenAI error: {e}")
        
        # Test Perplexity
        if ProviderType.PERPLEXITY.value in api_keys:
            try:
                print("\nTesting Perplexity...")
                response = await call_perplexity(
                    messages=[{"role": "user", "content": test_prompt}],
                    model="sonar-pro",
                    api_key=api_keys[ProviderType.PERPLEXITY.value]
                )
                print(f"✅ Perplexity: {response.content[:100]}...")
            except Exception as e:
                print(f"❌ Perplexity error: {e}")
        
        # Test Gemini
        if ProviderType.GEMINI.value in api_keys:
            try:
                print("\nTesting Gemini...")
                response = await call_gemini(
                    messages=[{"role": "user", "content": test_prompt}],
                    model="gemini-2.5-flash",
                    api_key=api_keys[ProviderType.GEMINI.value]
                )
                print(f"✅ Gemini: {response.content[:100]}...")
            except Exception as e:
                print(f"❌ Gemini error: {e}")
    
    async def test_step_by_step_collaboration(self, api_keys: Dict[str, str]):
        """Test collaboration pipeline step by step"""
        print("\n🚀 Testing step-by-step collaboration pipeline...")
        
        # Test anonymous collaboration model selection
        try:
            selected_models = self.engine._get_anonymous_collaboration_models(api_keys)
            print(f"✅ Model selection successful: {len(selected_models)} models selected")
            for i, model in enumerate(selected_models):
                print(f"   Step {i+1}: {model['label']} ({model['provider'].value})")
        except Exception as e:
            print(f"❌ Model selection failed: {e}")
            return
        
        # Test each step individually
        agent_outputs = []
        
        for i, model_config in enumerate(selected_models):
            step_num = i + 1
            print(f"\n📍 Testing Step {step_num}: {model_config['label']}")
            
            try:
                # Build context
                if i == 0:
                    context = f"User Query: {TEST_MESSAGE}"
                elif i == 4:  # Final model - synthesize
                    context = f"""Original user query: {TEST_MESSAGE}

Previous AI responses to build upon:
"""
                    for j, prev_output in enumerate(agent_outputs):
                        context += f"\nModel {j + 1} Response:\n{prev_output.content[:500]}...\n"
                    context += "\nPlease synthesize all the above responses into a comprehensive, final answer for the user."
                else:
                    context = f"User Query: {TEST_MESSAGE}\n\nPrevious AI Responses:\n"
                    for j, prev_output in enumerate(agent_outputs):
                        context += f"\nModel {j + 1}: {prev_output.content[:300]}...\n"
                
                # Run the model
                start_time = time.perf_counter()
                output = await self.engine._run_anonymous_model(
                    model_config,
                    TEST_MESSAGE,
                    TURN_ID,
                    api_keys,
                    context,
                    step=step_num
                )
                duration_ms = (time.perf_counter() - start_time) * 1000
                
                agent_outputs.append(output)
                print(f"✅ Step {step_num} success ({duration_ms:.1f}ms): {output.content[:150]}...")
                
                # Special check for step 2 (where user reported failures)
                if step_num == 2:
                    print(f"🔍 Step 2 detailed analysis:")
                    print(f"   Provider: {model_config['provider'].value}")
                    print(f"   Model: {model_config['model']}")
                    print(f"   Response length: {len(output.content)} chars")
                    print(f"   Context length: {len(context)} chars")
                
            except Exception as e:
                print(f"❌ Step {step_num} failed: {e}")
                print(f"   Provider: {model_config['provider'].value}")
                print(f"   Model: {model_config['model']}")
                
                # Check if this is step 2 specifically
                if step_num == 2:
                    print(f"🚨 STEP 2 FAILURE DETECTED:")
                    print(f"   Error type: {type(e).__name__}")
                    print(f"   Error message: {str(e)}")
                    print(f"   Context length: {len(context)}")
                    
                    # Try to diagnose the issue
                    await self.diagnose_step_2_failure(model_config, api_keys, context)
                
                return False
        
        print(f"\n🎉 Full pipeline test completed with {len(agent_outputs)} successful steps!")
        return True
    
    async def diagnose_step_2_failure(self, model_config: Dict, api_keys: Dict[str, str], context: str):
        """Diagnose specific step 2 failure"""
        print(f"\n🔬 Diagnosing Step 2 failure...")
        
        provider = model_config["provider"]
        api_key = api_keys.get(provider.value)
        
        if not api_key:
            print("❌ No API key available for this provider")
            return
        
        # Test with simpler prompt
        simple_test = "Say hello"
        print(f"Testing with simple prompt: '{simple_test}'")
        
        try:
            if provider == ProviderType.OPENAI:
                response = await call_openai(
                    messages=[{"role": "user", "content": simple_test}],
                    model=model_config["model"],
                    api_key=api_key,
                    temperature=0.1
                )
                print(f"✅ Simple test passed: {response.content}")
            elif provider == ProviderType.PERPLEXITY:
                response = await call_perplexity(
                    messages=[{"role": "user", "content": simple_test}],
                    model=model_config["model"],
                    api_key=api_key
                )
                print(f"✅ Simple test passed: {response.content}")
            elif provider == ProviderType.GEMINI:
                response = await call_gemini(
                    messages=[{"role": "user", "content": simple_test}],
                    model="gemini-2.5-flash",
                    api_key=api_key
                )
                print(f"✅ Simple test passed: {response.content}")
        except Exception as e:
            print(f"❌ Simple test also failed: {e}")
        
        # Check context length
        if len(context) > 8000:
            print(f"⚠️ Context might be too long ({len(context)} chars)")
        
        # Check for specific error patterns
        print("🔍 Checking for common issues:")
        print(f"   - Provider: {provider.value}")
        print(f"   - Model: {model_config['model']}")
        print(f"   - API key length: {len(api_key) if api_key else 0}")
        print(f"   - Context length: {len(context)}")
    
    async def test_full_collaboration(self, api_keys: Dict[str, str]):
        """Test the full collaboration flow"""
        print("\n🌟 Testing full collaboration flow...")
        
        try:
            start_time = time.perf_counter()
            result = await self.engine.collaborate(
                user_query=TEST_MESSAGE,
                turn_id=TURN_ID,
                api_keys=api_keys,
                collaboration_mode=True
            )
            duration_ms = (time.perf_counter() - start_time) * 1000
            
            print(f"✅ Full collaboration completed ({duration_ms:.1f}ms)")
            print(f"   Final report length: {len(result.final_report)} chars")
            print(f"   Agent outputs: {len(result.agent_outputs)}")
            print(f"   Final report preview: {result.final_report[:200]}...")
            
            return True
            
        except Exception as e:
            print(f"❌ Full collaboration failed: {e}")
            return False

async def main():
    """Main test function"""
    print("🧪 Syntra Collaboration Pipeline Test")
    print("=" * 50)
    
    tester = CollaborationTester()
    
    # Step 1: Check API keys
    print("\n1. Checking API key configuration...")
    api_keys = tester.get_test_api_keys()
    
    if not api_keys:
        print("❌ No API keys found. Please configure environment variables:")
        print("   - OPENAI_API_KEY")
        print("   - PERPLEXITY_API_KEY")
        print("   - GOOGLE_API_KEY")
        return
    
    print(f"Found {len(api_keys)} API keys")
    
    # Step 2: Test individual providers
    await tester.test_individual_providers(api_keys)
    
    # Step 3: Test step-by-step collaboration
    success = await tester.test_step_by_step_collaboration(api_keys)
    
    if success:
        # Step 4: Test full collaboration flow
        await tester.test_full_collaboration(api_keys)
    else:
        print("\n❌ Step-by-step test failed. Skipping full collaboration test.")
    
    print("\n📋 Test Summary:")
    print(f"   API Keys Available: {len(api_keys)}")
    print(f"   Individual Provider Tests: Check output above")
    print(f"   Step-by-Step Pipeline: {'✅ Passed' if success else '❌ Failed'}")
    
    if not success:
        print("\n💡 Troubleshooting suggestions:")
        print("   1. Check API key validity and quotas")
        print("   2. Verify network connectivity") 
        print("   3. Check if step 2 provider has rate limits")
        print("   4. Review error messages for specific failure patterns")

if __name__ == "__main__":
    asyncio.run(main())