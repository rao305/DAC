/**
 * Test script for Supermemory integration
 * 
 * Tests:
 * 1. Memory storage - "My name is Alice and I love TypeScript. Please remember that."
 * 2. Memory retrieval - "What is my name and what language do I like?"
 */

// Load environment variables using dotenv
// Try to load .env.local first, then fall back to .env
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

dotenvConfig({ path: resolve(__dirname, ".env.local") });
dotenvConfig({ path: resolve(__dirname, ".env") });

import { ContextManager } from "./context/ContextManager";
import { historyStore } from "./context/HistoryStore";
import { entityResolver } from "./context/EntityResolver";
import { llmRouter } from "./router/LlmRouter";
import { isSupermemoryAvailable } from "./integrations/supermemory";

async function testSupermemory() {
  console.log("🧠 Testing Supermemory Integration\n");
  console.log("=" .repeat(50));

  // Check if Supermemory is available
  if (!isSupermemoryAvailable()) {
    console.error("❌ Supermemory is not available!");
    console.error("   Please set SUPERMEMORY_API_KEY in .env.local");
    process.exit(1);
  }

  console.log("✅ Supermemory API key detected\n");

  const sessionId = "test-supermemory-session";
  const userId = "test-user-1";
  const contextManager = new ContextManager(historyStore);

  // Test 1: Store information in memory
  console.log("📝 Test 1: Storing information in memory");
  console.log("-".repeat(50));
  
  const message1 = "My name is Alice and I love TypeScript. Please remember that.";
  console.log(`User: "${message1}"\n`);

  contextManager.addUserMessage(sessionId, message1, userId);

  const recentMessages1 = contextManager.getRecentMessages(sessionId, 10);
  const resolution1 = await entityResolver.resolve(recentMessages1, message1);
  
  const contextWindow1 = contextManager.getContextWindow(sessionId, 20);
  const systemPrompt = contextManager.getOrCreateSystemPrompt();

  const llmMessages1 = [
    ...contextWindow1.slice(0, -1),
    {
      role: "user" as const,
      content: resolution1.resolvedQuery,
    },
  ];

  console.log("Calling LLM with Supermemory tools...");
  console.log("(This should trigger addMemory tool call)\n");

  try {
    const response1 = await llmRouter.routeChat({
      provider: "openai",
      systemPrompt,
      messages: llmMessages1,
      sessionId,
      userId,
    });

    console.log(`Assistant: "${response1.content}"\n`);
    
    if (response1.raw?.toolCalls && response1.raw.toolCalls.length > 0) {
      console.log("✅ Tool calls detected:");
      response1.raw.toolCalls.forEach((call: any, idx: number) => {
        console.log(`   ${idx + 1}. ${call.toolName}`);
      });
      console.log("");
    } else {
      console.log("⚠️  No tool calls detected (model may not have used addMemory)\n");
    }

    contextManager.addAssistantMessage(sessionId, response1.content);
  } catch (error) {
    console.error("❌ Error calling LLM:", error);
    process.exit(1);
  }

  // Wait a moment for memory to be stored
  console.log("⏳ Waiting 2 seconds for memory to be stored...\n");
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Retrieve information from memory
  console.log("🔍 Test 2: Retrieving information from memory");
  console.log("-".repeat(50));
  
  const message2 = "What is my name and what language do I like?";
  console.log(`User: "${message2}"\n`);

  contextManager.addUserMessage(sessionId, message2, userId);

  const recentMessages2 = contextManager.getRecentMessages(sessionId, 10);
  const resolution2 = await entityResolver.resolve(recentMessages2, message2);
  
  const contextWindow2 = contextManager.getContextWindow(sessionId, 20);

  const llmMessages2 = [
    ...contextWindow2.slice(0, -1),
    {
      role: "user" as const,
      content: resolution2.resolvedQuery,
    },
  ];

  console.log("Calling LLM with Supermemory tools...");
  console.log("(This should trigger searchMemories tool call)\n");

  try {
    const response2 = await llmRouter.routeChat({
      provider: "openai",
      systemPrompt,
      messages: llmMessages2,
      sessionId,
      userId,
    });

    console.log(`Assistant: "${response2.content}"\n`);
    
    if (response2.raw?.toolCalls && response2.raw.toolCalls.length > 0) {
      console.log("✅ Tool calls detected:");
      response2.raw.toolCalls.forEach((call: any, idx: number) => {
        console.log(`   ${idx + 1}. ${call.toolName}`);
      });
      console.log("");
    } else {
      console.log("⚠️  No tool calls detected (model may not have used searchMemories)\n");
    }

    // Check if the answer contains the stored information
    const answerLower = response2.content.toLowerCase();
    if (answerLower.includes("alice") && answerLower.includes("typescript")) {
      console.log("✅ SUCCESS: Assistant correctly recalled stored information!\n");
    } else {
      console.log("⚠️  WARNING: Answer may not have used stored memories\n");
    }
  } catch (error) {
    console.error("❌ Error calling LLM:", error);
    process.exit(1);
  }

  console.log("=" .repeat(50));
  console.log("🎉 Supermemory integration test complete!");
}

// Run the test
testSupermemory().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});

