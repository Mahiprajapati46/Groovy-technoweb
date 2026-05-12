import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";
import { logUsage } from "./logger.js";
import { glob } from "glob";
import fs from "fs/promises";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = "gemini-flash-latest";

async function explainCodebase() {
  try {
    // 1. Get all JS files (excluding node_modules and test files)
    const files = await glob("**/*.js", { ignore: ["node_modules/**", "test_*.js"] });
    
    let context = "Here is the codebase for this project:\n\n";
    
    for (const file of files) {
      const content = await fs.readFile(file, "utf-8");
      context += `--- FILE: ${file} ---\n${content}\n\n`;
    }

    // 2. Limit to ~10K tokens (rough estimation: 1 token ~= 4 chars)
    // 40,000 characters is a safe upper bound for ~10,000 tokens
    if (context.length > 40000) {
      console.warn("⚠️ Context too large (exceeds ~10K tokens), truncating for safety.");
      context = context.substring(0, 40000);
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    console.log(`--- Analyzing codebase (${files.length} files included) ---`);
    const startTime = Date.now();
    const result = await model.generateContent([
      context,
      "Act as a senior developer. Explain the purpose of this codebase, the architecture, and how the different files interact with each other. Provide a high-level summary."
    ]);
    const latency = Date.now() - startTime;

    console.log("\n--- CODEBASE EXPLANATION ---");
    console.log(result.response.text());

    logUsage(MODEL_NAME, result.response.usageMetadata, latency);

  } catch (error) {
    console.error("Error:", error.message);
  }
}

explainCodebase();
