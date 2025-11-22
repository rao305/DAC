// backend/dac/safety.ts
import { DACRequest } from './types';

export type SafetyVerdict = 'allow' | 'block' | 'needs_clarification';

export interface SafetyResult {
    verdict: SafetyVerdict;
    reasons: string[];
}

export function runSafetyCheck(req: DACRequest): SafetyResult {
    const lastUser = [...req.messages].reverse().find(m => m.role === 'user');
    if (!lastUser) {
        return { verdict: 'allow', reasons: [] };
    }

    const text = lastUser.content.toLowerCase();
    const reasons: string[] = [];

    const selfHarm =
        /kill myself|suicide|self harm|end my life|hurt myself/.test(text);
    const violence =
        /kill them|murder|how to make a bomb|explosive|terrorist/.test(text);
    const sexualMinor =
        /child porn|cp|minor sex|underage/.test(text);

    if (selfHarm) {
        reasons.push('self-harm');
    }
    if (violence) {
        reasons.push('violence/terror');
    }
    if (sexualMinor) {
        reasons.push('sexual content involving minors');
    }

    if (reasons.length > 0) {
        return { verdict: 'block', reasons };
    }

    // Example: ambiguous / gray-area requests can be flagged:
    const ambiguous =
        /hack|bypass|crack|exploit/.test(text);
    if (ambiguous) {
        return { verdict: 'needs_clarification', reasons: ['ambiguous security-related request'] };
    }

    return { verdict: 'allow', reasons: [] };
}
