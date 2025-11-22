# Query Rewriter Test Suite

Comprehensive test suite for the Query Rewriter and Disambiguation Assistant system.

## Test Structure

- `test_scenarios.json` - Test case matrix with 10 scenarios
- `test_query_rewriter.py` - Unit tests for Query Rewriter
- `test_disambiguation_assistant.py` - Unit tests for Disambiguation Assistant
- `test_query_rewriter_integration.py` - Integration tests for full pipeline

## Running Tests

### Run All Tests

```bash
cd backend
pytest tests/
```

### Run Specific Test File

```bash
pytest tests/test_query_rewriter.py
pytest tests/test_disambiguation_assistant.py
pytest tests/test_query_rewriter_integration.py
```

### Run Specific Test

```bash
pytest tests/test_query_rewriter.py::TestQueryRewriter::test_resolves_that_university_to_purdue
```

### Run with Coverage

```bash
pytest tests/ --cov=app.services.query_rewriter --cov=app.services.disambiguation_assistant --cov-report=html
```

### Run Verbose

```bash
pytest tests/ -v
```

## Test Scenarios

The test matrix includes:

1. **purdue_cs_ranking** - Single university resolution
2. **two_universities_ambiguous** - Ambiguity detection
3. **product_coref** - Product pronoun resolution
4. **company_reference** - Company pronoun resolution
5. **no_context_no_rewrite** - No context handling
6. **that_tool_reference** - Tool pronoun resolution
7. **three_companies_ambiguous** - Multiple candidates
8. **preserve_constraints** - Constraint preservation
9. **stale_context_ignored** - Stale topic filtering
10. **multi_word_pronoun** - Multi-word pronoun resolution

## Test Categories

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test full pipeline flow
- **Edge Cases**: Test error handling and boundary conditions

## Adding New Tests

1. Add scenario to `test_scenarios.json`
2. Add unit test to appropriate test file
3. Add integration test if needed
4. Run tests to verify

## Manual Testing

After automated tests pass, perform manual sanity checks:

1. **Unambiguous Resolution**:
   - User: "what is purdue university"
   - User: "what is the computer science ranking at that university"
   - ✅ Should auto-resolve to Purdue

2. **Ambiguity Detection**:
   - User: "compare purdue university and indiana university"
   - User: "what is the computer science ranking at that university"
   - ✅ Should ask: "Which university did you mean?"

3. **Product Coreference**:
   - User: "I'm using your DAC platform"
   - User: "can it call different llms in the same context?"
   - ✅ Should rewrite to mention DAC explicitly

