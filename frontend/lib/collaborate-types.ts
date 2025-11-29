/**
 * TypeScript types for Enhanced Multi-Model Collaboration
 * 
 * These types match the new API contract for the upgraded Collaborate mode
 * that includes internal pipeline + external multi-model reviews + meta-synthesis.
 */

// ============================================================================
// Core Types
// ============================================================================

export type CollaborateMode = "auto" | "manual";

export type InternalStageRole =
  | "analyst"
  | "researcher"
  | "creator"
  | "critic"
  | "internal_synth"; // pre-existing final synth before meta-synth

export type ProviderName = "openai" | "google" | "perplexity" | "kimi" | "openrouter";

export type ExternalReviewerSource =
  | "perplexity"
  | "gemini"
  | "gpt"
  | "kimi"
  | "openrouter";

export type ReviewStance = "agree" | "disagree" | "mixed" | "unknown";

// ============================================================================
// Model & Provider Types
// ============================================================================

export interface ModelInfo {
  provider: ProviderName;
  model_slug: string;  // "gpt-4.1", "gemini-2.0-pro", "sonar-reasoning", etc.
  display_name: string; // "GPT-4.1", "Gemini Pro", "Perplexity Sonar", "Kimi K2"
}

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
}

// ============================================================================
// Internal Pipeline Types
// ============================================================================

export interface InternalStage {
  id: string;                // UUID or short id like "stage_analyst"
  role: InternalStageRole;   // "analyst" | ...
  title: string;             // "Analyst", "Researcher", etc. – good for UI labels
  model: ModelInfo;
  content: string;           // full text that stage produced
  created_at: string;        // ISO date
  token_usage?: TokenUsage;
  latency_ms?: number;
  // did the meta-synth say it actually used this content?
  used_in_final_answer?: boolean;
}

export interface CompressedReport {
  model: ModelInfo;
  content: string;        // ~250-400 token compressed version of internal report
}

export interface InternalPipeline {
  stages: InternalStage[]; // in order: analyst → researcher → creator → critic → internal_synth
  compressed_report?: CompressedReport;
}

// ============================================================================
// External Review Types
// ============================================================================

export interface ExternalReview {
  id: string;                      // "rev_1"
  source: ExternalReviewerSource;  // for icons / colors
  model: ModelInfo;
  stance: ReviewStance;            // roughly agrees / disagrees with internal report
  content: string;                 // bullet style critique (max ~200-250 tokens)
  created_at: string;
  token_usage?: TokenUsage;
  latency_ms?: number;
}

// ============================================================================
// Final Answer & Meta Types
// ============================================================================

export interface FinalAnswerExplanation {
  // short machine-readable summary from meta-synth
  used_internal_report: boolean;
  external_reviews_considered: number;
  // high-level confidence flag
  confidence_level?: "low" | "medium" | "high";
}

export interface FinalAnswer {
  content: string;       // what user sees as the assistant reply
  model: ModelInfo;      // your "director" model (GPT or Gemini)
  created_at: string;
  // optional explanation of how it was formed
  explanation?: FinalAnswerExplanation;
}

export interface CollaborateRunMeta {
  run_id: string;
  mode: CollaborateMode;     // "auto" | "manual"
  started_at: string;
  finished_at: string;
  total_latency_ms?: number;
  // nice to have for analytics UI later
  models_involved: ModelInfo[];
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CollaborateRequestBody {
  message: string;        // the new user message
  mode: CollaborateMode;  // existing auto/manual
  // you can add more flags here later (e.g. highFidelity: boolean)
}

export interface CollaborateResponse {
  final_answer: FinalAnswer;              // what you render as the main message
  internal_pipeline: InternalPipeline;    // Analyst → Researcher → Creator → Critic → Synth
  external_reviews: ExternalReview[];     // multi-model short critiques
  meta: CollaborateRunMeta;               // timing, models used, etc.
}

// ============================================================================
// UI Display Constants
// ============================================================================

export const ROLE_LABELS: Record<InternalStageRole, string> = {
  analyst: "Analyst",
  researcher: "Researcher",
  creator: "Creator",
  critic: "Critic",
  internal_synth: "Internal Report",
};

export const ROLE_DESCRIPTIONS: Record<InternalStageRole, string> = {
  analyst: "Clarifies and decomposes the task",
  researcher: "Gathers facts and references",
  creator: "Produces the draft solution",
  critic: "Evaluates and identifies issues",
  internal_synth: "Creates the initial combined report",
};

export const ROLE_ICONS: Record<InternalStageRole, string> = {
  analyst: "🔍",
  researcher: "📚",
  creator: "✨",
  critic: "🎯",
  internal_synth: "📋",
};

export const SOURCE_LABELS: Record<ExternalReviewerSource, string> = {
  perplexity: "Perplexity",
  gemini: "Gemini",
  gpt: "GPT",
  kimi: "Kimi",
  openrouter: "OpenRouter",
};

export const SOURCE_ICONS: Record<ExternalReviewerSource, string> = {
  perplexity: "🔍",
  gemini: "🎯",
  gpt: "✨",
  kimi: "🌙",
  openrouter: "🔀",
};

export const STANCE_COLORS: Record<ReviewStance, string> = {
  agree: "bg-emerald-50 text-emerald-700",
  disagree: "bg-rose-50 text-rose-700",
  mixed: "bg-amber-50 text-amber-800",
  unknown: "bg-slate-100 text-slate-700",
};

export const STANCE_LABELS: Record<ReviewStance, string> = {
  agree: "Agrees",
  disagree: "Disagrees", 
  mixed: "Partially agrees",
  unknown: "Neutral",
};

export const PROVIDER_COLORS: Record<ProviderName, string> = {
  openai: "#10B981",    // Green
  google: "#3B82F6",    // Blue
  perplexity: "#8B5CF6", // Purple
  kimi: "#F59E0B",      // Amber
  openrouter: "#EC4899" // Pink
};

// ============================================================================
// Helper Functions
// ============================================================================

export function formatLatency(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

export function getProviderColor(provider: ProviderName): string {
  return PROVIDER_COLORS[provider] || "#6B7280";
}

export function formatTokenUsage(usage?: TokenUsage): string {
  if (!usage) return "";
  const total = usage.input_tokens + usage.output_tokens;
  return `${total.toLocaleString()} tokens`;
}

export function getStageSequence(stages: InternalStage[]): InternalStage[] {
  // Ensure stages are in the correct order
  const roleOrder: InternalStageRole[] = ["analyst", "researcher", "creator", "critic", "internal_synth"];
  return stages.sort((a, b) => {
    const aIndex = roleOrder.indexOf(a.role);
    const bIndex = roleOrder.indexOf(b.role);
    return aIndex - bIndex;
  });
}

export function summarizeCollaboration(response: CollaborateResponse): {
  total_models: number;
  total_time: string;
  reviews_count: number;
  confidence: string;
} {
  const totalTime = response.meta.total_latency_ms 
    ? formatLatency(response.meta.total_latency_ms)
    : "Unknown";
  
  return {
    total_models: response.meta.models_involved.length,
    total_time: totalTime,
    reviews_count: response.external_reviews.length,
    confidence: response.final_answer.explanation?.confidence_level || "unknown"
  };
}