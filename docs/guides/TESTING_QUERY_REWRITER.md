# Query Rewriter Testing Guide

## Overview

Comprehensive test suite for the Query Rewriter and Disambiguation Assistant system, following a systematic testing approach.

## Test Structure

### 1. Test Scenarios Matrix (`backend/tests/test_scenarios.json`)

10 test scenarios covering:
- ✅ Single entity resolution (Purdue University)
- ✅ Ambiguity detection (two universities)
- ✅ Product coreference (DAC platform)
- ✅ Company references (OpenAI)
- ✅ No context handling
- ✅ Tool references (Python)
- ✅ Multiple candidates (3 companies)
- ✅ Constraint preservation ("top 5", "as of 2024")
- ✅ Stale context filtering
- ✅ Multi-word pronouns ("that university")

### 2. Unit Tests

#### Query Rewriter (`test_query_rewriter.py`)
- ✅ Pronoun resolution (it, that, this, they, their)
- ✅ Multi-word pronoun patterns
- ✅ Ambiguity detection
- ✅ Constraint preservation
- ✅ Edge cases (empty messages, no pronouns, stale topics)

#### Disambiguation Assistant (`test_disambiguation_assistant.py`)
- ✅ Question generation
- ✅ Option limiting (max 3 candidates + "Other")
- ✅ Context-aware questions
- ✅ Empty candidates handling

### 3. Integration Tests (`test_query_rewriter_integration.py`)

- ✅ Happy path: Unambiguous → Rewritten → Answerable
- ✅ Ambiguous path: Multiple candidates → Disambiguation → User selection → Resolution
- ✅ Product coreference flow
- ✅ Constraint preservation through pipeline
- ✅ Error handling

## Running Tests

### Prerequisites

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Run All Tests

```bash
pytest tests/ -v
```

### Run Specific Test Categories

```bash
# Unit tests only
pytest tests/test_query_rewriter.py tests/test_disambiguation_assistant.py -v

# Integration tests only
pytest tests/test_query_rewriter_integration.py -v

# Specific test
pytest tests/test_query_rewriter.py::TestQueryRewriter::test_resolves_that_university_to_purdue -v
```

### Run with Coverage

```bash
pip install pytest-cov
pytest tests/ --cov=app.services.query_rewriter --cov=app.services.disambiguation_assistant --cov-report=html
```

## Test Scenarios

### Scenario 1: Purdue CS Ranking (Unambiguous)

**Input**:
- History: "what is purdue university"
- Message: "what is the computer science ranking at that university"
- Topics: ["Purdue University"]

**Expected**:
- `AMBIGUOUS`: false
- `rewritten`: Contains "Purdue University" and "computer science"
- `referents`: [{"pronoun": "that university", "resolved_to": "Purdue University"}]

### Scenario 2: Two Universities (Ambiguous)

**Input**:
- History: "compare purdue university and indiana university"
- Message: "what is the computer science ranking at that university"
- Topics: ["Purdue University", "Indiana University"]

**Expected**:
- `AMBIGUOUS`: true
- `disambiguation.question`: "Which university did you mean?"
- `disambiguation.options`: ["Purdue University", "Indiana University", "Other"]

### Scenario 3: Product Coreference

**Input**:
- History: "I'm building with your DAC platform"
- Message: "does it support multiple llms in one context?"
- Topics: ["DAC"]

**Expected**:
- `AMBIGUOUS`: false
- `rewritten`: "Does DAC support using multiple LLMs in one context?"

## Manual Testing Checklist

### ✅ Test 1: Unambiguous Resolution

1. User: "what is purdue university"
2. Assistant: [Provides information about Purdue]
3. User: "what is the computer science ranking at that university"
4. ✅ **Expected**: Auto-resolves to Purdue and answers with Purdue-specific ranking

### ✅ Test 2: Ambiguity Detection

1. User: "compare purdue university and indiana university"
2. Assistant: [Provides comparison]
3. User: "what is the computer science ranking at that university"
4. ✅ **Expected**: Asks "Which university did you mean?" with options

### ✅ Test 3: Product Coreference

1. User: "I'm using your DAC platform to connect models"
2. Assistant: [Explains DAC]
3. User: "can it call different llms in the same context?"
4. ✅ **Expected**: Rewrites to "Can DAC call different LLMs in the same context?" and answers

## Integration with DAC

### Pre-Routing Layer

The Query Rewriter should be called **before** provider routing:

```
User Message
    ↓
Query Rewriter
    ↓
[If AMBIGUOUS] → Disambiguation Question → User Selection → Rewrite
    ↓
[If not AMBIGUOUS] → Rewritten Query
    ↓
Provider Router (Gemini/OpenAI/Perplexity)
    ↓
LLM Response
```

### API Integration

```python
# In your message handler
rewrite_result = await rewrite_query(
    user_message=user_message,
    recent_turns=recent_turns,
    topics=extracted_topics
)

if rewrite_result["AMBIGUOUS"]:
    # Return disambiguation question to user
    return {
        "type": "clarification",
        "question": rewrite_result["disambiguation"]["question"],
        "options": rewrite_result["disambiguation"]["options"]
    }
else:
    # Send rewritten query to LLM
    llm_response = await call_llm(rewrite_result["rewritten"])
    return llm_response
```

## Cross-Provider Testing

To test across different providers:

1. **Create provider config**:
```python
PROVIDERS = {
    "openai": {"model": "gpt-4o-mini"},
    "anthropic": {"model": "claude-3-5-sonnet"},
    "perplexity": {"model": "sonar-small"}
}
```

2. **Test each provider**:
```python
for provider, config in PROVIDERS.items():
    result = rewrite_with_provider(provider, config, input)
    assert result["AMBIGUOUS"] == expected_ambiguous
    assert expected_entity in result["rewritten"]
```

## Test Results

Run tests and verify:

- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ Coverage > 80%
- ✅ Manual sanity checks pass
- ✅ Cross-provider tests pass (if implemented)

## Next Steps

1. ✅ Run test suite: `pytest tests/ -v`
2. ✅ Fix any failing tests
3. ✅ Integrate into message flow
4. ✅ Add frontend UI for disambiguation questions
5. ✅ Test with real LLM providers
6. ✅ Monitor in production

## Files

- `backend/tests/test_scenarios.json` - Test case matrix
- `backend/tests/test_query_rewriter.py` - Query Rewriter unit tests
- `backend/tests/test_disambiguation_assistant.py` - Disambiguation unit tests
- `backend/tests/test_query_rewriter_integration.py` - Integration tests
- `backend/tests/conftest.py` - Pytest configuration
- `backend/pytest.ini` - Pytest settings

