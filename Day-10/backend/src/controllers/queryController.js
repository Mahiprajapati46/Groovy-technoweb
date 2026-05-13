import { formatContextForQuery } from '../utils/pdfParser.js';
import { costTracker } from '../utils/costTracker.js';
import { getStoredPDF } from './pdfController.js';

// Lazy initialize Groq on first use
let groq = null;
async function getGroqClient() {
  if (!groq) {
    const Groq = (await import('groq-sdk')).default;
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }
  return groq;
}

export async function queryPDF(req, res) {
  try {
    const { question, contextText } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Get stored PDF
    const pdf = getStoredPDF();
    if (!pdf && !contextText) {
      return res.status(400).json({ error: 'No context provided. Please upload a PDF first.' });
    }

    // Format context (use provided contextText or fallback to PDF parsing)
    const context = contextText || formatContextForQuery(pdf.pages, question);

    // Call Groq API
    const systemPrompt = `You are a helpful assistant that answers questions about the provided document. 
When answering, always cite the page numbers where you found the information. 
Format citations as [Page X] at the end of relevant sentences.
Be concise and accurate.`;

    const userMessage = `Document context:\n\n${context}\n\nQuestion: ${question}`;

    const groqClient = await getGroqClient();
    const completion = await groqClient.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ]
    });

    // Extract response
    const answer = completion.choices[0].message.content || 'No response generated';

    // Track costs - support both Groq/OpenAI standard keys and possible variations
    const usageInfo = completion.usage || {};
    let inputTokens = usageInfo.prompt_tokens || usageInfo.input_tokens || 0;
    let outputTokens = usageInfo.completion_tokens || usageInfo.output_tokens || 0;
    
    // If usage data not available, estimate based on text length
    if (inputTokens === 0 && outputTokens === 0) {
      // Rough estimation: ~4 characters per token
      inputTokens = Math.ceil((context.length + userMessage.length) / 4);
      outputTokens = Math.ceil(answer.length / 4);
    }
    
    // Use the actual model name for cost tracking
    const modelUsed = completion.model || 'llama-3.1-8b-instant';
    const costRecord = costTracker.recordCall(inputTokens, outputTokens, modelUsed);

    res.json({
      success: true,
      question,
      answer,
      tokens: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens
      },
      cost: costRecord.totalCost || 0,
      pagesSearched: pdf ? pdf.pages.length : 0,
      documentName: pdf ? pdf.fileName : 'Direct Query'
    });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message });
  }
}

export function getCosts(req, res) {
  const summary = costTracker.getSummary();
  res.json(summary);
}

export function resetCosts(req, res) {
  costTracker.reset();
  res.json({ message: 'Costs reset', summary: costTracker.getSummary() });
}
