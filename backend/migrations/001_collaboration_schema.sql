-- Migration: Add collaboration schema
-- Description: Adds proper schema for multi-agent collaboration with conversations, runs, steps, and enhanced messages

-- 1️⃣ Enums for type safety
CREATE TYPE message_role AS ENUM (
  'user',
  'assistant', 
  'system',
  'agent_analyst',
  'agent_researcher',
  'agent_creator',
  'agent_critic',
  'agent_synth'
);

CREATE TYPE message_content_type AS ENUM (
  'markdown',
  'json',
  'tool_result'
);

CREATE TYPE collab_mode AS ENUM (
  'auto',
  'manual'
);

CREATE TYPE collab_status AS ENUM (
  'pending',
  'running',
  'awaiting_user',
  'done', 
  'error',
  'cancelled'
);

CREATE TYPE collab_role AS ENUM (
  'analyst',
  'researcher',
  'creator',
  'critic',
  'synthesizer'
);

-- 2️⃣ Conversations table (replaces threads for collaboration)
CREATE TABLE conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID,
  org_id        VARCHAR(255) NOT NULL,  -- Match existing org pattern
  title         TEXT,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for listing user's conversations
CREATE INDEX idx_conversations_org_user_created
  ON conversations (org_id, user_id, created_at DESC);

-- 3️⃣ Collaboration runs - one per collaborative execution  
CREATE TABLE collab_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- The user message that triggered this run
  user_message_id  UUID NOT NULL,
  
  mode             collab_mode NOT NULL DEFAULT 'auto',
  status           collab_status NOT NULL DEFAULT 'running',
  
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ,
  total_time_ms    INTEGER,
  error            JSONB,                  -- { message, provider, step_id, type }
  metadata         JSONB                   -- cost, tokens, etc.
);

CREATE INDEX idx_collab_runs_conversation_id
  ON collab_runs (conversation_id, started_at DESC);

-- 4️⃣ Collaboration steps - one row per agent step
CREATE TABLE collab_steps (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collab_run_id    UUID NOT NULL REFERENCES collab_runs(id) ON DELETE CASCADE,
  
  step_index       INT NOT NULL,      -- 1..5 (analyst, researcher, creator, critic, synth)
  role             collab_role NOT NULL,
  provider         TEXT NOT NULL,     -- 'openai' | 'gemini' | 'perplexity' | 'kimi'
  model            TEXT,              -- 'gpt-4o', 'gemini-2.0-flash-exp', etc.
  mode             collab_mode NOT NULL DEFAULT 'auto',
  
  status           collab_status NOT NULL DEFAULT 'pending',
  is_mock          BOOLEAN NOT NULL DEFAULT FALSE,
  
  input_context    TEXT,              -- compressed prompt/context used
  output_draft     TEXT,              -- raw model output
  output_final     TEXT,              -- after any processing/edits  
  error            JSONB,             -- { message, type, provider }
  
  execution_order  INTEGER,           -- order of actual execution (may differ from step_index)
  
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ
);

-- Fast lookup of steps in order for a run
CREATE INDEX idx_collab_steps_run_index
  ON collab_steps (collab_run_id, step_index);

CREATE INDEX idx_collab_steps_run_execution_order  
  ON collab_steps (collab_run_id, execution_order);

