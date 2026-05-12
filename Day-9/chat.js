import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";
import { logUsage } from "./logger.js";
import readline from "readline";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = "gemini-flash-latest"; // Updated to working model with quota

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function chat() {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const chatSession = model.startChat({
    history: [],
  });

  console.log("\n--- Gemini Interactive Chat (Logs to CSV) ---");
  console.log("Type your message to talk to the AI, or 'exit' to quit.\n");

  const ask = () => {
    rl.question("You: ", async (userInput) => {
      if (userInput.toLowerCase() === 'exit') {
        rl.close();
        return;
      }

      try {
        const startTime = Date.now();
        const result = await chatSession.sendMessage(userInput);
        const latency = Date.now() - startTime;
        
        const responseText = result.response.text();
        console.log(`\nGemini: ${responseText}\n`);

        // LOGGING EVERY CALL
        logUsage(MODEL_NAME, result.response.usageMetadata, latency);

      } catch (error) {
        console.error("Error:", error.message);
        logUsage(MODEL_NAME, { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 }, 0, "error");
      }

      ask(); // Recursive call for next message
    });
  };

  ask();
}

chat();
