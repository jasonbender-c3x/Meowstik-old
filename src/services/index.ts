/**
 * Service exports for RAG functionality
 */

export { RAGService, createRAGService } from './RAGService';
export type { Document, DocumentMetadata, SearchResult } from './RAGService';

export { StorageService, createStorageService, getStorageService } from './StorageService';
export type { UserProfile } from './StorageService';

export { IngestionService, createIngestionService } from './IngestionService';

export { EnhancedGeminiService, createEnhancedGeminiService } from './EnhancedGeminiService';

export { HybridSearchService, createHybridSearchService } from './HybridSearchService';

export { EntityRecognitionService, createEntityRecognitionService } from './EntityRecognitionService';
export type { Entity, EntityType } from './EntityRecognitionService';

export { PromptInjectionService, createPromptInjectionService } from './PromptInjectionService';
export type { PromptInjectionResult } from './PromptInjectionService';

export { RetrievalOrchestrator, createRetrievalOrchestrator } from './RetrievalOrchestrator';
export type { RetrievalOrchestratorConfig, OrchestratedResult, RecallStreamConfig, VertexAISearchClient, NotebookLMClient } from './RetrievalOrchestrator';

export { VertexAISearchClient, createVertexAISearchClient } from './VertexAISearchClient';
export type { VertexAIConfig } from './VertexAISearchClient';

export { NotebookLMClient, createNotebookLMClient } from './NotebookLMClient';
export type { NotebookLMConfig } from './NotebookLMClient';

/**
 * Evolution Center exports
 */
export { LogAnalyzer, IssueGenerator } from './EvolutionService';
export { OpinionAnalyzer } from './OpinionAnalyzer';
export { CaptainsLogService } from './CaptainsLogService';
