import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Document interface for RAG system
 */
export interface Document {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  embedding?: number[];
  timestamp: Date;
}

/**
 * Metadata for documents in the RAG system
 */
export interface DocumentMetadata {
  type: 'conversation' | 'agent' | 'documentation' | 'user_note' | 'web_search_result';
  userId?: string;
  source?: string;
  title?: string;
  tags?: string[];
  url?: string;
  searchQuery?: string;
  [key: string]: any;
}

/**
 * Search result from RAG retrieval
 */
export interface SearchResult {
  document: Document;
  similarity: number;
}

/**
 * RAG Service for managing embeddings and document retrieval
 * Provides semantic search capabilities using Google's embedding API
 */
export class RAGService {
  private genAI: GoogleGenerativeAI;
  private documents: Map<string, Document> = new Map();
  private embeddingModel: string = 'text-embedding-004';

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Generate embedding for a text using Google's embedding API
   * @param text - The text to embed
   * @returns Promise<number[]> - The embedding vector
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.embeddingModel 
      });
      
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param a - First vector
   * @param b - Second vector
   * @returns number - Similarity score between -1 and 1
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    // Handle zero-norm vectors
    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Add a document to the RAG system
   * @param content - The document content
   * @param metadata - Document metadata
   * @returns Promise<Document> - The created document with embedding
   */
  async addDocument(content: string, metadata: DocumentMetadata): Promise<Document> {
    const id = `${metadata.type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const embedding = await this.generateEmbedding(content);
    
    const document: Document = {
      id,
      content,
      metadata,
      embedding,
      timestamp: new Date(),
    };

    this.documents.set(id, document);
    return document;
  }

  /**
   * Restore a document with an existing embedding (no API call)
   * Used when loading from storage
   * @param document - Complete document with embedding
   */
  restoreDocument(document: Document): void {
    this.documents.set(document.id, document);
  }

  /**
   * Retrieve relevant documents based on a query
   * @param query - The search query
   * @param topK - Number of results to return
   * @param filter - Optional metadata filter
   * @returns Promise<SearchResult[]> - Top-K most similar documents
   */
  async retrieveRelevantDocuments(
    query: string,
    topK: number = 5,
    filter?: Partial<DocumentMetadata>
  ): Promise<SearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(query);
    
    let documents = Array.from(this.documents.values());

    // Apply metadata filter if provided
    if (filter) {
      documents = documents.filter(doc => {
        return Object.entries(filter).every(([key, value]) => {
          if (value === undefined) return true;
          return doc.metadata[key] === value;
        });
      });
    }

    // Calculate similarities
    const results: SearchResult[] = documents
      .map(doc => ({
        document: doc,
        similarity: doc.embedding 
          ? this.cosineSimilarity(queryEmbedding, doc.embedding)
          : 0,
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    return results;
  }

  /**
   * Get all documents with optional filtering
   * @param filter - Optional metadata filter
   * @returns Document[] - Filtered documents
   */
  getDocuments(filter?: Partial<DocumentMetadata>): Document[] {
    let documents = Array.from(this.documents.values());

    if (filter) {
      documents = documents.filter(doc => {
        return Object.entries(filter).every(([key, value]) => {
          if (value === undefined) return true;
          return doc.metadata[key] === value;
        });
      });
    }

    return documents;
  }

  /**
   * Remove a document by ID
   * @param id - Document ID
   * @returns boolean - True if document was removed
   */
  removeDocument(id: string): boolean {
    return this.documents.delete(id);
  }

  /**
   * Clear all documents
   */
  clearDocuments(): void {
    this.documents.clear();
  }

  /**
   * Get document count
   * @returns number - Total number of documents
   */
  getDocumentCount(): number {
    return this.documents.size;
  }

  /**
   * Batch add documents
   * @param documents - Array of {content, metadata} pairs
   * @returns Promise<Document[]> - Created documents
   */
  async batchAddDocuments(
    documents: Array<{ content: string; metadata: DocumentMetadata }>
  ): Promise<Document[]> {
    const results: Document[] = [];
    
    for (const doc of documents) {
      try {
        const result = await this.addDocument(doc.content, doc.metadata);
        results.push(result);
      } catch (error) {
        console.error(`Failed to add document: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }
}

/**
 * Create a RAGService instance
 * @param apiKey - Google AI API key
 * @returns RAGService instance
 */
export function createRAGService(apiKey: string): RAGService {
  return new RAGService(apiKey);
}
