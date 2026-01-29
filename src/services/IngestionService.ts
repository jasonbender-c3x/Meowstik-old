import type { RAGService, DocumentMetadata } from './RAGService';
import type { ConversationMessage } from '../GeminiService';
import type { AgentSchema } from '../types/agent';

/**
 * Ingestion Service for processing and indexing various content types
 */
export class IngestionService {
  private ragService: RAGService;

  constructor(ragService: RAGService) {
    this.ragService = ragService;
  }

  /**
   * Chunk text into smaller pieces for better retrieval
   * @param text - Text to chunk
   * @param chunkSize - Maximum chunk size in characters
   * @param overlap - Overlap between chunks
   * @returns string[] - Array of text chunks
   */
  private chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    // Validate inputs
    if (overlap >= chunkSize) {
      throw new Error('Overlap must be less than chunk size');
    }
    
    if (chunkSize <= 0 || overlap < 0) {
      throw new Error('Chunk size must be positive and overlap must be non-negative');
    }
    
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.substring(start, end);
      chunks.push(chunk.trim());
      start += chunkSize - overlap;
    }

    return chunks;
  }

  /**
   * Ingest a markdown file
   * @param content - Markdown content
   * @param metadata - Document metadata
   */
  async ingestMarkdown(content: string, metadata: Omit<DocumentMetadata, 'type'>): Promise<void> {
    const chunks = this.chunkText(content);
    
    for (let i = 0; i < chunks.length; i++) {
      await this.ragService.addDocument(chunks[i], {
        ...metadata,
        type: 'documentation',
        chunkIndex: i,
        totalChunks: chunks.length,
      });
    }
  }

  /**
   * Ingest conversation history
   * @param history - Conversation messages
   * @param userId - User ID
   */
  async ingestConversationHistory(
    history: ConversationMessage[],
    userId: string
  ): Promise<void> {
    // Group messages into conversation turns (user + model response)
    for (let i = 0; i < history.length; i += 2) {
      const userMsg = history[i];
      const modelMsg = history[i + 1];
      
      // Validate message roles
      if (userMsg && modelMsg && userMsg.role === 'user' && modelMsg.role === 'model') {
        const content = `User: ${userMsg.parts}\n\nAssistant: ${modelMsg.parts}`;
        
        await this.ragService.addDocument(content, {
          type: 'conversation',
          userId,
          source: 'chat_history',
          timestamp: userMsg.timestamp.toISOString(),
        });
      } else if (userMsg) {
        // Handle single user message without response
        await this.ragService.addDocument(`User: ${userMsg.parts}`, {
          type: 'conversation',
          userId,
          source: 'chat_history',
          timestamp: userMsg.timestamp.toISOString(),
        });
      }
    }
  }

  /**
   * Ingest a generated agent specification
   * @param agent - Agent specification
   * @param userId - User ID
   */
  async ingestAgent(agent: AgentSchema, userId: string): Promise<void> {
    const content = `
Agent: ${agent.name}
Description: ${agent.description}
Role: ${agent.role || 'N/A'}
Capabilities: ${agent.capabilities.join(', ')}
Tools: ${agent.tools?.map(t => t.name).join(', ') || 'None'}
Personality: ${agent.personality?.tone || 'N/A'}
    `.trim();
    
    await this.ragService.addDocument(content, {
      type: 'agent',
      userId,
      source: 'generated_agent',
      title: agent.name,
      tags: agent.capabilities,
      agentId: agent.id,
    });
  }

  /**
   * Ingest multiple agents at once
   * @param agents - Array of agent specifications
   * @param userId - User ID
   */
  async ingestAgents(agents: AgentSchema[], userId: string): Promise<void> {
    for (const agent of agents) {
      await this.ingestAgent(agent, userId);
    }
  }

  /**
   * Ingest all markdown files from a directory
   * This is a placeholder - in a real implementation, you'd read files from disk
   * @param markdownFiles - Map of filename to content
   * @param userId - User ID
   */
  async ingestMarkdownFiles(
    markdownFiles: Map<string, string>,
    userId: string
  ): Promise<void> {
    for (const [filename, content] of markdownFiles.entries()) {
      await this.ingestMarkdown(content, {
        userId,
        source: filename,
        title: filename,
      });
    }
  }

  /**
   * Ingest a user note
   * @param content - Note content
   * @param userId - User ID
   * @param title - Optional note title
   * @param tags - Optional tags
   */
  async ingestUserNote(
    content: string,
    userId: string,
    title?: string,
    tags?: string[]
  ): Promise<void> {
    await this.ragService.addDocument(content, {
      type: 'user_note',
      userId,
      source: 'user_note',
      title,
      tags,
    });
  }
}

/**
 * Create an IngestionService instance
 * @param ragService - RAGService instance
 * @returns IngestionService instance
 */
export function createIngestionService(ragService: RAGService): IngestionService {
  return new IngestionService(ragService);
}
