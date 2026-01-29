import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Interface defining the structure of an agent specification
 */
export interface AgentSpecification {
  name: string;
  description: string;
  capabilities: string[];
  parameters: Record<string, unknown>;
}

/**
 * Interface for conversation history messages
 */
export interface ConversationMessage {
  role: 'user' | 'model';
  parts: string;
  timestamp?: Date;
}

/**
 * Service for interacting with Google's Gemini AI API
 * Provides functionality to generate agent specifications from natural language prompts
 */
export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private chatSession: ChatSession | null = null;
  private conversationHistory: ConversationMessage[] = [];
  private systemInstruction: string;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    
    if (!key) {
      throw new Error('GEMINI_API_KEY must be provided or set as an environment variable');
    }

    this.genAI = new GoogleGenerativeAI(key);
    
    // Consistent system instruction for all interactions
    this.systemInstruction = `You are an expert AI assistant that generates agent specifications in JSON format.
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
    
    // Initialize the model with JSON response formatting
    // Using gemini-1.5-flash for faster responses, can be configured for gemini-1.5-pro
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      systemInstruction: this.systemInstruction,
    });
    
    // Initialize chat session with empty history
    this.initializeChatSession();
  }

  /**
   * Initialize or reset the chat session
   */
  private initializeChatSession(): void {
    if (!this.model) {
      throw new Error('Model is not initialized');
    }
    
    this.chatSession = this.model.startChat({
      history: [],
    });
  }

  /**
   * Generate an agent specification from a natural language prompt using chat session
   * @param prompt - The natural language description of the desired agent
   * @returns Promise<AgentSpecification> - The generated agent specification as a JSON object
   */
  async generateAgent(prompt: string): Promise<AgentSpecification> {
    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Prompt must be a non-empty string');
    }

    if (prompt.length > 10000) {
      throw new Error('Prompt exceeds maximum length of 10000 characters');
    }

    if (!this.chatSession) {
      throw new Error('Chat session is not properly initialized');
    }

    try {
      // Format the user request
      const userMessage = `User request: ${prompt}\n\nJSON response:`;

      // Send message through chat session (maintains history)
      const result = await this.chatSession.sendMessage(userMessage);
      const response = result.response;
      const text = response.text();

      // Store in conversation history
      this.conversationHistory.push({
        role: 'user',
        parts: prompt,
        timestamp: new Date(),
      });

      // Parse the JSON response
      let jsonResponse: AgentSpecification;
      try {
        // Try to extract JSON from the response (in case it's wrapped in code blocks)
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const jsonText = jsonMatch ? jsonMatch[1] : text.trim();
        
        jsonResponse = JSON.parse(jsonText) as AgentSpecification;
        
        // Store model response in conversation history
        this.conversationHistory.push({
          role: 'model',
          parts: text,
          timestamp: new Date(),
        });
      } catch {
        // Truncate error message to avoid exposing large responses
        const truncatedText = text.length > 200 ? text.substring(0, 200) + '...' : text;
        throw new Error(`Failed to parse JSON response. Response preview: ${truncatedText}`);
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
   * Get the conversation history
   * @returns Array of conversation messages
   */
  getConversationHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history and reset chat session
   */
  clearHistory(): void {
    this.conversationHistory = [];
    this.initializeChatSession();
  }

  /**
   * Get the count of messages in conversation history
   * @returns Number of messages
   */
  getHistoryLength(): number {
    return this.conversationHistory.length;
  }

}

/**
 * Create a GeminiService instance with lazy initialization
 * @param apiKey - Optional API key, defaults to GEMINI_API_KEY environment variable
 * @returns GeminiService instance
 */
export function createGeminiService(apiKey?: string): GeminiService {
  return new GeminiService(apiKey);
}

// Lazy singleton instance - only created when accessed
let _geminiServiceInstance: GeminiService | null = null;

/**
 * Get or create the singleton GeminiService instance
 * @returns GeminiService instance
 */
export function getGeminiService(): GeminiService {
  if (!_geminiServiceInstance) {
    _geminiServiceInstance = new GeminiService();
  }
  return _geminiServiceInstance;
}
