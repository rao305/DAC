# Context-Awareness & Coreference Resolution Guide

## Overview

DAC now includes comprehensive context-awareness capabilities that enable intelligent pronoun and reference resolution in conversations. The system automatically tracks entities (people, universities, models, companies, etc.) mentioned during conversations and resolves vague references like "that university", "it", "they", etc.

## Key Features

### 1. **Automatic Entity Tracking**
- Entities are automatically extracted from conversations using LLM-powered analysis
- Supports any entity type: people, universities, models, companies, products, locations, concepts, etc.
- Tracks mention frequency, recency, and context

### 2. **Intelligent Reference Resolution**
- Resolves pronouns: "it", "they", "he", "she", etc.
- Resolves vague references: "that university", "this model", "the company", etc.
- Uses recency and type matching for accurate resolution
- Prefers resolution over asking for clarification when context is clear

### 3. **Smart Clarification**
- Only asks for clarification when:
  - There are 2+ realistic candidates
  - AND the choice would significantly change the answer
- Provides clear options when clarification is needed

## Architecture

### Backend Components

#### 1. **Coreference Service** (`app/services/coreference_service.py`)
- Core entity tracking and resolution logic
- In-memory storage (production: Redis)
- Entity and ConversationContext data models

#### 2. **LLM Context Extractor** (`app/services/llm_context_extractor.py`)
- LLM-powered entity extraction
- Query rewriting for context-awareness
- Integration with coreference service

#### 3. **DAC Persona** (`app/services/dac_persona.py`)
- Updated system prompts with context-awareness instructions
- Comprehensive coreference resolution guidelines

#### 4. **API Endpoints** (`app/api/entities.py`)
- `/api/threads/{thread_id}/entities` - Get all tracked entities
- `/api/threads/{thread_id}/entities/by-type/{entity_type}` - Get entities by type
- `/api/threads/{thread_id}/entities` (POST) - Manually add entity
- `/api/threads/{thread_id}/entities` (DELETE) - Clear entities
- `/api/threads/{thread_id}/entities/search/{name}` - Search for entity

### Frontend Components

#### Entity Tracker Component (`components/entity-tracker.tsx`)
- Visual display of tracked entities
- Grouped by entity type
- Shows mention count, context, and timestamps
- Collapsible UI for clean interface

## Usage Examples

### Example 1: University Discussion

**User:** "What is Purdue University?"

**DAC:** "Purdue University is a large public research university in West Lafayette, Indiana..."

*System tracks: Entity(name="Purdue University", type="university")*

**User:** "What is the computer science rank for that university?"

**DAC:** "Purdue University's computer science program is ranked..."

*System resolves "that university" → "Purdue University"*

### Example 2: Model Comparison

**User:** "Tell me about GPT-4"

**DAC:** "GPT-4 is OpenAI's most advanced language model..."

*System tracks: Entity(name="GPT-4", type="model")*

**User:** "How does it compare to Claude?"

**DAC:** "Comparing GPT-4 to Claude, here are the key differences..."

*System resolves "it" → "GPT-4"*

### Example 3: Multiple Entities

**User:** "What's the difference between Purdue University and MIT?"

**DAC:** "Purdue University and MIT are both excellent institutions..."

*System tracks: Entity(name="Purdue University", type="university"), Entity(name="MIT", type="university")*

**User:** "Which one has a better aerospace program?"

**DAC:** "Do you mean Purdue University or MIT?"

*System asks for clarification because both are recent universities*

## Configuration

### Feature Flags

The query rewriting feature is controlled by the `FEATURE_COREWRITE` setting in `config.py`:

```python
# Enable/disable query rewriting
FEATURE_COREWRITE: bool = True  # Set to False to disable
```

### Model Configuration

Entity extraction uses `gpt-4o-mini` by default for fast, cost-effective processing. Configure in `llm_context_extractor.py`:

```python
model="gpt-4o-mini",  # Fast and cheap model for context extraction
```

## API Integration

### Getting Tracked Entities

```bash
curl -X GET "http://localhost:8000/api/threads/{thread_id}/entities" \
  -H "x-org-id: org_demo"
```

