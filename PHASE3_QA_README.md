# Phase 3 QA Validation System

## Overview

The Phase 3 QA validation system automatically tests DAC's ability to:
- Maintain consistent personality and tone
- Correctly classify user intent
- Preserve context across conversation turns
- Handle ambiguous queries gracefully
- Never expose internal routing or model names

## How It Works

### 1. QA Mode Activation

QA mode is enabled by setting a thread's `description` field to `"PHASE3_QA_MODE"`. When enabled:

- The QA system prompt replaces the standard DAC persona
- DAC is instructed to include QA footers in responses: `[intent: <intent> | tone: stable | context: maintained]`
- Intent detection is validated against expected intents

### 2. QA System Prompt

The QA prompt (`DAC_QA_SYSTEM_PROMPT` in `backend/app/services/dac_persona.py`) instructs DAC to:

1. **Detect intent** for each message (social_chat, coding_help, qa_retrieval, etc.)
2. **Include QA footer** at the end of each response
3. **Maintain consistency** in tone and personality
4. **Preserve context** across model switches
5. **Never reveal** internal routing or provider details

### 3. Automated Test Script

The test script (`scripts/phase3_qa_test.py`) runs a sequence of 8 test queries:

1. **Greeting** → Expected: `social_chat`
2. **Coding task** → Expected: `coding_help`
3. **Explanation follow-up** → Expected: `qa_retrieval`
4. **Writing rewrite** → Expected: `editing/writing`
5. **Math/logic** → Expected: `reasoning/math`
6. **Small talk** → Expected: `social_chat`
7. **Ambiguous query** → Expected: `ambiguous_or_other`
8. **Context check** → Should remember "Alex" and "Python project"

## Usage

### Running the QA Test

```bash
# Make sure backend and frontend are running
cd /Users/rao305/Documents/DAC

# Run the QA test script
python scripts/phase3_qa_test.py
```

### Expected Output

The script will:
1. Create a QA test thread
2. Run all 8 test queries
3. Parse QA footers from responses
4. Validate intent detection, tone, and context
5. Generate a summary report

### Sample Output

```
╔══════════════════════════════════════════════════════════════╗
║          Phase 3 QA Validation Test Suite                    ║
╚══════════════════════════════════════════════════════════════╝

📝 Creating QA test thread...
✅ Thread created: thread_abc123

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧪 1. Greeting (social_chat)
   Query: "Hi! My name is Alex, working on a Python project."
   Expected intent: social_chat
    → Router: gemini / gemini-1.5-flash
   Response: Hi Alex! Nice to meet you...
   QA Footer: {'intent': 'social_chat', 'tone': 'stable', 'context': 'maintained'}
   ✅ PASS - Intent: social_chat, Tone: stable, Context: maintained

...

📊 TEST SUMMARY

✅ Passed: 7/8
⚠️  Partial: 1/8
❌ Failed: 0/8

🔍 Context Checks:
   ✅ Context preserved: Remembers 'Alex' and 'Python project'
```

## Manual Testing

You can also enable QA mode manually:

1. **Create a thread with QA mode:**
   ```bash
   curl -X POST http://localhost:8000/api/threads/ \
     -H "Content-Type: application/json" \
     -H "x-org-id: org_demo" \
     -d '{
       "title": "QA Test",
       "description": "PHASE3_QA_MODE"
     }'
   ```

2. **Send messages to that thread** - DAC will include QA footers in responses

3. **Verify** that:
   - QA footers appear in responses
   - Intent detection is accurate
   - Tone remains consistent
   - Context is preserved across turns

## Success Criteria

A test **PASSES** if:
- ✅ QA footer is detected
- ✅ Detected intent matches expected intent
- ✅ Tone is "stable" (no drift detected)
- ✅ Context is "maintained"

A test is **PARTIAL** if:
- ⚠️ QA footer detected but intent/tone/context partially correct

A test **FAILS** if:
- ❌ No QA footer detected
- ❌ Error during request/response

## Files

- **Backend**: `backend/app/services/dac_persona.py` - QA prompt and injection logic
- **Backend**: `backend/app/api/threads.py` - QA mode detection
- **Frontend**: `frontend/app/api/chat/route.ts` - Thread creation with description support
- **Script**: `scripts/phase3_qa_test.py` - Automated test runner

## Troubleshooting

### QA footer not appearing

1. Check that thread description is set to `"PHASE3_QA_MODE"`
2. Verify backend is using the updated `dac_persona.py`
3. Check backend logs for QA mode detection

### Intent detection incorrect

- The QA prompt uses keyword-based intent detection
- Some queries may be ambiguous - this is expected
- Check the QA footer to see what intent was detected

### Context not preserved

- Verify conversation history is being passed correctly
- Check that model switching isn't breaking context
- Ensure thread_id is consistent across requests

