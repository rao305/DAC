// backend/dac/types.ts
export type TaskType = 'code' | 'math' | 'factual' | 'creative' | 'multimodal' | 'chat';

export type Provider = 'openai' | 'anthropic' | 'google' | 'groq' | 'local';

export interface ModelConfig {
  name: string;
  provider: Provider;
  strengths: TaskType[];
  maxOutputTokens: number;
  costTier: 'cheap' | 'standard' | 'premium';
  latencyTier: 'fast' | 'normal' | 'slow';
}

export interface RoutedModel {
  primary: ModelConfig;
  secondary?: ModelConfig[]; // e.g. collab models
}

export interface DACRequest {
  userId?: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
}

export interface DACRouteDecision {
  taskType: TaskType;
  routed: RoutedModel;
  useCollab: boolean;
}
