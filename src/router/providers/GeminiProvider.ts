/**
 * Gemini Provider: Stub implementation
 * 
 * TODO: Implement full Google Gemini API integration
 */

import { LlmChatResponse } from "../../types";
import { LlmProviderInterface } from "../LlmRouter";

export class GeminiProvider implements LlmProviderInterface {
  async chat(args: {
    systemPrompt: string;
    messages: Array<{ role: "system" | "user" | "assistant" | "tool"; content: string }>;
  }): Promise<LlmChatResponse> {
    // TODO: Implement Google Gemini API
    // Example structure:
    // - Use Gemini REST API or SDK
    // - Convert messages format (Gemini uses different structure)
    // - Handle system instructions (Gemini uses systemInstruction field)
    // - Return normalized response
    
    throw new Error(
      "Gemini provider not implemented yet. " +
      "Would use Google Gemini API with gemini-1.5-flash or gemini-1.5-pro. " +
      "See: https://ai.google.dev/api/generate"
    );
  }
}

