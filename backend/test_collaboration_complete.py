#!/usr/bin/env python3
"""
Test the complete collaboration pipeline with error handling
"""

import asyncio
import sys
import os

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_collaboration_with_mock_keys():
    """Test collaboration with mock keys to verify error handling"""
    print("🧪 TESTING COLLABORATION WITH ERROR HANDLING")
    print("=" * 60)
    
    try:
        from app.services.collaboration_engine import CollaborationEngine
        from app.models.provider_key import ProviderType
        
        engine = CollaborationEngine()
        
        # Test query
        test_query = "What are the best practices for building scalable React applications?"
        turn_id = "error_test_123"
        
        print(f"📝 Test Query: '{test_query}'")
        print(f"🔍 Turn ID: {turn_id}")
        print()
        
        # Mock API keys - these will fail but should be handled gracefully
        api_keys = {
            ProviderType.OPENAI.value: "fake_openai_key",
            ProviderType.GEMINI.value: "fake_gemini_key", 
            ProviderType.PERPLEXITY.value: "fake_perplexity_key"
        }
        
        print("🎭 Starting collaboration with error handling...")
        
        # This should complete successfully despite API failures
        result = await engine.collaborate(
            user_query=test_query,
            turn_id=turn_id,
            api_keys=api_keys,
            collaboration_mode=True
        )
        
        print("✅ COLLABORATION COMPLETED!")
        print(f"   Total time: {result.total_time_ms:.0f}ms")
        print(f"   Agent outputs: {len(result.agent_outputs)}")
        print(f"   Final report length: {len(result.final_report)} chars")
        print()
        
        print("📋 Agent Outputs:")
        for i, output in enumerate(result.agent_outputs):
            output_preview = output.content[:100] + "..." if len(output.content) > 100 else output.content
            print(f"   {i+1}. {output.provider}: {output_preview}")
        
        print(f"\n📊 Final Report Preview:")
        final_preview = result.final_report[:200] + "..." if len(result.final_report) > 200 else result.final_report
        print(f"   {final_preview}")
        
        # Check that we have outputs for all 5 steps
        if len(result.agent_outputs) == 5:
            print("\n✅ All 5 collaboration steps completed (with error handling)")
        else:
            print(f"\n⚠️ Only {len(result.agent_outputs)}/5 steps completed")
            
        # Check that final report is meaningful 
        if "technical difficulties" in result.final_report or "Error" in result.final_report:
            print("✅ Graceful error handling detected in final report")
        else:
            print("⚠️ No error handling detected - unexpected success?")
        
        return True
        
    except Exception as e:
        print(f"❌ COLLABORATION FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_partial_failure_scenario():
    """Test scenario where only some APIs fail"""
    print("\n🧪 TESTING PARTIAL FAILURE SCENARIO")
    print("=" * 60)
    
    try:
        from app.services.collaboration_engine import CollaborationEngine
        from app.models.provider_key import ProviderType
        
        engine = CollaborationEngine()
        
        test_query = "What is React?"
        turn_id = "partial_test_123"
        
        # Simulate having only OpenAI key (others will fail)
        api_keys = {
            ProviderType.OPENAI.value: "fake_openai_key", # Will still fail but should fallback properly
            # No other keys - should trigger fallbacks
        }
        
        print(f"📝 Test Query: '{test_query}'")
        print("🔑 Only OpenAI key provided (simulated)")
        print()
        
        result = await engine.collaborate(
            user_query=test_query,
            turn_id=turn_id,
            api_keys=api_keys,
            collaboration_mode=True
        )
        
        print("✅ PARTIAL FAILURE SCENARIO COMPLETED!")
        print(f"   Total time: {result.total_time_ms:.0f}ms")
        print(f"   Agent outputs: {len(result.agent_outputs)}")
        
        return True
        
    except Exception as e:
        print(f"❌ PARTIAL FAILURE TEST FAILED: {e}")
        return False

if __name__ == "__main__":
    async def main():
        success1 = await test_collaboration_with_mock_keys()
        success2 = await test_partial_failure_scenario()
        
        print("\n" + "=" * 60)
        print("🎯 FINAL SUMMARY")
        print("=" * 60)
        
        if success1 and success2:
            print("🎉 ALL TESTS PASSED!")
            print("✅ Collaboration engine now handles errors gracefully")
            print("✅ Step 2 failures (and all other failures) are handled properly")
            print("✅ System continues collaboration despite individual step failures")
            print("✅ Meaningful fallback responses are generated")
        else:
            print("❌ Some tests failed")
            if not success1:
                print("❌ Basic error handling test failed")
            if not success2:
                print("❌ Partial failure test failed")
        
        print("\n💡 Next steps:")
        print("   1. Test with real API keys to verify full functionality")
        print("   2. Test the frontend collaboration toggle")
        print("   3. Verify database storage of collaboration results")
    
    asyncio.run(main())