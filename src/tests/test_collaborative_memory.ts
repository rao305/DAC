/**
 * Collaborative Memory + Ambiguity Test Suite
 * 
 * Tests DAC behavior under collaborative memory with dynamic access control
 * and ambiguity resolution, based on Collaborative Memory paper principles.
 * 
 * Run: npx tsx src/tests/test_collaborative_memory.ts
 */

import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, "../.env.local") });
dotenvConfig({ path: resolve(__dirname, "../.env") });

import { ContextManager } from "../context/ContextManager";
import { historyStore } from "../context/HistoryStore";
import { EntityResolver } from "../context/EntityResolver";
import { llmRouter } from "../router/LlmRouter";
import { DAC_SYSTEM_PROMPT } from "../config";
import { isSupermemoryAvailable } from "../integrations/supermemory";

// Test configuration
const userId = "test-collab-memory-user";
const sessionId = "test-collab-memory-session";
const contextManager = new ContextManager(historyStore);
const entityResolver = new EntityResolver();

// Enable test mode
process.env.DAC_TEST_MODE = "1";
process.env.DEBUG_DAC_TESTS = "1";

interface TestResult {
  scenario: string;
  passed: boolean;
  message: string;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string, details?: string) {
  if (!condition) {
    results.push({ scenario: "Current", passed: false, message, details });
    throw new Error(message);
  }
  results.push({ scenario: "Current", passed: true, message, details });
}

async function runScenario(
  name: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  expectedBehavior: string,
  assertions: (response: string) => boolean
): Promise<TestResult> {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`SCENARIO: ${name}`);
  console.log("=".repeat(70));
  console.log(`Expected: ${expectedBehavior}\n`);

  let lastResponse = "";
  
  for (const msg of messages) {
    if (msg.role === "user") {
      console.log(`👤 User: ${msg.content}`);
      contextManager.addUserMessage(sessionId, msg.content, userId);
      
      const recent = contextManager.getRecentMessages(sessionId, 10);
      const resolution = await entityResolver.resolve(recent, msg.content);
      const context = contextManager.getContextWindow(sessionId, 20);
      const llmMessages = [
        ...context.slice(0, -1),
        { role: "user" as const, content: resolution.resolvedQuery },
      ];

      const response = await llmRouter.routeChat({
        provider: "openai",
        systemPrompt: DAC_SYSTEM_PROMPT,
        messages: llmMessages,
        sessionId,
        userId,
      });

      lastResponse = response.content;
      contextManager.addAssistantMessage(sessionId, lastResponse);
      console.log(`🤖 Assistant: ${lastResponse.substring(0, 200)}${lastResponse.length > 200 ? '...' : ''}`);
    } else {
      // Simulated assistant response (for setup)
      console.log(`🤖 Assistant: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}`);
      contextManager.addAssistantMessage(sessionId, msg.content);
    }
  }

  const passed = assertions(lastResponse);
  return {
    scenario: name,
    passed,
    message: passed ? "✅ PASSED" : "❌ FAILED",
    details: lastResponse.substring(0, 300),
  };
}

