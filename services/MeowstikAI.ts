import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

/**
 * Custom error class for Meowstik generation errors
 */
export class MeowstikGenerationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'MeowstikGenerationError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MeowstikGenerationError);
    }
  }
}

/**
 * Zod schema for Agent specification
 */
export const AgentSchema = z.object({
  name: z.string(),
  description: z.string(),
  capabilities: z.array(z.string()),
  parameters: z.record(z.string(), z.any()).optional(),
});

export type AgentSpec = z.infer<typeof AgentSchema>;

/**
 * Generates an agent specification using Gemini 1.5 Flash with strict JSON output
 * @param prompt - The prompt to generate the agent specification
 * @returns A validated AgentSpec object
 * @throws MeowstikGenerationError if generation fails or validation fails
 */
export async function generateAgentSpec(prompt: string): Promise<AgentSpec> {
  // Get API key from environment variable
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new MeowstikGenerationError(
      'GEMINI_API_KEY environment variable is not set'
    );
  }

  try {
    // Initialize the Google Generative AI client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the Gemini 1.5 Flash model
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json', // CRITICAL: Ensures JSON output
      },
    });

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON response
    let jsonData: unknown;
    try {
      jsonData = JSON.parse(text);
    } catch (parseError) {
      throw new MeowstikGenerationError(
        `Failed to parse JSON response: ${text}`,
        parseError
      );
    }

    // Validate against the schema
    try {
      const agentSpec = AgentSchema.parse(jsonData);
      return agentSpec;
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        throw new MeowstikGenerationError(
          `Schema validation failed: ${validationError.message}`,
          validationError
        );
      }
      throw new MeowstikGenerationError(
        'Unexpected validation error',
        validationError
      );
    }
  } catch (error) {
    // If it's already a MeowstikGenerationError, re-throw it
    if (error instanceof MeowstikGenerationError) {
      throw error;
    }
    // Wrap other errors in MeowstikGenerationError
    throw new MeowstikGenerationError(
      `Failed to generate agent specification: ${error instanceof Error ? error.message : String(error)}`,
      error
    );
  }
}
