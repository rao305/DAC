#!/usr/bin/env python3
"""Test context preservation across model switching in the same conversation."""

import requests
import json
import time

API_URL = "http://localhost:8000/api"
ORG_ID = "org_demo"

def send_message(thread_id: str, content: str) -> dict:
    """Send a message and return the response."""
    response = requests.post(
        f"{API_URL}/threads/{thread_id}/messages",
        headers={"x-org-id": ORG_ID, "Content-Type": "application/json"},
        json={"content": content, "role": "user"}
    )
    response.raise_for_status()
    return response.json()

def get_audit_log(thread_id: str) -> list:
    """Get audit log for the thread."""
    response = requests.get(
        f"{API_URL}/threads/{thread_id}/audit",
        headers={"x-org-id": ORG_ID}
    )
    response.raise_for_status()
    return response.json()

def create_thread() -> str:
    """Create a new thread."""
    response = requests.post(
        f"{API_URL}/threads/",
        headers={"x-org-id": ORG_ID, "Content-Type": "application/json"},
        json={"title": "Context Switching Test"}
    )
    response.raise_for_status()
    return response.json()["thread_id"]

def print_section(title):
    """Print a section header."""
    print(f"\n{'='*100}")
    print(f"  {title}")
    print(f"{'='*100}\n")

def print_exchange(turn_num, query, response_preview, provider, model, context_check=None):
    """Print a conversation turn."""
    print(f"Turn {turn_num}:")
    print(f"  👤 User: {query}")
    print(f"  🤖 DAC: {response_preview[:150]}...")
    print(f"  📊 Model: {provider}/{model}")
    if context_check:
        print(f"  🔍 Context Check: {context_check}")
    print()

