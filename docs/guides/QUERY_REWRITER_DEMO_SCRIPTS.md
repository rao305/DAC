# Query Rewriter Demo Scripts

Ready-made demo flows for showcasing the Query Rewriter feature.

---

## 🎬 Demo 1: Purdue University Ranking

**Perfect for**: Landing page demo, investor presentations

### Script

```
User: "what is purdue university"

Assistant: "Purdue University is a public research university located in West Lafayette, Indiana. It's known for its strong engineering and computer science programs..."

User: "what is the computer science ranking at that university"
```

### Expected Behavior

✅ **Auto-resolves** "that university" → "Purdue University"
✅ **Rewritten query**: "What is Purdue University's current Computer Science ranking?"
✅ **Answer**: Provides ranking with source and year

### What to Highlight

- **Zero user effort**: No need to repeat "Purdue University"
- **Context awareness**: System remembers the conversation
- **Seamless experience**: Works like natural conversation

---

## 🎬 Demo 2: Ambiguity Resolution

**Perfect for**: Technical demos, showing intelligence

### Script

```
User: "compare purdue university and indiana university"

Assistant: "Purdue University and Indiana University are both public universities in Indiana. Purdue is known for engineering, while IU is known for business and liberal arts..."

User: "what is the computer science ranking at that university"
```

### Expected Behavior

✅ **Detects ambiguity**: Two universities mentioned
✅ **Shows disambiguation**: "Which university did you mean?"
✅ **Options**: [Purdue University] [Indiana University] [Other]
✅ **User selects**: "Purdue University"
✅ **Resolves and answers**: Provides Purdue-specific ranking

### What to Highlight

- **Smart detection**: Knows when context is ambiguous
- **User-friendly**: Asks instead of guessing
- **Quick resolution**: One click to clarify

---

## 🎬 Demo 3: Product Coreference (DAC)

**Perfect for**: Product demos, feature showcases

### Script

```
User: "I'm building with your DAC platform to connect multiple LLM providers"

Assistant: "DAC (Distributed AI Coordinator) is a unified AI assistant platform that intelligently routes queries across multiple LLM providers..."

User: "can it call different llms in the same context?"
```

### Expected Behavior

✅ **Resolves "it"** → "DAC"
✅ **Rewritten query**: "Can DAC call different LLMs in the same context?"
✅ **Answer**: Explains DAC's multi-LLM context capabilities

### What to Highlight

- **Product awareness**: System understands product references
- **Natural conversation**: No need to repeat product name
- **Feature discovery**: Answers about DAC capabilities

---

## 🎬 Demo 4: Multi-Provider Routing

**Perfect for**: Technical deep-dives, architecture demos

### Script

```
User: "what is the latest news about OpenAI"

Assistant: [Provides news about OpenAI]

User: "what is their latest model?"
```

### Expected Behavior

✅ **Resolves "their"** → "OpenAI"
✅ **Rewritten query**: "What is OpenAI's latest model?"
✅ **Routes to**: Perplexity (for latest/current information)
✅ **Answer**: Provides latest OpenAI model with sources

### What to Highlight

- **Intelligent routing**: Rewritten query helps router choose best provider
- **Source citation**: Provides sources and dates
- **Cross-provider**: Same context, different providers

---

## 🎬 Demo 5: Constraint Preservation

**Perfect for**: Showing precision, technical accuracy

### Script

```
User: "tell me about MIT"

Assistant: [Provides info about MIT]

User: "what are the top 5 programs at that university as of 2024?"
```

### Expected Behavior

✅ **Resolves "that university"** → "MIT"
✅ **Preserves constraints**: "top 5" and "as of 2024"
✅ **Rewritten query**: "What are the top 5 programs at MIT as of 2024?"
✅ **Answer**: Provides exactly top 5 programs with 2024 data

### What to Highlight

- **Precision**: Preserves all user constraints
- **Accuracy**: Uses correct year and count
- **Self-contained**: Query is complete and unambiguous

---

## 📹 Recording Tips

### Setup

1. **Clear browser cache** before recording
2. **Enable feature flag**: `FEATURE_COREWRITE=1`
3. **Open browser console** to show logs (optional)
4. **Use screen recording** tool (Loom, OBS, etc.)

### Recording Flow

1. **Start fresh conversation**
2. **Show initial question** (e.g., "what is purdue university")
3. **Wait for response**
4. **Type follow-up with pronoun** (e.g., "what is the ranking at that university")
5. **Highlight the rewrite** (if visible in logs)
6. **Show the answer** mentions the resolved entity

### Voiceover Script

> "Notice how I asked about 'that university' without repeating 'Purdue'. The system automatically understood the context and resolved the pronoun. This makes conversations feel natural and reduces friction."

---

## 🎯 Key Talking Points

### For Investors

- **User Experience**: Reduces cognitive load, feels natural
- **Technical Innovation**: Rule-based, no LLM overhead
- **Scalability**: Works across all providers
- **Differentiation**: Most AI assistants don't do this

### For Developers

- **Architecture**: Pre-routing layer, provider-agnostic
- **Performance**: < 10ms overhead, negligible impact
- **Testability**: 67 comprehensive tests, 100% passing
- **Extensibility**: Easy to add new pronoun patterns

### For Users

- **Natural Conversation**: Talk like you would to a human
- **Context Awareness**: System remembers what you discussed
- **Clarity**: Asks when ambiguous instead of guessing
- **Speed**: Instant resolution, no delays

---

## 📊 Demo Metrics

Track these during demos:

- **Rewrite Success Rate**: % of pronouns successfully resolved
- **Ambiguity Detection**: % of cases correctly flagged as ambiguous
- **User Selection Rate**: % of disambiguations where user selects an option
- **Time to Resolution**: How long from question to answer

---

## 🚀 Quick Start Demo

**Fastest demo** (30 seconds):

```
1. Type: "what is purdue university"
2. Wait for response
3. Type: "what is the ranking at that university"
4. Show: Answer mentions "Purdue University" explicitly
```

**Done!** Shows the feature working in under 30 seconds.

---

## 💡 Pro Tips

1. **Use real examples**: Actual universities, companies users know
2. **Show the rewrite**: If possible, display rewritten query in UI
3. **Highlight speed**: Emphasize instant resolution
4. **Compare**: Show "before" (without rewriter) vs "after" (with rewriter)
5. **Edge cases**: Show ambiguity handling for credibility

---

**Ready to demo!** 🎬

