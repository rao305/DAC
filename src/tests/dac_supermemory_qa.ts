/**
 * DAC Supermemory QA Harness - CI-Ready Test Suite
 * 
 * Comprehensive integration tests for:
 * - ContextManager (same-session context)
 * - EntityResolver (pronouns & "that X")
 * - Supermemory (add/search)
 * - Cross-session context
 * 
 * Run with:
 *   npx tsx src/tests/dac_supermemory_qa.ts
 * 
 * Use in CI to validate context + Supermemory behavior.
 * 
 * Environment variables:
 *   - API_BASE_URL (default: http://localhost:3000)
 *   - OPENAI_API_KEY (required)
 *   - SUPERMEMORY_API_KEY (optional, but recommended)
 */

// Load environment variables using dotenv
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

dotenvConfig({ path: resolve(__dirname, "../.env.local") });
dotenvConfig({ path: resolve(__dirname, "../.env") });

import { ContextManager } from "../context/ContextManager";
import { historyStore } from "../context/HistoryStore";
import { entityResolver } from "../context/EntityResolver";
import { llmRouter } from "../router/LlmRouter";
import { isSupermemoryAvailable } from "../integrations/supermemory";
import { config } from "../config";

// ============================================================
// Test Runner Infrastructure
// ============================================================

interface TestCase {
  name: string;
  phase: string;
  fn: () => Promise<void>;
}

const testCases: TestCase[] = [];
let currentTest: TestCase | null = null;
let assertionErrors: string[] = [];

/**
 * Register a test case
 */
function test(name: string, phase: string, fn: () => Promise<void>): void {
  testCases.push({ name, phase, fn });
}

/**
 * Assert a condition, record failure if false
 */
function assert(condition: any, message: string): void {
  if (!condition) {
    const errorMsg = `Assertion failed: ${message}`;
    assertionErrors.push(errorMsg);
    if (currentTest) {
      console.error(`  ❌ ${errorMsg}`);
    }
  }
}

/**
 * Run a single test case
 */
async function runTest(testCase: TestCase): Promise<boolean> {
  currentTest = testCase;
  assertionErrors = [];
  
  try {
    await testCase.fn();
    
    if (assertionErrors.length === 0) {
      console.log(`✅ PASS – ${testCase.phase}: ${testCase.name}`);
      return true;
    } else {
      console.log(`❌ FAIL – ${testCase.phase}: ${testCase.name}`);
      assertionErrors.forEach(err => console.error(`   ${err}`));
      return false;
    }
  } catch (error) {
    console.error(`❌ FAIL – ${testCase.phase}: ${testCase.name}`);
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  } finally {
    currentTest = null;
  }
}

// ============================================================
// Test Implementation
// ============================================================

let sessionId1 = "qa-session-1";
let sessionId2 = "qa-session-2";
const userId = "qa-user-1";

