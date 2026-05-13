// Track API costs for Groq API calls
class CostTracker {
  constructor() {
    this.calls = [];
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
  }

  // Add a call record
  recordCall(inputTokens, outputTokens, model = 'mixtral-8x7b-32768') {
    const call = {
      timestamp: new Date().toISOString(),
      inputTokens,
      outputTokens,
      model,
      // Groq API pricing (approximate - check current pricing)
      // Free tier: first 90k input tokens free, 7.2k output tokens free
      inputCost: (inputTokens / 1000000) * 0.05, // $0.05 per M tokens (may be free tier)
      outputCost: (outputTokens / 1000000) * 0.15, // $0.15 per M tokens (may be free tier)
    };
    
    call.totalCost = call.inputCost + call.outputCost;
    this.calls.push(call);
    
    this.totalInputTokens += inputTokens;
    this.totalOutputTokens += outputTokens;

    return call;
  }

  // Get summary
  getSummary() {
    const totalCost = this.calls.reduce((sum, call) => sum + call.totalCost, 0);
    
    return {
      totalCalls: this.calls.length,
      totalInputTokens: this.totalInputTokens,
      totalOutputTokens: this.totalOutputTokens,
      totalTokens: this.totalInputTokens + this.totalOutputTokens,
      estimatedCost: totalCost,
      currency: 'USD',
      calls: this.calls
    };
  }

  // Reset tracker
  reset() {
    this.calls = [];
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
  }
}

// Global instance
export const costTracker = new CostTracker();
