// backend/dac/classifyTask.ts
import { TaskType, DACRequest } from './types';

export function classifyTask(req: DACRequest): TaskType {
    const lastUser = [...req.messages].reverse().find(m => m.role === 'user');
    if (!lastUser) return 'chat';
    const text = lastUser.content.toLowerCase();

    const hasCodeKeywords =
        /code|implement|function|class|bug|stack trace|error|python|javascript|typescript|java|c\+\+/.test(text);
    const hasMathKeywords =
        /solve|equation|integral|derivative|limit|matrix|vector|probability|prove|show that/.test(text);
    const hasImageKeywords =
        /image|picture|photo|screenshot|diagram|draw|generate an image/.test(text);
    const isFactual =
        /what is|who is|when was|history of|explain|compare|pros and cons|advantages|disadvantages/.test(
            text,
        );
    const isCreative =
        /story|poem|song|lyrics|script|blog|ad copy|hook|tagline|character/.test(text);

    if (hasCodeKeywords) return 'code';
    if (hasMathKeywords) return 'math';
    if (hasImageKeywords) return 'multimodal';
    if (isFactual) return 'factual';  // Check factual before creative
    if (isCreative) return 'creative';

    return 'chat';
}