async function runAllTests() {
  console.log("🧪 DAC Supermemory QA Harness\n");
  console.log("=".repeat(70));

  // Enable test mode for deterministic behavior
  process.env.DAC_TEST_MODE = "1";
  process.env.DEBUG_DAC_TESTS = "1";

  // Pre-flight checks
  console.log("🔍 Pre-flight checks...");
  console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "✅ Set" : "❌ Not set"}`);
  console.log(`   SUPERMEMORY_API_KEY: ${process.env.SUPERMEMORY_API_KEY ? "✅ Set" : "⚠️  Not set (optional)"}`);
  
  assert(!!process.env.OPENAI_API_KEY, "OPENAI_API_KEY must be set");
  
  if (!process.env.OPENAI_API_KEY) {
    console.error("\n❌ OPENAI_API_KEY is not configured!");
    console.error("   Please set OPENAI_API_KEY in src/.env.local");
    process.exit(1);
  }

  if (!isSupermemoryAvailable()) {
    console.warn("\n⚠️  Supermemory is not available (SUPERMEMORY_API_KEY not set)");
    console.warn("   Supermemory tests will be skipped");
  }

  console.log("✅ Pre-flight checks passed\n");

  const contextManager = new ContextManager(historyStore);
  const systemPrompt = contextManager.getOrCreateSystemPrompt();

  // ============================================================
  // Phase 1: Same-session context + pronouns
  // ============================================================
  
  test("Trump pronoun context", "Phase 1", async () => {
    const msg1 = "Who is Donald Trump?";
    contextManager.addUserMessage(sessionId1, msg1, userId);
    const recent1 = contextManager.getRecentMessages(sessionId1, 10);
    const resolution1 = await entityResolver.resolve(recent1, msg1);
    const context1 = contextManager.getContextWindow(sessionId1, 20);
    const llmMessages1 = [
      ...context1.slice(0, -1),
      { role: "user" as const, content: resolution1.resolvedQuery },
    ];

    const response1 = await llmRouter.routeChat({
      provider: "openai",
      systemPrompt,
      messages: llmMessages1,
      sessionId: sessionId1,
      userId,
    });

    contextManager.addAssistantMessage(sessionId1, response1.content);
    
    assert(response1.content.toLowerCase().includes("trump"), "Answer should mention Trump");
  });

  test("Trump 'he' pronoun resolution", "Phase 1", async () => {
    const msg2 = "When was he born?";
    contextManager.addUserMessage(sessionId1, msg2, userId);
    const recent2 = contextManager.getRecentMessages(sessionId1, 10);
    const resolution2 = await entityResolver.resolve(recent2, msg2);
    const context2 = contextManager.getContextWindow(sessionId1, 20);
    const llmMessages2 = [
      ...context2.slice(0, -1),
      { role: "user" as const, content: resolution2.resolvedQuery },
    ];

    const response2 = await llmRouter.routeChat({
      provider: "openai",
      systemPrompt,
      messages: llmMessages2,
      sessionId: sessionId1,
      userId,
    });

    contextManager.addAssistantMessage(sessionId1, response2.content);

    assert(
      resolution2.resolvedQuery.toLowerCase().includes("donald trump"),
      `Resolved query should mention Donald Trump, got: "${resolution2.resolvedQuery}"`
    );
    assert(
      !response2.content.toLowerCase().includes("luis miguel"),
      "Answer should not mention Luis Miguel"
    );
    assert(
      response2.content.toLowerCase().includes("donald trump"),
      "Answer should explicitly mention Donald Trump"
    );
  });

  test("Trump summary with pronoun", "Phase 1", async () => {
    const msg3 = "Summarize what you just told me about him in 2 sentences.";
    contextManager.addUserMessage(sessionId1, msg3, userId);
    const recent3 = contextManager.getRecentMessages(sessionId1, 10);
    const resolution3 = await entityResolver.resolve(recent3, msg3);
    const context3 = contextManager.getContextWindow(sessionId1, 20);
    const llmMessages3 = [
      ...context3.slice(0, -1),
      { role: "user" as const, content: resolution3.resolvedQuery },
    ];

    const response3 = await llmRouter.routeChat({
      provider: "openai",
      systemPrompt,
      messages: llmMessages3,
      sessionId: sessionId1,
      userId,
    });

    contextManager.addAssistantMessage(sessionId1, response3.content);

    assert(
      resolution3.resolvedQuery.toLowerCase().includes("donald trump"),
      `Resolved query should mention Donald Trump, got: "${resolution3.resolvedQuery}"`
    );
    assert(
      response3.content.toLowerCase().includes("trump"),
      "Summary should refer to Trump"
    );
  });

  // ============================================================
  // Phase 2: Supermemory - store + recall user info
  // ============================================================
  
  test("Store user info in Supermemory", "Phase 2", async () => {
    if (!isSupermemoryAvailable()) {
      console.log("  ⏭️  Skipping (Supermemory not available)");
      return;
    }

    const msg4 = "My name is Alex, I study computer science at Purdue University, and I prefer dark mode and TypeScript. Please remember that.";
    contextManager.addUserMessage(sessionId1, msg4, userId);
    const recent4 = contextManager.getRecentMessages(sessionId1, 10);
    const resolution4 = await entityResolver.resolve(recent4, msg4);
    const context4 = contextManager.getContextWindow(sessionId1, 20);
    const llmMessages4 = [
      ...context4.slice(0, -1),
      { role: "user" as const, content: resolution4.resolvedQuery },
    ];

    const response4 = await llmRouter.routeChat({
      provider: "openai",
      systemPrompt,
      messages: llmMessages4,
      sessionId: sessionId1,
      userId,
    });

    contextManager.addAssistantMessage(sessionId1, response4.content);

    const hasAddMemory = response4.raw?.toolCalls?.some((call: any) => 
      call.toolName?.toLowerCase().includes("memory") || 
      call.toolName?.toLowerCase().includes("add")
    );

    assert(hasAddMemory, "Expected addMemory tool call, but none detected");
    
    // Wait for memory to be stored
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  test("Recall user info from Supermemory", "Phase 2", async () => {
    if (!isSupermemoryAvailable()) {
      console.log("  ⏭️  Skipping (Supermemory not available)");
      return;
    }

    const msg5 = "What's my name and what language do I like again?";
    contextManager.addUserMessage(sessionId1, msg5, userId);
    const recent5 = contextManager.getRecentMessages(sessionId1, 10);
    const resolution5 = await entityResolver.resolve(recent5, msg5);
    const context5 = contextManager.getContextWindow(sessionId1, 20);
    const llmMessages5 = [
      ...context5.slice(0, -1),
      { role: "user" as const, content: resolution5.resolvedQuery },
    ];

    const response5 = await llmRouter.routeChat({
      provider: "openai",
      systemPrompt,
      messages: llmMessages5,
      sessionId: sessionId1,
      userId,
    });

    contextManager.addAssistantMessage(sessionId1, response5.content);

    // PART A: Only assert on answer content, not on whether searchMemories was called
    // It's acceptable to answer from short-term history when info is still in context
    const answerLower = response5.content.toLowerCase();
    assert(answerLower.includes("alex"), `Answer should mention 'Alex', got: "${response5.content.substring(0, 200)}"`);
    assert(answerLower.includes("typescript"), `Answer should mention 'TypeScript', got: "${response5.content.substring(0, 200)}"`);
    
    // Optional: Log if searchMemories was called (for debugging, but don't fail on it)
    const hasSearchMemory = response5.raw?.toolCalls?.some((call: any) => 
      call.toolName?.toLowerCase().includes("memory") || 
      call.toolName?.toLowerCase().includes("search")
    );
    if (hasSearchMemory) {
      console.log("  ℹ️  searchMemories was called (memory search used)");
    } else {
      console.log("  ℹ️  Answer used conversation history (acceptable for same-session recall)");
    }
  });

  // ============================================================
  // Phase 3: "That university" + ranking context
  // ============================================================
  
  test("Purdue 'that university' resolution", "Phase 3", async () => {
    const msg6 = "What is Purdue University?";
    contextManager.addUserMessage(sessionId1, msg6, userId);
    const recent6 = contextManager.getRecentMessages(sessionId1, 10);
    const resolution6 = await entityResolver.resolve(recent6, msg6);
    const context6 = contextManager.getContextWindow(sessionId1, 20);
    const llmMessages6 = [
      ...context6.slice(0, -1),
      { role: "user" as const, content: resolution6.resolvedQuery },
    ];

    const response6 = await llmRouter.routeChat({
      provider: "openai",
      systemPrompt,
      messages: llmMessages6,
      sessionId: sessionId1,
      userId,
    });

    contextManager.addAssistantMessage(sessionId1, response6.content);

    const msg7 = "What is the computer science rank for that university?";
    contextManager.addUserMessage(sessionId1, msg7, userId);
    const recent7 = contextManager.getRecentMessages(sessionId1, 10);
    const resolution7 = await entityResolver.resolve(recent7, msg7);
    const context7 = contextManager.getContextWindow(sessionId1, 20);
    const llmMessages7 = [
      ...context7.slice(0, -1),
      { role: "user" as const, content: resolution7.resolvedQuery },
    ];

    const response7 = await llmRouter.routeChat({
      provider: "openai",
      systemPrompt,
      messages: llmMessages7,
      sessionId: sessionId1,
      userId,
    });

    contextManager.addAssistantMessage(sessionId1, response7.content);

    assert(
      resolution7.resolvedQuery.toLowerCase().includes("purdue"),
      `Resolved query should mention Purdue, got: "${resolution7.resolvedQuery}"`
    );
    assert(
      !response7.content.toLowerCase().includes("couldn't determine") &&
      !response7.content.toLowerCase().includes("which university"),
      "Answer should not show confusion about which university"
    );
    assert(
      response7.content.toLowerCase().includes("purdue"),
      "Answer should explicitly mention Purdue University"
    );
  });

  // ============================================================
  // Phase 4: Cross-session / reload test (Supermemory)
  // ============================================================
  
  test("Cross-session memory recall", "Phase 4", async () => {
    if (!isSupermemoryAvailable()) {
      console.log("  ⏭️  Skipping (Supermemory not available)");
      return;
    }

    const msg8 = "Hey, do you remember my name and what I'm studying?";
    contextManager.addUserMessage(sessionId2, msg8, userId); // NEW SESSION
    const recent8 = contextManager.getRecentMessages(sessionId2, 10);
    const resolution8 = await entityResolver.resolve(recent8, msg8);
    const context8 = contextManager.getContextWindow(sessionId2, 20);
    const llmMessages8 = [
      ...context8.slice(0, -1),
      { role: "user" as const, content: resolution8.resolvedQuery },
    ];

    const response8 = await llmRouter.routeChat({
      provider: "openai",
      systemPrompt,
      messages: llmMessages8,
      sessionId: sessionId2,
      userId, // SAME USER ID
    });

    contextManager.addAssistantMessage(sessionId2, response8.content);

    // Debug: show recent messages for session2 to ensure session isolation
    console.log(
      "  recent8 messages (session2):",
      recent8.map((m) => m.content.substring(0, 80))
    );

    const hasOldMessage = recent8.some((m) =>
      m.content.toLowerCase().includes("alex") &&
      m.content.toLowerCase().includes("typescript")
    );
    assert(!hasOldMessage, "New session should have clean history (no old messages)");

    const hasSearchMemory8 = response8.raw?.toolCalls?.some((call: any) => 
      call.toolName?.toLowerCase().includes("memory") || 
      call.toolName?.toLowerCase().includes("search")
    );

    assert(hasSearchMemory8, "Expected searchMemories tool call, but none detected");

    const answerLower8 = response8.content.toLowerCase();
    
    // Enhanced logging for Phase 4 debugging
    console.log(`  Response: "${response8.content.substring(0, 300)}"`);
    console.log(`  Contains "alex": ${answerLower8.includes("alex")}`);
    
    assert(
      answerLower8.includes("alex"), 
      `Answer should mention 'Alex' (cross-session memory recall). Got: "${response8.content.substring(0, 300)}"`
    );
  });

  // ============================================================
  // Bonus: Ambiguity handling
  // ============================================================
  
  test("Obama/Biden ambiguity clarification", "Bonus", async () => {
    const msg9 = "Tell me about Barack Obama and Joe Biden";
    contextManager.addUserMessage(sessionId2, msg9, userId);
    const recent9 = contextManager.getRecentMessages(sessionId2, 10);
    const resolution9 = await entityResolver.resolve(recent9, msg9);
    const context9 = contextManager.getContextWindow(sessionId2, 20);
    const llmMessages9 = [
      ...context9.slice(0, -1),
      { role: "user" as const, content: resolution9.resolvedQuery },
    ];

    const response9 = await llmRouter.routeChat({
      provider: "openai",
      systemPrompt,
      messages: llmMessages9,
      sessionId: sessionId2,
      userId,
    });

    contextManager.addAssistantMessage(sessionId2, response9.content);

    const msg10 = "What year was he born?";
    contextManager.addUserMessage(sessionId2, msg10, userId);
    const recent10 = contextManager.getRecentMessages(sessionId2, 10);
    const resolution10 = await entityResolver.resolve(recent10, msg10);
    const context10 = contextManager.getContextWindow(sessionId2, 20);
    const llmMessages10 = [
      ...context10.slice(0, -1),
      { role: "user" as const, content: resolution10.resolvedQuery },
    ];

    const response10 = await llmRouter.routeChat({
      provider: "openai",
      systemPrompt,
      messages: llmMessages10,
      sessionId: sessionId2,
      userId,
    });

    contextManager.addAssistantMessage(sessionId2, response10.content);

    // PART D: More flexible ambiguity test - check for clarifying question
    const answerLower10 = response10.content.toLowerCase();
    
    // Check if answer contains both names (indicating clarification)
    const hasBothNames = answerLower10.includes("obama") && answerLower10.includes("biden");
    
    // Check for question indicators
    const hasQuestionMark = answerLower10.includes("?");
    const hasWhich = answerLower10.includes("which");
    const hasDoYouMean = answerLower10.includes("do you mean");
    
    // Clarifying question should have both names AND a question mark
    const asksClarification = hasBothNames && hasQuestionMark && (hasWhich || hasDoYouMean);

    if (!asksClarification) {
      console.log(`  ⚠️  Response: "${response10.content.substring(0, 200)}"`);
      console.log(`     Has both names: ${hasBothNames}, Has ?: ${hasQuestionMark}, Has "which"/"do you mean": ${hasWhich || hasDoYouMean}`);
    }

    assert(
      asksClarification,
      `Expected clarifying question mentioning both Obama and Biden with a question mark. Got: "${response10.content.substring(0, 200)}"`
    );
  });

  // ============================================================
  // Run all tests
  // ============================================================
  
  console.log("Running test suite...\n");
  
  const results: boolean[] = [];
  for (const testCase of testCases) {
    const passed = await runTest(testCase);
    results.push(passed);
  }

  // ============================================================
  // Print Summary
  // ============================================================
  
  console.log("\n" + "=".repeat(70));
  console.log("📊 Test Results Summary");
  console.log("=".repeat(70));

  const passed = results.filter(r => r).length;
  const total = results.length;
  const failed = total - passed;

  console.log(`\nSummary: ${passed}/${total} tests passed`);
  
  if (failed > 0) {
    console.log(`❌ ${failed} test(s) failed`);
  } else {
    console.log(`✅ All tests passed!`);
  }

  console.log("=".repeat(70) + "\n");

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run the test suite
runAllTests().catch((error) => {
  console.error("❌ Test suite failed with error:", error);
  process.exit(1);
});

