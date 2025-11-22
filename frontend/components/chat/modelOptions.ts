// components/chat/modelOptions.ts

export type ModelId =
  | "kimi-k2-thinking"
  | "gemini-2.0-flash-thinking-exp"
  | "gpt-5"
  | "sonar-pro";

export interface ModelOption {
  id: ModelId;
  name: string;
  provider: 'kimi' | 'google' | 'openai' | 'perplexity';
  group: "Auto";
  thinking: boolean;
  vision: boolean;
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    id: "kimi-k2-thinking",
    name: "Kimi K2 Thinking",
    provider: "kimi",
    group: "Auto",
    thinking: true,
    vision: true,
  },
  {
    id: "gemini-2.0-flash-thinking-exp",
    name: "Gemini 2.0 Flash Thinking",
    provider: "google",
    group: "Auto",
    thinking: true,
    vision: true,
  },
  {
    id: "gpt-5",
    name: "GPT-5",
    provider: "openai",
    group: "Auto",
    thinking: true,
    vision: true,
  },
  {
    id: "sonar-pro",
    name: "Perplexity Sonar Pro",
    provider: "perplexity",
    group: "Auto",
    thinking: true,
    vision: false,
  },
];

export const getModelById = (id: ModelId): ModelOption =>
  MODEL_OPTIONS.find((m) => m.id === id) ?? MODEL_OPTIONS[0];