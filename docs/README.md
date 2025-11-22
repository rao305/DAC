# DAC Documentation

Welcome to the DAC (Distributed AI Coordinator) documentation. This directory contains all project documentation organized by category.

## 📁 Documentation Structure

### [Specs](./specs/)
Technical specifications and invariants that define system behavior and guarantees.

- `CONTEXT_INVARIANTS_SPEC.md` - Core invariants for conversation context system

### [Onboarding](./onboarding/)
Guides for new contributors joining the DAC team.

- `CONTRIBUTOR_ONBOARDING.md` - Complete onboarding guide for new developers

### [Debugging](./debugging/)
Operational guides for diagnosing and fixing issues.

- `CONTEXT_DEBUGGING_PLAYBOOK.md` - Step-by-step debugging guide for context issues

### [Architecture](./architecture/)
System architecture, design decisions, and technical deep-dives.

- `MEMORY_PIPELINE_ARCHITECTURE.md` - Visual architecture of the memory pipeline
- `LLM_CONTEXT_SYSTEM.md` - LLM context system overview
- `CONTEXT_FLOW_OPTIMIZED.md` - Context flow optimization details

### [Tests](./tests/)
Test documentation, results, and test strategy.

- `COMPLETE_TEST_SUITE.md` - Full test suite documentation
- `REGRESSION_TESTS_COMPLETE.md` - Regression test coverage
- `E2E_API_TEST_COMPLETE.md` - End-to-end API test documentation
- `BROWSER_TEST_RESULTS.md` - Browser testing results
- `SANITY_TEST_FINDINGS.md` - Sanity test results

### [Implementation](./implementation/)
Implementation guides, fixes, and solution summaries.

- `THREAD_STORE_FIX_COMPLETE.md` - Thread store implementation
- `ROBUST_CONTEXT_FIX.md` - Context system fixes
- `COMPLETE_SOLUTION_SUMMARY.md` - Solution summaries
- `QUERY_REWRITER_IMPLEMENTATION.md` - Query rewriter implementation

### [Phases](./phases/)
Phase-specific documentation, status reports, and checklists.

- Phase 1-5 documentation and status reports

### [Guides](./guides/)
User guides, integration guides, and how-to documentation.

- `QUERY_REWRITER_INTEGRATION_GUIDE.md` - Query rewriter integration
- `INTELLIGENT_ROUTING_GUIDE.md` - Intelligent routing guide
- `PROVIDER_SWITCHING_GUIDE.md` - Provider switching guide

### [Reports](./reports/)
Analysis reports, evaluations, and QA reports.

- `SUPERMEMORY_INTEGRATION_REPORT.md` - Supermemory integration analysis
- `MODEL_OPTIMIZATION_REPORT.md` - Model optimization analysis
- `PHASE2_QA_REPORT.md` - Phase 2 QA report

### [Cursor Prompts](./cursor-prompts/)
System prompts for Cursor AI assistant.

- `README.md` - Cursor prompts overview
- `1_MEMORY_PIPELINE_STRESS_TEST.md` - Stress test prompt
- `2_ASYNC_RACE_CONDITION_SIMULATOR.md` - Race condition simulator prompt
- `3_PROVIDER_ROUTING_RELIABILITY_SPEC.md` - Provider routing spec prompt
- `4_LLM_EVALUATION_HARNESS.md` - LLM evaluation harness prompt

## 🚀 Quick Links

- [Main README](../README.md) - Project overview
- [Contributor Onboarding](./onboarding/CONTRIBUTOR_ONBOARDING.md) - Get started contributing
- [Context Debugging Playbook](./debugging/CONTEXT_DEBUGGING_PLAYBOOK.md) - Debug context issues
- [Test Suite](./tests/COMPLETE_TEST_SUITE.md) - Run tests

## 📝 Documentation Standards

All documentation follows our [Documentation Style Guide](./STANDARDS/DOCS_STYLE_GUIDE.md).

## 🔄 Keeping Documentation Updated

When adding new documentation:

1. Place files in the appropriate category directory
2. Update this README if adding a new category
3. Follow the documentation style guide
4. Link from relevant sections in the main README

---

**Last Updated:** 2025-01-16
