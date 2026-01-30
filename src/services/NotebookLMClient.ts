import type { SearchResult, Document } from './RAGService';

/**
 * Configuration for NotebookLM integration
 */
export interface NotebookLMConfig {
  notebookId: string;
  apiEndpoint?: string;
}

/**
 * NotebookLM Client
 * Integrates with Google's NotebookLM for enhanced document understanding and search
 */
export class NotebookLMClient {
  private config: NotebookLMConfig;
  private apiKey: string;

  constructor(apiKey: string, config: NotebookLMConfig) {
    this.apiKey = apiKey;
    this.config = {
      apiEndpoint: 'https://notebooklm.google.com/api/v1',
      ...config,
    };
  }

  /**
   * Search using NotebookLM
   * @param query - Search query
   * @param topK - Number of results to return
   * @returns Search results
   */
  async search(query: string, topK: number = 10): Promise<SearchResult[]> {
    try {
      const url = this.buildSearchUrl();
      
      // NotebookLM API (this is a conceptual implementation as the API may not be public yet)
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          notebookId: this.config.notebookId,
          query: query,
          maxResults: topK,
          includeContext: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`NotebookLM search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseNotebookLMResponse(data);
    } catch (error) {
      console.error('NotebookLM search error:', error);
      throw error;
    }
  }

  /**
   * Build search URL for NotebookLM API
   * @returns API endpoint URL
   */
  private buildSearchUrl(): string {
    const { apiEndpoint, notebookId } = this.config;
    return `${apiEndpoint}/notebooks/${notebookId}/search`;
  }

  /**
   * Parse NotebookLM API response
   * @param data - API response data
   * @returns Array of search results
   */
  private parseNotebookLMResponse(data: any): SearchResult[] {
    const results: SearchResult[] = [];

    if (!data.results || !Array.isArray(data.results)) {
      return results;
    }

    for (const result of data.results) {
      const document: Document = {
        id: result.id || `notebooklm_${Date.now()}_${Math.random()}`,
        content: result.content || result.excerpt || '',
        metadata: {
          type: 'documentation',
          source: 'notebooklm',
          title: result.title || result.sourceTitle || 'Untitled',
          sourceId: result.sourceId,
          sourcePage: result.sourcePage,
          ...(result.metadata || {}),
        },
        timestamp: new Date(result.timestamp || Date.now()),
      };

      // NotebookLM provides relevance scores
      const similarity = result.relevanceScore || result.score || 0.5;

      results.push({
        document,
        similarity,
      });
    }

    return results;
  }

  /**
   * Add a source to NotebookLM notebook
   * @param source - Source to add (URL, text, or file reference)
   * @param type - Type of source
   * @returns Source ID
   */
  async addSource(source: string, type: 'url' | 'text' | 'file'): Promise<string> {
    try {
      const url = `${this.config.apiEndpoint}/notebooks/${this.config.notebookId}/sources`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          type,
          content: source,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add source: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.sourceId;
    } catch (error) {
      console.error('NotebookLM add source error:', error);
      throw error;
    }
  }

  /**
   * Generate a summary using NotebookLM
   * @param query - Query or prompt for summarization
   * @returns Generated summary
   */
  async generateSummary(query: string): Promise<string> {
    try {
      const url = `${this.config.apiEndpoint}/notebooks/${this.config.notebookId}/summarize`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          prompt: query,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate summary: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.summary || '';
    } catch (error) {
      console.error('NotebookLM summary error:', error);
      throw error;
    }
  }

  /**
   * List all sources in the notebook
   * @returns Array of source metadata
   */
  async listSources(): Promise<any[]> {
    try {
      const url = `${this.config.apiEndpoint}/notebooks/${this.config.notebookId}/sources`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list sources: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.sources || [];
    } catch (error) {
      console.error('NotebookLM list sources error:', error);
      throw error;
    }
  }

  /**
   * Update configuration
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<NotebookLMConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Test connection to NotebookLM
   * @returns True if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.listSources();
      return true;
    } catch (error) {
      console.error('NotebookLM connection test failed:', error);
      return false;
    }
  }
}

/**
 * Create a NotebookLMClient instance
 * @param apiKey - Google API key
 * @param config - NotebookLM configuration
 * @returns NotebookLMClient instance
 */
export function createNotebookLMClient(
  apiKey: string,
  config: NotebookLMConfig
): NotebookLMClient {
  return new NotebookLMClient(apiKey, config);
}
