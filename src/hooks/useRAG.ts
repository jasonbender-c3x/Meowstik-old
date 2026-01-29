import { useState, useEffect, useCallback } from 'react';
import { createRAGService, createStorageService, createIngestionService, createEnhancedGeminiService } from '../services';
import type { RAGService } from '../services/RAGService';
import type { StorageService } from '../services/StorageService';
import type { IngestionService } from '../services/IngestionService';
import type { EnhancedGeminiService } from '../services/EnhancedGeminiService';
import { ingestDocumentation, ingestExampleAgents } from '../utils/documentIngestion';

/**
 * Hook for managing RAG system
 * Provides initialized services and utilities for RAG functionality
 */
export function useRAG(apiKey: string | null) {
  const [ragService, setRagService] = useState<RAGService | null>(null);
  const [storageService, setStorageService] = useState<StorageService | null>(null);
  const [ingestionService, setIngestionService] = useState<IngestionService | null>(null);
  const [geminiService, setGeminiService] = useState<EnhancedGeminiService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ragEnabled, setRagEnabled] = useState(true);

  /**
   * Initialize RAG services
   */
  const initializeRAG = useCallback(async () => {
    if (!apiKey || isInitialized || isInitializing) {
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      // Create services
      const rag = createRAGService(apiKey);
      const storage = createStorageService();
      const ingestion = createIngestionService(rag);
      const gemini = createEnhancedGeminiService(apiKey);

      // Enable RAG on gemini service
      gemini.enableRAG(rag, storage, ingestion);

      // Set services
      setRagService(rag);
      setStorageService(storage);
      setIngestionService(ingestion);
      setGeminiService(gemini);

      // Get user ID
      const userId = storage.getUserId();

      // Check if this is first time initialization
      const existingDocs = storage.loadDocuments();
      if (existingDocs.length === 0) {
        console.log('First time RAG initialization - ingesting documentation and examples');
        
        // Ingest documentation files
        await ingestDocumentation(ingestion, userId);
        
        // Ingest example agents
        await ingestExampleAgents(ingestion, userId);
        
        // Save documents to storage
        const documents = rag.getDocuments();
        storage.saveDocuments(documents);
      }

      setIsInitialized(true);
      console.log('RAG system initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize RAG';
      setError(errorMessage);
      console.error('RAG initialization error:', err);
    } finally {
      setIsInitializing(false);
    }
  }, [apiKey, isInitialized, isInitializing]);

  /**
   * Toggle RAG on/off
   */
  const toggleRAG = useCallback(() => {
    if (geminiService) {
      const newState = !ragEnabled;
      setRagEnabled(newState);
      
      if (newState) {
        geminiService.enableRAG(ragService!, storageService!, ingestionService!);
      } else {
        geminiService.disableRAG();
      }
    }
  }, [geminiService, ragEnabled, ragService, storageService, ingestionService]);

  /**
   * Get RAG statistics
   */
  const getStats = useCallback(() => {
    return geminiService?.getRAGStats() || {
      enabled: false,
      documentCount: 0,
      conversationCount: 0,
      agentCount: 0,
    };
  }, [geminiService]);

  /**
   * Search for similar agents
   */
  const searchAgents = useCallback(async (query: string, topK: number = 5) => {
    if (!geminiService) {
      return [];
    }
    return await geminiService.searchAgents(query, topK);
  }, [geminiService]);

  /**
   * Search conversation history
   */
  const searchConversations = useCallback(async (query: string, topK: number = 5) => {
    if (!geminiService) {
      return [];
    }
    return await geminiService.searchConversations(query, topK);
  }, [geminiService]);

  /**
   * Save current conversation
   */
  const saveConversation = useCallback(async () => {
    if (geminiService && storageService) {
      await geminiService.saveConversation();
      
      // Persist documents to storage
      if (ragService) {
        const documents = ragService.getDocuments();
        storageService.saveDocuments(documents);
      }
    }
  }, [geminiService, storageService, ragService]);

  /**
   * Clear all RAG data
   */
  const clearRAGData = useCallback(() => {
    if (storageService && ragService) {
      storageService.clearAll();
      ragService.clearDocuments();
      setIsInitialized(false);
    }
  }, [storageService, ragService]);

  // Initialize on mount if API key is available
  useEffect(() => {
    if (apiKey && !isInitialized && !isInitializing) {
      initializeRAG();
    }
  }, [apiKey, isInitialized, isInitializing, initializeRAG]);

  return {
    // Services
    ragService,
    storageService,
    ingestionService,
    geminiService,
    
    // State
    isInitialized,
    isInitializing,
    error,
    ragEnabled,
    
    // Actions
    initializeRAG,
    toggleRAG,
    saveConversation,
    clearRAGData,
    
    // Queries
    getStats,
    searchAgents,
    searchConversations,
  };
}
