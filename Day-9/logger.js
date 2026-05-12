

import fs from "fs";
import path from "path";

const CSV_FILE = "usage_logs.csv";

export function logUsage(modelName, usage, latencyMs = 0, status = "success") {
  const filePath = path.join(process.cwd(), CSV_FILE);
  const exists = fs.existsSync(filePath);

  const timestamp = new Date().toISOString();
  const input = usage.promptTokenCount || 0;
  const output = usage.candidatesTokenCount || 0;
  const total = usage.totalTokenCount || 0;
  const cached = usage.cachedContentTokenCount || 0;
  const thinking = usage.thoughtsTokenCount || 0; // Capture reasoning tokens

  // Headers: Time, Model, Status, Input, Output, Thinking, Total, Cached, Latency(ms)
  const headers = "timestamp,model,status,input_tokens,output_tokens,thinking_tokens,total_tokens,cached_tokens,latency_ms\n";
  const row = `${timestamp},${modelName},${status},${input},${output},${thinking},${total},${cached},${latencyMs}\n`;

  if (!exists) {
    fs.writeFileSync(filePath, headers + row);
  } else {
    fs.appendFileSync(filePath, row);
  }

  console.log(`\n[LOG] Saved to ${CSV_FILE} (${status}, ${total} total tokens, ${thinking} thinking)`);
}
