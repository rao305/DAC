/**
 * /api/chat endpoint handler
 * 
 * Next.js App Router API route handler
 * For Express, see chat-express.ts alternative
 */

import { NextRequest, NextResponse } from "next/server";
import { ChatRequest, ChatResponse } from "../types";
import { ContextManager } from "../context/ContextManager";
import { historyStore } from "../context/HistoryStore";
import { entityResolver } from "../context/EntityResolver";
import { llmRouter } from "../router/LlmRouter";
import { analyzeContent } from "../router/QueryRouter";

// Initialize services
const contextManager = new ContextManager(historyStore);

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ChatRequest = await request.json();

    // Validate required fields
    if (!body.sessionId || !body.message) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId and message" },
        { status: 400 }
      );
    }

    const { sessionId, userId, message, provider: requestedProvider } = body;

    // Step 0: Intelligent routing - analyze query to determine best provider
    // If provider is explicitly requested, use it; otherwise, analyze content
    let provider: string;
    let routingReason: string | undefined;
    
    if (requestedProvider) {
      // User explicitly requested a provider
      provider = requestedProvider;
    } else {
      // Analyze query content to determine best provider
      const contextWindow = contextManager.getContextWindow(sessionId, 20);
      const routingDecision = analyzeContent(message, contextWindow.length);
      provider = routingDecision.provider;
      routingReason = routingDecision.reason;
      
      console.log(`[QueryRouter] Routing decision: ${provider} (${routingDecision.model}) - ${routingReason}`);
    }

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
      routingReason, // Include routing reason for debugging/transparency
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

