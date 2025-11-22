# Query Rewriter & Disambiguation System

## Overview

Implemented a comprehensive query rewriting system that resolves pronouns and makes user queries self-contained using conversation context. When ambiguity is detected, the system generates disambiguation questions.

## Components

### 1. Query Rewriter Service (`backend/app/services/query_rewriter.py`)

**Purpose**: Resolves pronouns in user messages by matching them to entities from recent conversation context.

**Key Features**:
- Pronoun detection (it, that, this, they, he, she, etc.)
- Multi-word pronoun patterns ("that university", "this company")
- Entity resolution from topics and conversation context
- Context window filtering (24 hours by default)
- Ambiguity detection when multiple candidates exist

**Example**:
```python
Input:
  user_message: "what is the computer science ranking at that university?"
  recent_turns: [{"role": "user", "content": "Tell me about Purdue University"}]
  topics: [{"name": "Purdue University", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"}]

Output:
{
  "rewritten": "What is Purdue University's current Computer Science ranking?",
  "AMBIGUOUS": false,
  "referents": [{"pronoun": "that university", "resolved_to": "Purdue University"}]
}
```

### 2. Disambiguation Assistant (`backend/app/services/disambiguation_assistant.py`)

**Purpose**: Generates clarifying questions when pronoun resolution is ambiguous.

**Key Features**:
- Context-aware question generation
- Up to 3 candidate options plus "Other"
- Pronoun-specific question templates

**Example**:
```python
Input:
  candidates: ["Purdue University", "Indiana University", "Notre Dame"]
  original_user_message: "what is the ranking at that university?"
  pronoun: "that university"

Output:
{
  "question": "Which university did you mean?",
  "options": ["Purdue University", "Indiana University", "Notre Dame", "Other"],
  "pronoun": "that university"
}
```

### 3. API Endpoint (`backend/app/api/query_rewriter.py`)

**Endpoint**: `POST /api/query-rewriter/rewrite`

**Request**:
```json
{
  "user_message": "what is the computer science ranking at that university?",
  "recent_turns": [
    {"role": "user", "content": "Tell me about Purdue University"},
    {"role": "assistant", "content": "Purdue University is..."}
  ],
  "topics": [
    {"name": "Purdue University", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"}
  ]
}
```

**Response**:
```json
{
  "rewritten": "What is Purdue University's current Computer Science ranking?",
  "AMBIGUOUS": false,
  "referents": [
    {"pronoun": "that university", "resolved_to": "Purdue University"}
  ],
  "disambiguation": null
}
```

**Ambiguous Response**:
```json
{
  "rewritten": "what is the computer science ranking at that university?",
  "AMBIGUOUS": true,
  "referents": [],
  "disambiguation": {
    "question": "Which university did you mean?",
    "options": ["Purdue University", "Indiana University", "Notre Dame", "Other"],
    "pronoun": "that university"
  }
}
```

## Integration

The Query Rewriter is registered in `backend/main.py` and available at:
- **API Endpoint**: `POST /api/query-rewriter/rewrite`
- **Documentation**: Available at `/docs` when the API is running

## Usage Flow

1. **User sends message** with pronoun: "what is the ranking at that university?"

2. **Query Rewriter processes**:
   - Extracts pronouns from message
   - Searches recent conversation context
   - Matches against topics list
   - Resolves if unambiguous, flags if ambiguous

3. **If unambiguous**:
   - Returns rewritten query with resolved entities
   - Frontend can send rewritten query to LLM

4. **If ambiguous**:
   - Returns disambiguation question with options
   - Frontend displays question and options
   - User selects option
   - Frontend resubmits with resolved entity

## Context-Aware Assistant Integration

The existing DAC persona system (`backend/app/services/dac_persona.py`) should be enhanced to:

1. **Accept rewritten messages**: Use the `rewritten` field from Query Rewriter
2. **Lead with resolved entity**: First sentence should restate the resolved entity
3. **Cite sources**: For rankings, prices, dates - include source and year/date
4. **Handle ambiguity**: If `AMBIGUOUS=true`, ask the disambiguation question instead of answering

## Testing

Test the endpoint:

```bash
curl -X POST http://localhost:8000/api/query-rewriter/rewrite \
  -H "Content-Type: application/json" \
  -d '{
    "user_message": "what is the computer science ranking at that university?",
    "recent_turns": [
      {"role": "user", "content": "Tell me about Purdue University"},
      {"role": "assistant", "content": "Purdue University is a public research university..."}
    ],
    "topics": [
      {"name": "Purdue University", "type": "university", "lastSeen": "2025-01-12T10:00:00Z"}
    ]
  }'
```

## Next Steps

1. **Integrate with message flow**: Call Query Rewriter before sending to LLM
2. **Enhance Context-Aware Assistant**: Update DAC persona to handle rewritten queries
3. **Frontend UI**: Add disambiguation question display with option chips/buttons
4. **Topic extraction**: Implement automatic topic extraction from conversations
5. **Context window tuning**: Adjust 24-hour window based on usage patterns

## Files Created

- `backend/app/services/query_rewriter.py` - Core rewriting logic
- `backend/app/services/disambiguation_assistant.py` - Disambiguation question generation
- `backend/app/api/query_rewriter.py` - FastAPI endpoint
- Updated `backend/main.py` - Router registration

