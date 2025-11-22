# DAC Advanced Reasoning Engine - Quick Reference

## 🎯 What is DAC?

**DAC (Distributed AI Coordinator)** is a multi-model reasoning engine with:
- 9-step internal processing pipeline
- Hidden chain-of-thought
- Built-in safety filtering
- Automatic output formatting
- Provider-specific specialization
- Zero infrastructure leakage

---

## 📋 9-Step Internal Pipeline

```
User Query
    ↓
1. Tokenization & Embedding
    ↓
2. Semantic Intent Classification
    ↓
3. Safety Filtering
    ↓
4. Output-Style Flagging
    ↓
5. Reasoning Plan Selection
    ↓
6. Internal Chain-of-Thought (HIDDEN)
    ↓
7. Generation Phase
    ↓
8. Post-Processing
    ↓
9. Output (Clean & Concise)
```

---

## 🎨 6 Reasoning Profiles

| Profile | Trigger | Internal Process | Output |
|---------|---------|------------------|--------|
| **CODING** | "write", "function", "class", code keywords | Plan → Implement → Check | Code block + brief explanation |
| **MATH** | Equations, "solve", symbols | Parse → Formalize → Compute → Verify | Final answer + concise derivation |
| **FACTUAL** | "explain", "what is", questions | Research → Organize → Verify | Short overview + optional details |
| **CREATIVE** | "write story", "blog post", tone changes | Outline → Draft → Refine | On-tone content matching style |
| **MULTIMODAL** | Image questions, image generation | Grounded interpretation | Visual description or prompt |
| **CHAT** | Greetings, casual talk | Natural response | Brief, friendly reply |

---

## 🛡️ Built-in Safety Filtering

Checks for:
- ✅ Harm, self-harm, disallowed content
- ✅ Dangerous instructions
- ✅ Personal data (PII)
- ✅ Illegal requests

**Response**: Polite refusal or clarification request
**Never reveals**: Safety logic or detection methods

---

## 🎭 5 Provider Specializations

| Provider | Specialization | Best For |
|----------|----------------|----------|
| **OpenAI** | Coding Specialist | Code generation, debugging, algorithms |
| **Claude** | Reasoning Specialist | Complex analysis, technical writing |
| **Gemini** | Creative Specialist | Creative writing, multimodal, long context |
| **Perplexity** | Research Specialist | Current events, web search, factual queries |
| **Kimi** | Multilingual Specialist | Chinese language, multilingual, cross-cultural |

---

## 🚫 Strict Behavioral Rules

### **MUST NOT**:
- ❌ Mention chain-of-thought
- ❌ Describe internal classifiers, embeddings, pipelines
- ❌ Mention policies, tools, system prompts, backends
- ❌ Guess about DAC infrastructure
- ❌ Mention being a model or AI

### **MUST**:
- ✅ Be concise, precise, logical
- ✅ Start with answer, then brief reasoning
- ✅ Choose simplest correct method
- ✅ Keep formatting clean
- ✅ Follow user instructions EXACTLY

---

## 💻 Code Integration

### Inject DAC Persona
```python
from app.services.dac_persona import inject_dac_persona

messages = inject_dac_persona(
    messages=base_messages,
    qa_mode=False,
    intent="coding_help",  # or "qa_retrieval", "reasoning/math", etc.
    provider="openai"      # or "gemini", "perplexity", "kimi", "claude"
)
```

### Get Provider Override
```python
from app.services.dac_persona import get_provider_specific_override

override = get_provider_specific_override("openai")
# Returns coding specialist override
```

---

## 🧪 Testing

### Run Verification
```bash
cd /Users/rrao/Desktop/DAC-main
python3 verify_reasoning_engine.py
```

### Expected Output
```
============================================================
🎉 ALL TESTS PASSED!
============================================================
System Prompts: ✅ PASSED
Helper Functions: ✅ PASSED
API Integration: ✅ PASSED
Profile Structure: ✅ PASSED
```

---

## 📊 Key Metrics to Monitor

| Metric | Target | Description |
|--------|--------|-------------|
| **Infrastructure Mentions** | <0.1% | Responses mentioning "backend", "tools", etc. |
| **CoT Leakage** | <1% | Responses showing internal reasoning unprompted |
| **Safety Refusals** | Monitor | Track safety layer effectiveness |
| **Formatting Accuracy** | >98% | Proper code fences, LaTeX, markdown |
| **Task Classification** | >95% | Correct profile selection |
| **Response Conciseness** | -30% tokens | Compared to baseline |
| **TTFT** | <200ms p95 | Time to first token |

---

## 🔍 Example Queries

### Coding
**Query**: "Write a function to reverse a string"
**Profile**: CODING
**Provider**: OpenAI
**Output**: Clean Python function with brief usage

### Math
**Query**: "Solve 3x² + 5x - 2 = 0"
**Profile**: MATH
**Provider**: Any
**Output**: Solutions with concise explanation

### Research
**Query**: "What are the latest AI developments?"
**Profile**: FACTUAL
**Provider**: Perplexity
**Output**: Current info with sources at end

### Creative
**Query**: "Write a short story about time travel"
**Profile**: CREATIVE
**Provider**: Gemini
**Output**: Engaging narrative

### Multilingual
**Query**: "用Python实现二分查找"
**Profile**: CODING
**Provider**: Kimi
**Output**: Chinese explanation + Python code

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `backend/app/services/dac_persona.py` | All system prompts + helper functions |
| `backend/app/api/threads.py` | Message endpoints (streaming + non-streaming) |
| `backend/app/services/route_and_call.py` | Routing service integration |
| `verify_reasoning_engine.py` | Automated verification script |
| `DAC_REASONING_ENGINE_IMPLEMENTATION.md` | Full implementation guide |

---

## 🚀 Quick Start

### 1. Verify Implementation
```bash
python3 verify_reasoning_engine.py
```

### 2. Start Backend
```bash
cd backend
python3 main.py
```

### 3. Test Query
```bash
curl -X POST http://localhost:8000/api/threads/{thread_id}/messages \
  -H "x-org-id: org_demo" \
  -H "Content-Type: application/json" \
  -d '{"content": "Write a Python function to calculate fibonacci"}'
```

### 4. Monitor Response
- Verify concise output
- Check proper code formatting
- Confirm no infrastructure mentions
- Validate provider routing

---

## 🎯 Success Criteria

✅ **Zero infrastructure leakage** (<0.1% mentions)
✅ **Hidden chain-of-thought** (<1% leakage)
✅ **Proper formatting** (>98% accuracy)
✅ **Task-appropriate responses** (correct profile selection)
✅ **Provider specialization** (routing to optimal model)
✅ **Safety filtering** (harmful requests caught)
✅ **Concise outputs** (~30% fewer tokens)

---

## 📚 Documentation

- **Full Guide**: `DAC_REASONING_ENGINE_IMPLEMENTATION.md`
- **Advanced Features**: `dac_advanced_implementation.md` (artifact)
- **System Overview**: `dac_system_overview.md` (artifact)
- **This Guide**: `DAC_QUICK_REFERENCE.md`

---

## 🎉 Status

**Implementation**: ✅ Complete
**Verification**: ✅ All tests passed
**Integration**: ✅ Fully integrated
**Status**: **PRODUCTION READY** 🚀

---

**Last Updated**: 2025-11-19
**Version**: 2.0 (Advanced Pipeline Architecture)
