/**
 * Minimal OpenAI "Ping" Test
 * 
 * Verifies that:
 * 1. OPENAI_API_KEY is loaded from environment
 * 2. Vercel AI SDK can successfully call OpenAI
 * 3. The API key is valid and accepted by OpenAI
 * 
 * Run: npx tsx src/tests/test_openai_ping.ts
 */

// Load environment variables using dotenv
// dotenv/config loads .env by default, but we also check .env.local
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";

// Try to load .env.local first, then fall back to .env
dotenvConfig({ path: resolve(__dirname, "../.env.local") });
dotenvConfig({ path: resolve(__dirname, "../.env") });

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY not set");
    console.error("   Please set it in src/.env.local or as an environment variable");
    process.exit(1);
  }

  console.log("🧪 Testing OpenAI API connection...");
  console.log(`   Key: ${process.env.OPENAI_API_KEY.substring(0, 20)}...`);

  try {
    // Use Vercel AI SDK - it automatically picks up OPENAI_API_KEY from env
    // The openai() function reads OPENAI_API_KEY from process.env automatically
    const model = openai("gpt-4o-mini");

    const result = await generateText({
      model,
      prompt: "Say 'pong' if this OpenAI test works.",
    });

    console.log("✅ OpenAI response:", result.text);

    if (result.text.toLowerCase().includes("pong")) {
      console.log("\n🎉 OpenAI ping test PASSED!");
      console.log("   The API key is valid and OpenAI is responding correctly.");
    } else {
      console.log("\n⚠️  OpenAI responded but didn't say 'pong'");
      console.log("   The connection works, but the response format may be unexpected.");
    }
  } catch (err: any) {
    console.error("❌ Error calling OpenAI:", err.message);
    if (err.message.includes("Incorrect API key")) {
      console.error("\n   The API key appears to be invalid or expired.");
      console.error("   Please check your OPENAI_API_KEY in src/.env.local");
    }
    process.exit(1);
  }
}

main();

