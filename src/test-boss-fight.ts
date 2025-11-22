/**
 * Boss Fight Test - Comprehensive Integration Test
 * 
 * Tests:
 * 1. ContextManager (same-session context)
 * 2. EntityResolver (pronouns & "that X")
 * 3. Supermemory (add/search)
 * 4. Cross-session context
 * 
 * Run: npx tsx test-boss-fight.ts
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
import { config } from "./config";

interface TestResult {
  phase: string;
  message: string;
  passed: boolean;
  checks: string[];
  errors: string[];
  resolvedQuery?: string;
  entities?: string[];
  toolCalls?: any[];
  answer?: string;
}

const results: TestResult[] = [];
let sessionId1 = "boss-fight-session-1";
let sessionId2 = "boss-fight-session-2";
const userId = "boss-fight-user-1";

async function runTest() {
  console.log("🧪 Boss Fight Test - Comprehensive Integration Test\n");
  console.log("=" .repeat(70));

  // Pre-flight checks
  console.log("🔍 Pre-flight checks...");
  console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "✅ Set" : "❌ Not set"}`);
  console.log(`   SUPERMEMORY_API_KEY: ${process.env.SUPERMEMORY_API_KEY ? "✅ Set" : "⚠️  Not set (optional)"}`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.error("\n❌ OPENAI_API_KEY is not configured!");
    console.error("   Please set OPENAI_API_KEY in src/.env.local");
    process.exit(1);
  }

  if (!isSupermemoryAvailable()) {
    console.warn("\n⚠️  Supermemory is not available (SUPERMEMORY_API_KEY not set)");
    console.warn("   Supermemory features will be disabled, but tests can continue");
  }

  console.log("✅ Pre-flight checks passed\n");

  const contextManager = new ContextManager(historyStore);
  const systemPrompt = contextManager.getOrCreateSystemPrompt();

  // ============================================================
  // Phase 1: Same-session context + pronouns
  // ============================================================
  console.log("🔁 Phase 1 – Same-session context + pronouns");
  console.log("-".repeat(70));

  // Message 1: Who is Donald Trump?
  console.log("\n📝 Message 1: Who is Donald Trump?");
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
  
  const result1: TestResult = {
    phase: "Phase 1",
    message: msg1,
    passed: true,
    checks: ["Normal bio answer expected"],
    errors: [],
    resolvedQuery: resolution1.resolvedQuery,
    entities: resolution1.entities,
    toolCalls: response1.raw?.toolCalls,
    answer: response1.content,
  };

  if (!response1.content.toLowerCase().includes("trump")) {
    result1.passed = false;
    result1.errors.push("Answer should mention Trump");
  }

  results.push(result1);
  console.log(`✅ Resolved: "${resolution1.resolvedQuery}"`);
  console.log(`✅ Answer length: ${response1.content.length} chars`);

  // Message 2: When was he born?
  console.log("\n📝 Message 2: When was he born?");
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

  const result2: TestResult = {
    phase: "Phase 1",
    message: msg2,
    passed: true,
    checks: [
      "resolved_query should be: 'When was Donald Trump born?'",
      "No random 'Luis Miguel' nonsense",
      "Answer should explicitly say: 'Donald Trump was born on June 14, 1946.'",
    ],
    errors: [],
    resolvedQuery: resolution2.resolvedQuery,
    entities: resolution2.entities,
    toolCalls: response2.raw?.toolCalls,
    answer: response2.content,
  };

  // Check resolved query
  if (!resolution2.resolvedQuery.toLowerCase().includes("donald trump")) {
    result2.passed = false;
    result2.errors.push(`Resolved query should mention Donald Trump, got: "${resolution2.resolvedQuery}"`);
  }

  // Check for random entities
  if (response2.content.toLowerCase().includes("luis miguel")) {
    result2.passed = false;
    result2.errors.push("Answer should not mention Luis Miguel");
  }

  // Check for explicit entity mention
  if (!response2.content.toLowerCase().includes("donald trump")) {
    result2.passed = false;
    result2.errors.push("Answer should explicitly mention Donald Trump");
  }

  // Check for birth date
  if (!response2.content.toLowerCase().includes("1946") && !response2.content.toLowerCase().includes("june")) {
    result2.errors.push("Answer should mention birth year/date (warning only)");
  }

  results.push(result2);
  console.log(`✅ Resolved: "${resolution2.resolvedQuery}"`);
  console.log(`✅ Entities: ${JSON.stringify(resolution2.entities)}`);

  // Message 3: Summarize what you just told me about him
  console.log("\n📝 Message 3: Summarize what you just told me about him in 2 sentences.");
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

  const result3: TestResult = {
    phase: "Phase 1",
    message: msg3,
    passed: true,
    checks: [
      "resolved_query should mention Donald Trump",
      "Summary should refer to Trump, not anyone else",
    ],
    errors: [],
    resolvedQuery: resolution3.resolvedQuery,
    entities: resolution3.entities,
    toolCalls: response3.raw?.toolCalls,
    answer: response3.content,
  };

  if (!resolution3.resolvedQuery.toLowerCase().includes("donald trump")) {
    result3.passed = false;
    result3.errors.push(`Resolved query should mention Donald Trump, got: "${resolution3.resolvedQuery}"`);
  }

  if (!response3.content.toLowerCase().includes("trump")) {
    result3.passed = false;
    result3.errors.push("Summary should refer to Trump");
  }

  results.push(result3);
  console.log(`✅ Resolved: "${resolution3.resolvedQuery}"`);

  // ============================================================
  // Phase 2: Supermemory - store + recall user info
  // ============================================================
  console.log("\n🧠 Phase 2 – Supermemory: store + recall user info");
  console.log("-".repeat(70));

  // Message 4: Store user info
  console.log("\n📝 Message 4: My name is Alex, I study computer science at Purdue University, and I prefer dark mode and TypeScript. Please remember that.");
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

  const result4: TestResult = {
    phase: "Phase 2",
    message: msg4,
    passed: true,
    checks: [
      "Model should call addMemory (or equivalent supermemory tool)",
      "Memory content should include: Alex, CS at Purdue, dark mode, TypeScript",
    ],
    errors: [],
    resolvedQuery: resolution4.resolvedQuery,
    entities: resolution4.entities,
    toolCalls: response4.raw?.toolCalls,
    answer: response4.content,
  };

  // Check for tool calls
  const hasAddMemory = response4.raw?.toolCalls?.some((call: any) => 
    call.toolName?.toLowerCase().includes("memory") || 
    call.toolName?.toLowerCase().includes("add")
  );

  if (!hasAddMemory) {
    result4.errors.push("Expected addMemory tool call, but none detected");
    result4.passed = false;
  } else {
    console.log("✅ addMemory tool call detected");
  }

  results.push(result4);

  // Wait for memory to be stored
  console.log("⏳ Waiting 2 seconds for memory to be stored...");
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Message 5: Recall user info
  console.log("\n📝 Message 5: What's my name and what language do I like again?");
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

  const result5: TestResult = {
    phase: "Phase 2",
    message: msg5,
    passed: true,
    checks: [
      "searchMemories should be called",
      "Answer should be: 'Your name is Alex, and you like TypeScript.'",
    ],
    errors: [],
    resolvedQuery: resolution5.resolvedQuery,
    entities: resolution5.entities,
    toolCalls: response5.raw?.toolCalls,
    answer: response5.content,
  };

  // Check for search tool calls
  const hasSearchMemory = response5.raw?.toolCalls?.some((call: any) => 
    call.toolName?.toLowerCase().includes("memory") || 
    call.toolName?.toLowerCase().includes("search")
  );

  if (!hasSearchMemory) {
    result5.errors.push("Expected searchMemories tool call, but none detected");
    result5.passed = false;
  } else {
    console.log("✅ searchMemories tool call detected");
  }

  // Check answer content
  const answerLower = response5.content.toLowerCase();
  if (!answerLower.includes("alex")) {
    result5.passed = false;
    result5.errors.push("Answer should mention 'Alex'");
  }

  if (!answerLower.includes("typescript")) {
    result5.passed = false;
    result5.errors.push("Answer should mention 'TypeScript'");
  }

  // Check if info is NOT in recent messages (proving Supermemory worked)
  const recentMessagesText = recent5.map(m => m.content).join(" ").toLowerCase();
  if (recentMessagesText.includes("alex") && recentMessagesText.includes("typescript")) {
    result5.errors.push("Warning: Info found in recent messages, may not be using Supermemory");
  }

  results.push(result5);
  console.log(`✅ Answer: "${response5.content.substring(0, 100)}..."`);

  // ============================================================
  // Phase 3: "That university" + ranking context
  // ============================================================
  console.log("\n🎯 Phase 3 – 'That university' + ranking context");
  console.log("-".repeat(70));

  // Message 6: What is Purdue University?
  console.log("\n📝 Message 6: What is Purdue University?");
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

  const result6: TestResult = {
    phase: "Phase 3",
    message: msg6,
    passed: true,
    checks: ["Short description expected"],
    errors: [],
    resolvedQuery: resolution6.resolvedQuery,
    entities: resolution6.entities,
    toolCalls: response6.raw?.toolCalls,
    answer: response6.content,
  };

  results.push(result6);

  // Message 7: What is the computer science rank for that university?
  console.log("\n📝 Message 7: What is the computer science rank for that university?");
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

  const result7: TestResult = {
    phase: "Phase 3",
    message: msg7,
    passed: true,
    checks: [
      "resolved_query should be: 'What is the computer science rank for Purdue University?'",
      "No 'I couldn't determine which university...' junk",
      "Answer should explicitly mention Purdue University",
    ],
    errors: [],
    resolvedQuery: resolution7.resolvedQuery,
    entities: resolution7.entities,
    toolCalls: response7.raw?.toolCalls,
    answer: response7.content,
  };

  // Check resolved query
  if (!resolution7.resolvedQuery.toLowerCase().includes("purdue")) {
    result7.passed = false;
    result7.errors.push(`Resolved query should mention Purdue, got: "${resolution7.resolvedQuery}"`);
  }

  // Check for confusion messages
  if (response7.content.toLowerCase().includes("couldn't determine") || 
      response7.content.toLowerCase().includes("which university")) {
    result7.passed = false;
    result7.errors.push("Answer should not show confusion about which university");
  }

  // Check for explicit mention
  if (!response7.content.toLowerCase().includes("purdue")) {
    result7.passed = false;
    result7.errors.push("Answer should explicitly mention Purdue University");
  }

  results.push(result7);
  console.log(`✅ Resolved: "${resolution7.resolvedQuery}"`);

  // ============================================================
  // Phase 4: Cross-session / reload test (Supermemory)
  // ============================================================
  console.log("\n🔄 Phase 4 – Cross-session / reload test (Supermemory)");
  console.log("-".repeat(70));
  console.log("Starting NEW session with same userId but different sessionId...");

  // Message 8: Hey, do you remember my name and what I'm studying?
  console.log("\n📝 Message 8: Hey, do you remember my name and what I'm studying?");
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

  const result8: TestResult = {
    phase: "Phase 4",
    message: msg8,
    passed: true,
    checks: [
      "History in new session should NOT include earlier 'My name is Alex...' line",
      "Model should call searchMemories",
      "Answer should be: 'Your name is Alex, and you're studying computer science at Purdue University.'",
    ],
    errors: [],
    resolvedQuery: resolution8.resolvedQuery,
    entities: resolution8.entities,
    toolCalls: response8.raw?.toolCalls,
    answer: response8.content,
  };

  // Check that new session doesn't have old messages
  const hasOldMessage = recent8.some(m => m.content.toLowerCase().includes("alex") && m.content.toLowerCase().includes("typescript"));
  if (hasOldMessage) {
    result8.errors.push("Warning: Old messages found in new session history");
  } else {
    console.log("✅ New session has clean history (no old messages)");
  }

  // Check for search tool calls
  const hasSearchMemory8 = response8.raw?.toolCalls?.some((call: any) => 
    call.toolName?.toLowerCase().includes("memory") || 
    call.toolName?.toLowerCase().includes("search")
  );

  if (!hasSearchMemory8) {
    result8.errors.push("Expected searchMemories tool call, but none detected");
    result8.passed = false;
  } else {
    console.log("✅ searchMemories tool call detected");
  }

  // Check answer content
  const answerLower8 = response8.content.toLowerCase();
  if (!answerLower8.includes("alex")) {
    result8.passed = false;
    result8.errors.push("Answer should mention 'Alex'");
  }

  if (!answerLower8.includes("computer science") || !answerLower8.includes("purdue")) {
    result8.errors.push("Answer should mention computer science at Purdue (warning only)");
  }

  results.push(result8);
  console.log(`✅ Answer: "${response8.content.substring(0, 100)}..."`);

  // ============================================================
  // Bonus: Ambiguity handling
  // ============================================================
  console.log("\n🧪 Bonus – Ambiguity handling");
  console.log("-".repeat(70));

  // Message 9: Tell me about Barack Obama and Joe Biden
  console.log("\n📝 Message 9: Tell me about Barack Obama and Joe Biden");
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

  const result9: TestResult = {
    phase: "Bonus",
    message: msg9,
    passed: true,
    checks: ["Should mention both Obama and Biden"],
    errors: [],
    resolvedQuery: resolution9.resolvedQuery,
    entities: resolution9.entities,
    toolCalls: response9.raw?.toolCalls,
    answer: response9.content,
  };

  results.push(result9);

  // Message 10: What year was he born?
  console.log("\n📝 Message 10: What year was he born?");
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

  const result10: TestResult = {
    phase: "Bonus",
    message: msg10,
    passed: true,
    checks: [
      "There are two plausible 'he's (Obama and Biden)",
      "Model should ask a clarifying question",
      "Should NOT silently guess",
    ],
    errors: [],
    resolvedQuery: resolution10.resolvedQuery,
    entities: resolution10.entities,
    toolCalls: response10.raw?.toolCalls,
    answer: response10.content,
  };

  // Check if it asks for clarification
  const answerLower10 = response10.content.toLowerCase();
  const asksClarification = 
    answerLower10.includes("which") || 
    answerLower10.includes("do you mean") || 
    answerLower10.includes("obama") && answerLower10.includes("biden");

  if (!asksClarification) {
    result10.errors.push("Expected clarifying question when multiple entities are plausible");
    result10.passed = false;
  } else {
    console.log("✅ Clarifying question detected");
  }

  // Check that it doesn't silently guess
  const silentlyGuessed = 
    (answerLower10.includes("obama") && !answerLower10.includes("biden")) ||
    (answerLower10.includes("biden") && !answerLower10.includes("obama"));

  if (silentlyGuessed && !asksClarification) {
    result10.passed = false;
    result10.errors.push("Model silently guessed instead of asking for clarification");
  }

  results.push(result10);

  // ============================================================
  // Print Results Summary
  // ============================================================
  console.log("\n" + "=" .repeat(70));
  console.log("📊 Test Results Summary");
  console.log("=" .repeat(70));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const failed = results.filter(r => !r.passed);

  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed.length}/${total}\n`);

  // Print detailed results
  results.forEach((result, idx) => {
    const icon = result.passed ? "✅" : "❌";
    console.log(`${icon} ${result.phase} - Message ${idx + 1}`);
    console.log(`   Query: "${result.message}"`);
    if (result.resolvedQuery) {
      console.log(`   Resolved: "${result.resolvedQuery}"`);
    }
    if (result.toolCalls && result.toolCalls.length > 0) {
      console.log(`   Tools: ${result.toolCalls.map((c: any) => c.toolName).join(", ")}`);
    }
    if (result.errors.length > 0) {
      result.errors.forEach(err => console.log(`   ⚠️  ${err}`));
    }
    console.log("");
  });

  // Print phase summaries
  const phase1Results = results.filter(r => r.phase === "Phase 1");
  const phase2Results = results.filter(r => r.phase === "Phase 2");
  const phase3Results = results.filter(r => r.phase === "Phase 3");
  const phase4Results = results.filter(r => r.phase === "Phase 4");
  const bonusResults = results.filter(r => r.phase === "Bonus");

  console.log("=" .repeat(70));
  console.log("Phase Summaries:");
  console.log(`  Phase 1 (Context + Pronouns): ${phase1Results.filter(r => r.passed).length}/${phase1Results.length} passed`);
  console.log(`  Phase 2 (Supermemory Store/Recall): ${phase2Results.filter(r => r.passed).length}/${phase2Results.length} passed`);
  console.log(`  Phase 3 (That X Resolution): ${phase3Results.filter(r => r.passed).length}/${phase3Results.length} passed`);
  console.log(`  Phase 4 (Cross-Session Memory): ${phase4Results.filter(r => r.passed).length}/${phase4Results.length} passed`);
  console.log(`  Bonus (Ambiguity Handling): ${bonusResults.filter(r => r.passed).length}/${bonusResults.length} passed`);
  console.log("=" .repeat(70));

  if (failed.length === 0) {
    console.log("\n🎉 ALL TESTS PASSED! Boss fight complete! 🎉\n");
  } else {
    console.log(`\n⚠️  ${failed.length} test(s) failed. Review errors above.\n`);
    process.exit(1);
  }
}

// Run the test
runTest().catch((error) => {
  console.error("❌ Test failed with error:", error);
  process.exit(1);
});

