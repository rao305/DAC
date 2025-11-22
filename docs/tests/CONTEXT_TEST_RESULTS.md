# Context Feature Test Results

## Test Date: 2025-01-16

## Test Scenario: Donald Trump Follow-up Question

### Steps:
1. ✅ Sent: "Who is Donald Trump"
2. ✅ Received response about Donald Trump (correct)
3. ✅ Sent: "who are his children"
4. ❌ **Received response about "John Doe" instead of "Donald Trump's children"**

## Issue Confirmed

The second response shows:
- **Expected**: Answer about Donald Trump's children (Donald Jr., Ivanka, Eric, etc.)
- **Actual**: Answer about "John Doe" and legal placeholders

This **confirms the context bug** - the provider is NOT seeing the previous conversation turn.

## Root Cause Analysis Needed

The centralized context builder should be:
1. Loading conversation history from DB
2. Including the "Who is Donald Trump" Q&A in the messages array
3. Passing it to the provider

But the response suggests the provider only saw "who are his children" as an isolated query.

## Next Steps

1. Check backend logs for:
   - `🔧 CONTEXT BUILDER` logs showing conversation history
   - `📤 SENDING TO PROVIDER` logs showing messages array
   - Verify conversation history turns >= 2

2. Verify:
   - Context builder is being called
   - Conversation history is being loaded from DB
   - Messages array includes prior Q&A

3. Check if query rewriter is enabled:
   - `FEATURE_COREWRITE` setting
   - If disabled, context builder should still include history

## Expected Log Output (for second message)

```
🔧 CONTEXT BUILDER: thread_id=...
Short-term history turns: 2  ← Should be 2 (user + assistant)
Messages array preview:
  [0] system: You are DAC...
  [1] user: Who is Donald Trump
  [2] assistant: Donald Trump is the 45th...
  [3] user: Original user message:
who are his children
```

If logs show `Short-term history turns: 0` or `1`, then the context builder is not loading history correctly.

