export const IS_MOCK_MODE = process.env.DAC_FORCE_MOCK === "1";

export function isGptAvailable() {
    return !!process.env.OPENAI_API_KEY;
}

export function isGeminiAvailable() {
    return !!process.env.GEMINI_API_KEY || !!process.env.GOOGLE_API_KEY;
}

export function isPerplexityAvailable() {
    return !!process.env.PERPLEXITY_API_KEY;
}

export function isKimiAvailable() {
    return !!process.env.KIMI_API_KEY || !!process.env.MOONSHOT_API_KEY;
}

export class ProviderConfigError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ProviderConfigError";
    }
}

export class ProviderCallError extends Error {
    provider: string;
    statusCode?: number;

    constructor(provider: string, message: string, statusCode?: number) {
        super(message);
        this.name = "ProviderCallError";
        this.provider = provider;
        this.statusCode = statusCode;
    }
}
