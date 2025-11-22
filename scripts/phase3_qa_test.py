#!/usr/bin/env python3
"""
Phase 3 QA Validation Test Script

Automatically runs the Phase 3 QA test sequence against the DAC /api/chat endpoint,
validates intent detection, tone consistency, and context preservation.

Usage:
    python scripts/phase3_qa_test.py
"""

import asyncio
import json
import re
import sys
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import httpx

# Configuration
BACKEND_URL = "http://localhost:8000/api"
FRONTEND_URL = "http://localhost:3000/api"
ORG_ID = "org_demo"
USE_FRONTEND = True  # Use frontend proxy for streaming

# QA Test Sequence
QA_TEST_SEQUENCE = [
    {
        "query": "Hi! My name is Alex, working on a Python project.",
        "expected_intent": "social_chat",
        "test_name": "1. Greeting (social_chat)"
    },
    {
        "query": "Write a Python function to calculate fibonacci numbers",
        "expected_intent": "coding_help",
        "test_name": "2. Coding task (coding_help)"
    },
    {
        "query": "What's the time complexity of that function?",
        "expected_intent": "qa_retrieval",
        "test_name": "3. Explanation follow-up (qa_retrieval)"
    },
    {
        "query": "Rewrite this sentence to be more professional: 'Hey, can you help me with this?'",
        "expected_intent": "editing/writing",
        "test_name": "4. Writing rewrite (editing/writing)"
    },
    {
        "query": "Solve this: If a train travels 120 km in 2 hours, what's its average speed?",
        "expected_intent": "reasoning/math",
        "test_name": "5. Math/logic (reasoning/math)"
    },
    {
        "query": "Thanks! How's your day going?",
        "expected_intent": "social_chat",
        "test_name": "6. Random small talk (social_chat)"
    },
    {
        "query": "What is the meaning of life, the universe, and everything? Also, can you make me a sandwich?",
        "expected_intent": "ambiguous_or_other",
        "test_name": "7. Ambiguous query (ambiguous_or_other)"
    },
    {
        "query": "Remind me my name and what we were working on?",
        "expected_intent": "qa_retrieval",
        "test_name": "8. Context check (qa_retrieval) - Should remember 'Alex' and 'Python project'"
    }
]


def parse_qa_footer(response_text: str) -> Optional[Dict[str, str]]:
    """
    Parse QA footer from response.
    
    Expected format: [intent: <intent> | tone: <tone> | context: <context>]
    """
    # Look for QA footer pattern at the end of response
    footer_pattern = r'\[intent:\s*([^\|]+)\s*\|\s*tone:\s*([^\|]+)\s*\|\s*context:\s*([^\]]+)\]'
    match = re.search(footer_pattern, response_text, re.IGNORECASE)
    
    if match:
        return {
            "intent": match.group(1).strip(),
            "tone": match.group(2).strip(),
            "context": match.group(3).strip()
        }
    
    # Also check for diagnostic footer
    diagnostic_pattern = r'\[intent:\s*([^\|]+)\s*\|\s*tone:\s*([^\]]+)\]'
    match = re.search(diagnostic_pattern, response_text, re.IGNORECASE)
    if match:
        return {
            "intent": match.group(1).strip(),
            "tone": match.group(2).strip(),
            "context": "unknown"
        }
    
    return None


