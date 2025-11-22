/**
 * Simple Supermemory Integration Test
 * 
 * This test verifies that:
 * 1. Supermemory API key is detected
 * 2. Supermemory tools can be instantiated
 * 3. The integration is properly wired
 * 
 * Note: Full end-to-end test requires OPENAI_API_KEY to be set
 */

// Load environment variables using dotenv
// Try to load .env.local first, then fall back to .env
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

dotenvConfig({ path: resolve(__dirname, ".env.local") });
dotenvConfig({ path: resolve(__dirname, ".env") });

import { isSupermemoryAvailable, getSupermemoryTools } from "./integrations/supermemory";
import { config } from "./config";

async function testSupermemorySimple() {
  console.log("🧠 Testing Supermemory Integration (Simple)\n");
  console.log("=" .repeat(50));

  // Test 1: Check if API key is configured
  console.log("📋 Test 1: Checking configuration");
  console.log("-".repeat(50));
  
  const hasKey = !!process.env.SUPERMEMORY_API_KEY;
  const configHasKey = !!config.supermemoryApiKey;
  const isAvailable = isSupermemoryAvailable();

  console.log(`Environment variable set: ${hasKey ? "✅" : "❌"}`);
  console.log(`Config has key: ${configHasKey ? "✅" : "❌"}`);
  console.log(`isSupermemoryAvailable(): ${isAvailable ? "✅" : "❌"}`);
  console.log("");

  if (!isAvailable) {
    console.error("❌ Supermemory is not available!");
    console.error("   Please set SUPERMEMORY_API_KEY in .env.local");
    process.exit(1);
  }

  // Test 2: Try to get Supermemory tools
  console.log("🔧 Test 2: Getting Supermemory tools");
  console.log("-".repeat(50));
  
  try {
    const tools = getSupermemoryTools();
    console.log("✅ Successfully created Supermemory tools instance");
    console.log(`   Tools type: ${typeof tools}`);
    console.log(`   Tools keys: ${Object.keys(tools || {}).length > 0 ? Object.keys(tools).join(", ") : "N/A"}`);
    console.log("");
  } catch (error) {
    console.error("❌ Failed to get Supermemory tools:", error);
    process.exit(1);
  }

  // Test 3: Check OpenAI provider integration
  console.log("🔗 Test 3: Checking OpenAI Provider integration");
  console.log("-".repeat(50));
  
  const { OpenAIProvider } = await import("./router/providers/OpenAIProvider");
  const provider = new OpenAIProvider();
  
  console.log("✅ OpenAIProvider loaded");
  console.log(`   Has chat method: ${typeof provider.chat === "function" ? "✅" : "❌"}`);
  console.log("");

  // Test 4: Check if OpenAI API key is set (needed for full test)
  console.log("🔑 Test 4: Checking OpenAI API key");
  console.log("-".repeat(50));
  
  const hasOpenAIKey = !!config.openaiApiKey;
  console.log(`OpenAI API key configured: ${hasOpenAIKey ? "✅" : "❌"}`);
  
  if (!hasOpenAIKey) {
    console.log("");
    console.log("⚠️  Note: OPENAI_API_KEY is not set.");
    console.log("   To run full end-to-end test, add to .env.local:");
    console.log("   OPENAI_API_KEY=sk-your-key-here");
    console.log("");
  } else {
    console.log("✅ Ready for full end-to-end test!");
    console.log("");
  }

  // Summary
  console.log("=" .repeat(50));
  console.log("📊 Integration Status Summary");
  console.log("=" .repeat(50));
  console.log(`Supermemory API Key:     ${isAvailable ? "✅ Configured" : "❌ Missing"}`);
  console.log(`Supermemory Tools:       ✅ Available`);
  console.log(`OpenAI Provider:         ✅ Loaded`);
  console.log(`OpenAI API Key:          ${hasOpenAIKey ? "✅ Configured" : "❌ Missing"}`);
  console.log("");
  
  if (isAvailable && hasOpenAIKey) {
    console.log("🎉 All systems ready! You can now run the full test:");
    console.log("   npx tsx test-supermemory.ts");
  } else if (isAvailable) {
    console.log("✅ Supermemory integration is properly configured!");
    console.log("   Add OPENAI_API_KEY to run full end-to-end tests.");
  } else {
    console.log("❌ Supermemory integration needs configuration.");
  }
  console.log("");
}

// Run the test
testSupermemorySimple().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});

