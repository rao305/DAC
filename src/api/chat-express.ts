/**
 * /api/chat endpoint handler (Express.js version)
 * 
 * Alternative implementation for Express.js instead of Next.js
 * Usage: app.post('/api/chat', chatHandler)
 */

import { Request, Response } from "express";
import { ChatRequest, ChatResponse } from "../types";
import { ContextManager } from "../context/ContextManager";
import { historyStore } from "../context/HistoryStore";
import { entityResolver } from "../context/EntityResolver";
import { llmRouter } from "../router/LlmRouter";

// Initialize services
const contextManager = new ContextManager(historyStore);

export async function chatHandler(req: Request, res: Response) {
  try {
    // Parse request body
    const body: ChatRequest = req.body;

    // Validate required fields
    if (!body.sessionId || !body.message) {
      return res.status(400).json({
        error: "Missing required fields: sessionId and message",
      });
    }

    const { sessionId, userId, message, provider = "openai" } = body;

    // Step 1: Add user message to history
    contextManager.addUserMessage(sessionId, message, userId);

    // Step 2: Get recent conversation context
    const recentMessages = contextManager.getRecentMessages(sessionId, 10);

    // Step 3: Resolve pronouns and vague references
    const { resolvedQuery, entities } = await entityResolver.resolve(
      recentMessages,
      message
    );

    // Step 4: Get context window for LLM
    const contextWindow = contextManager.getContextWindow(sessionId, 20);

    // Step 5: Get system prompt
    const systemPrompt = contextManager.getOrCreateSystemPrompt();

    // Step 6: Build messages for LLM
    // Replace the last user message with the resolved query
    const llmMessages = [
      ...contextWindow.slice(0, -1), // All messages except the last one
      {
        role: "user" as const,
        content: resolvedQuery, // Use resolved query instead of raw message
      },
    ];

    // Step 7: Call LLM router (pass sessionId and userId for Supermemory)
    const llmResponse = await llmRouter.routeChat({
      provider,
      systemPrompt,
      messages: llmMessages,
      sessionId,
      userId,
    });

    const assistantAnswer = llmResponse.content;

    // Step 8: Save assistant reply
    contextManager.addAssistantMessage(sessionId, assistantAnswer);

    // Step 9: Return response
    const response: ChatResponse = {
      answer: assistantAnswer,
      resolvedQuery,
      entities,
      providerUsed: provider,
    };

    res.json(response);
  } catch (error) {
    console.error("Chat API error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

