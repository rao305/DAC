/**
 * Core type definitions for DAC conversational backend
 */

export type MessageRole = "system" | "user" | "assistant" | "tool";

export interface Message {
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface ConversationHistory {
  sessionId: string;
  userId?: string;
  messages: Message[];
}

export interface EntityResolutionResult {
  resolvedQuery: string;
  entities: string[];
}

export interface LlmChatOptions {
  provider: "openai" | "anthropic" | "gemini" | "perplexity";
  systemPrompt: string;
  messages: Array<{ role: MessageRole; content: string }>;
  sessionId?: string;
  userId?: string;
}

export interface LlmChatResponse {
  content: string;
  raw?: any;
}

export interface ChatRequest {
  sessionId: string;
  userId?: string;
  message: string;
  provider?: "openai" | "anthropic" | "gemini" | "perplexity";
}

export interface ChatResponse {
  answer: string;
  resolvedQuery: string;
  entities: string[];
  providerUsed: string;
  routingReason?: string; // Optional: reason for provider selection (for debugging/transparency)
}

