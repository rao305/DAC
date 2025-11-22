#!/usr/bin/env python3
"""
Test script for the collaboration engine implementation.

This script tests:
1. Basic collaboration pipeline
2. Follow-up questions 
3. Meta-questions about the collaboration
4. Database storage and retrieval
"""

import asyncio
import json
from typing import Dict, Any

async def test_collaboration_endpoint():
    """Test the collaboration API endpoint"""
    import aiohttp
    
    # Test collaboration request
    collaboration_data = {
        "message": "I want to build a simple todo app. Give me a quick blueprint with tech stack recommendations.",
        "user_id": "test_user",
        "thread_id": None
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            # Test collaboration endpoint
            async with session.post(
                "http://localhost:8000/api/collaboration/collaborate",
                json=collaboration_data,
                headers={
                    "X-Org-ID": "org_demo",
                    "Content-Type": "application/json"
                }
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print("✅ Collaboration endpoint working!")
                    print(f"📊 Final report length: {len(result.get('final_report', ''))}")
                    print(f"🤖 Agent outputs: {len(result.get('agent_outputs', []))}")
                    print(f"⏱️  Total time: {result.get('total_time_ms', 0)}ms")
                    return result.get('turn_id')
                else:
                    error_text = await response.text()
                    print(f"❌ Collaboration failed: {response.status}")
                    print(f"Error: {error_text}")
                    return None
    
    except Exception as e:
        print(f"❌ Error testing collaboration: {e}")
        return None

async def test_meta_question(turn_id: str):
    """Test meta-question functionality"""
    import aiohttp
    
    meta_data = {
        "question": "What did the Researcher find in the last collaboration?",
        "user_id": "test_user", 
        "thread_id": f"collab_{turn_id}"
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "http://localhost:8000/api/collaboration/meta-question",
                json=meta_data,
                headers={
                    "X-Org-ID": "org_demo",
                    "Content-Type": "application/json"
                }
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print("✅ Meta-question working!")
                    print(f"📝 Answer length: {len(result.get('answer', ''))}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Meta-question failed: {response.status}")
                    print(f"Error: {error_text}")
                    return False
    
    except Exception as e:
        print(f"❌ Error testing meta-question: {e}")
        return False

async def test_follow_up(turn_id: str):
    """Test follow-up question functionality"""
    import aiohttp
    
    followup_data = {
        "message": "Can you expand more on the database design section?",
        "user_id": "test_user",
        "thread_id": f"collab_{turn_id}"
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "http://localhost:8000/api/collaboration/follow-up",
                json=followup_data,
                headers={
                    "X-Org-ID": "org_demo",
                    "Content-Type": "application/json"
                }
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print("✅ Follow-up question working!")
                    print(f"📝 Answer length: {len(result.get('answer', ''))}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Follow-up failed: {response.status}")
                    print(f"Error: {error_text}")
                    return False
    
    except Exception as e:
        print(f"❌ Error testing follow-up: {e}")
        return False

async def test_regular_message_with_collaboration():
    """Test regular message endpoint with collaboration mode enabled"""
    import aiohttp
    
    # Create a thread first
    thread_data = {
        "user_id": "test_user",
        "title": "Test Collaboration Thread"
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            # Create thread
            async with session.post(
                "http://localhost:8000/api/threads/",
                json=thread_data,
                headers={
                    "X-Org-ID": "org_demo",
                    "Content-Type": "application/json"
                }
            ) as response:
                if response.status != 200:
                    print(f"❌ Failed to create thread: {response.status}")
                    return False
                
                thread_result = await response.json()
                thread_id = thread_result["thread_id"]
                print(f"✅ Created thread: {thread_id}")
            
            # Send message with collaboration mode
            message_data = {
                "content": "What are the key considerations for building a scalable web application?",
                "user_id": "test_user",
                "collaboration_mode": True
            }
            
            async with session.post(
                f"http://localhost:8000/api/threads/{thread_id}/messages",
                json=message_data,
                headers={
                    "X-Org-ID": "org_demo",
                    "Content-Type": "application/json"
                }
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print("✅ Regular message with collaboration working!")
                    print(f"📝 Assistant message length: {len(result['assistant_message']['content'])}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Regular message failed: {response.status}")
                    print(f"Error: {error_text}")
                    return False
    
    except Exception as e:
        print(f"❌ Error testing regular message: {e}")
        return False

async def main():
    """Run all tests"""
    print("🚀 Starting collaboration pipeline tests...\n")
    
    # Test 1: Collaboration endpoint
    print("Test 1: Testing collaboration endpoint...")
    turn_id = await test_collaboration_endpoint()
    print()
    
    if not turn_id:
        print("❌ Collaboration test failed, skipping follow-up tests")
        return
    
    # Test 2: Meta-question
    print("Test 2: Testing meta-question functionality...")
    meta_success = await test_meta_question(turn_id)
    print()
    
    # Test 3: Follow-up question
    print("Test 3: Testing follow-up question functionality...")
    followup_success = await test_follow_up(turn_id)
    print()
    
    # Test 4: Regular message with collaboration
    print("Test 4: Testing regular message endpoint with collaboration...")
    regular_success = await test_regular_message_with_collaboration()
    print()
    
    # Summary
    print("📊 Test Summary:")
    print(f"✅ Collaboration endpoint: {'✓' if turn_id else '✗'}")
    print(f"✅ Meta-questions: {'✓' if meta_success else '✗'}")
    print(f"✅ Follow-up questions: {'✓' if followup_success else '✗'}")
    print(f"✅ Regular message w/ collab: {'✓' if regular_success else '✗'}")
    
    if turn_id and meta_success and followup_success and regular_success:
        print("\n🎉 All tests passed! Collaboration pipeline is working correctly.")
    else:
        print("\n⚠️  Some tests failed. Check the logs above for details.")

if __name__ == "__main__":
    asyncio.run(main())