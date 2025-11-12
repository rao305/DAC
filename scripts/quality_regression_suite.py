#!/usr/bin/env python3
"""
Quality Regression Suite - Nightly Evaluation

Runs behavioral and task-based evaluations to ensure quality doesn't degrade.
Fails build if metrics fall below thresholds.
"""
import asyncio
import json
import sys
from typing import Dict, List, Tuple
from datetime import datetime
import httpx

# Configuration
BACKEND_URL = "http://localhost:8000/api"
FRONTEND_URL = "http://localhost:3000/api"
ORG_ID = "org_demo"

# Quality thresholds
INTENT_ACCURACY_THRESHOLD = 0.95  # 95%
TONE_DRIFT_THRESHOLD = 0.10  # 10% drift allowed
P95_LATENCY_THRESHOLD_MS = 5000  # 5 seconds
COST_BUDGET_PER_TURN_USD = 0.01  # $0.01 per turn

# Behavioral test set (from Phase 3 QA)
BEHAVIORAL_TESTS = [
    {"query": "Hi! My name is Alex, working on a Python project.", "expected_intent": "social_chat"},
    {"query": "Write a Python function to calculate fibonacci", "expected_intent": "coding_help"},
    {"query": "What's the time complexity of that function?", "expected_intent": "qa_retrieval"},
    {"query": "Rewrite this to be more professional: 'Hey, can you help?'", "expected_intent": "editing/writing"},
    {"query": "Solve: If a train travels 120 km in 2 hours, what's its average speed?", "expected_intent": "reasoning/math"},
    {"query": "Thanks! How's your day?", "expected_intent": "social_chat"},
    {"query": "Remind me my name and what we were working on?", "expected_intent": "qa_retrieval"},
]

# Task-based test set (gold references)
TASK_TESTS = [
    # Coding tasks
    {"query": "Write a function to reverse a string", "category": "coding_help", "gold_contains": ["def", "reverse", "string"]},
    {"query": "How do I sort a list in Python?", "category": "coding_help", "gold_contains": ["sort", "sorted", "list"]},
    
    # Q&A tasks
    {"query": "What is machine learning?", "category": "qa_retrieval", "gold_contains": ["machine learning", "algorithm", "data"]},
    {"query": "Explain how neural networks work", "category": "qa_retrieval", "gold_contains": ["neural", "network", "layer"]},
    
    # Math tasks
    {"query": "What is 15 * 23?", "category": "reasoning/math", "gold_contains": ["345"]},
    {"query": "Calculate the area of a circle with radius 5", "category": "reasoning/math", "gold_contains": ["78.5", "π", "pi"]},
    
    # Social chat
    {"query": "Hello, how are you?", "category": "social_chat", "gold_contains": ["hello", "hi", "good"]},
]


async def run_behavioral_tests(thread_id: str) -> Dict[str, any]:
    """Run behavioral test suite."""
    results = []
    latencies = []
    
    for test in BEHAVIORAL_TESTS:
        start = asyncio.get_event_loop().time()
        
        try:
            response_text, _ = await send_message(thread_id, test["query"])
            latency_ms = (asyncio.get_event_loop().time() - start) * 1000
            latencies.append(latency_ms)
            
            # Check intent (if QA footer present)
            intent_match = test["expected_intent"] in response_text.lower()
            
            results.append({
                "test": test["query"][:50],
                "expected_intent": test["expected_intent"],
                "intent_match": intent_match,
                "latency_ms": latency_ms,
                "passed": intent_match,
            })
        except Exception as e:
            results.append({
                "test": test["query"][:50],
                "expected_intent": test["expected_intent"],
                "error": str(e),
                "passed": False,
            })
    
    # Calculate metrics
    passed = sum(1 for r in results if r.get("passed", False))
    intent_accuracy = passed / len(results) if results else 0
    
    latencies.sort()
    p95_latency = latencies[int(len(latencies) * 0.95)] if latencies else 0
    
    return {
        "total_tests": len(results),
        "passed": passed,
        "intent_accuracy": intent_accuracy,
        "p95_latency_ms": p95_latency,
        "results": results,
    }


