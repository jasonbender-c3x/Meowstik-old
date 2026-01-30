/**
 * Web Search Service using Google Custom Search API
 * Provides web search capabilities for grounding agent generation with current information
 */

export interface WebSearchOptions {
  numResults?: number;       // Number of results to return (default: 5, max: 10)
  dateRestrict?: string;     // Date restrict (e.g., 'd7' for last 7 days, 'm1' for last month)
  siteSearch?: string;       // Restrict search to specific domain
  fileType?: string;         // Filter by file type (e.g., 'pdf', 'doc')
  language?: string;         // Language code (e.g., 'en', 'es')
  safeSearch?: 'off' | 'medium' | 'high';  // Safe search level
}

export interface SearchResult {
  title: string;
  snippet: string;
  link: string;
  displayLink: string;
  timestamp: Date;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
}

interface CacheEntry {
  response: SearchResponse;
  timestamp: number;
}

export interface WebSearchConfig {
  enabled: boolean;
  frequency: 'always' | 'conditional' | 'manual';
  maxResultsPerSearch: number;
  cacheEnabled: boolean;
  cacheTTL: number;  // Time to live in seconds
  rateLimitPerMinute: number;
  fallbackOnError: boolean;
}

/**
 * Default configuration for web search
 */
const DEFAULT_CONFIG: WebSearchConfig = {
  enabled: true,
  frequency: 'always',
  maxResultsPerSearch: 5,
  cacheEnabled: true,
  cacheTTL: 3600,  // 1 hour
  rateLimitPerMinute: 10,
  fallbackOnError: true,
};

/**
 * WebSearchService class for performing Google Custom Search queries
 */
export class WebSearchService {
  private apiKey: string;
  private searchEngineId: string;
  private config: WebSearchConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private requestTimestamps: number[] = [];
  private readonly baseUrl = 'https://www.googleapis.com/customsearch/v1';