Response:
```json
{
  "thread_id": "...",
  "entities": [
    {
      "name": "Purdue University",
      "type": "university",
      "first_mentioned": 1699564800.0,
      "last_mentioned": 1699564900.0,
      "mention_count": 3,
      "context": "User asked about this university",
      "aliases": []
    }
  ],
  "recent_topics": []
}
```

### Adding Entity Manually

```bash
curl -X POST "http://localhost:8000/api/threads/{thread_id}/entities" \
  -H "x-org-id: org_demo" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Purdue University",
    "type": "university",
    "context": "Large public university in Indiana",
    "aliases": ["Purdue", "Boilermakers"]
  }'
```

## Context-Awareness Rules

The system follows these rules (as defined in the DAC persona):

1. **Treat conversation as timeline**: Each message builds on prior messages unless user explicitly starts new topic

2. **Resolve references using recent entities**:
   - Scan last few turns for entities of matching type
   - Use recency + type match

3. **Prefer resolution over asking**:
   - If single clear candidate exists, assume that's what user means
   - Don't ask for clarification when obvious from history

4. **When to ask for clarification**:
   - ONLY if 2+ realistic candidates AND choice significantly changes answer
   - Ask short, precise question

5. **Be explicit in reasoning**:
   - Use explicit entity name in reply at least once
   - Example: "Purdue University's CS program is ranked..." not "It is ranked..."

6. **Use conversation history for missing details**:
   - If user omits details that appeared earlier, silently reuse them
   - Don't ask user to repeat information

7. **Respect corrections**:
   - If user corrects something, always use latest correction

8. **Minimize unnecessary questions**:
   - Don't say "please specify X" if X can be recovered from previous turns

9. **Be honest about true uncertainty**:
   - If truly cannot resolve after checking history, explain briefly and ask concisely

## Testing

### Run Unit Tests

```bash
cd backend
pytest tests/test_coreference.py -v
```

### Test Coverage

- ✅ Entity creation and updating
- ✅ Conversation context management
- ✅ Entity type extraction
- ✅ Vague reference resolution
- ✅ Clarification decision logic
- ✅ End-to-end conversation flows

## Performance Considerations

### In-Memory Storage

Current implementation uses in-memory storage (`_context_store` dictionary). For production:

**Recommended: Redis**
- Persist entities across server restarts
- Support distributed deployments
- Fast entity lookups

**Implementation:**
```python
# Replace _context_store with Redis
import redis
redis_client = redis.Redis(host='localhost', port=6379, db=0)
```

### Entity Extraction Performance

- Uses `gpt-4o-mini` for fast extraction (~200ms)
- Timeout protection (2-3 seconds)
- Graceful degradation on failure
- Cached API keys for speed

## Future Enhancements

1. **Persistent Storage**: Redis/PostgreSQL for entity persistence
2. **Entity Relationships**: Track relationships between entities
3. **Topic Modeling**: Automatic topic extraction and tracking
4. **Cross-Session Memory**: Remember entities across sessions for same user
5. **Entity Disambiguation UI**: Better visual feedback when clarification needed
6. **Analytics**: Track most mentioned entities, trending topics, etc.

## Troubleshooting

### Entity Not Being Tracked

1. Check if `FEATURE_COREWRITE` is enabled
2. Verify OpenAI API key is set
3. Check backend logs for extraction errors
4. Ensure conversation history is being loaded

### Reference Not Being Resolved

1. Verify entity was extracted (check `/api/threads/{thread_id}/entities`)
2. Check entity type matches reference phrase
3. Look for timing - more recent entities are preferred
4. Review backend logs for resolution attempts

### Performance Issues

1. Consider disabling entity extraction for simple queries
2. Reduce `max_entities` parameter (default: 10)
3. Use shorter conversation history window
4. Implement Redis caching

## Support

For issues or questions:
- Check backend logs: `/tmp/backend.log`
- Review entity API: `/api/threads/{thread_id}/entities`
- Run tests: `pytest tests/test_coreference.py -v`
