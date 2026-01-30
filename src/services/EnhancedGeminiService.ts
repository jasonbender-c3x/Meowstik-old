import { GeminiService, AgentSpecification } from '../GeminiService';
import type { RAGService, SearchResult, Document } from './RAGService';
import type { StorageService } from './StorageService';
import type { IngestionService } from './IngestionService';
import type { RetrievalOrchestrator, OrchestratedResult } from './RetrievalOrchestrator';

/**
 * Enhanced Gemini Service with RAG capabilities
 * Extends the base GeminiService to include context retrieval and injection
 */
export class EnhancedGeminiService extends GeminiService {
  private ragService: RAGService | null = null;
  private storageService: StorageService | null = null;
  private ingestionService: IngestionService | null = null;
  private retrievalOrchestrator: RetrievalOrchestrator | null = null;
  private ragEnabled: boolean = true;
  private userId: string = 'default_user';
  private lastRetrievedContext: SearchResult[] = [];

  /**
   * Enable RAG functionality
   * @param ragService - RAG service instance
   * @param storageService - Storage service instance
   * @param ingestionService - Ingestion service instance
   * @param retrievalOrchestrator - Optional retrieval orchestrator instance
   */
  async enableRAG(
    ragService: RAGService,
    storageService: StorageService,
    ingestionService: IngestionService,
    retrievalOrchestrator?: RetrievalOrchestrator
  ): Promise<void> {
    this.ragService = ragService;
    this.storageService = storageService;
    this.ingestionService = ingestionService;
    this.retrievalOrchestrator = retrievalOrchestrator || null;
    this.userId = storageService.getUserId();
    
    // Load and ingest existing data (await to ensure completion)
    await this.loadAndIngestPersistedData();
  }

  /**
   * Set the retrieval orchestrator
   * @param orchestrator - Retrieval orchestrator instance
   */
  setRetrievalOrchestrator(orchestrator: RetrievalOrchestrator): void {
    this.retrievalOrchestrator = orchestrator;
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
      
      // Restore documents to RAG service (no embedding regeneration)
      for (const doc of documents) {
        this.ragService.restoreDocument(doc);
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
   * Uses RetrievalOrchestrator if available, otherwise falls back to basic RAG
   * @param query - User query
   * @param topK - Number of results to retrieve
   * @returns Promise<SearchResult[] | OrchestratedResult> - Retrieved context
   */
  async retrieveContext(query: string, topK: number = 5): Promise<SearchResult[] | OrchestratedResult> {
    if (!this.isRAGAvailable() || !this.ragService) {
      return [];
    }

    try {
      // Use orchestrator if available for enhanced retrieval
      if (this.retrievalOrchestrator) {
        const result = await this.retrievalOrchestrator.retrieve(query);
        
        // Log security warnings
        if (!result.securityCheck.isSafe) {
          console.warn('Security check failed:', result.securityCheck.threats);
        }
        
        // Log entity recognition
        if (result.entities.length > 0) {
          console.log('Detected entities:', result.entities.map(e => `${e.type}:${e.text}`).join(', '));
        }
        
        return result;
      }
      
      // Fallback to basic RAG
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
      this.lastRetrievedContext = context; // Store for debug purposes

      // Handle orchestrated results
      if (context && typeof context === 'object' && 'documents' in context) {
        const orchestratedResult = context as OrchestratedResult;
        
        if (orchestratedResult.documents.length > 0) {
          const contextText = orchestratedResult.documents
            .map((result, idx) => {
              const doc = result.document;
              return `
Context ${idx + 1} (Relevance: ${(result.similarity * 100).toFixed(1)}%):
${doc.content.substring(0, 500)}...
              `.trim();
            })
            .join('\n\n');

          // Add entity information if available
          const entityInfo = orchestratedResult.entities.length > 0
            ? `\n\nDetected Entities: ${orchestratedResult.entities.map(e => e.text).join(', ')}`
            : '';

          enhancedPrompt = `
Based on the following relevant context from previous conversations and documentation:

${contextText}${entityInfo}

---

User request: ${prompt}

Please generate an agent specification considering the above context.
          `.trim();
        }
      } else if (Array.isArray(context) && context.length > 0) {
        // Handle simple SearchResult array
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
    } else {
      this.lastRetrievedContext = []; // Clear if not using RAG
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

  /**
   * Get the last retrieved context from RAG
   * @returns Last retrieved context (for debug purposes)
   */
  getLastRetrievedContext(): SearchResult[] {
    return this.lastRetrievedContext;
  }

  /**
   * Get all documents from RAG (for debug purposes)
   * @returns All documents in RAG system
   */
  getAllRAGDocuments(): Document[] {
    if (!this.ragService) {
      return [];
    }
    return this.ragService.getDocuments();
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
