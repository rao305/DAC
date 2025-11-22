/**
 * EntityResolver: Micro-agent that rewrites ambiguous user messages
 * 
 * Uses a separate LLM call to resolve pronouns and vague references
 * using conversation history.
 */

import { Message, EntityResolutionResult } from "../types";
import { config, OPENAI_API_KEY } from "../config";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * System prompt for EntityResolver (Context Guard)
 */
const ENTITY_RESOLVER_SYSTEM_PROMPT = `You are the DAC Context Guard.

Your job is to fix ambiguous or vague user messages using conversation history.
You MUST always output a JSON object with a resolved, explicit user query.

Rules:

1. Replace pronouns and vague references with the specific entity mentioned
   in the conversation history (e.g., "he", "she", "they", "that university").
2. Use the most recently mentioned entity of the correct type (person, university,
   company, model, etc.).
3. If there is EXACTLY ONE clear candidate entity, use it automatically.
4. Only ask for clarification if there are multiple equally plausible entities,
   and choosing the wrong one would significantly change the answer.
5. Do NOT invent new entities beyond those mentioned in the conversation.

Output FORMAT (REQUIRED):

{
  "resolvedQuery": "<fully explicit rewritten query>",
  "entities": ["list of resolved entities as strings"]
}

- If you cannot resolve anything, set "resolvedQuery" equal to the original
  user message and "entities" to [].
- Do not include explanations, reasoning, or any extra keys.
- Only output the JSON object.`;

export class EntityResolver {
  /**
   * Resolve pronouns and vague references in user message
   * 
   * @param recentMessages Recent conversation history
   * @param rawUserMessage Latest user message (may contain pronouns/vague refs)
   * @returns Resolved query and extracted entities
   */
  async resolve(
    recentMessages: Message[],
    rawUserMessage: string
  ): Promise<EntityResolutionResult> {
    try {
      // Build conversation context for the resolver
      const conversationContext = recentMessages
        .slice(-10) // Last 10 messages for context
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      // Build messages for the resolver LLM call
      const messages = [
        {
          role: "system" as const,
          content: ENTITY_RESOLVER_SYSTEM_PROMPT,
        },
        {
          role: "user" as const,
          content: `Recent conversation:
${conversationContext}

Latest user message: "${rawUserMessage}"

Rewrite this message to be explicit. Output ONLY the JSON object.`,
        },
      ];

      // Call OpenAI for entity resolution
      const response = await this.callResolverLlm(messages);

      // Parse JSON response
      const parsed = this.parseJsonResponse(response);

      // Validate and return
      if (parsed && typeof parsed.resolvedQuery === "string") {
        return {
          resolvedQuery: parsed.resolvedQuery,
          entities: Array.isArray(parsed.entities)
            ? parsed.entities.filter((e) => typeof e === "string")
            : [],
        };
      }

      // Fallback to original message if parsing fails
      return {
        resolvedQuery: rawUserMessage,
        entities: [],
      };
    } catch (error) {
      console.error("EntityResolver error:", error);
      // Always fallback to original message on error
      return {
        resolvedQuery: rawUserMessage,
        entities: [],
      };
    }
  }

  /**
   * Call the resolver LLM using Vercel AI SDK
   * Uses the same OpenAI key from OPENAI_API_KEY environment variable
   */
  private async callResolverLlm(
    messages: Array<{ role: "system" | "user"; content: string }>
  ): Promise<string> {
    if (!OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    // Use Vercel AI SDK - it automatically picks up OPENAI_API_KEY from env
    const model = openai(config.entityResolverModel);

    // Extract system and user messages
    const systemMessage = messages.find(m => m.role === "system")?.content || "";
    const userMessages = messages.filter(m => m.role === "user").map(m => ({
      role: "user" as const,
      content: m.content,
    }));

    const result = await generateText({
      model,
      system: systemMessage,
      messages: userMessages,
      temperature: 0.1, // Low temperature for consistent JSON output
      maxTokens: 500,
    });

    return result.text;
  }

  /**
   * Parse JSON response, handling markdown code blocks
   */
  private parseJsonResponse(response: string): any {
    let cleaned = response.trim();

    // Remove markdown code blocks if present
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    try {
      return JSON.parse(cleaned);
    } catch (e) {
      // Try to extract JSON from text if wrapped
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw e;
    }
  }
}

// Singleton instance
export const entityResolver = new EntityResolver();

