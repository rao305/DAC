/**
 * Supermemory Integration Helper
 * 
 * Provides Supermemory tools for long-term memory via Vercel AI SDK
 */

import { supermemoryTools } from "@supermemory/tools/ai-sdk";
import { SUPERMEMORY_API_KEY } from "../config";

/**
 * Get Supermemory tools instance for use with Vercel AI SDK
 * 
 * IMPORTANT: supermemoryTools() already returns properly formatted tools with Zod schemas
 * Do NOT wrap the returned tools again - they are ready to use with generateText()
 * 
 * @param userId - Optional user ID to scope memories (used as containerTag)
 * @param sessionId - Optional session ID for session-scoped memories
 * @throws {Error} If SUPERMEMORY_API_KEY is not set
 * @returns Supermemory tools instance with proper Zod schemas
 */
export function getSupermemoryTools(userId?: string, sessionId?: string) {
  if (!SUPERMEMORY_API_KEY) {
    console.warn("⚠️  SUPERMEMORY_API_KEY is not set. Supermemory disabled.");
    return undefined;
  }

  // Build containerTags array - use userId as primary containerTag
  // Supermemory uses containerTags to scope memories per user/project
  // For cross-session memory, we use userId only (not sessionId) so memories
  // stored in one session can be found in another session for the same user
  const containerTags: string[] = [];
  if (userId) {
    containerTags.push(userId);
  }
  // Note: We don't include sessionId in containerTags to enable cross-session memory
  // If you need session-specific memories, you can add sessionId, but that will
  // prevent cross-session recall

  // Return Supermemory tools with containerTags for proper memory scoping
  // The supermemoryTools() function returns an object with:
  // - addMemory: tool({ description, inputSchema: z.object({memory: z.string()}), execute })
  // - searchMemories: tool({ description, inputSchema: z.object({informationToGet: z.string(), ...}), execute })
  // These are already properly formatted for Vercel AI SDK - no additional wrapping needed!
  return supermemoryTools(SUPERMEMORY_API_KEY, {
    containerTags: containerTags.length > 0 ? containerTags : undefined,
  });
}

/**
 * Check if Supermemory is available (API key is configured)
 */
export function isSupermemoryAvailable(): boolean {
  return !!SUPERMEMORY_API_KEY;
}
