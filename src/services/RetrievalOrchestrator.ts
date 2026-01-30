import type { RAGService, SearchResult, Document } from './RAGService';
import type { HybridSearchService } from './HybridSearchService';
import type { EntityRecognitionService, Entity } from './EntityRecognitionService';
import type { PromptInjectionService, PromptInjectionResult } from './PromptInjectionService';

/**
 * Configuration for recall streams
 */
export interface RecallStreamConfig {
  enabled: boolean;
  weight: number; // Weight for combining results (0-1)
  topK: number;   // Number of results to fetch
}

/**
 * Configuration for retrieval orchestrator
 */
export interface RetrievalOrchestratorConfig {
  // Recall streams
  localRAG: RecallStreamConfig;
  vertexAI: RecallStreamConfig;
  notebookLM: RecallStreamConfig;
  
  // Hybrid search
  useHybridSearch: boolean;
  vectorWeight: number; // Alpha parameter for hybrid search (0-1)
  
  // Context management
  maxContextLength: number;
  contextWindowStrategy: 'relevance' | 'recency' | 'diversity' | 'balanced';
  
  // Security
  enablePromptInjectionDetection: boolean;
  
  // Entity recognition
  useEntityRecognition: boolean;
}

/**
 * Recall stream result
 */
interface RecallStreamResult {
  source: 'localRAG' | 'vertexAI' | 'notebookLM';
  results: SearchResult[];
  latency: number;
  error?: string;
}

/**
 * Orchestrated retrieval result
 */
export interface OrchestratedResult {
  documents: SearchResult[];
  entities: Entity[];
  securityCheck: PromptInjectionResult;
  metadata: {
    totalResults: number;
    streamResults: RecallStreamResult[];
    contextLength: number;
    processingTime: number;
  };
}

/**
 * Vertex AI Search integration interface
 */
export interface VertexAISearchClient {
  search(query: string, topK: number): Promise<SearchResult[]>;
}

/**
 * NotebookLM integration interface
 */
export interface NotebookLMClient {
  search(query: string, topK: number): Promise<SearchResult[]>;
}

/**
 * Retrieval Orchestrator Service
 * Manages multiple recall streams, hybrid search, entity recognition, and context management
 */
export class RetrievalOrchestrator {
  private ragService: RAGService;
  private hybridSearchService: HybridSearchService;
  private entityRecognitionService: EntityRecognitionService;
  private promptInjectionService: PromptInjectionService;
  private vertexAIClient?: VertexAISearchClient;
  private notebookLMClient?: NotebookLMClient;
  private config: RetrievalOrchestratorConfig;

  constructor(
    ragService: RAGService,
    hybridSearchService: HybridSearchService,
    entityRecognitionService: EntityRecognitionService,
    promptInjectionService: PromptInjectionService,
    config?: Partial<RetrievalOrchestratorConfig>
  ) {
    this.ragService = ragService;
    this.hybridSearchService = hybridSearchService;
    this.entityRecognitionService = entityRecognitionService;
    this.promptInjectionService = promptInjectionService;
    
    // Default configuration
    this.config = {
      localRAG: { enabled: true, weight: 1.0, topK: 10 },
      vertexAI: { enabled: false, weight: 0.8, topK: 10 },
      notebookLM: { enabled: false, weight: 0.7, topK: 10 },
      useHybridSearch: true,
      vectorWeight: 0.7,
      maxContextLength: 8000,
      contextWindowStrategy: 'balanced',
      enablePromptInjectionDetection: true,
      useEntityRecognition: true,
      ...config,
    };
  }

  /**
   * Set Vertex AI Search client
   * @param client - Vertex AI Search client
   */
  setVertexAIClient(client: VertexAISearchClient): void {
    this.vertexAIClient = client;
  }

  /**
   * Set NotebookLM client
   * @param client - NotebookLM client
   */
  setNotebookLMClient(client: NotebookLMClient): void {
    this.notebookLMClient = client;
  }