  constructor(
    apiKey: string,
    searchEngineId: string,
    config: Partial<WebSearchConfig> = {}
  ) {
    if (!apiKey || !searchEngineId) {
      throw new Error('API key and Search Engine ID are required');
    }

    this.apiKey = apiKey;
    this.searchEngineId = searchEngineId;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if rate limit allows another request
   */
  private canMakeRequest(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter(ts => ts > oneMinuteAgo);
    
    return this.requestTimestamps.length < this.config.rateLimitPerMinute;
  }

  /**
   * Record a request timestamp for rate limiting
   */
  private recordRequest(): void {
    this.requestTimestamps.push(Date.now());
  }

  /**
   * Get cache key for a query and options
   */
  private getCacheKey(query: string, options: WebSearchOptions = {}): string {
    return JSON.stringify({ query: query.toLowerCase().trim(), options });
  }

  /**
   * Get cached search results if available and not expired
   */
  private getCachedResults(query: string, options: WebSearchOptions = {}): SearchResponse | null {
    if (!this.config.cacheEnabled) {
      return null;
    }

    const cacheKey = this.getCacheKey(query, options);
    const cached = this.cache.get(cacheKey);

    if (!cached) {
      return null;
    }

    // Check if cache entry is expired
    const now = Date.now();
    const age = (now - cached.timestamp) / 1000;  // Convert to seconds

    if (age > this.config.cacheTTL) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.response;
  }

  /**
   * Cache search results
   */
  private cacheResults(query: string, options: WebSearchOptions = {}, response: SearchResponse): void {
    if (!this.config.cacheEnabled) {
      return;
    }

    const cacheKey = this.getCacheKey(query, options);
    this.cache.set(cacheKey, {
      response,
      timestamp: Date.now(),
    });
  }

  /**
   * Build the API URL with parameters
   */
  private buildUrl(query: string, options: WebSearchOptions = {}): string {
    const params = new URLSearchParams({
      key: this.apiKey,
      cx: this.searchEngineId,
      q: query,
      num: Math.min(options.numResults || this.config.maxResultsPerSearch, 10).toString(),
    });

    if (options.dateRestrict) {
      params.append('dateRestrict', options.dateRestrict);
    }

    if (options.siteSearch) {
      params.append('siteSearch', options.siteSearch);
    }

    if (options.fileType) {
      params.append('fileType', options.fileType);
    }

    if (options.language) {
      params.append('lr', `lang_${options.language}`);
    }

    if (options.safeSearch) {
      params.append('safe', options.safeSearch);
    }

    // Return only specific fields to minimize response size
    params.append('fields', 'items(title,snippet,link,displayLink),searchInformation(totalResults,searchTime)');

    return `${this.baseUrl}?${params.toString()}`;
  }

  /**
   * Perform a web search using Google Custom Search API
   * @param query - The search query
   * @param options - Optional search parameters
   * @returns Promise<SearchResponse> - Search results
   */
  async performSearch(query: string, options: WebSearchOptions = {}): Promise<SearchResponse> {
    if (!this.config.enabled) {
      throw new Error('Web search is disabled');
    }

    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    // Check cache first
    const cached = this.getCachedResults(query, options);
    if (cached) {
      console.log(`Using cached search results for: ${query}`);
      return cached;
    }

    // Check rate limit
    if (!this.canMakeRequest()) {
      if (this.config.fallbackOnError) {
        console.warn('Rate limit reached, returning empty results');
        return {
          query,
          results: [],
          totalResults: 0,
          searchTime: 0,
        };
      }
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    try {
      const url = this.buildUrl(query, options);
      
      this.recordRequest();
      const startTime = Date.now();
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Search API error: ${response.status} - ${errorData.error?.message || response.statusText}`
        );
      }

      const data = await response.json();
      const searchTime = (Date.now() - startTime) / 1000;

      // Parse results
      const results: SearchResult[] = (data.items || []).map((item: any) => ({
        title: item.title || '',
        snippet: item.snippet || '',
        link: item.link || '',
        displayLink: item.displayLink || '',
        timestamp: new Date(),
      }));

      const searchResponse: SearchResponse = {
        query,
        results,
        totalResults: parseInt(data.searchInformation?.totalResults || '0', 10),
        searchTime,
      };

      // Cache the results
      this.cacheResults(query, options, searchResponse);

      return searchResponse;
    } catch (error) {
      if (this.config.fallbackOnError) {
        console.error('Search failed, returning empty results:', error);
        return {
          query,
          results: [],
          totalResults: 0,
          searchTime: 0,
        };
      }
      
      if (error instanceof Error) {
        throw new Error(`Web search failed: ${error.message}`);
      }
      throw new Error('Web search failed: Unknown error');
    }
  }

  /**
   * Search and format results as context for LLM consumption
   * @param query - The search query
   * @param options - Optional search parameters
   * @returns Promise<string> - Formatted search results as context
   */
  async searchForContext(query: string, options: WebSearchOptions = {}): Promise<string> {
    const searchResponse = await this.performSearch(query, options);

    if (searchResponse.results.length === 0) {
      return 'No web search results found.';
    }

    const contextParts = searchResponse.results.map((result, idx) => {
      return `
[${idx + 1}] ${result.title}
Source: ${result.displayLink}
URL: ${result.link}
Summary: ${result.snippet}
      `.trim();
    });

    return `
Web Search Results (${searchResponse.results.length} results found):

${contextParts.join('\n\n')}

Search performed at: ${new Date().toISOString()}
    `.trim();
  }

  /**
   * Clear the search cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<WebSearchConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): WebSearchConfig {
    return { ...this.config };
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(): {
    requestsInLastMinute: number;
    remainingRequests: number;
    rateLimitPerMinute: number;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const requestsInLastMinute = this.requestTimestamps.filter(ts => ts > oneMinuteAgo).length;
    
    return {
      requestsInLastMinute,
      remainingRequests: Math.max(0, this.config.rateLimitPerMinute - requestsInLastMinute),
      rateLimitPerMinute: this.config.rateLimitPerMinute,
    };
  }
}

/**
 * Create a WebSearchService instance
 * @param apiKey - Google Custom Search API key
 * @param searchEngineId - Google Custom Search Engine ID
 * @param config - Optional configuration
 * @returns WebSearchService instance
 */
export function createWebSearchService(
  apiKey: string,
  searchEngineId: string,
  config?: Partial<WebSearchConfig>
): WebSearchService {
  return new WebSearchService(apiKey, searchEngineId, config);
}
