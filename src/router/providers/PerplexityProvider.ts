/**
 * Perplexity Provider: Stub implementation
 * 
 * TODO: Implement full Perplexity API integration
 */

import { LlmChatResponse } from "../../types";
import { LlmProviderInterface } from "../LlmRouter";

export class PerplexityProvider implements LlmProviderInterface {
  async chat(args: {
    systemPrompt: string;
    messages: Array<{ role: "system" | "user" | "assistant" | "tool"; content: string }>;
  }): Promise<LlmChatResponse> {
    // TODO: Implement Perplexity API
    // Example structure:
    // - Use Perplexity Chat Completions API
    // - Similar to OpenAI format but with Perplexity-specific endpoints
    // - Handle system prompts
    // - Return normalized response with citations if available
    
    throw new Error(
      "Perplexity provider not implemented yet. " +
      "Would use Perplexity Chat Completions API with sonar models. " +
      "See: https://docs.perplexity.ai/"
    );
  }
}

