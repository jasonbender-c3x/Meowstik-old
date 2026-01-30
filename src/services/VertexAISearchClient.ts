import type { SearchResult, Document } from './RAGService';

/**
 * Configuration for Vertex AI Search
 */
export interface VertexAIConfig {
  projectId: string;
  location: string;
  dataStoreId: string;
  apiEndpoint?: string;
}

/**
 * Vertex AI Search Client
 * Integrates with Google Cloud Vertex AI Search for enterprise-scale RAG
 */
export class VertexAISearchClient {
  private config: VertexAIConfig;
  private apiKey: string;

  constructor(apiKey: string, config: VertexAIConfig) {
    this.apiKey = apiKey;
    this.config = {
      apiEndpoint: 'https://discoveryengine.googleapis.com/v1',
      ...config,
    };
  }

  /**
   * Search using Vertex AI Search
   * @param query - Search query
   * @param topK - Number of results to return
   * @returns Search results
   */
  async search(query: string, topK: number = 10): Promise<SearchResult[]> {
    try {
      const url = this.buildSearchUrl();
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: query,
          pageSize: topK,
          queryExpansionSpec: {
            condition: 'AUTO',
          },
          spellCorrectionSpec: {
            mode: 'AUTO',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Vertex AI Search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseVertexAIResponse(data);
    } catch (error) {
      console.error('Vertex AI Search error:', error);
      throw error;
    }
  }

  /**
   * Build search URL for Vertex AI API
   * @returns API endpoint URL
   */
  private buildSearchUrl(): string {
    const { apiEndpoint, projectId, location, dataStoreId } = this.config;
    return `${apiEndpoint}/projects/${projectId}/locations/${location}/collections/default_collection/dataStores/${dataStoreId}/servingConfigs/default_search:search`;
  }

  /**
   * Parse Vertex AI Search API response
   * @param data - API response data
   * @returns Array of search results
   */
  private parseVertexAIResponse(data: any): SearchResult[] {
    const results: SearchResult[] = [];

    if (!data.results || !Array.isArray(data.results)) {
      return results;
    }

    for (const result of data.results) {
      if (!result.document) continue;

      const document: Document = {
        id: result.document.id || `vertex_${Date.now()}_${Math.random()}`,
        content: this.extractContent(result.document),
        metadata: {
          type: 'documentation',
          source: 'vertex_ai',
          title: result.document.derivedStructData?.title || 'Untitled',
          ...(result.document.structData || {}),
        },
        timestamp: new Date(),
      };

      // Extract relevance score (if available)
      const similarity = this.extractRelevanceScore(result);

      results.push({
        document,
        similarity,
      });
    }

    return results;
  }

  /**
   * Extract content from Vertex AI document
   * @param document - Vertex AI document
   * @returns Extracted content
   */
  private extractContent(document: any): string {
    // Try multiple content fields in order of preference
    if (document.derivedStructData?.snippets) {
      return document.derivedStructData.snippets
        .map((s: any) => s.snippet)
        .join('\n');
    }

    if (document.structData?.content) {
      return document.structData.content;
    }

    if (document.jsonData) {
      return JSON.stringify(document.jsonData);
    }

    return document.name || 'No content available';
  }

  /**
   * Extract relevance score from result
   * @param result - Search result from API
   * @returns Relevance score (0-1)
   */
  private extractRelevanceScore(result: any): number {
    // Vertex AI doesn't always provide explicit scores
    // Use rank as inverse score
    if (result.relevanceScore) {
      return result.relevanceScore;
    }

    // Fallback: use position-based scoring
    return 1.0 / (1.0 + (result.rank || 1));
  }

  /**
   * Update configuration
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<VertexAIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Test connection to Vertex AI Search
   * @returns True if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.search('test', 1);
      return true;
    } catch (error) {
      console.error('Vertex AI connection test failed:', error);
      return false;
    }
  }
}

/**
 * Create a VertexAISearchClient instance
 * @param apiKey - Google Cloud API key or access token
 * @param config - Vertex AI configuration
 * @returns VertexAISearchClient instance
 */
export function createVertexAISearchClient(
  apiKey: string,
  config: VertexAIConfig
): VertexAISearchClient {
  return new VertexAISearchClient(apiKey, config);
}
