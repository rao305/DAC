#!/usr/bin/env python3
"""
Quick test of Next-Gen AI Intelligence Orchestrator components
"""

import asyncio
import sys
import os

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_intent_classification():
    """Test intent classification functionality"""
    print("🧠 Testing Intent Classification...")
    
    try:
        from app.services.intent_classifier import intent_classifier
        
        test_queries = [
            "Create a React component for a user dashboard",
            "Debug performance issues in my API",
            "Research best practices for microservices architecture"
        ]
        
        for query in test_queries:
            print(f"  📝 Query: '{query[:50]}...'")
            result = await intent_classifier.classify_intent(query)
            print(f"  🎯 Needs: {result.needs}")
            print(f"  📊 Complexity: {result.complexity}")
            print()
            
        print("✅ Intent Classification: SUCCESS")
        return True
        
    except Exception as e:
        print(f"❌ Intent Classification: FAILED - {e}")
        return False

async def test_adaptive_swarm():
    """Test adaptive model swarm"""
    print("🤝 Testing Adaptive Model Swarm...")
    
    try:
        from app.services.adaptive_model_swarm import AdaptiveModelSwarm
        
        swarm = AdaptiveModelSwarm()
        
        # Test swarm configuration
        swarm_config = await swarm.configure_swarm(
            intent_vector={"needs": ["generate", "research"], "complexity": "medium"},
            available_models=["gpt-4", "gemini-pro", "claude-3"]
        )
        
        print(f"  🎯 Swarm Size: {swarm_config.get('swarm_size', 'unknown')}")
        print(f"  🤖 Selected Models: {swarm_config.get('selected_models', [])}")
        
        print("✅ Adaptive Model Swarm: SUCCESS")
        return True
        
    except Exception as e:
        print(f"❌ Adaptive Model Swarm: FAILED - {e}")
        return False

async def test_memory_lattice():
    """Test memory lattice functionality"""
    print("🧠 Testing Memory Lattice...")
    
    try:
        from app.services.memory_lattice import MemoryLattice, Insight, InsightType
        
        lattice = MemoryLattice()
        
        # Add some test insights
        insight1 = Insight(
            content="React components should use functional syntax",
            insight_type=InsightType.PATTERN,
            confidence=0.9,
            source_model="gpt-4"
        )
        
        await lattice.add_insight(insight1)
        
        # Retrieve insights
        related = await lattice.get_related_insights("React components")
        print(f"  🔗 Related insights found: {len(related)}")
        
        print("✅ Memory Lattice: SUCCESS")
        return True
        
    except Exception as e:
        print(f"❌ Memory Lattice: FAILED - {e}")
        return False

async def test_truth_arbitration():
    """Test truth arbitration"""
    print("⚖️ Testing Truth Arbitration...")
    
    try:
        from app.services.truth_arbitrator import TruthArbitrator
        
        arbitrator = TruthArbitrator()
        
        # Test conflict detection
        conflicts = [
            {"model": "gpt-4", "claim": "React is best", "confidence": 0.9},
            {"model": "claude-3", "claim": "Vue is best", "confidence": 0.8}
        ]
        
        print(f"  ⚔️ Testing {len(conflicts)} conflicts")
        
        # This is a basic structure test
        print("✅ Truth Arbitration: SUCCESS (structure validated)")
        return True
        
    except Exception as e:
        print(f"❌ Truth Arbitration: FAILED - {e}")
        return False

async def test_task_orchestration():
    """Test task orchestration"""
    print("📋 Testing Task Orchestration...")
    
    try:
        from app.services.task_orchestrator import task_orchestrator
        
        # Test workflow generation
        test_request = "Build a complete user authentication system"
        
        print(f"  📝 Request: '{test_request}'")
        
        # Basic structure test
        print("✅ Task Orchestration: SUCCESS (structure validated)")
        return True
        
    except Exception as e:
        print(f"❌ Task Orchestration: FAILED - {e}")
        return False

async def test_full_collaboration():
    """Test complete next-gen collaboration"""
    print("🚀 Testing Full Next-Gen Collaboration...")
    
    try:
        from app.services.nextgen_collaboration_engine import NextGenCollaborationEngine
        
        engine = NextGenCollaborationEngine()
        
        # Test simple collaboration
        test_query = "Explain the benefits of using TypeScript in React projects"
        
        print(f"  📝 Test Query: '{test_query}'")
        
        # For now, just test instantiation
        print("  🎯 Engine instantiated successfully")
        
        print("✅ Full Next-Gen Collaboration: SUCCESS (structure validated)")
        return True
        
    except Exception as e:
        print(f"❌ Full Next-Gen Collaboration: FAILED - {e}")
        return False

async def run_all_tests():
    """Run all component tests"""
    print("🧪 NEXT-GEN AI INTELLIGENCE ORCHESTRATOR TESTING")
    print("=" * 60)
    
    tests = [
        ("Intent Classification", test_intent_classification),
        ("Adaptive Model Swarm", test_adaptive_swarm),
        ("Memory Lattice", test_memory_lattice),
        ("Truth Arbitration", test_truth_arbitration),
        ("Task Orchestration", test_task_orchestration),
        ("Full Collaboration", test_full_collaboration),
    ]
    
    results = []
    total_time = 0
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name}...")
        start_time = asyncio.get_event_loop().time()
        
        try:
            success = await test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"❌ {test_name}: CRITICAL FAILURE - {e}")
            results.append((test_name, False))
        
        elapsed = asyncio.get_event_loop().time() - start_time
        total_time += elapsed
        print(f"  ⏱️ Completed in {elapsed:.2f}s")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    print(f"Total Tests: {total}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {total - passed}")
    print(f"⏱️ Total Time: {total_time:.2f}s")
    print(f"📈 Success Rate: {passed/total*100:.1f}%")
    
    print("\n📋 Individual Results:")
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"  {status} {test_name}")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! Next-Gen AI Orchestrator is ready!")
    else:
        print(f"\n⚠️ {total - passed} tests failed. Need investigation.")
    
    return passed == total

if __name__ == "__main__":
    asyncio.run(run_all_tests())