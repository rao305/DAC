#!/usr/bin/env python3
"""
QUICK TEST RUNNER for Next-Gen AI Intelligence Orchestrator
Run specific edge case categories or all tests with simple commands
"""

import asyncio
import sys
import argparse
from test_edge_cases import NextGenTestSuite

class QuickTestRunner:
    """Quick test execution with filtering and reporting"""
    
    def __init__(self):
        self.test_suite = NextGenTestSuite()
        
    async def run_category(self, category: str):
        """Run specific test category"""
        category_map = {
            "intent": self.test_suite.test_intent_edge_cases,
            "routing": self.test_suite.test_routing_edge_cases,
            "parallel": self.test_suite.test_parallel_edge_cases,
            "memory": self.test_suite.test_memory_edge_cases,
            "arbitration": self.test_suite.test_arbitration_edge_cases,
            "tasks": self.test_suite.test_task_graph_edge_cases,
            "ui": self.test_suite.test_ui_edge_cases,
            "performance": self.test_suite.test_performance_edge_cases,
            "scenarios": self.test_suite.test_realistic_scenarios,
            "chaos": self.test_suite.test_integration_chaos
        }
        
        if category not in category_map:
            print(f"❌ Unknown category: {category}")
            print(f"Available: {', '.join(category_map.keys())}")
            return
            
        print(f"🚀 Running {category} edge case tests...")
        await category_map[category]()
        self.test_suite.print_final_report()
    
    async def run_quick_smoke_test(self):
        """Run essential tests for quick validation"""
        print("🚀 Running Quick Smoke Test (Essential Edge Cases)")
        print("=" * 50)
        
        # Run critical tests from each category
        await self.test_suite.test_intent_edge_cases()
        await self.test_suite.test_arbitration_edge_cases()
        await self.test_suite.test_realistic_scenarios()
        
        self.test_suite.print_final_report()
    
    async def run_stress_test(self):
        """Run stress and chaos tests"""
        print("🚀 Running Stress & Chaos Tests")
        print("=" * 50)
        
        await self.test_suite.test_parallel_edge_cases()
        await self.test_suite.test_memory_edge_cases()
        await self.test_suite.test_performance_edge_cases()
        await self.test_suite.test_integration_chaos()
        
        self.test_suite.print_final_report()

def main():
    parser = argparse.ArgumentParser(description="Next-Gen AI Orchestrator Edge Case Testing")
    parser.add_argument("--category", "-c", help="Test specific category")
    parser.add_argument("--smoke", action="store_true", help="Run quick smoke test")
    parser.add_argument("--stress", action="store_true", help="Run stress tests only")
    parser.add_argument("--all", action="store_true", help="Run all edge case tests")
    
    args = parser.parse_args()
    runner = QuickTestRunner()
    
    if args.smoke:
        print("🔥 QUICK SMOKE TEST - Essential Edge Cases")
        asyncio.run(runner.run_quick_smoke_test())
    elif args.stress:
        print("💪 STRESS TEST - Chaos & Performance")
        asyncio.run(runner.run_stress_test())
    elif args.category:
        asyncio.run(runner.run_category(args.category))
    elif args.all:
        print("🚀 FULL EDGE CASE TEST SUITE")
        asyncio.run(runner.test_suite.run_all_tests())
    else:
        print("Next-Gen AI Intelligence Orchestrator Edge Case Testing")
        print("\nUsage:")
        print("  python run_edge_tests.py --smoke     # Quick validation")
        print("  python run_edge_tests.py --stress    # Stress testing")
        print("  python run_edge_tests.py --all       # Full test suite")
        print("  python run_edge_tests.py -c intent   # Specific category")
        print("\nCategories:")
        print("  intent, routing, parallel, memory, arbitration")
        print("  tasks, ui, performance, scenarios, chaos")

if __name__ == "__main__":
    main()