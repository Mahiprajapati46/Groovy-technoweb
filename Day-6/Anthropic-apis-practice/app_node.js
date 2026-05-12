import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function run() {
  try {
    const response = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 100,
      messages: [
        { role: "user", content: "Hello from Node.js" }
      ],
    });

    console.log(response.content[0].text);
  } catch (error) {
    console.log("Error:", error.message);
  }
}

run();