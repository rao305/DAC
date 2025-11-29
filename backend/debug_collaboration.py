#!/usr/bin/env python3
"""
Debug collaboration step-by-step to identify where it's failing
"""

import asyncio
import sys
import os
import traceback

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def debug_collaboration():
    """Debug the collaboration pipeline step by step"""
    print("🐛 DEBUGGING COLLABORATION PIPELINE")
    print("=" * 60)
    
    try:
        from app.services.collaboration_engine import CollaborationEngine
        from app.models.provider_key import ProviderType
        
        engine = CollaborationEngine()
        
        # Test query
        test_query = "What are the best practices for building scalable React applications?"
        turn_id = "debug_test_123"
        
        print(f"📝 Test Query: '{test_query}'")
        print(f"🔍 Turn ID: {turn_id}")
        print()
        
        # Mock API keys for testing
        api_keys = {
            ProviderType.OPENAI.value: "fake_openai_key",
            ProviderType.GEMINI.value: "fake_gemini_key",
            ProviderType.PERPLEXITY.value: "fake_perplexity_key"
        }
        
        print("🔑 Testing with mock API keys...")
        print(f"   OpenAI: {api_keys.get('openai', 'Not configured')}")
        print(f"   Gemini: {api_keys.get('gemini', 'Not configured')}")
        print(f"   Perplexity: {api_keys.get('perplexity', 'Not configured')}")
        print()
        
        # Test model selection
        print("📋 Testing model selection...")
        try:
            selected_models = engine._get_anonymous_collaboration_models(api_keys)
            print(f"✅ Selected {len(selected_models)} models for collaboration")
            
            for i, model in enumerate(selected_models):
                print(f"   Model {i+1}: {model['label']} ({model['provider'].value})")
            print()
            
        except Exception as e:
            print(f"❌ Model selection failed: {e}")
            return False
        
        # Test each step of the collaboration
        print("🎭 Testing collaboration steps...")
        
        for i, model_config in enumerate(selected_models):
            step_num = i + 1
            print(f"\n--- Step {step_num} ({model_config['label']}) ---")
            
            try:
                # Build context like the real collaboration does
                if i == 0:
                    context = f"User Query: {test_query}"
                elif i == 4:  # Final model
                    context = f"Original user query: {test_query}\n\nPrevious AI responses to build upon:\n(Mock previous responses)\n\nPlease synthesize all the above responses into a comprehensive, final answer for the user."
                else:
                    context = f"User Query: {test_query}\n\nPrevious AI Responses:\n(Mock previous responses)\n"
                
                print(f"📝 Context length: {len(context)} chars")
                print(f"🔧 Provider: {model_config['provider'].value}")
                print(f"🤖 Model: {model_config['model']}")
                
                # Test the step (we expect this to fail with mock API keys, but we can see where it fails)
                try:
                    # This will fail with mock keys but we can see the error location
                    output = await engine._run_anonymous_model(
                        model_config,
                        test_query,
                        turn_id,
                        api_keys,
                        context,
                        step=step_num
                    )
                    print(f"✅ Step {step_num} succeeded (unexpected!)")
                    
                except Exception as step_error:
                    print(f"⚠️ Step {step_num} failed (expected with mock keys): {str(step_error)[:100]}...")
                    
                    # Check if this is step 2 and the error we're looking for
                    if step_num == 2:
                        print(f"🔍 STEP 2 ERROR DETAILS:")
                        print(f"   Error type: {type(step_error).__name__}")
                        print(f"   Error message: {step_error}")
                        if hasattr(step_error, '__cause__'):
                            print(f"   Caused by: {step_error.__cause__}")
                        
                        # Show full stack trace for step 2
                        print("📊 Full traceback for Step 2:")
                        traceback.print_exc()
                        
            except Exception as e:
                print(f"❌ Step {step_num} setup failed: {e}")
                return False
        
        print("\n" + "=" * 60)
        print("🎯 DEBUGGING SUMMARY:")
        print("✅ Collaboration engine loaded successfully")
        print("✅ Model selection working")
        print("✅ Step configuration working")
        print("⚠️ API call failures expected with mock keys")
        print()
        print("💡 To test with real API keys, set environment variables:")
        print("   OPENAI_API_KEY=your_openai_key")
        print("   GEMINI_API_KEY=your_gemini_key") 
        print("   PERPLEXITY_API_KEY=your_perplexity_key")
        
        return True
        
    except Exception as e:
        print(f"❌ CRITICAL FAILURE: {e}")
        traceback.print_exc()
        return False

async def debug_with_real_keys():
    """Debug with real API keys if available"""
    print("\n🔐 TESTING WITH REAL API KEYS (if available)")
    print("=" * 60)
    
    # Check for real API keys
    real_keys = {}
    
    openai_key = os.getenv('OPENAI_API_KEY')
    gemini_key = os.getenv('GEMINI_API_KEY')
    perplexity_key = os.getenv('PERPLEXITY_API_KEY')
    
    if openai_key:
        real_keys['openai'] = openai_key
        print("✅ OpenAI API key found")
    else:
        print("⚠️ OpenAI API key not found")
        
    if gemini_key:
        real_keys['gemini'] = gemini_key
        print("✅ Gemini API key found")
    else:
        print("⚠️ Gemini API key not found")
        
    if perplexity_key:
        real_keys['perplexity'] = perplexity_key
        print("✅ Perplexity API key found")
    else:
        print("⚠️ Perplexity API key not found")
    
    if len(real_keys) >= 2:
        print(f"\n🚀 Found {len(real_keys)} API keys, testing real collaboration...")
        
        try:
            from app.services.collaboration_engine import CollaborationEngine
            
            engine = CollaborationEngine()
            
            test_query = "What are 3 key principles for building scalable React apps?"
            turn_id = "real_test_123"
            
            print(f"📝 Test Query: '{test_query}'")
            
            result = await engine.collaborate(
                user_query=test_query,
                turn_id=turn_id,
                api_keys=real_keys,
                collaboration_mode=True
            )
            
            print(f"✅ COLLABORATION SUCCESS!")
            print(f"   Total time: {result.total_time_ms:.0f}ms")
            print(f"   Agent outputs: {len(result.agent_outputs)}")
            print(f"   Final report length: {len(result.final_report)} chars")
            print(f"   First 200 chars: {result.final_report[:200]}...")
            
            return True
            
        except Exception as e:
            print(f"❌ Real collaboration failed: {e}")
            traceback.print_exc()
            return False
    else:
        print("⚠️ Need at least 2 API keys for full collaboration test")
        return False

if __name__ == "__main__":
    async def main():
        success1 = await debug_collaboration()
        success2 = await debug_with_real_keys() 
        
        if success1 or success2:
            print("\n🎉 Debugging completed successfully!")
        else:
            print("\n❌ Debugging found issues that need attention")
    
    asyncio.run(main())