  /**
   * Update configuration
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<RetrievalOrchestratorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Retrieve from local RAG
   * @param query - Search query
   * @param topK - Number of results
   * @returns Recall stream result
   */
  private async retrieveFromLocalRAG(query: string, topK: number): Promise<RecallStreamResult> {
    const startTime = Date.now();
    
    try {
      let results: SearchResult[];
      
      if (this.config.useHybridSearch) {
        // Use hybrid search
        const vectorResults = await this.ragService.retrieveRelevantDocuments(query, topK * 2);
        
        // Update hybrid search with current documents
        const documents = this.ragService.getDocuments();
        this.hybridSearchService.setDocuments(documents);
        
        // Perform hybrid search
        results = this.hybridSearchService.hybridSearch(
          vectorResults,
          query,
          topK,
          this.config.vectorWeight
        );
      } else {
        // Use vector search only
        results = await this.ragService.retrieveRelevantDocuments(query, topK);
      }

      return {
        source: 'localRAG',
        results,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        source: 'localRAG',
        results: [],
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Retrieve from Vertex AI Search
   * @param query - Search query
   * @param topK - Number of results
   * @returns Recall stream result
   */
  private async retrieveFromVertexAI(query: string, topK: number): Promise<RecallStreamResult> {
    const startTime = Date.now();
    
    if (!this.vertexAIClient) {
      return {
        source: 'vertexAI',
        results: [],
        latency: Date.now() - startTime,
        error: 'Vertex AI client not configured',
      };
    }

    try {
      const results = await this.vertexAIClient.search(query, topK);
      return {
        source: 'vertexAI',
        results,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        source: 'vertexAI',
        results: [],
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Retrieve from NotebookLM
   * @param query - Search query
   * @param topK - Number of results
   * @returns Recall stream result
   */
  private async retrieveFromNotebookLM(query: string, topK: number): Promise<RecallStreamResult> {
    const startTime = Date.now();
    
    if (!this.notebookLMClient) {
      return {
        source: 'notebookLM',
        results: [],
        latency: Date.now() - startTime,
        error: 'NotebookLM client not configured',
      };
    }

    try {
      const results = await this.notebookLMClient.search(query, topK);
      return {
        source: 'notebookLM',
        results,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        source: 'notebookLM',
        results: [],
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Combine results from multiple recall streams
   * @param streamResults - Results from all streams
   * @returns Combined and ranked results
   */
  private combineStreamResults(streamResults: RecallStreamResult[]): SearchResult[] {
    const scoreMap = new Map<string, { document: Document; totalScore: number; count: number }>();

    for (const streamResult of streamResults) {
      if (streamResult.error) continue;

      const streamConfig = this.getStreamConfig(streamResult.source);
      if (!streamConfig.enabled) continue;

      for (const result of streamResult.results) {
        const docId = result.document.id;
        const weightedScore = result.similarity * streamConfig.weight;

        const existing = scoreMap.get(docId);
        if (existing) {
          existing.totalScore += weightedScore;
          existing.count += 1;
        } else {
          scoreMap.set(docId, {
            document: result.document,
            totalScore: weightedScore,
            count: 1,
          });
        }
      }
    }

    // Calculate average scores and create results
    const combinedResults: SearchResult[] = Array.from(scoreMap.values()).map(entry => ({
      document: entry.document,
      similarity: entry.totalScore / entry.count, // Average weighted score
    }));

    // Sort by score
    return combinedResults.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Get stream configuration by source
   * @param source - Stream source
   * @returns Stream configuration
   */
  private getStreamConfig(source: 'localRAG' | 'vertexAI' | 'notebookLM'): RecallStreamConfig {
    return this.config[source];
  }

  /**
   * Apply context window management strategy
   * @param results - Search results
   * @returns Filtered results based on strategy
   */
  private applyContextWindowStrategy(results: SearchResult[]): SearchResult[] {
    const maxResults = Math.floor(this.config.maxContextLength / 500); // Assume ~500 chars per doc

    switch (this.config.contextWindowStrategy) {
      case 'relevance':
        // Already sorted by relevance
        return results.slice(0, maxResults);

      case 'recency':
        // Sort by timestamp (most recent first)
        return [...results]
          .sort((a, b) => {
            const timeA = a.document.timestamp?.getTime() || 0;
            const timeB = b.document.timestamp?.getTime() || 0;
            return timeB - timeA;
          })
          .slice(0, maxResults);

      case 'diversity':
        // Maximize diversity of document types
        return this.selectDiverseResults(results, maxResults);

      case 'balanced':
        // Balance relevance and diversity
        const topRelevant = results.slice(0, Math.ceil(maxResults * 0.7));
        const diverse = this.selectDiverseResults(
          results.slice(Math.ceil(maxResults * 0.7)),
          Math.floor(maxResults * 0.3)
        );
        return [...topRelevant, ...diverse];

      default:
        return results.slice(0, maxResults);
    }
  }

  /**
   * Select diverse results from search results
   * @param results - Search results
   * @param count - Number of results to select
   * @returns Diverse subset of results
   */
  private selectDiverseResults(results: SearchResult[], count: number): SearchResult[] {
    if (results.length <= count) return results;

    const selected: SearchResult[] = [];
    const typesSeen = new Set<string>();

    // First pass: select one from each type
    for (const result of results) {
      const type = result.document.metadata.type;
      if (!typesSeen.has(type)) {
        selected.push(result);
        typesSeen.add(type);
        if (selected.length >= count) break;
      }
    }

    // Second pass: fill remaining slots with highest scores
    if (selected.length < count) {
      const remaining = results.filter(r => !selected.includes(r));
      selected.push(...remaining.slice(0, count - selected.length));
    }

    return selected;
  }

  /**
   * Orchestrate retrieval from all enabled streams
   * @param query - Search query
   * @returns Orchestrated retrieval result
   */
  async retrieve(query: string): Promise<OrchestratedResult> {
    const startTime = Date.now();

    // Security check
    let securityCheck: PromptInjectionResult = {
      isSafe: true,
      confidence: 0,
      threats: [],
    };

    if (this.config.enablePromptInjectionDetection) {
      securityCheck = this.promptInjectionService.validateQuery(query);
      
      if (!securityCheck.isSafe) {
        console.warn('Potential prompt injection detected:', securityCheck.threats);
        // Use sanitized query if available
        query = securityCheck.sanitizedQuery || query;
      }
    }

    // Entity recognition
    let entities: Entity[] = [];
    let enhancedQuery = query;

    if (this.config.useEntityRecognition) {
      entities = this.entityRecognitionService.extractEntities(query);
      
      // Enhance query with entity information for better retrieval
      if (entities.length > 0) {
        const entityTerms = entities.map(e => e.text).join(' ');
        enhancedQuery = `${query} ${entityTerms}`;
      }
    }

    // Retrieve from all enabled streams in parallel
    const streamPromises: Promise<RecallStreamResult>[] = [];

    if (this.config.localRAG.enabled) {
      streamPromises.push(this.retrieveFromLocalRAG(enhancedQuery, this.config.localRAG.topK));
    }

    if (this.config.vertexAI.enabled && this.vertexAIClient) {
      streamPromises.push(this.retrieveFromVertexAI(enhancedQuery, this.config.vertexAI.topK));
    }

    if (this.config.notebookLM.enabled && this.notebookLMClient) {
      streamPromises.push(this.retrieveFromNotebookLM(enhancedQuery, this.config.notebookLM.topK));
    }

    const streamResults = await Promise.all(streamPromises);

    // Combine results from all streams
    const combinedResults = this.combineStreamResults(streamResults);

    // Apply context window strategy
    const finalResults = this.applyContextWindowStrategy(combinedResults);

    // Calculate context length
    const contextLength = finalResults.reduce(
      (sum, result) => sum + result.document.content.length,
      0
    );

    return {
      documents: finalResults,
      entities,
      securityCheck,
      metadata: {
        totalResults: combinedResults.length,
        streamResults,
        contextLength,
        processingTime: Date.now() - startTime,
      },
    };
  }

  /**
   * Get orchestrator statistics
   * @returns Statistics object
   */
  getStats(): {
    config: RetrievalOrchestratorConfig;
    streamStatus: {
      localRAG: boolean;
      vertexAI: boolean;
      notebookLM: boolean;
    };
  } {
    return {
      config: this.config,
      streamStatus: {
        localRAG: this.config.localRAG.enabled,
        vertexAI: this.config.vertexAI.enabled && !!this.vertexAIClient,
        notebookLM: this.config.notebookLM.enabled && !!this.notebookLMClient,
      },
    };
  }
}

/**
 * Create a RetrievalOrchestrator instance
 * @param ragService - RAG service
 * @param hybridSearchService - Hybrid search service
 * @param entityRecognitionService - Entity recognition service
 * @param promptInjectionService - Prompt injection service
 * @param config - Optional configuration
 * @returns RetrievalOrchestrator instance
 */
export function createRetrievalOrchestrator(
  ragService: RAGService,
  hybridSearchService: HybridSearchService,
  entityRecognitionService: EntityRecognitionService,
  promptInjectionService: PromptInjectionService,
  config?: Partial<RetrievalOrchestratorConfig>
): RetrievalOrchestrator {
  return new RetrievalOrchestrator(
    ragService,
    hybridSearchService,
    entityRecognitionService,
    promptInjectionService,
    config
  );
}