-- 5️⃣ Enhanced messages table - everything you render (and agent logs)
CREATE TABLE collab_messages (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id    UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  role               message_role NOT NULL,
  author_model       TEXT,                    -- 'gpt-4o', 'gemini-2.0-flash-exp'
  provider           TEXT,                    -- 'openai' | 'gemini' | 'perplexity' | 'kimi' | 'dac'
  
  collab_run_id      UUID REFERENCES collab_runs(id) ON DELETE SET NULL,
  collab_step_id     UUID REFERENCES collab_steps(id) ON DELETE SET NULL,
  
  content_type       message_content_type NOT NULL DEFAULT 'markdown',
  content_text       TEXT,        -- for markdown / plain text
  content_json       JSONB,       -- for structured/tool outputs if needed
  
  parent_message_id  UUID REFERENCES collab_messages(id) ON DELETE SET NULL,
  
  -- Token usage tracking
  prompt_tokens      INTEGER,
  completion_tokens  INTEGER, 
  total_tokens       INTEGER,
  
  -- Citations and metadata
  citations          JSONB,       -- URLs/sources from research steps
  metadata           JSONB,       -- { isMock, latencyMs, tokens, collabRole, collabStepIndex, ... }
  
  sequence           INTEGER,     -- display order within conversation
  
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast retrieval for conversation timeline
CREATE INDEX idx_collab_messages_conversation_created
  ON collab_messages (conversation_id, created_at);

-- Fast retrieval by sequence for display
CREATE INDEX idx_collab_messages_conversation_sequence
  ON collab_messages (conversation_id, sequence);

-- Index to quickly find agent messages for a run
CREATE INDEX idx_collab_messages_run_role
  ON collab_messages (collab_run_id, role);

-- Index for follow-up queries (find recent agent outputs)  
CREATE INDEX idx_collab_messages_role_created
  ON collab_messages (conversation_id, role, created_at DESC);

-- 6️⃣ Add FK from collab_runs back to messages
ALTER TABLE collab_runs
  ADD CONSTRAINT collab_runs_user_message_fk
  FOREIGN KEY (user_message_id)
  REFERENCES collab_messages(id)
  ON DELETE CASCADE;

-- 7️⃣ Views for easy queries

-- View for latest agent outputs in conversations
CREATE VIEW latest_agent_outputs AS
SELECT DISTINCT ON (conversation_id, role) 
  conversation_id,
  role,
  content_text,
  collab_run_id,
  created_at
FROM collab_messages 
WHERE role IN ('agent_analyst', 'agent_researcher', 'agent_creator', 'agent_critic', 'agent_synth')
ORDER BY conversation_id, role, created_at DESC;

-- View for collaboration run summaries
CREATE VIEW collab_run_summary AS
SELECT 
  cr.id as run_id,
  cr.conversation_id,
  cr.status,
  cr.started_at,
  cr.completed_at,
  cr.total_time_ms,
  COUNT(cs.id) as total_steps,
  COUNT(cs.id) FILTER (WHERE cs.status = 'done') as completed_steps,
  um.content_text as user_query,
  fm.content_text as final_response
FROM collab_runs cr
LEFT JOIN collab_steps cs ON cr.id = cs.collab_run_id  
LEFT JOIN collab_messages um ON cr.user_message_id = um.id
LEFT JOIN collab_messages fm ON cr.id = fm.collab_run_id AND fm.role = 'assistant'
GROUP BY cr.id, um.content_text, fm.content_text;

-- 8️⃣ Triggers for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_conversations
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();

-- 9️⃣ RLS (Row Level Security) policies to match existing pattern
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_runs ENABLE ROW LEVEL SECURITY; 
ALTER TABLE collab_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE collab_messages ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY conversations_org_isolation ON conversations
  FOR ALL USING (org_id = current_setting('app.current_org_id', true));

-- Policies for collab_runs (through conversation)
CREATE POLICY collab_runs_org_isolation ON collab_runs
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE org_id = current_setting('app.current_org_id', true)
    )
  );

-- Policies for collab_steps (through run -> conversation)  
CREATE POLICY collab_steps_org_isolation ON collab_steps
  FOR ALL USING (
    collab_run_id IN (
      SELECT cr.id FROM collab_runs cr
      JOIN conversations c ON cr.conversation_id = c.id
      WHERE c.org_id = current_setting('app.current_org_id', true)
    )
  );

-- Policies for collab_messages (through conversation)
CREATE POLICY collab_messages_org_isolation ON collab_messages  
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE org_id = current_setting('app.current_org_id', true) 
    )
  );

-- 🔟 Functions for common operations

-- Get recent agent outputs for follow-up context
CREATE OR REPLACE FUNCTION get_recent_agent_outputs(
  p_conversation_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  role message_role,
  content_text TEXT,
  created_at TIMESTAMPTZ,
  collab_run_id UUID
)
LANGUAGE sql STABLE AS $$
  SELECT cm.role, cm.content_text, cm.created_at, cm.collab_run_id
  FROM collab_messages cm
  WHERE cm.conversation_id = p_conversation_id
    AND cm.role IN ('agent_analyst', 'agent_researcher', 'agent_creator', 'agent_critic', 'agent_synth')
  ORDER BY cm.created_at DESC
  LIMIT p_limit;
$$;

-- Get conversation history for context building  
CREATE OR REPLACE FUNCTION get_conversation_history(
  p_conversation_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  role message_role,
  content_text TEXT, 
  created_at TIMESTAMPTZ,
  sequence INTEGER
)
LANGUAGE sql STABLE AS $$
  SELECT cm.role, cm.content_text, cm.created_at, cm.sequence
  FROM collab_messages cm
  WHERE cm.conversation_id = p_conversation_id
    AND cm.role IN ('user', 'assistant')
  ORDER BY cm.sequence DESC
  LIMIT p_limit;
$$;

-- Comments for documentation
COMMENT ON TABLE conversations IS 'Main conversation threads for multi-agent collaboration';
COMMENT ON TABLE collab_runs IS 'Individual collaboration runs within conversations';  
COMMENT ON TABLE collab_steps IS 'Individual agent steps within collaboration runs';
COMMENT ON TABLE collab_messages IS 'All messages including user, assistant, and agent outputs';

COMMENT ON COLUMN collab_steps.step_index IS 'Logical step order: 1=analyst, 2=researcher, 3=creator, 4=critic, 5=synthesizer';
COMMENT ON COLUMN collab_steps.execution_order IS 'Actual execution order (may differ from step_index for parallel execution)';
COMMENT ON COLUMN collab_messages.sequence IS 'Display order within conversation for proper threading';