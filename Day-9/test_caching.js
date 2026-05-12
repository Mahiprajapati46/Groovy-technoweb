import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";
import { logUsage } from "./logger.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = "gemini-flash-latest"; // Verified stable model for v1beta caching

async function proveCaching() {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // 1. Create a massive context (~40,000+ tokens to ensure caching kicks in)
    // Google usually caches contexts above 32,768 tokens.
    const baseText = "The quick brown fox jumps over the lazy dog. ".repeat(4000);

    const secretKey = "SECRETCODE: EMERALD-DRAGON-2026";
    const largeContext = baseText + secretKey;

    console.log("--- STEP 1: WARMING UP THE CACHE ---");
    console.log("Sending ~35,000 tokens to the AI...");

    const startTime1 = Date.now();
    const result1 = await model.generateContent([
      largeContext,
      "Summarize the general theme of this text in 5 words."
    ]);
    const latency1 = Date.now() - startTime1;

    console.log("Response 1:", result1.response.text());
    logUsage(MODEL_NAME, result1.response.usageMetadata, latency1);

    console.log("\n--- STEP 2: THE PROOF (CACHE HIT) ---");
    console.log("Asking for the secret hidden at the end...");

    const startTime2 = Date.now();
    const result2 = await model.generateContent([
      largeContext,
      "What is the SECRETCODE mentioned at the very end of the text?"
    ]);
    const latency2 = Date.now() - startTime2;

    const usage2 = result2.response.usageMetadata;
    console.log("Response 2:", result2.response.text());
    console.log(`Latency: ${latency2}ms (Compare to ${latency1}ms)`);
    console.log(`Cached Tokens: ${usage2.cachedContentTokenCount || 0}`);

    logUsage(MODEL_NAME, usage2, latency2);

    console.log("\n--- CONCLUSION ---");
    if (usage2.cachedContentTokenCount > 0) {
      console.log("✅ PROOF: The second request used CACHED tokens!");
      console.log(`You saved ${usage2.cachedContentTokenCount} input tokens.`);
    } else {
      console.log("❌ The context might be too small or the model didn't cache it yet. Try increasing the repeat count.");
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
}

proveCaching();