async def run_task_tests(thread_id: str) -> Dict[str, any]:
    """Run task-based test suite."""
    results = []
    
    for test in TASK_TESTS:
        try:
            response_text, _ = await send_message(thread_id, test["query"])
            
            # Check if response contains expected keywords
            response_lower = response_text.lower()
            contains_expected = any(keyword.lower() in response_lower for keyword in test["gold_contains"])
            
            results.append({
                "test": test["query"][:50],
                "category": test["category"],
                "contains_expected": contains_expected,
                "passed": contains_expected,
            })
        except Exception as e:
            results.append({
                "test": test["query"][:50],
                "category": test["category"],
                "error": str(e),
                "passed": False,
            })
    
    passed = sum(1 for r in results if r.get("passed", False))
    task_accuracy = passed / len(results) if results else 0
    
    return {
        "total_tests": len(results),
        "passed": passed,
        "task_accuracy": task_accuracy,
        "results": results,
    }


async def send_message(thread_id: str, message: str) -> Tuple[str, Optional[Dict]]:
    """Send a message and get response."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{FRONTEND_URL}/chat",
            headers={"x-org-id": ORG_ID, "Content-Type": "application/json"},
            json={"prompt": message, "thread_id": thread_id}
        )
        
        if response.status_code != 200:
            raise Exception(f"HTTP {response.status_code}")
        
        # Parse streaming response
        response_text = ""
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                try:
                    data = json.loads(line[6:])
                    if "delta" in data:
                        response_text += data["delta"]
                except:
                    pass
        
        return response_text, None


async def main():
    """Run quality regression suite."""
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║          Quality Regression Suite - Nightly Eval             ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print()
    
    # Create test thread
    async with httpx.AsyncClient() as client:
        thread_resp = await client.post(
            f"{BACKEND_URL}/threads/",
            headers={"x-org-id": ORG_ID, "Content-Type": "application/json"},
            json={"title": f"Quality Regression - {datetime.now().isoformat()}"}
        )
        thread_id = thread_resp.json().get("id") or thread_resp.json().get("thread_id")
    
    print(f"📝 Test thread: {thread_id}")
    print()
    
    # Run behavioral tests
    print("🧪 Running behavioral tests...")
    behavioral_results = await run_behavioral_tests(thread_id)
    print(f"   Intent accuracy: {behavioral_results['intent_accuracy']:.2%}")
    print(f"   P95 latency: {behavioral_results['p95_latency_ms']:.0f}ms")
    print()
    
    # Run task tests
    print("🧪 Running task-based tests...")
    task_results = await run_task_tests(thread_id)
    print(f"   Task accuracy: {task_results['task_accuracy']:.2%}")
    print()
    
    # Evaluate thresholds
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("📊 Quality Check")
    print()
    
    failures = []
    
    if behavioral_results['intent_accuracy'] < INTENT_ACCURACY_THRESHOLD:
        failures.append(f"Intent accuracy {behavioral_results['intent_accuracy']:.2%} < {INTENT_ACCURACY_THRESHOLD:.0%}")
    
    if behavioral_results['p95_latency_ms'] > P95_LATENCY_THRESHOLD_MS:
        failures.append(f"P95 latency {behavioral_results['p95_latency_ms']:.0f}ms > {P95_LATENCY_THRESHOLD_MS}ms")
    
    if task_results['task_accuracy'] < 0.80:  # 80% for task tests
        failures.append(f"Task accuracy {task_results['task_accuracy']:.2%} < 80%")
    
    if failures:
        print("❌ QUALITY CHECK FAILED")
        for failure in failures:
            print(f"   - {failure}")
        print()
        return 1
    else:
        print("✅ QUALITY CHECK PASSED")
        print()
        return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)

