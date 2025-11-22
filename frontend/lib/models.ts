import {
    IS_MOCK_MODE,
    isGptAvailable,
    isGeminiAvailable,
    isPerplexityAvailable,
    isKimiAvailable,
    ProviderConfigError,
    ProviderCallError
} from "./providersConfig";

export interface ModelResponse {
    content: string;
    isMock?: boolean;
    error?: string;
}

// Updated all models to 2025 valid versions

// Helper to call OpenAI (GPT)
export async function callGPT(
    messages: { role: string; content: string }[],
    model: string = "gpt-4o"
): Promise<ModelResponse> {
    if (!isGptAvailable()) {
        if (IS_MOCK_MODE) {
            console.log(`[GPT] Mock mode active. Missing OPENAI_API_KEY.`);
            return {
                content: `[MOCK GPT RESPONSE]\n\nI have processed the request using a simulated GPT model. \n\n(Real API call skipped: Missing OPENAI_API_KEY)`,
                isMock: true
            };
        }
        throw new ProviderConfigError("Missing OPENAI_API_KEY");
    }

    try {
        console.log(`[GPT] Calling OpenAI API with model ${model}...`);
        const apiKey = process.env.OPENAI_API_KEY;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: 0.7,
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const error = await response.text();
            throw new ProviderCallError("OpenAI", error, response.status);
        }

        const data = await response.json();
        console.log(`[GPT] Response received: ${data.choices[0].message.content.substring(0, 50)}...`);
        return { content: data.choices[0].message.content, isMock: false };
    } catch (error: any) {
        console.error("GPT Call Error:", error);
        if (error.name === 'AbortError') {
            throw new ProviderCallError("OpenAI", "Request timed out", 408);
        }
        if (error instanceof ProviderConfigError || error instanceof ProviderCallError) {
            throw error;
        }
        throw new ProviderCallError("OpenAI", error.message);
    }
}

// Helper to call Google (Gemini)
export async function callGemini(
    prompt: string,
    model: string = "gemini-2.5-flash"
): Promise<ModelResponse> {
    if (!isGeminiAvailable()) {
        if (IS_MOCK_MODE) {
            console.log(`[Gemini] Mock mode active. Missing GEMINI_API_KEY.`);
            return {
                content: `[MOCK GEMINI RESPONSE]\n\nI have analyzed the request using a simulated Gemini model. \n\n(Real API call skipped: Missing GEMINI_API_KEY)`,
                isMock: true
            };
        }
        throw new ProviderConfigError("Missing GEMINI_API_KEY");
    }

    try {
        console.log(`[Gemini] Calling Google API with model ${model}...`);
        // Support both GEMINI_API_KEY and GOOGLE_API_KEY
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        // Gemini API structure (simplified)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const error = await response.text();
            throw new ProviderCallError("Gemini", error, response.status);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        console.log(`[Gemini] Response received: ${content.substring(0, 50)}...`);
        return { content, isMock: false };
    } catch (error: any) {
        console.error("Gemini Call Error:", error);
        if (error.name === 'AbortError') {
            throw new ProviderCallError("Gemini", "Request timed out", 408);
        }
        if (error instanceof ProviderConfigError || error instanceof ProviderCallError) {
            throw error;
        }
        throw new ProviderCallError("Gemini", error.message);
    }
}

// Helper to call Perplexity
export async function callPerplexity(
    messages: { role: string; content: string }[],
    model: string = "sonar-pro"
): Promise<ModelResponse> {
    if (!isPerplexityAvailable()) {
        if (IS_MOCK_MODE) {
            console.log(`[Perplexity] Mock mode active. Missing PERPLEXITY_API_KEY.`);
            return {
                content: `[MOCK PERPLEXITY RESPONSE]\n\nI have performed a simulated search. \n\n(Real API call skipped: Missing PERPLEXITY_API_KEY)`,
                isMock: true
            };
        }
        throw new ProviderConfigError("Missing PERPLEXITY_API_KEY");
    }

    try {
        console.log(`[Perplexity] Calling Perplexity API with model ${model}...`);
        const apiKey = process.env.PERPLEXITY_API_KEY;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch("https://api.perplexity.ai/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const error = await response.text();
            throw new ProviderCallError("Perplexity", error, response.status);
        }

        const data = await response.json();
        console.log(`[Perplexity] Response received: ${data.choices[0].message.content.substring(0, 50)}...`);
        return { content: data.choices[0].message.content, isMock: false };
    } catch (error: any) {
        console.error("Perplexity Call Error:", error);
        if (error.name === 'AbortError') {
            throw new ProviderCallError("Perplexity", "Request timed out", 408);
        }
        if (error instanceof ProviderConfigError || error instanceof ProviderCallError) {
            throw error;
        }
        throw new ProviderCallError("Perplexity", error.message);
    }
}

// Helper to call Kimi (Moonshot)
export async function callKimi(
    messages: { role: string; content: string }[],
    model: string = "moonshot-v1-8k"
): Promise<ModelResponse> {
    if (!isKimiAvailable()) {
        if (IS_MOCK_MODE) {
            console.log(`[Kimi] Mock mode active. Missing KIMI_API_KEY.`);
            return {
                content: `[MOCK KIMI RESPONSE]\n\nI have critiqued the solution using a simulated Kimi model. \n\n(Real API call skipped: Missing KIMI_API_KEY)`,
                isMock: true
            };
        }
        throw new ProviderConfigError("Missing KIMI_API_KEY or MOONSHOT_API_KEY");
    }

    try {
        console.log(`[Kimi] Calling Moonshot API with model ${model}...`);
        const apiKey = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

        const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: 0.7,
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const error = await response.text();
            throw new ProviderCallError("Kimi", error, response.status);
        }

        const data = await response.json();
        console.log(`[Kimi] Response received: ${data.choices[0].message.content.substring(0, 50)}...`);
        return { content: data.choices[0].message.content, isMock: false };
    } catch (error: any) {
        console.error("Kimi Call Error:", error);
        if (error.name === 'AbortError') {
            throw new ProviderCallError("Kimi", "Request timed out", 408);
        }
        if (error instanceof ProviderConfigError || error instanceof ProviderCallError) {
            throw error;
        }
        throw new ProviderCallError("Kimi", error.message);
    }
}
