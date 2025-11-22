/**
 * Anthropic Provider: Stub implementation
 * 
 * TODO: Implement full Anthropic Claude API integration
 */

import { LlmChatResponse } from "../../types";
import { LlmProviderInterface } from "../LlmRouter";

export class AnthropicProvider implements LlmProviderInterface {
  async chat(args: {
    systemPrompt: string;
    messages: Array<{ role: "system" | "user" | "assistant" | "tool"; content: string }>;
  }): Promise<LlmChatResponse> {
    // TODO: Implement Anthropic Claude API
    // Example structure:
    // - Use Anthropic Messages API
    // - Convert messages format (Anthropic uses different format)
    // - Handle system prompt (Anthropic supports system messages)
    // - Return normalized response
    
    throw new Error(
      "Anthropic provider not implemented yet. " +
      "Would use Anthropic Messages API with Claude models. " +
      "See: https://docs.anthropic.com/claude/reference/messages-post"
    );
  }
}

