# Cursor System Prompts - Advanced Testing & Reliability

This directory contains four fully-formed system prompts that can be dropped directly into Cursor to build advanced testing and reliability infrastructure for the DAC conversation context system.

## Available Prompts

### 1. Memory Pipeline Stress Test Suite
**File:** `1_MEMORY_PIPELINE_STRESS_TEST.md`

**Purpose:** Build stress tests for high concurrency, rapid-fire requests, multi-user isolation, and long conversations.

**Creates:**
- `backend/tests/stress/test_concurrent_threads.py`
- `backend/tests/stress/test_rapid_fire_messages.py`
- `backend/tests/stress/test_multi_user_isolation.py`
- `backend/tests/stress/test_long_conversation_windowing.py`
- `backend/tests/stress/utils.py` (optional)

**When to use:** When you need to validate system behavior under load and edge cases.

---

### 2. Async Race Condition Simulator
**File:** `2_ASYNC_RACE_CONDITION_SIMULATOR.md`

**Purpose:** Build tools and tests specifically targeting async race conditions in turn saving, context building, and streaming.

**Creates:**
- `backend/tests/race_simulation/test_async_races.py`
- `backend/tests/race_simulation/async_utils.py`
- Race injection framework with test-only hooks

**When to use:** When you need to detect subtle timing bugs and race conditions in async operations.

---

### 3. Provider Routing Reliability Spec
**File:** `3_PROVIDER_ROUTING_RELIABILITY_SPEC.md`

**Purpose:** Formalize how routing works and ensure all providers receive identical context.

**Creates:**
- `PROVIDER_ROUTING_SPEC.md` - Complete specification document
- `backend/tests/test_provider_routing.py` - Routing validation tests

**When to use:** When you need to ensure multi-model routing never breaks context or causes inconsistencies.

---

### 4. LLM Evaluation Harness
**File:** `4_LLM_EVALUATION_HARNESS.md`

**Purpose:** Build an evaluation framework for answer quality, correctness, and context-dependent questions.

**Creates:**
- `eval/README.md` - Documentation
- `eval/tasks.yaml` - Evaluation task definitions
- `eval/run_eval.py` - CLI evaluation runner
- `eval/metrics.py` - Scoring and metrics
- `eval/providers.py` (optional) - Provider wrappers

**When to use:** When you need to systematically evaluate model outputs and detect regressions in answer quality.

---

## How to Use

1. **Open Cursor**
2. **Copy the entire contents** of one of the prompt files
3. **Paste into Cursor** as a system prompt (or use Cursor's prompt interface)
4. **Let Cursor generate** the code and documentation
5. **Review and test** the generated artifacts

## Usage Order

Recommended order for building a complete reliability stack:

1. **Start with Stress Tests** (Prompt 1) - Validates basic robustness
2. **Add Race Condition Simulator** (Prompt 2) - Catches timing bugs
3. **Formalize Routing** (Prompt 3) - Ensures multi-model consistency
4. **Build Evaluation Harness** (Prompt 4) - Measures quality and correctness

## Integration with Existing System

These prompts are designed to work alongside:

- ✅ `CONTEXT_INVARIANTS_SPEC.md` - Core invariants
- ✅ `CONTRIBUTOR_ONBOARDING.md` - Developer guide
- ✅ `CONTEXT_DEBUGGING_PLAYBOOK.md` - Debugging guide
- ✅ `MEMORY_PIPELINE_ARCHITECTURE.md` - Architecture docs
- ✅ Existing regression test suite (12 tests)

## Notes

- All prompts are **production-ready** and follow existing project patterns
- All prompts **respect existing code** and don't break current tests
- All prompts create **isolated test suites** that can run independently
- All prompts include **clear documentation** and examples

## Next Steps

After running these prompts, you'll have:

- **Stress testing** for load and concurrency
- **Race condition detection** for async bugs
- **Routing reliability** for multi-model consistency
- **Evaluation framework** for quality assurance

This completes the "context correctness shield" for DAC! 🛡️