async def create_qa_thread() -> str:
    """Create a new thread with QA mode enabled."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{BACKEND_URL}/threads/",
            headers={"x-org-id": ORG_ID, "Content-Type": "application/json"},
            json={
                "title": f"Phase 3 QA Test - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                "description": "PHASE3_QA_MODE"  # Enable QA mode
            }
        )
        response.raise_for_status()
        thread_data = response.json()
        # Handle both "id" and "thread_id" response formats
        return thread_data.get("id") or thread_data.get("thread_id")


async def send_message_streaming(thread_id: str, message: str) -> Tuple[str, Optional[Dict]]:
    """
    Send a message and stream the response.
    
    Returns:
        Tuple of (response_text, qa_footer_dict)
    """
    url = f"{FRONTEND_URL}/chat" if USE_FRONTEND else f"{BACKEND_URL}/threads/{thread_id}/messages/stream"
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        if USE_FRONTEND:
            # Frontend API expects prompt and thread_id
            payload = {
                "prompt": message,
                "thread_id": thread_id
            }
        else:
            # Backend API format
            payload = {
                "content": message,
                "role": "user",
                "provider": "auto",
                "model": "auto",
                "scope": "private"
            }
        
        try:
            async with client.stream(
                "POST",
                url,
                headers={"x-org-id": ORG_ID, "Content-Type": "application/json"},
                json=payload,
                timeout=30.0
            ) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    return f"Error {response.status_code}: {error_text.decode()}", None
                
                response_text = ""
                qa_footer = None
                buffer = ""
                error_seen = False
                
                async for chunk in response.aiter_bytes():
                    buffer += chunk.decode('utf-8', errors='ignore')
                    
                    # Process complete SSE frames
                    while '\n\n' in buffer:
                        frame_end = buffer.index('\n\n')
                        frame = buffer[:frame_end]
                        buffer = buffer[frame_end + 2:]
                        
                        # Parse SSE frame
                        event_type = 'delta'
                        data_line = ''
                        
                        for line in frame.split('\n'):
                            if line.startswith('event:'):
                                event_type = line[6:].strip()
                            elif line.startswith('data:'):
                                data_line += line[5:].strip()
                        
                        if not data_line:
                            continue
                        
                        try:
                            data = json.loads(data_line)
                            
                            # Handle error events
                            if event_type == 'error':
                                error_seen = True
                                error_msg = data.get('error', 'Unknown error')
                                response_text = f"Error: {error_msg}"
                                break
                            
                            # Handle router event
                            if event_type == 'router':
                                print(f"    → Router: {data.get('provider')} / {data.get('model')}")
                            
                            # Handle delta events
                            if event_type == 'delta' and 'delta' in data:
                                response_text += data["delta"]
                            
                            # Handle done event
                            if event_type == 'done' or data.get("type") == "done":
                                break
                        except json.JSONDecodeError:
                            continue
                
                # Parse QA footer from response
                if not error_seen:
                    qa_footer = parse_qa_footer(response_text)
                
                return response_text, qa_footer
        except httpx.TimeoutException:
            return "Request timeout (30s)", None
        except Exception as e:
            return f"Request error: {str(e)}", None


async def run_qa_test_sequence() -> Dict:
    """Run the complete QA test sequence."""
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║          Phase 3 QA Validation Test Suite                    ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print()
    
    # Create QA thread
    print("📝 Creating QA test thread...")
    try:
        thread_id = await create_qa_thread()
        print(f"✅ Thread created: {thread_id}")
    except Exception as e:
        print(f"❌ Failed to create thread: {e}")
        return {"error": str(e)}
    
    print()
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print()
    
    results = []
    context_checks = []
    
    for i, test in enumerate(QA_TEST_SEQUENCE, 1):
        print(f"🧪 {test['test_name']}")
        print(f"   Query: \"{test['query']}\"")
        print(f"   Expected intent: {test['expected_intent']}")
        
        try:
            response_text, qa_footer = await send_message_streaming(thread_id, test['query'])
            
            # Extract response without footer for display
            response_display = response_text
            if qa_footer:
                # Remove footer from display
                footer_pattern = r'\[intent:.*?\]'
                response_display = re.sub(footer_pattern, '', response_display).strip()
            
            # Show response preview
            preview = response_display[:150] + "..." if len(response_display) > 150 else response_display
            print(f"   Response: {preview}")
            
            # Validate QA footer
            if qa_footer:
                detected_intent = qa_footer.get("intent", "").lower()
                expected_intent = test['expected_intent'].lower()
                
                intent_match = expected_intent in detected_intent or detected_intent in expected_intent
                tone_ok = "stable" in qa_footer.get("tone", "").lower() or "drift" not in qa_footer.get("tone", "").lower()
                context_ok = "maintained" in qa_footer.get("context", "").lower()
                
                print(f"   QA Footer: {qa_footer}")
                
                if intent_match and tone_ok and context_ok:
                    print(f"   ✅ PASS - Intent: {detected_intent}, Tone: {qa_footer.get('tone')}, Context: {qa_footer.get('context')}")
                    results.append({
                        "test": test['test_name'],
                        "status": "PASS",
                        "intent_match": intent_match,
                        "tone_ok": tone_ok,
                        "context_ok": context_ok,
                        "qa_footer": qa_footer
                    })
                else:
                    print(f"   ⚠️  PARTIAL - Intent match: {intent_match}, Tone: {tone_ok}, Context: {context_ok}")
                    results.append({
                        "test": test['test_name'],
                        "status": "PARTIAL",
                        "intent_match": intent_match,
                        "tone_ok": tone_ok,
                        "context_ok": context_ok,
                        "qa_footer": qa_footer
                    })
            else:
                print(f"   ❌ FAIL - No QA footer detected")
                results.append({
                    "test": test['test_name'],
                    "status": "FAIL",
                    "error": "No QA footer found",
                    "response_preview": preview
                })
            
            # Special context check for test 8
            if i == 8:
                if "alex" in response_text.lower() and "python" in response_text.lower():
                    context_checks.append("✅ Context preserved: Remembers 'Alex' and 'Python project'")
                else:
                    context_checks.append("❌ Context lost: Did not remember 'Alex' or 'Python project'")
            
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
            results.append({
                "test": test['test_name'],
                "status": "ERROR",
                "error": str(e)
            })
        
        print()
        await asyncio.sleep(1)  # Small delay between tests
    
    # Summary
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print()
    print("📊 TEST SUMMARY")
    print()
    
    passed = sum(1 for r in results if r.get("status") == "PASS")
    partial = sum(1 for r in results if r.get("status") == "PARTIAL")
    failed = sum(1 for r in results if r.get("status") in ["FAIL", "ERROR"])
    
    print(f"✅ Passed: {passed}/{len(results)}")
    print(f"⚠️  Partial: {partial}/{len(results)}")
    print(f"❌ Failed: {failed}/{len(results)}")
    print()
    
    if context_checks:
        print("🔍 Context Checks:")
        for check in context_checks:
            print(f"   {check}")
        print()
    
    # Detailed results
    print("📋 Detailed Results:")
    for result in results:
        status_icon = "✅" if result.get("status") == "PASS" else "⚠️" if result.get("status") == "PARTIAL" else "❌"
        print(f"   {status_icon} {result['test']}: {result.get('status')}")
        if result.get("qa_footer"):
            print(f"      Intent: {result['qa_footer'].get('intent')}, Tone: {result['qa_footer'].get('tone')}, Context: {result['qa_footer'].get('context')}")
    
    return {
        "thread_id": thread_id,
        "total_tests": len(results),
        "passed": passed,
        "partial": partial,
        "failed": failed,
        "results": results,
        "context_checks": context_checks
    }


if __name__ == "__main__":
    try:
        results = asyncio.run(run_qa_test_sequence())
        
        # Exit with appropriate code
        if results.get("failed", 0) == 0 and results.get("passed", 0) > 0:
            sys.exit(0)  # Success
        else:
            sys.exit(1)  # Some tests failed
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n\n❌ Test suite error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

