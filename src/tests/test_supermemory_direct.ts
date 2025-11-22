// Load environment variables
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, "../.env.local") });
dotenvConfig({ path: resolve(__dirname, "../.env") });

import { supermemoryTools } from "@supermemory/tools/ai-sdk";
import { SUPERMEMORY_API_KEY } from "../config";

async function runDirectSupermemoryTest() {
  console.log("🧪 Direct Supermemory Test\n");
  console.log("=".repeat(70));

  if (!SUPERMEMORY_API_KEY) {
    console.error("❌ SUPERMEMORY_API_KEY not set. Cannot run direct Supermemory test.");
    process.exit(1);
  }

  const userId = "test-user-1";
  const testMemory = "User's name is Alex, studies computer science at Purdue, and prefers TypeScript.";

  // Initialize Supermemory tools with the userId
  const tools = supermemoryTools(SUPERMEMORY_API_KEY, {
    containerTags: [userId],
  });

  if (!tools || !tools.addMemory || !tools.searchMemories) {
    console.error("❌ Supermemory tools not initialized correctly.");
    console.error("   Tools object:", tools);
    process.exit(1);
  }

  console.log("\n1️⃣  Testing addMemory...");
  try {
    // The tools returned by supermemoryTools are AI SDK tool objects
    // They have an `execute` method that takes the parameters
    const addResult = await tools.addMemory.execute({ memory: testMemory });
    console.log("   Store response: ", JSON.stringify(addResult, null, 2));
    if (addResult && (addResult as any).success) {
      console.log("   ✅ addMemory succeeded");
      console.log("   Memory ID:", (addResult as any).memory?.id);
    } else {
      console.error("   ❌ addMemory failed:", (addResult as any).error);
    }
  } catch (error: any) {
    console.error("   ❌ Error calling addMemory:", error.message);
    console.error("   Full error:", error);
  }

  console.log("\n   ⏳ Waiting 10 seconds for memory indexing...");
  await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for indexing

  console.log("\n2️⃣  Testing searchMemories...");
  try {
    const searchResult = await tools.searchMemories.execute({ 
      informationToGet: "user name and preferences",
      includeFullDocs: true,
      limit: 10
    });
    console.log("   Search response: ", JSON.stringify(searchResult, null, 2));
    if (searchResult && (searchResult as any).success) {
      console.log("   ✅ searchMemories succeeded");
      console.log(`   Found ${(searchResult as any).count} memories`);
    } else {
      console.error("   ❌ searchMemories failed:", (searchResult as any).error);
    }

    console.log("\n3️⃣  Verifying memory content in response:");
    const responseContent = JSON.stringify((searchResult as any).results || "").toLowerCase();
    const containsAlex = responseContent.includes("alex");
    const containsTypeScript = responseContent.includes("typescript");
    const containsPurdue = responseContent.includes("purdue") || responseContent.includes("computer science");

    console.log(`   Contains "Alex": ${containsAlex ? "✅" : "❌"}`);
    console.log(`   Contains "TypeScript": ${containsTypeScript ? "✅" : "❌"}`);
    console.log(`   Contains "Purdue": ${containsPurdue ? "✅" : "❌"}`);

    if (containsAlex && containsTypeScript && containsPurdue) {
      console.log("\n🎉 Direct Supermemory test PASSED!");
    } else {
      console.error("\n❌ Direct Supermemory test FAILED!");
      console.error("   Memory was retrieved but content not found in response.");
      console.error("   Full response:", JSON.stringify((searchResult as any).results, null, 2));
      process.exit(1);
    }

  } catch (error: any) {
    console.error("   ❌ Error calling searchMemories:", error.message);
    console.error("   Full error:", error);
    process.exit(1);
  }

  console.log("=".repeat(70) + "\n");
}

runDirectSupermemoryTest().catch((error) => {
  console.error("❌ Direct Supermemory test suite failed with error:", error);
  process.exit(1);
});
