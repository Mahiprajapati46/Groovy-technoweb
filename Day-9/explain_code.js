import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";
import { logUsage } from "./logger.js";
import { glob } from "glob";
import fs from "fs/promises";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = "gemini-2.5-flash-lite";

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
      `You are a senior software engineer.
      Analyze the following codebase and explain it clearly for a developer.
      Your explanation must include:
      
      1. High-Level Overview
      - What is the purpose of this project?  
      - What problem does it solve?

      2. Architecture  
      - How the project is structured  
      - How different files/modules interact  

      3. File-by-File Breakdown  
      - Explain the role of each file  
      - Mention key functions and responsibilities  

      4. Data Flow  
      - Step-by-step flow of execution  
      - From input → processing → output  

      5. Key Concepts Used  
      - Libraries, APIs, design patterns  
      - Any important techniques used  

      6. Strengths  
      - What is well designed in this project  

      7. Improvements  
      - What can be improved (like a senior review)

      Keep the explanation simple, structured, and beginner-friendly.
      Avoid unnecessary jargon.`
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