async function runAllScenarios() {
  console.log("🧪 Collaborative Memory + Ambiguity Test Suite\n");
  console.log("=".repeat(70));

  // Pre-flight checks
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY not set");
    process.exit(1);
  }

  if (!isSupermemoryAvailable()) {
    console.warn("⚠️  SUPERMEMORY_API_KEY not set. Some tests may be limited.");
  }

  // Clear history for clean test
  historyStore.clearHistory(sessionId);

  try {
    // SCENARIO 1: Simple Pronoun Resolution (SHOULD WORK)
    const result1 = await runScenario(
      "1. Simple Pronoun Resolution",
      [
        { role: "user", content: "Who is Mung Chiang?" },
        { role: "assistant", content: "Mung Chiang is the president of Purdue University, an electrical engineer, and a professor." },
        { role: "user", content: "Is he an engineer by any chance?" },
      ],
      "Correctly interpret 'he' as Mung Chiang, confirm he is an engineer, no random entities",
      (response) => {
        const lower = response.toLowerCase();
        const mentionsMung = lower.includes("mung") || lower.includes("chiang");
        const mentionsEngineer = lower.includes("engineer");
        const noRandomNames = !lower.includes("john smith") && !lower.includes("random");
        
        if (!mentionsMung) {
          console.log(`  ❌ Response doesn't mention Mung Chiang: "${response.substring(0, 100)}"`);
          return false;
        }
        if (!mentionsEngineer) {
          console.log(`  ❌ Response doesn't confirm engineering: "${response.substring(0, 100)}"`);
          return false;
        }
        if (!noRandomNames) {
          console.log(`  ❌ Response mentions irrelevant entities: "${response.substring(0, 100)}"`);
          return false;
        }
        console.log("  ✅ Correctly resolved pronoun to Mung Chiang");
        return true;
      }
    );
    results.push(result1);

    // SCENARIO 2: Ambiguous Pronoun (MUST ASK CLARIFICATION)
    historyStore.clearHistory(sessionId);
    const result2 = await runScenario(
      "2. Ambiguous Pronoun (Obama/Biden)",
      [
        { role: "user", content: "Tell me a bit about Barack Obama." },
        { role: "assistant", content: "Barack Obama is the 44th President of the United States, served from 2009-2017." },
        { role: "user", content: "And tell me a bit about Joe Biden too." },
        { role: "assistant", content: "Joe Biden is the 46th President of the United States, served as Vice President under Obama." },
        { role: "user", content: "What was he doing in 2008?" },
      ],
      "Ask clarifying question mentioning both Obama and Biden, do NOT guess",
      (response) => {
        const lower = response.toLowerCase();
        const hasBothNames = lower.includes("obama") && lower.includes("biden");
        const hasQuestionMark = lower.includes("?");
        const hasClarifyingPhrase = lower.includes("which") || lower.includes("clarify") || lower.includes("do you mean");
        const noDirectAnswer = !lower.includes("2008") || hasQuestionMark; // Should ask, not answer directly
        
        if (!hasBothNames) {
          console.log(`  ❌ Response doesn't mention both names: "${response.substring(0, 100)}"`);
          return false;
        }
        if (!hasQuestionMark) {
          console.log(`  ❌ Response doesn't ask a question: "${response.substring(0, 100)}"`);
          return false;
        }
        if (!hasClarifyingPhrase) {
          console.log(`  ❌ Response doesn't use clarifying language: "${response.substring(0, 100)}"`);
          return false;
        }
        console.log("  ✅ Correctly asked for clarification");
        return true;
      }
    );
    results.push(result2);

    // SCENARIO 3: Name Collision (Multiple John Smiths)
    historyStore.clearHistory(sessionId);
    const result3 = await runScenario(
      "3. Name Collision (Multiple John Smiths)",
      [
        { role: "user", content: "Can you tell me about a person named John Smith?" },
        { role: "user", content: "He works in engineering. What does he do?" },
      ],
      "Recognize ambiguity, ask for more disambiguating info (company, location, field)",
      (response) => {
        const lower = response.toLowerCase();
        const mentionsMultiple = lower.includes("many") || lower.includes("multiple") || lower.includes("several");
        const asksForMoreInfo = lower.includes("?") && (
          lower.includes("where") || lower.includes("company") || lower.includes("location") || 
          lower.includes("field") || lower.includes("which") || lower.includes("more")
        );
        const noArbitraryChoice = !lower.match(/john smith (is|works|does|at)/i); // Shouldn't pick one arbitrarily
        
        if (!mentionsMultiple && !asksForMoreInfo) {
          console.log(`  ❌ Response doesn't recognize ambiguity: "${response.substring(0, 100)}"`);
          return false;
        }
        if (!asksForMoreInfo) {
          console.log(`  ❌ Response doesn't ask for more info: "${response.substring(0, 100)}"`);
          return false;
        }
        console.log("  ✅ Correctly asked for disambiguation");
        return true;
      }
    );
    results.push(result3);

    // SCENARIO 4: Private vs Shared Memory
    if (isSupermemoryAvailable()) {
      historyStore.clearHistory(sessionId);
      
      // First, store a private memory
      console.log("\n  📝 Storing private memory: 'User likes C++ backend roles at large tech companies'");
      contextManager.addUserMessage(sessionId, "I love C++ backend roles at large tech companies. Please remember that.", userId);
      const recent4a = contextManager.getRecentMessages(sessionId, 10);
      const resolution4a = await entityResolver.resolve(recent4a, "I love C++ backend roles at large tech companies. Please remember that.");
      const context4a = contextManager.getContextWindow(sessionId, 20);
      const llmMessages4a = [
        ...context4a.slice(0, -1),
        { role: "user" as const, content: resolution4a.resolvedQuery },
      ];
      const response4a = await llmRouter.routeChat({
        provider: "openai",
        systemPrompt: DAC_SYSTEM_PROMPT,
        messages: llmMessages4a,
        sessionId,
        userId,
      });
      contextManager.addAssistantMessage(sessionId, response4a.content);
      
      // Wait for memory indexing (Supermemory needs time to process)
      console.log("  ⏳ Waiting 10 seconds for memory indexing...");
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const result4 = await runScenario(
        "4. Private vs Shared Memory",
        [
          { role: "user", content: "I told you before what kind of jobs I like. Can you remind me and give some suggestions?" },
        ],
        "Recall private memory (C++ backend roles), mention preference, no cross-user leaks",
        (response) => {
          const lower = response.toLowerCase();
          const mentionsCpp = lower.includes("c++") || lower.includes("cpp");
          const mentionsBackend = lower.includes("backend");
          const mentionsPreference = lower.includes("like") || lower.includes("prefer") || lower.includes("enjoy");
          const noOtherUser = !lower.includes("another user") && !lower.includes("other users");
          
          if (!mentionsCpp || !mentionsBackend) {
            console.log(`  ❌ Response doesn't recall C++ backend preference: "${response.substring(0, 150)}"`);
            return false;
          }
          if (!mentionsPreference) {
            console.log(`  ❌ Response doesn't acknowledge user's preference: "${response.substring(0, 150)}"`);
            return false;
          }
          if (!noOtherUser) {
            console.log(`  ❌ Response leaks other user info: "${response.substring(0, 150)}"`);
            return false;
          }
          console.log("  ✅ Correctly recalled private memory without cross-user leaks");
          return true;
        }
      );
      results.push(result4);
    } else {
      results.push({
        scenario: "4. Private vs Shared Memory",
        passed: false,
        message: "⏭️  SKIPPED (Supermemory not available)",
      });
    }

    // SCENARIO 5: Cross-User Leakage Check
    historyStore.clearHistory(sessionId);
    const result5 = await runScenario(
      "5. Cross-User Leakage Check",
      [
        { role: "user", content: "Do you know where I live or what type of work style I prefer?" },
      ],
      "Say don't know if no memory, do NOT guess or use other user's info",
      (response) => {
        const lower = response.toLowerCase();
        const admitsNoKnowledge = lower.includes("don't know") || lower.includes("don't have") || 
                                  lower.includes("no information") || lower.includes("not sure") ||
                                  lower.includes("would you like to share") || lower.includes("can you tell me");
        const noGuessing = !lower.includes("berlin") && !lower.includes("remote work") && 
                          !lower.includes("on-site") && !lower.includes("another user");
        
        if (!admitsNoKnowledge) {
          console.log(`  ❌ Response doesn't admit lack of knowledge: "${response.substring(0, 150)}"`);
          return false;
        }
        if (!noGuessing) {
          console.log(`  ❌ Response guesses or leaks other user info: "${response.substring(0, 150)}"`);
          return false;
        }
        console.log("  ✅ Correctly admitted lack of knowledge without guessing");
        return true;
      }
    );
    results.push(result5);

    // SCENARIO 6: Permission Change / Forgotten Info
    historyStore.clearHistory(sessionId);
    const result6 = await runScenario(
      "6. Permission Change / Forgotten Info",
      [
        { role: "user", content: "What do you remember about Project Aurora?" },
      ],
      "Say don't have info, do NOT hallucinate details from old memory",
      (response) => {
        const lower = response.toLowerCase();
        const admitsNoKnowledge = lower.includes("don't know") || lower.includes("don't have") || 
                                  lower.includes("no information") || lower.includes("not remember") ||
                                  lower.includes("can't recall") || lower.includes("unable to");
        const noHallucination = !lower.match(/project aurora (is|was|involves|has|does)/i) || 
                               lower.includes("don't") || lower.includes("can't");
        
        if (!admitsNoKnowledge) {
          console.log(`  ❌ Response doesn't admit lack of knowledge: "${response.substring(0, 150)}"`);
          return false;
        }
        if (!noHallucination && !admitsNoKnowledge) {
          console.log(`  ❌ Response hallucinates Project Aurora details: "${response.substring(0, 150)}"`);
          return false;
        }
        console.log("  ✅ Correctly admitted lack of knowledge without hallucination");
        return true;
      }
    );
    results.push(result6);

  } catch (error) {
    console.error("\n❌ Test suite error:", error);
    results.push({
      scenario: "Test Suite",
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  // Print summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("=".repeat(70));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach((result) => {
    console.log(`${result.message} – ${result.scenario}`);
    if (result.details && !result.passed) {
      console.log(`   Details: ${result.details.substring(0, 100)}...`);
    }
  });
  
  console.log("\n" + "=".repeat(70));
  console.log(`Summary: ${passed}/${total} scenarios passed`);
  console.log("=".repeat(70));
  
  process.exit(passed === total ? 0 : 1);
}

runAllScenarios().catch((error) => {
  console.error("❌ Test suite failed:", error);
  process.exit(1);
});

