/**
 * OpenAI Provider: Implementation using Vercel AI SDK with Supermemory integration
 * 
 * MANUAL TOOL LOOP - SIMPLIFIED APPROACH:
 * - Use simple Core messages (strings for content)
 * - DON'T use maxToolRoundtrips - we control the loop
 * - Execute tools manually and feed results back as simple strings
 */

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { LlmChatResponse } from "../../types";
import { LlmProviderInterface } from "../LlmRouter";
import { config } from "../../config";
import { getSupermemoryTools } from "../../integrations/supermemory";

export class OpenAIProvider implements LlmProviderInterface {
  async chat(args: {
    systemPrompt: string;
    messages: Array<{ role: "system" | "user" | "assistant" | "tool"; content: string }>;
    sessionId?: string;
    userId?: string;
  }): Promise<LlmChatResponse> {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured. Set OPENAI_API_KEY environment variable.");
    }

    // Build initial messages array (filter out system messages - passed separately)
    const initialMessages = args.messages
      .filter((msg) => msg.role !== "system")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

    // Get Supermemory tools if available
    const tools = getSupermemoryTools(args.userId, args.sessionId);

    // Use Vercel AI SDK's openai model
    const model = openai(config.openaiModel);

    // Use lower temperature for test runs
    const isTestMode = process.env.DAC_TEST_MODE === "1" || process.env.NODE_ENV === "test";
    const temperature = isTestMode ? 0 : 0.7;
    const debugMode = process.env.DEBUG_DAC_TESTS === "1" || isTestMode;

    if (debugMode && tools) {
      console.log(`[OpenAIProvider] userId: ${args.userId || "none"}, sessionId: ${args.sessionId || "none"}`);
    }

    try {
      // SIMPLIFIED APPROACH: Use maxToolRoundtrips and let SDK handle tool execution
      // Then make one more call if needed to get final text answer
      const result = await generateText({
        model,
        system: args.systemPrompt,
        messages: initialMessages,
        tools,
        maxToolRoundtrips: 5, // Let SDK handle automatic tool execution
        temperature,
        maxTokens: 2000,
      });

      const allToolCalls = result.toolCalls || [];

      // Log tool calls for debugging
      if (allToolCalls.length > 0) {
        console.log(`[OpenAIProvider] Tool calls executed: ${allToolCalls.length}`);
        allToolCalls.forEach((call, idx) => {
          console.log(`  Tool ${idx + 1}: ${call.toolName}`);
          if (debugMode && call.args) {
            const argsStr = JSON.stringify(call.args);
            console.log(`    Args: ${argsStr.substring(0, 150)}${argsStr.length > 150 ? '...' : ''}`);
          }
        });

        // Check if we have a final text response
        if (result.text && result.text.length > 0) {
          console.log(`  Final answer: ${result.text.substring(0, 200)}${result.text.length > 200 ? '...' : ''}`);
        } else {
          console.log(`  ⚠️  No final text after tools - making follow-up call`);
          
          // Make one more call WITHOUT tools to force a final answer
          const finalResult = await generateText({
            model,
            system: args.systemPrompt + "\n\nIMPORTANT: Provide a final answer now based on the tool results you just received. Do not call more tools.",
            messages: [
              ...result.response.messages.map((msg: any) => {
                // Convert SDK messages to simple Core messages
                if (msg.role === "user" || msg.role === "system") {
                  return {
                    role: msg.role,
                    content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
                  };
                } else if (msg.role === "assistant") {
                  // Extract text content from assistant messages
                  if (typeof msg.content === "string") {
                    return { role: "assistant" as const, content: msg.content };
                  } else if (Array.isArray(msg.content)) {
                    const textParts = msg.content
                      .filter((part: any) => part.type === "text")
                      .map((part: any) => part.text);
                    return { role: "assistant" as const, content: textParts.join("\n") || "[Tool calls]" };
                  }
                  return { role: "assistant" as const, content: "[Tool calls]" };
                } else if (msg.role === "tool") {
                  // Convert tool results to assistant messages
                  if (Array.isArray(msg.content)) {
                    const results = msg.content.map((part: any) => 
                      `Tool ${part.toolName} result: ${JSON.stringify(part.output || part.result)}`
                    ).join("\n");
                    return { role: "assistant" as const, content: results };
                  }
                  return { role: "assistant" as const, content: JSON.stringify(msg.content) };
                }
                return { role: "assistant" as const, content: "" };
              }),
            ],
            temperature,
            maxTokens: 2000,
          });

          console.log(`  Follow-up answer: ${finalResult.text.substring(0, 200)}${finalResult.text.length > 200 ? '...' : ''}`);

          return {
            content: finalResult.text,
            raw: {
              finishReason: finalResult.finishReason,
              usage: finalResult.usage,
              toolCalls: allToolCalls.map(call => ({
                toolName: call.toolName,
                args: call.args,
              })),
            },
          };
        }
      } else if (tools && debugMode) {
        console.log("[OpenAIProvider] No tool calls made");
      }

      return {
        content: result.text,
        raw: {
          finishReason: result.finishReason,
          usage: result.usage,
          toolCalls: allToolCalls.map(call => ({
            toolName: call.toolName,
            args: call.args,
          })),
        },
      };

    } catch (error) {
      console.error("[OpenAIProvider] Error:", error);
      throw new Error(`Error calling openai provider: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
