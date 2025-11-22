// backend/dac/models.ts
import { ModelConfig } from './types';

export const MODELS: ModelConfig[] = [
    {
        name: 'gpt-4.1-mini',
        provider: 'openai',
        strengths: ['chat', 'factual', 'math'],
        maxOutputTokens: 2048,
        costTier: 'cheap',
        latencyTier: 'fast',
    },
    {
        name: 'gpt-4.1',
        provider: 'openai',
        strengths: ['math', 'factual', 'chat'],
        maxOutputTokens: 4096,
        costTier: 'standard',
        latencyTier: 'normal',
    },
    {
        name: 'claude-3.5-sonnet',
        provider: 'anthropic',
        strengths: ['code', 'creative', 'factual'],
        maxOutputTokens: 4096,
        costTier: 'premium',
        latencyTier: 'normal',
    },
    {
        name: 'gemini-1.5-pro',
        provider: 'google',
        strengths: ['creative', 'multimodal', 'chat'],
        maxOutputTokens: 4096,
        costTier: 'standard',
        latencyTier: 'normal',
    },
    {
        name: 'llama-3.1-8b',
        provider: 'local',
        strengths: ['chat', 'factual'],
        maxOutputTokens: 1024,
        costTier: 'cheap',
        latencyTier: 'fast',
    },
];
