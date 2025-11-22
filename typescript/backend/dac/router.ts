// backend/dac/router.ts
import { DACRequest, DACRouteDecision, TaskType, ModelConfig } from './types';
import { MODELS } from './models';
import { classifyTask } from './classifyTask';

function pickPrimaryModel(taskType: TaskType): ModelConfig {
    const candidates = MODELS.filter(m => m.strengths.includes(taskType));

    // Prefer faster & cheaper for simple tasks
    const sorted = candidates.sort((a, b) => {
        const costRank = { cheap: 0, standard: 1, premium: 2 } as const;
        const latencyRank = { fast: 0, normal: 1, slow: 2 } as const;
        return (
            costRank[a.costTier] - costRank[b.costTier] ||
            latencyRank[a.latencyTier] - latencyRank[b.latencyTier]
        );
    });

    return sorted[0] ?? MODELS[0];
}

function pickCollabModels(taskType: TaskType, primary: ModelConfig): ModelConfig[] {
    // Example: code bugfix → use Claude as primary, GPT as secondary summarizer, Gemini for comments/docs
    if (taskType === 'code') {
        return MODELS.filter(
            m =>
                m.name !== primary.name &&
                (m.strengths.includes('code') || m.strengths.includes('factual') || m.strengths.includes('creative')),
        );
    }

    if (taskType === 'math') {
        return MODELS.filter(
            m => m.name !== primary.name && (m.strengths.includes('math') || m.strengths.includes('factual')),
        );
    }

    if (taskType === 'creative') {
        return MODELS.filter(
            m => m.name !== primary.name && (m.strengths.includes('creative') || m.strengths.includes('chat')),
        );
    }

    // default: no collab or minimal
    return [];
}

export function routeDAC(req: DACRequest): DACRouteDecision {
    const taskType = classifyTask(req);
    const primary = pickPrimaryModel(taskType);

    // You can make this smarter (look at length, user plan tier, etc.)
    const useCollab =
        taskType === 'code' ||
        taskType === 'math' ||
        taskType === 'creative';

    const secondary = useCollab ? pickCollabModels(taskType, primary) : [];

    return {
        taskType,
        routed: {
            primary,
            secondary,
        },
        useCollab,
    };
}
