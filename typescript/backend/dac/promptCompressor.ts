// backend/dac/promptCompressor.ts
import { DACRequest } from './types';

export interface CompressedContext {
    system: string;
    messages: { role: 'user' | 'assistant'; content: string }[];
}

type Role = 'user' | 'assistant' | 'system';

function estimateTokens(text: string): number {
    // TODO: use real tokenizer (e.g., tiktoken); for now, naive word count * factor
    const words = text.trim().split(/\s+/).length;
    return Math.round(words * 1.3);
}

function countMessagesTokens(messages: { role: Role; content: string }[]): number {
    return messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
}

async function summarizeHistory(
    history: { role: Role; content: string }[],
    summarizer: (input: string) => Promise<string>,
): Promise<string> {
    const joined = history
        .map(m => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n\n');
    const prompt = `Summarize the following conversation into a concise, neutral summary that preserves important user goals, constraints, and decisions. Omit small talk.\n\n${joined}`;
    return summarizer(prompt);
}

export async function compressRequestContext(
    req: DACRequest,
    systemPrompt: string,
    modelMaxTokens: number,
    reserveForResponse: number,
    summarizer: (input: string) => Promise<string>,
): Promise<CompressedContext> {
    const rawMessages = [
        { role: 'system' as Role, content: systemPrompt },
        ...req.messages,
    ];

    const total = countMessagesTokens(rawMessages);
    const allowedContextTokens = modelMaxTokens - reserveForResponse;

    if (total <= allowedContextTokens) {
        // No compression needed
        return {
            system: systemPrompt,
            messages: req.messages.filter(m => m.role !== 'system') as any,
        };
    }

    // Keep last N turns, summarize the rest
    const turns = req.messages.filter(m => m.role !== 'system');
    const MAX_RECENT_TURNS = 6; // tunable

    const recent = turns.slice(-MAX_RECENT_TURNS);
    const earlier = turns.slice(0, -MAX_RECENT_TURNS);

    let summaryMessage: { role: 'assistant'; content: string } | null = null;

    if (earlier.length > 0) {
        const summary = await summarizeHistory(
            earlier,
            summarizer,
        );
        summaryMessage = {
            role: 'assistant',
            content: `Conversation summary so far (for context only, do not repeat this to the user): ${summary}`,
        };
    }

    const compressedMessages = summaryMessage
        ? [summaryMessage, ...recent]
        : recent;

    // Optional: verify token count and, if still too big, shrink summary again.

    return {
        system: systemPrompt,
        messages: compressedMessages as any,
    };
}
