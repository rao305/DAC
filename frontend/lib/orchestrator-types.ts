/**
 * TypeScript types for the Dynamic Collaborate Orchestrator
 * 
 * These types mirror the backend Pydantic models for the
 * dynamic collaboration system.
 */

// ============================================================================
// Model Capabilities
// ============================================================================

export type CostTier = 'low' | 'medium' | 'high'

export interface ModelStrengths {
  reasoning: number    // 0.0 - 1.0
  creativity: number   // 0.0 - 1.0
  factuality: number   // 0.0 - 1.0
  code: number         // 0.0 - 1.0
  long_context: number // 0.0 - 1.0
}

export interface ModelCapability {
  id: string                  // Format: "provider:model-name"
  display_name: string
  provider: string
  model_name: string
  strengths: ModelStrengths
  cost_tier: CostTier
  has_browse: boolean
  relative_latency: number    // 0.0 (fastest) to 1.0 (slowest)
  max_context_tokens: number
  description: string
}

// ============================================================================
// User Settings
// ============================================================================

export type UserPriority = 'quality' | 'balanced' | 'speed' | 'cost'

export interface UserSettings {
  priority: UserPriority
  max_steps: number  // 1-7
}

// ============================================================================
// Collaboration Roles
// ============================================================================

export type CollabRole = 'analyst' | 'researcher' | 'creator' | 'critic' | 'synthesizer'

export const COLLAB_ROLE_DISPLAY: Record<CollabRole, { name: string; description: string; icon: string }> = {
  analyst: {
    name: 'Analyst',
    description: 'Clarifies and decomposes the task',
    icon: '🔍'
  },
  researcher: {
    name: 'Researcher',
    description: 'Gathers facts and references',
    icon: '📚'
  },
  creator: {
    name: 'Creator',
    description: 'Produces the draft solution',
    icon: '✨'
  },
  critic: {
    name: 'Critic',
    description: 'Evaluates and identifies issues',
    icon: '🎯'
  },
  synthesizer: {
    name: 'Synthesizer',
    description: 'Creates the final polished answer',
    icon: '🔮'
  }
}

// ============================================================================
// Collaboration Plan
// ============================================================================

export interface CollabStep {
  step_index: number
  role: CollabRole
  model_id: string
  model_name?: string
  purpose: string
  instructions_for_step?: string
  needs_previous_steps: string[]
  estimated_importance: number  // 0.0 - 1.0
  model_rationale: string
}

export interface CollaborationPlan {
  pipeline_summary: string
  steps: CollabStep[]
  planning_time_ms: number
}

// ============================================================================
// Step Results
// ============================================================================

export interface StepResult {
  step_index: number
  role: CollabRole
  model_id: string
  model_name: string
  purpose: string
  content: string
  execution_time_ms: number
  success: boolean
  error?: string
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface DynamicCollaborateRequest {
  user_id?: string
  message: string
  thread_id?: string
  thread_context?: string
  settings?: UserSettings
}

export interface DynamicCollaborateResponse {
  turn_id: string
  final_answer: string
  plan: CollaborationPlan
  step_results: StepResult[]
  total_time_ms: number
  available_models_used: string[]
}

export interface AvailableModelsResponse {
  models: ModelCapability[]
  total_count: number
}

// ============================================================================
// Streaming Types
// ============================================================================

export type StreamEventType = 
  | 'planning'
  | 'plan_created'
  | 'step_started'
  | 'step_completed'
  | 'final_answer'
  | 'error'
  | 'done'

export interface StreamEventPlanning {
  type: 'planning'
  message: string
}

export interface StreamEventPlanCreated {
  type: 'plan_created'
  plan: {
    pipeline_summary: string
    steps: {
      step_index: number
      role: CollabRole
      model_id: string
      purpose: string
    }[]
    planning_time_ms: number
  }
}

export interface StreamEventStepStarted {
  type: 'step_started'
  step_index: number
  role: CollabRole
  model_id: string
}

export interface StreamEventStepCompleted {
  type: 'step_completed'
  step_index: number
  role: CollabRole
  content?: string
  execution_time_ms?: number
  success: boolean
  error?: string
}

export interface StreamEventFinalAnswer {
  type: 'final_answer'
  turn_id: string
  content: string
}

export interface StreamEventError {
  type: 'error'
  message: string
}

export interface StreamEventDone {
  type: 'done'
}

export type StreamEvent =
  | StreamEventPlanning
  | StreamEventPlanCreated
  | StreamEventStepStarted
  | StreamEventStepCompleted
  | StreamEventFinalAnswer
  | StreamEventError
  | StreamEventDone

// ============================================================================
// Helper Functions
// ============================================================================

export function getProviderFromModelId(modelId: string): string {
  const [provider] = modelId.split(':')
  return provider
}

export function getModelNameFromModelId(modelId: string): string {
  const [, ...rest] = modelId.split(':')
  return rest.join(':')
}

export function formatExecutionTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`
  }
  return `${(ms / 1000).toFixed(1)}s`
}

export function getRoleColor(role: CollabRole): string {
  const colors: Record<CollabRole, string> = {
    analyst: '#3B82F6',    // Blue
    researcher: '#8B5CF6', // Purple
    creator: '#10B981',    // Green
    critic: '#F59E0B',     // Amber
    synthesizer: '#EC4899' // Pink
  }
  return colors[role]
}

/**
 * Default settings for collaboration
 */
export const DEFAULT_COLLAB_SETTINGS: UserSettings = {
  priority: 'balanced',
  max_steps: 5
}

