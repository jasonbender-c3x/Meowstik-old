import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';
import { z } from 'zod';
import { allTools } from '../src/services/GeminiTools';

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
 * Interface for conversation history messages
 */
export interface ConversationMessage {
  role: 'user' | 'model';
  parts: string;
  timestamp: Date;
}

/**
 * Generates an agent specification using Gemini 1.5 Flash with strict JSON output and conversation history
 * @param prompt - The prompt to generate the agent specification
 * @param chatSession - Optional existing chat session for conversation history
 * @returns A validated AgentSpec object and the chat session
 * @throws MeowstikGenerationError if generation fails or validation fails
 */
export async function generateAgentSpec(
  prompt: string,
  chatSession?: ChatSession
): Promise<{ agentSpec: AgentSpec; chatSession: ChatSession }> {
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
    
    // System instruction for consistent agent generation
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

Always respond with valid JSON only. Do not include markdown code blocks or any other formatting.
You have access to conversation history and should consider previous context when generating responses.`;
    
    // Get the Gemini 1.5 Flash model with function calling tools
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json', // CRITICAL: Ensures JSON output
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      systemInstruction,
      tools: allTools, // Enable function calling for search, append, create, replace
    });

    // Initialize or reuse chat session
    let session = chatSession;
    if (!session) {
      session = model.startChat({
        history: [],
      });
    }

    // Send message through chat session (maintains conversation history)
    const result = await session.sendMessage(prompt);
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
      return { agentSpec, chatSession: session };
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
