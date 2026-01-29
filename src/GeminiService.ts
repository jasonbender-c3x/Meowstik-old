import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Service for interacting with Google's Gemini AI API
 * Provides functionality to generate agent specifications from natural language prompts
 */
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Initialize the model with JSON response formatting
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });
  }

  /**
   * Generate an agent specification from a natural language prompt
   * @param prompt - The natural language description of the desired agent
   * @returns Promise<object> - The generated agent specification as a JSON object
   */
  async generateAgent(prompt: string): Promise<object> {
    try {
      // System instruction to enforce JSON output
      const systemInstruction = `You are an expert AI assistant that generates agent specifications in JSON format.
Given a natural language description, you must respond with ONLY valid JSON, no additional text or explanations.

The JSON should follow this structure:
{
  "name": "string - the name of the agent",
  "description": "string - a brief description of what the agent does",
  "capabilities": ["array of strings - list of agent capabilities"],
  "parameters": {
    "key": "value - any configuration parameters"
  }
}

Always respond with valid JSON only. Do not include markdown code blocks or any other formatting.`;

      // Combine system instruction with user prompt
      const fullPrompt = `${systemInstruction}\n\nUser request: ${prompt}\n\nJSON response:`;

      // Generate content
      const result = await this.model.generateContent(fullPrompt);
      const response = result.response;
      const text = response.text();

      // Parse the JSON response
      let jsonResponse: object;
      try {
        // Try to extract JSON from the response (in case it's wrapped in code blocks)
        const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        const jsonText = jsonMatch ? jsonMatch[1] : text.trim();
        
        jsonResponse = JSON.parse(jsonText);
      } catch (parseError) {
        throw new Error(`Failed to parse JSON response: ${text}`);
      }

      return jsonResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate agent: ${error.message}`);
      }
      throw new Error('Failed to generate agent: Unknown error');
    }
  }

  /**
   * Get the underlying Gemini AI client
   * @returns GoogleGenerativeAI - The initialized Gemini AI client
   */
  getClient(): GoogleGenerativeAI {
    return this.genAI;
  }
}

// Export a singleton instance for convenience
export const geminiService = new GeminiService();
