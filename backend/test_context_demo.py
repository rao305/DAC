#!/usr/bin/env python3
"""
Demo script to test context-awareness and coreference resolution.

This script simulates a conversation with DAC and demonstrates:
1. Entity tracking
2. Pronoun resolution
3. Vague reference resolution
4. Smart clarification
"""

import asyncio
from app.services.coreference_service import (
    get_conversation_context,
    Entity,
    resolve_vague_reference,
)


def print_header(text):
    """Print a formatted header."""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)


def print_turn(speaker, message):
    """Print a conversation turn."""
    print(f"\n{speaker}: {message}")


def print_resolution(phrase, resolved, reasoning):
    """Print resolution details."""
    if resolved:
        print(f"  ✓ Resolved '{phrase}' → '{resolved}'")
        print(f"    Reasoning: {reasoning}")
    else:
        print(f"  ✗ Could not resolve '{phrase}'")
        print(f"    Reason: {reasoning}")


async def test_scenario_1():
    """Test Scenario 1: Single University Reference."""
    print_header("TEST 1: Single University Reference")

    thread_id = "test-scenario-1"
    context = get_conversation_context(thread_id)

    # Turn 1: User asks about Purdue
    print_turn("User", "What is Purdue University?")
    context.add_entity(Entity(
        name="Purdue University",
        type="university",
        context="Large public research university in Indiana"
    ))
    print_turn("DAC", "Purdue University is a large public research university in West Lafayette, Indiana...")

    # Turn 2: User uses vague reference
    print_turn("User", "What is the computer science rank for that university?")
    resolved, reasoning = resolve_vague_reference("that university", context, [])
    print_resolution("that university", resolved, reasoning)

    assert resolved == "Purdue University", f"Expected 'Purdue University', got '{resolved}'"
    print("\n✅ TEST 1 PASSED: Correctly resolved single university reference")


async def test_scenario_2():
    """Test Scenario 2: Pronoun Resolution with Models."""
    print_header("TEST 2: Pronoun Resolution (Models)")

    thread_id = "test-scenario-2"
    context = get_conversation_context(thread_id)

    # Turn 1: Discuss GPT-4
    print_turn("User", "Tell me about GPT-4")
    context.add_entity(Entity(
        name="GPT-4",
        type="model",
        context="OpenAI's most advanced language model"
    ))
    print_turn("DAC", "GPT-4 is OpenAI's most advanced language model...")

    # Turn 2: Use pronoun "it"
    print_turn("User", "How does it compare to Claude?")
    resolved, reasoning = resolve_vague_reference("it", context, [])
    print_resolution("it", resolved, reasoning)

    assert resolved == "GPT-4", f"Expected 'GPT-4', got '{resolved}'"
    print("\n✅ TEST 2 PASSED: Correctly resolved pronoun 'it' to model")


async def test_scenario_3():
    """Test Scenario 3: Multiple Entities - Recency Wins."""
    print_header("TEST 3: Multiple Entities - Recency Wins")

    thread_id = "test-scenario-3"
    context = get_conversation_context(thread_id)

    # Turn 1: Mention Purdue
    print_turn("User", "What is Purdue University known for?")
    context.add_entity(Entity(
        name="Purdue University",
        type="university",
        context="Known for engineering"
    ))
    print_turn("DAC", "Purdue University is particularly known for its engineering programs...")

    # Turn 2: Mention MIT (more recent)
    print_turn("User", "What about MIT?")
    context.add_entity(Entity(
        name="MIT",
        type="university",
        context="Known for technology and innovation"
    ))
    print_turn("DAC", "MIT is renowned for technology and innovation...")

    # Turn 3: Use vague reference (should resolve to MIT, most recent)
    print_turn("User", "What's the acceptance rate for that university?")
    resolved, reasoning = resolve_vague_reference("that university", context, [])
    print_resolution("that university", resolved, reasoning)

    assert resolved == "MIT", f"Expected 'MIT' (most recent), got '{resolved}'"
    print("\n✅ TEST 3 PASSED: Correctly resolved to most recent entity")


async def test_scenario_4():
    """Test Scenario 4: Different Entity Types."""
    print_header("TEST 4: Different Entity Types")

    thread_id = "test-scenario-4"
    context = get_conversation_context(thread_id)

    # Add entities of different types
    print_turn("User", "Tell me about Purdue University, GPT-4, and OpenAI")
    context.add_entity(Entity(name="Purdue University", type="university"))
    context.add_entity(Entity(name="GPT-4", type="model"))
    context.add_entity(Entity(name="OpenAI", type="company"))
    print_turn("DAC", "Here's information about all three...")

    # Test resolving each type
    print("\nResolving different types:")

    university, _ = resolve_vague_reference("that university", context, [])
    print_resolution("that university", university, "Most recent university")
    assert university == "Purdue University"

    model, _ = resolve_vague_reference("that model", context, [])
    print_resolution("that model", model, "Most recent model")
    assert model == "GPT-4"

    company, _ = resolve_vague_reference("that company", context, [])
    print_resolution("that company", company, "Most recent company")
    assert company == "OpenAI"

    print("\n✅ TEST 4 PASSED: Correctly resolved different entity types")


async def test_scenario_5():
    """Test Scenario 5: No Entity Found."""
    print_header("TEST 5: No Entity Found (Graceful Handling)")

    thread_id = "test-scenario-5"
    context = get_conversation_context(thread_id)

    # No entities added
    print_turn("User", "What is that university's ranking?")
    resolved, reasoning = resolve_vague_reference("that university", context, [])
    print_resolution("that university", resolved, reasoning)

    assert resolved is None, f"Expected None, got '{resolved}'"
    assert "No university found" in reasoning
    print("\n✅ TEST 5 PASSED: Correctly handled missing entity")


async def test_scenario_6():
    """Test Scenario 6: Company Pronoun 'They'."""
    print_header("TEST 6: Pronoun 'They' for Company")

    thread_id = "test-scenario-6"
    context = get_conversation_context(thread_id)

    # Mention a company
    print_turn("User", "Tell me about OpenAI")
    context.add_entity(Entity(
        name="OpenAI",
        type="company",
        context="AI research company"
    ))
    print_turn("DAC", "OpenAI is an AI research company...")

    # Use pronoun "they"
    print_turn("User", "What products have they released?")
    resolved, reasoning = resolve_vague_reference("they", context, [])
    print_resolution("they", resolved, reasoning)

    assert resolved == "OpenAI", f"Expected 'OpenAI', got '{resolved}'"
    print("\n✅ TEST 6 PASSED: Correctly resolved 'they' to company")


async def main():
    """Run all test scenarios."""
    print("\n" + "🧠" * 35)
    print("  CONTEXT-AWARENESS & COREFERENCE RESOLUTION TESTS")
    print("🧠" * 35)

    try:
        await test_scenario_1()
        await test_scenario_2()
        await test_scenario_3()
        await test_scenario_4()
        await test_scenario_5()
        await test_scenario_6()

        print("\n" + "=" * 70)
        print("  ✅ ALL TESTS PASSED!")
        print("=" * 70)
        print("\nContext-awareness system is working correctly!")
        print("The system can:")
        print("  • Track entities across conversation turns")
        print("  • Resolve vague references like 'that university'")
        print("  • Resolve pronouns like 'it', 'they'")
        print("  • Handle multiple entity types simultaneously")
        print("  • Prefer most recent entity when multiple exist")
        print("  • Gracefully handle missing entities")
        print()

    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
