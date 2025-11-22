import { Brain, Sparkles, Zap, Search, Wand2 } from 'lucide-react'

export const DAC_MODELS = [
    {
        id: 'auto',
        name: 'Auto',
        provider: 'auto',
        icon: Wand2,
        description: 'Intelligent routing - automatically selects the best model for your query',
        features: ['Smart routing', 'Cost optimized', 'Best performance'],
    },
    {
        id: 'kimi-k2-thinking',
        name: 'Kimi K2 Thinking',
        provider: 'kimi',
        icon: Brain,
        description: 'Advanced reasoning with extended context and deep analysis',
        features: ['Long context', 'Chain of thought', 'Multilingual'],
    },
    {
        id: 'gemini-2.0-flash-thinking-exp',
        name: 'Gemini 2.0 Flash Thinking',
        provider: 'google',
        icon: Sparkles,
        description: 'Fast multimodal AI with visual understanding and code generation',
        features: ['Multimodal', 'Code expert', 'Fast response'],
    },
    {
        id: 'gpt-5',
        name: 'GPT-5',
        provider: 'openai',
        icon: Zap,
        description: 'Most capable reasoning model with advanced problem-solving',
        features: ['Best reasoning', 'Complex tasks', 'High accuracy'],
    },
    {
        id: 'sonar-pro',
        name: 'Perplexity Sonar Pro',
        provider: 'perplexity',
        icon: Search,
        description: 'Web-grounded answers with real-time search and citations',
        features: ['Real-time search', 'Citations', 'Current info'],
    },
]
