import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";
import { logUsage } from "./logger.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = "gemini-flash-latest";

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // 1. Simulating a Large Context (e.g., Codebase or Document)
    const largeContext = "This is a massive codebase context. ".repeat(1000);

    console.log("--- Request 1: Normal Processing ---");
    const startTime1 = Date.now();
    const result1 = await model.generateContent([
      largeContext,
      "Summarize the context above in one sentence."
    ]);
    const latency1 = Date.now() - startTime1;

    const usage1 = result1.response.usageMetadata;
    console.log("Response 1:", result1.response.text());
    console.log("Usage 1:", usage1);
    logUsage(MODEL_NAME, usage1, latency1);

    console.log("\n--- Request 2: Measuring Savings Concept ---");
    const startTime2 = Date.now();
    const result2 = await model.generateContent([
      largeContext,
      "What is the main topic of the context?"
    ]);
    const latency2 = Date.now() - startTime2;

    const usage2 = result2.response.usageMetadata;
    console.log("Response 2:", result2.response.text());
    console.log("Usage 2:", usage2);
    logUsage(MODEL_NAME, usage2, latency2);

    // Concept of Savings:
    // If we had used Caching (GoogleContextCachingManager), 
    // the 'promptTokenCount' in usage2 would be replaced by 'cachedContentTokenCount'.

    console.log("\n--- MEASURING SAVINGS ---");
    const totalInputTokens = usage1.promptTokenCount + usage2.promptTokenCount;
    console.log(`Total Input Tokens without caching: ${totalInputTokens}`);
    console.log(`With caching, you would pay full price for the first call, and ~10% for the second.`);

  } catch (error) {
    console.error("Error:", error.message);
  }
}

run();
