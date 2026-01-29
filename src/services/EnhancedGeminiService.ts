import { GeminiService, AgentSpecification } from '../GeminiService';
import type { RAGService, SearchResult } from './RAGService';
import type { StorageService } from './StorageService';
import type { IngestionService } from './IngestionService';

/**
 * Enhanced Gemini Service with RAG capabilities
 * Extends the base GeminiService to include context retrieval and injection
 */
export class EnhancedGeminiService extends GeminiService {
  private ragService: RAGService | null = null;
  private storageService: StorageService | null = null;
  private ingestionService: IngestionService | null = null;
  private ragEnabled: boolean = true;
  private userId: string = 'default_user';

  /**
   * Enable RAG functionality
   * @param ragService - RAG service instance
   * @param storageService - Storage service instance
   * @param ingestionService - Ingestion service instance
   */
  enableRAG(
    ragService: RAGService,
    storageService: StorageService,
    ingestionService: IngestionService
  ): void {
    this.ragService = ragService;
    this.storageService = storageService;
    this.ingestionService = ingestionService;
    this.userId = storageService.getUserId();
    
    // Load and ingest existing data
    this.loadAndIngestPersistedData();
  }

  /**
   * Disable RAG functionality
   */
  disableRAG(): void {
    this.ragEnabled = false;
  }

  /**
   * Check if RAG is enabled and available
   */
  isRAGAvailable(): boolean {
    return this.ragEnabled && this.ragService !== null;
  }

  /**
   * Load persisted data and ingest into RAG
   */
  private async loadAndIngestPersistedData(): Promise<void> {
    if (!this.ragService || !this.storageService || !this.ingestionService) {
      return;
    }

    try {
      // Load existing documents
      const documents = this.storageService.loadDocuments();
      
      // Restore documents to RAG service
      for (const doc of documents) {
        if (doc.embedding) {
          // Document already has embedding, add it directly
          await this.ragService.addDocument(doc.content, doc.metadata);
        }
      }

      // Load and ingest conversation history
      const history = this.storageService.loadConversationHistory();
      if (history.length > 0) {
        await this.ingestionService.ingestConversationHistory(history, this.userId);
      }

      // Load and ingest generated agents
      const agents = this.storageService.loadGeneratedAgents();
      if (agents.length > 0) {
        await this.ingestionService.ingestAgents(agents, this.userId);
      }

      console.log(`RAG initialized with ${documents.length} documents, ${history.length} conversation messages, and ${agents.length} agents`);
    } catch (error) {
      console.error('Failed to load and ingest persisted data:', error);
    }
  }

  /**
   * Retrieve relevant context for a query
   * @param query - User query
   * @param topK - Number of results to retrieve
   * @returns Promise<SearchResult[]> - Retrieved context
   */
  async retrieveContext(query: string, topK: number = 5): Promise<SearchResult[]> {
    if (!this.isRAGAvailable() || !this.ragService) {
      return [];
    }

    try {
      return await this.ragService.retrieveRelevantDocuments(query, topK, {
        userId: this.userId,
      });
    } catch (error) {
      console.error('Failed to retrieve context:', error);
      return [];
    }
  }

  /**
   * Generate agent with RAG-enhanced context
   * @param prompt - User prompt
   * @param useRAG - Whether to use RAG for context
   * @returns Promise<AgentSpecification> - Generated agent
   */
  async generateAgentWithRAG(
    prompt: string,
    useRAG: boolean = true
  ): Promise<AgentSpecification> {
    let enhancedPrompt = prompt;

    // Retrieve and inject context if RAG is enabled
    if (useRAG && this.isRAGAvailable()) {
      const context = await this.retrieveContext(prompt, 5);

      if (context.length > 0) {
        const contextText = context
          .map((result, idx) => {
            const doc = result.document;
            return `
Context ${idx + 1} (Relevance: ${(result.similarity * 100).toFixed(1)}%):
${doc.content.substring(0, 500)}...
            `.trim();
          })
          .join('\n\n');

        enhancedPrompt = `
Based on the following relevant context from previous conversations and documentation:

${contextText}

---

User request: ${prompt}

Please generate an agent specification considering the above context.
        `.trim();
      }
    }

    // Generate agent using base service
    const agent = await this.generateAgent(enhancedPrompt);

    // Persist agent if storage is available
    if (this.storageService && this.ingestionService) {
      try {
        // Save to storage
        const agents = this.storageService.loadGeneratedAgents();
        agents.push(agent as any);
        this.storageService.saveGeneratedAgents(agents);

        // Ingest into RAG
        await this.ingestionService.ingestAgent(agent as any, this.userId);
      } catch (error) {
        console.error('Failed to persist agent:', error);
      }
    }

    return agent;
  }

  /**
   * Override clearHistory to also persist to storage
   */
  override clearHistory(): void {
    super.clearHistory();

    if (this.storageService) {
      this.storageService.saveConversationHistory([]);
    }
  }

  /**
   * Save current conversation history to storage and ingest into RAG
   */
  async saveConversation(): Promise<void> {
    const history = this.getConversationHistory();

    if (this.storageService) {
      this.storageService.saveConversationHistory(history);
    }

    if (this.ingestionService) {
      await this.ingestionService.ingestConversationHistory(history, this.userId);
    }
  }

  /**
   * Get RAG statistics
   * @returns object - Statistics about RAG system
   */
  getRAGStats(): {
    enabled: boolean;
    documentCount: number;
    conversationCount: number;
    agentCount: number;
  } {
    if (!this.isRAGAvailable() || !this.ragService || !this.storageService) {
      return {
        enabled: false,
        documentCount: 0,
        conversationCount: 0,
        agentCount: 0,
      };
    }

    const documents = this.ragService.getDocuments({ userId: this.userId });
    const conversationDocs = documents.filter(d => d.metadata.type === 'conversation');
    const agentDocs = documents.filter(d => d.metadata.type === 'agent');

    return {
      enabled: true,
      documentCount: documents.length,
      conversationCount: conversationDocs.length,
      agentCount: agentDocs.length,
    };
  }

  /**
   * Search for similar agents
   * @param query - Search query
   * @param topK - Number of results
   * @returns Promise<SearchResult[]> - Similar agents
   */
  async searchAgents(query: string, topK: number = 5): Promise<SearchResult[]> {
    if (!this.isRAGAvailable() || !this.ragService) {
      return [];
    }

    return await this.ragService.retrieveRelevantDocuments(query, topK, {
      type: 'agent',
      userId: this.userId,
    });
  }

  /**
   * Search conversation history
   * @param query - Search query
   * @param topK - Number of results
   * @returns Promise<SearchResult[]> - Relevant conversations
   */
  async searchConversations(query: string, topK: number = 5): Promise<SearchResult[]> {
    if (!this.isRAGAvailable() || !this.ragService) {
      return [];
    }

    return await this.ragService.retrieveRelevantDocuments(query, topK, {
      type: 'conversation',
      userId: this.userId,
    });
  }
}

/**
 * Create an EnhancedGeminiService instance
 * @param apiKey - Google AI API key
 * @returns EnhancedGeminiService instance
 */
export function createEnhancedGeminiService(apiKey: string): EnhancedGeminiService {
  return new EnhancedGeminiService(apiKey);
}