def main():
    print_section("🧪 Testing Context Preservation Across Model Switching")

    # Create thread
    print("📝 Creating conversation thread...")
    thread_id = create_thread()
    print(f"✅ Thread created: {thread_id}\n")

    conversation_history = []

    # Turn 1: Simple greeting (should use Gemini)
    print_section("Turn 1: Simple Greeting → Gemini")
    query1 = "Hi! My name is Alex and I'm working on a Python project."
    result1 = send_message(thread_id, query1)
    response1 = result1['assistant_message']['content']
    audit1 = get_audit_log(thread_id)[0]

    print_exchange(
        1, query1, response1,
        audit1['provider'], audit1['model'],
        "✅ Should use Gemini for simple greeting"
    )

    conversation_history.append({
        "turn": 1,
        "query": query1,
        "response": response1,
        "model": f"{audit1['provider']}/{audit1['model']}"
    })

    time.sleep(1)

    # Turn 2: Ask for code (should switch to OpenAI)
    print_section("Turn 2: Code Request → OpenAI")
    query2 = "Can you write me a function to calculate fibonacci numbers?"
    result2 = send_message(thread_id, query2)
    response2 = result2['assistant_message']['content']
    audit2 = get_audit_log(thread_id)[0]

    print_exchange(
        2, query2, response2,
        audit2['provider'], audit2['model'],
        "✅ Should switch to OpenAI for code generation"
    )

    conversation_history.append({
        "turn": 2,
        "query": query2,
        "response": response2,
        "model": f"{audit2['provider']}/{audit2['model']}"
    })

    time.sleep(1)

    # Turn 3: Follow-up on code (should stay OpenAI and remember the code)
    print_section("Turn 3: Code Follow-up → Test Context")
    query3 = "Can you modify that function to handle negative numbers?"
    result3 = send_message(thread_id, query3)
    response3 = result3['assistant_message']['content']
    audit3 = get_audit_log(thread_id)[0]

    # Check if response references "fibonacci" or "function" showing context awareness
    has_context = any(word in response3.lower() for word in ['fibonacci', 'function', 'negative'])

    print_exchange(
        3, query3, response3,
        audit3['provider'], audit3['model'],
        f"{'✅' if has_context else '❌'} Context preserved: References previous code"
    )

    conversation_history.append({
        "turn": 3,
        "query": query3,
        "response": response3,
        "model": f"{audit3['provider']}/{audit3['model']}",
        "context_preserved": has_context
    })

    time.sleep(1)

    # Turn 4: Ask a factual question (should try Perplexity)
    print_section("Turn 4: Factual Question → Perplexity")
    query4 = "What's the time complexity of the fibonacci algorithm?"
    result4 = send_message(thread_id, query4)
    response4 = result4['assistant_message']['content']
    audit4 = get_audit_log(thread_id)[0]

    print_exchange(
        4, query4, response4,
        audit4['provider'], audit4['model'],
        "✅ May switch to Perplexity or stay OpenAI for analysis"
    )

    conversation_history.append({
        "turn": 4,
        "query": query4,
        "response": response4,
        "model": f"{audit4['provider']}/{audit4['model']}"
    })

    time.sleep(1)

    # Turn 5: Reference earlier conversation (test long-term context)
    print_section("Turn 5: Reference Earlier Context → Critical Test")
    query5 = "Thanks! Can you remind me what my name is and what project I'm working on?"
    result5 = send_message(thread_id, query5)
    response5 = result5['assistant_message']['content']
    audit5 = get_audit_log(thread_id)[0]

    # Check if it remembers "Alex" and "Python"
    remembers_name = "alex" in response5.lower()
    remembers_project = "python" in response5.lower()

    context_status = []
    if remembers_name:
        context_status.append("✅ Remembers name (Alex)")
    else:
        context_status.append("❌ Forgot name")

    if remembers_project:
        context_status.append("✅ Remembers project (Python)")
    else:
        context_status.append("❌ Forgot project")

    print_exchange(
        5, query5, response5,
        audit5['provider'], audit5['model'],
        " | ".join(context_status)
    )

    conversation_history.append({
        "turn": 5,
        "query": query5,
        "response": response5,
        "model": f"{audit5['provider']}/{audit5['model']}",
        "remembers_name": remembers_name,
        "remembers_project": remembers_project
    })

    time.sleep(1)

    # Turn 6: Creative writing (switch to OpenAI creative mode)
    print_section("Turn 6: Creative Writing → OpenAI")
    query6 = "Write me a short poem about coding"
    result6 = send_message(thread_id, query6)
    response6 = result6['assistant_message']['content']
    audit6 = get_audit_log(thread_id)[0]

    print_exchange(
        6, query6, response6,
        audit6['provider'], audit6['model'],
        "✅ Should use OpenAI for creative writing"
    )

    conversation_history.append({
        "turn": 6,
        "query": query6,
        "response": response6,
        "model": f"{audit6['provider']}/{audit6['model']}"
    })

    time.sleep(1)

    # Turn 7: Simple farewell (back to Gemini)
    print_section("Turn 7: Simple Chat → Gemini")
    query7 = "Thanks, you've been really helpful!"
    result7 = send_message(thread_id, query7)
    response7 = result7['assistant_message']['content']
    audit7 = get_audit_log(thread_id)[0]

    print_exchange(
        7, query7, response7,
        audit7['provider'], audit7['model'],
        "✅ Should switch back to Gemini for simple chat"
    )

    conversation_history.append({
        "turn": 7,
        "query": query7,
        "response": response7,
        "model": f"{audit7['provider']}/{audit7['model']}"
    })

    # Summary
    print_section("📊 SUMMARY: Context Preservation Analysis")

    # Model switches
    print("🔄 Model Switching Pattern:")
    prev_model = None
    switches = 0
    for i, turn in enumerate(conversation_history, 1):
        if prev_model and prev_model != turn['model']:
            switches += 1
            print(f"   Turn {i}: {prev_model} → {turn['model']} ✅ SWITCHED")
        else:
            print(f"   Turn {i}: {turn['model']}")
        prev_model = turn['model']

    print(f"\n   Total model switches: {switches}")

    # Context preservation
    print("\n🧠 Context Preservation Results:")

    # Check Turn 3 (code follow-up)
    turn3 = conversation_history[2]
    if turn3.get('context_preserved'):
        print("   ✅ Turn 3: Model remembered previous code (fibonacci function)")
    else:
        print("   ❌ Turn 3: Model forgot previous code context")

    # Check Turn 5 (name and project recall)
    turn5 = conversation_history[4]
    if turn5.get('remembers_name') and turn5.get('remembers_project'):
        print("   ✅ Turn 5: Model remembered name (Alex) and project (Python)")
    elif turn5.get('remembers_name') or turn5.get('remembers_project'):
        print("   ⚠️  Turn 5: Model partially remembered context")
    else:
        print("   ❌ Turn 5: Model forgot earlier conversation details")

    # Model usage breakdown
    print("\n📊 Model Usage Distribution:")
    model_counts = {}
    for turn in conversation_history:
        model = turn['model']
        model_counts[model] = model_counts.get(model, 0) + 1

    for model, count in sorted(model_counts.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / len(conversation_history)) * 100
        print(f"   {model}: {count} turns ({percentage:.1f}%)")

    # Final verdict
    print("\n" + "="*100)
    print("🎯 FINAL VERDICT")
    print("="*100)

    context_works = (
        turn3.get('context_preserved', False) and
        (turn5.get('remembers_name', False) or turn5.get('remembers_project', False))
    )

    if context_works and switches >= 2:
        print("✅ SUCCESS: Models switch based on task AND maintain context!")
        print("   - Multiple model switches detected")
        print("   - Context preserved across switches")
        print("   - Each model used for its strength")
    elif switches >= 2:
        print("⚠️  PARTIAL: Models switch but context preservation needs work")
        print("   - Model switching works")
        print("   - Context preservation may have gaps")
    else:
        print("❌ ISSUE: Not enough model switching detected")
        print("   - Review routing logic")

    print("="*100)

if __name__ == "__main__":
    main()
