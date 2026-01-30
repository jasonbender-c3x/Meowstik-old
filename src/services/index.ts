/**
 * Service exports for RAG functionality
 */

export { RAGService, createRAGService } from './RAGService';
export type { Document, DocumentMetadata, SearchResult } from './RAGService';

export { StorageService, createStorageService, getStorageService } from './StorageService';
export type { UserProfile } from './StorageService';

export { IngestionService, createIngestionService } from './IngestionService';

export { EnhancedGeminiService, createEnhancedGeminiService } from './EnhancedGeminiService';

export { WebSearchService, createWebSearchService } from './WebSearchService';
export type { 
  WebSearchOptions, 
  SearchResult as WebSearchResult, 
  SearchResponse, 
  WebSearchConfig 
} from './WebSearchService';

/**
 * Evolution Center exports
 */
export { LogAnalyzer, IssueGenerator } from './EvolutionService';
export { OpinionAnalyzer } from './OpinionAnalyzer';
export { CaptainsLogService } from './CaptainsLogService';
