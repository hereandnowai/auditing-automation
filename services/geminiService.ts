
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { FlaggedTransaction } from '../types';
import { GEMINI_MODEL_TEXT } from '../constants';

export const generateGeminiInsights = async (flaggedTransactions: FlaggedTransaction[]): Promise<string> => {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("Critical: Gemini API key (process.env.API_KEY) is not set. AI features will fail.");
    throw new Error("Gemini API Key is not available. Cannot fetch AI insights. Please ensure the API_KEY environment variable is set.");
  }
  
  const ai = new GoogleGenAI({ apiKey: apiKey });

  if (flaggedTransactions.length === 0) {
    return "No transactions were flagged for audit, so no AI insights to generate.";
  }

  const transactionSummaries = flaggedTransactions.map(t => 
    `- ID: ${t.transaction_id}, Date: ${t.date}, Amount: $${t.amount.toLocaleString()}, Category: ${t.category}, Vendor: ${t.vendor}, Reasons: ${t.riskReasons.join(', ')}`
  ).join('\n');

  const prompt = `
You are an expert audit assistant. Analyze the following financial transactions that have been flagged for potential audit.
Provide a concise summary of the overall risk profile indicated by these flagged transactions.
Then, for each transaction, briefly highlight the most critical risk factors.
Keep your analysis clear, actionable, and suitable for an auditor's review.

Flagged Transactions:
${transactionSummaries}

Overall Summary and Key Concerns:
[Your summary here]

Detailed Breakdown (Highlight critical risks per transaction):
[Your breakdown here, focusing on the most severe/unusual flags for each]
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: prompt,
        config: {
            temperature: 0.3, // Lower temperature for more factual, less creative output
            topP: 0.9,
            topK: 40,
        }
    });
    
    const textOutput = response.text;
    if (!textOutput) { // Check if textOutput itself is empty or undefined
        console.warn("Gemini API returned an empty text response.");
        throw new Error("Received an empty or invalid response from Gemini API.");
    }
    return textOutput;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid") || error.message.includes("API_KEY_INVALID")) {
             throw new Error("Gemini API key is not valid. Please check your configuration and ensure the API_KEY environment variable is correct.");
        }
         throw new Error(`Gemini API request failed: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with Gemini API.");
  }
};
