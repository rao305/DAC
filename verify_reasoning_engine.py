#!/usr/bin/env python3
"""
Verification script for DAC Reasoning Engine implementation.

This script verifies that all new features are correctly implemented:
1. New base system prompt (DAC_SYSTEM_PROMPT)
2. Provider-specific overrides (5 total)
3. Helper functions (get_provider_specific_override, inject_dac_persona)
4. Integration in API endpoints
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_system_prompts():
    """Test that all system prompts are defined."""
    print("=" * 60)
    print("Testing System Prompts...")
    print("=" * 60)
    
    from app.services.dac_persona import (
        DAC_SYSTEM_PROMPT,
        DAC_OPENAI_CODING_OVERRIDE,
        DAC_CLAUDE_REASONING_OVERRIDE,
        DAC_GEMINI_CREATIVE_OVERRIDE,
        DAC_PERPLEXITY_RESEARCH_OVERRIDE,
        DAC_KIMI_MULTILINGUAL_OVERRIDE
    )
    
    prompts = {
        "Base DAC System Prompt": DAC_SYSTEM_PROMPT,
        "OpenAI Coding Override": DAC_OPENAI_CODING_OVERRIDE,
        "Claude Reasoning Override": DAC_CLAUDE_REASONING_OVERRIDE,
        "Gemini Creative Override": DAC_GEMINI_CREATIVE_OVERRIDE,
        "Perplexity Research Override": DAC_PERPLEXITY_RESEARCH_OVERRIDE,
        "Kimi Multilingual Override": DAC_KIMI_MULTILINGUAL_OVERRIDE
    }
    
    for name, prompt in prompts.items():
        if not prompt or len(prompt) < 50:
            print(f"❌ {name}: FAILED (too short or empty)")
            return False
        else:
            print(f"✅ {name}: OK ({len(prompt)} chars)")
    
    # Verify key concepts in base prompt
    key_concepts = [
        "reasoning engine",
        "HIGH-LEVEL ARCHITECTURE",
        "Semantic Intent Classification",
        "Safety Filtering",
        "REASONING PROFILES",
        "MULTI-MODEL COLLABORATION"
    ]
    
    print("\nVerifying key concepts in base prompt:")
    for concept in key_concepts:
        if concept in DAC_SYSTEM_PROMPT:
            print(f"✅ Found: {concept}")
        else:
            print(f"❌ Missing: {concept}")
            return False
    
    return True


def test_helper_functions():
    """Test helper functions."""
    print("\n" + "=" * 60)
    print("Testing Helper Functions...")
    print("=" * 60)
    
    from app.services.dac_persona import get_provider_specific_override, inject_dac_persona
    
    # Test get_provider_specific_override
    providers = [
        ("openai", "coding"),
        ("gpt", "coding"),
        ("claude", "reasoning"),
        ("anthropic", "reasoning"),
        ("gemini", "creative"),
        ("google", "creative"),
        ("perplexity", "research"),
        ("sonar", "research"),
        ("kimi", "multilingual"),
        ("moonshot", "multilingual")
    ]
    
    print("\nTesting get_provider_specific_override:")
    for provider, expected_specialty in providers:
        override = get_provider_specific_override(provider)
        if override and expected_specialty.lower() in override.lower():
            print(f"✅ {provider} → {expected_specialty} specialist")
        else:
            print(f"❌ {provider} → FAILED (expected {expected_specialty})")
            return False
    
    # Test inject_dac_persona
    print("\nTesting inject_dac_persona:")
    test_messages = [
        {"role": "user", "content": "Hello"}
    ]
    
    # Test without provider
    result = inject_dac_persona(test_messages, qa_mode=False, intent=None, provider=None)
    if result and len(result) >= 2:  # Should have system message + user message
        print(f"✅ inject_dac_persona without provider: OK ({len(result)} messages)")
    else:
        print(f"❌ inject_dac_persona without provider: FAILED")
        return False
    
    # Test with provider
    result_with_provider = inject_dac_persona(test_messages, qa_mode=False, intent="coding_help", provider="openai")
    if result_with_provider and len(result_with_provider) > len(result):
        print(f"✅ inject_dac_persona with provider: OK ({len(result_with_provider)} messages, includes override)")
    else:
        print(f"❌ inject_dac_persona with provider: FAILED")
        return False
    
    return True


def test_api_integration():
    """Test that API endpoints call inject_dac_persona correctly."""
    print("\n" + "=" * 60)
    print("Testing API Integration...")
    print("=" * 60)
    
    # Read threads.py and check for provider parameter
    with open('backend/app/api/threads.py', 'r') as f:
        threads_content = f.read()
    
    # Check for inject_dac_persona calls with provider parameter
    checks = [
        ("inject_dac_persona calls", "inject_dac_persona(", 2),
        ("provider parameter usage", "provider=", 2)
    ]
    
    for check_name, search_str, expected_count in checks:
        count = threads_content.count(search_str)
        if count >= expected_count:
            print(f"✅ {check_name}: Found {count} occurrences (expected {expected_count}+)")
        else:
            print(f"❌ {check_name}: Found {count} occurrences (expected {expected_count}+)")
            return False
    
    # Check route_and_call.py
    with open('backend/app/services/route_and_call.py', 'r') as f:
        route_content = f.read()
    
    if "provider=" in route_content and "inject_dac_persona" in route_content:
        print(f"✅ route_and_call.py integration: OK")
    else:
        print(f"❌ route_and_call.py integration: FAILED")
        return False
    
    return True


def test_profile_structure():
    """Test that reasoning profiles are properly structured."""
    print("\n" + "=" * 60)
    print("Testing Reasoning Profile Structure...")
    print("=" * 60)
    
    from app.services.dac_persona import DAC_SYSTEM_PROMPT
    
    # Check for all reasoning profiles (new naming)
    profiles = [
        "A. CODING TASKS",
        "B. MATH TASKS",
        "C. FACTUAL / RESEARCH TASKS",
        "D. CREATIVE TASKS",
        "E. MULTIMODAL TASKS",
        "F. GENERAL CHAT"
    ]
    
    for profile in profiles:
        if profile in DAC_SYSTEM_PROMPT:
            print(f"✅ Found: {profile}")
        else:
            print(f"❌ Missing: {profile}")
            return False
    
    return True


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("DAC REASONING ENGINE - VERIFICATION")
    print("=" * 60)
    
    tests = [
        ("System Prompts", test_system_prompts),
        ("Helper Functions", test_helper_functions),
        ("API Integration", test_api_integration),
        ("Profile Structure", test_profile_structure)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ {test_name} FAILED with error: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    
    all_passed = True
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
        if not result:
            all_passed = False
    
    print("\n" + "=" * 60)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
        print("=" * 60)
        print("\nThe DAC Reasoning Engine is correctly implemented.")
        print("You can now:")
        print("  1. Start the backend: cd backend && python3 main.py")
        print("  2. Test with sample queries")
        print("  3. Monitor performance metrics")
        return 0
    else:
        print("❌ SOME TESTS FAILED")
        print("=" * 60)
        print("\nPlease review the failed tests above.")
        return 1


if __name__ == "__main__":
    exit(main())
