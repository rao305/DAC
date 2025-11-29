# Dynamic Router Tests

Comprehensive test suite for the dynamic routing system.

## Running Tests

```bash
cd backend
pytest tests/test_dynamic_router_intent.py -v
pytest tests/test_dynamic_router_scoring.py -v
pytest tests/test_dynamic_router_integration.py -v

# Run all router tests
pytest tests/test_dynamic_router*.py -v

# Run with coverage
pytest tests/test_dynamic_router*.py --cov=app.services.dynamic_router --cov-report=html
```

## Test Structure

### `test_dynamic_router_intent.py`
Tests the router LLM intent classification:
- Core task-type classification (chat, reasoning, coding, math, etc.)
- Web/search detection edge cases
- Priority detection (quality/speed/cost)
- Token estimation
- Robustness (invalid JSON, missing fields, etc.)
- Edge cases (empty messages, non-English, emoji)

### `test_dynamic_router_scoring.py`
Tests the scoring logic:
- Model ranking for different task types
- Priority-based weighting (quality/speed/cost)
- Context filtering
- Capability matching
- Score normalization

### `test_dynamic_router_integration.py`
End-to-end integration tests:
- Full routing flow
- Provider filtering
- Epsilon-greedy exploration
- Fallback behavior
- Historical rewards

## Test Coverage

The tests cover all the scenarios from the test plan:

1. ✅ Core task-type classification (Tests 1-9)
2. ✅ Web/search detection (Tests 10-13)
3. ✅ Priority tests (Tests 14-16)
4. ✅ Token estimation & context limits (Tests 17-18)
5. ✅ Router robustness (Tests 5.1-5.4)
6. ✅ Multi-intent queries (Test 6.1-6.2)
7. ✅ Language/weird input (Tests 7.1-7.3)
8. ✅ Exploration behavior (Tests 19-20)

## Mocking

The tests mock the OpenAI API calls to avoid:
- Real API costs
- Network dependencies
- Non-deterministic behavior

All router LLM responses are mocked with expected JSON outputs.

## Adding New Tests

When adding new test cases:

1. Add to the appropriate test file based on what you're testing
2. Mock the router LLM response if testing intent classification
3. Use real scoring functions if testing scoring logic
4. Use full routing flow if testing integration

Example:

```python
@pytest.mark.asyncio
async def test_my_new_scenario(self):
    """Test description."""
    user_message = "Your test prompt"
    
    mock_response = {
        "content": '{"taskType": "coding", "requiresWeb": false, ...}'
    }
    
    with patch("app.services.dynamic_router.intent.call_openai", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = type("Response", (), mock_response)()
        
        intent = await get_router_intent(user_message, "")
        
        assert intent.task_type == "coding"
        # ... more assertions
```
