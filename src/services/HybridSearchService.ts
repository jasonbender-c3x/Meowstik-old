import type { Document, SearchResult } from './RAGService';

/**
 * BM25 parameters for keyword search
 */
interface BM25Params {
  k1: number; // Term frequency saturation parameter (typically 1.2-2.0)
  b: number;  // Length normalization parameter (typically 0.75)
}

/**
 * Hybrid Search Service combining vector and keyword search
 * Uses BM25 algorithm for keyword search and combines with vector similarity
 */
export class HybridSearchService {
  private documents: Document[] = [];
  private invertedIndex: Map<string, Map<string, number>> = new Map();
  private documentLengths: Map<string, number> = new Map();
  private averageDocLength: number = 0;
  private idf: Map<string, number> = new Map();
  private bm25Params: BM25Params = { k1: 1.5, b: 0.75 };

  /**
   * Set documents for hybrid search
   * @param documents - Array of documents to index
   */
  setDocuments(documents: Document[]): void {
    this.documents = documents;
    this.buildIndex();
  }

  /**
   * Tokenize text into terms
   * @param text - Text to tokenize
   * @returns Array of lowercase terms
   */
  private tokenize(text: string): string[] {
    // Simple tokenization: lowercase, remove punctuation, split on whitespace
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2); // Filter out very short terms
  }

  /**
   * Build inverted index and calculate IDF scores
   */
  private buildIndex(): void {
    this.invertedIndex.clear();
    this.documentLengths.clear();
    this.idf.clear();

    let totalLength = 0;

    // Build inverted index and calculate document lengths
    for (const doc of this.documents) {
      const terms = this.tokenize(doc.content);
      const termFrequency = new Map<string, number>();

      // Count term frequencies
      for (const term of terms) {
        termFrequency.set(term, (termFrequency.get(term) || 0) + 1);
      }

      // Update inverted index
      for (const [term, freq] of termFrequency.entries()) {
        if (!this.invertedIndex.has(term)) {
          this.invertedIndex.set(term, new Map());
        }
        this.invertedIndex.get(term)!.set(doc.id, freq);
      }

      // Store document length
      this.documentLengths.set(doc.id, terms.length);
      totalLength += terms.length;
    }

    // Calculate average document length
    this.averageDocLength = this.documents.length > 0 
      ? totalLength / this.documents.length 
      : 0;

    // Calculate IDF for each term
    const N = this.documents.length;
    for (const [term, docMap] of this.invertedIndex.entries()) {
      const df = docMap.size; // Document frequency
      this.idf.set(term, Math.log((N - df + 0.5) / (df + 0.5) + 1));
    }
  }

  /**
   * Calculate BM25 score for a document given query terms
   * @param docId - Document ID
   * @param queryTerms - Array of query terms
   * @returns BM25 score
   */
  private calculateBM25Score(docId: string, queryTerms: string[]): number {
    let score = 0;
    const docLength = this.documentLengths.get(docId) || 0;

    for (const term of queryTerms) {
      const termDocs = this.invertedIndex.get(term);
      if (!termDocs) continue;

      const termFreq = termDocs.get(docId) || 0;
      if (termFreq === 0) continue;

      const idfScore = this.idf.get(term) || 0;
      
      // BM25 formula
      const numerator = termFreq * (this.bm25Params.k1 + 1);
      const denominator = termFreq + this.bm25Params.k1 * (
        1 - this.bm25Params.b + 
        this.bm25Params.b * (docLength / this.averageDocLength)
      );

      score += idfScore * (numerator / denominator);
    }

    return score;
  }

  /**
   * Perform keyword search using BM25
   * @param query - Search query
   * @param topK - Number of results to return
   * @returns Array of search results with BM25 scores
   */
  keywordSearch(query: string, topK: number = 5): SearchResult[] {
    const queryTerms = this.tokenize(query);
    if (queryTerms.length === 0) {
      return [];
    }

    // Calculate BM25 scores for all documents
    const scores: SearchResult[] = this.documents.map(doc => ({
      document: doc,
      similarity: this.calculateBM25Score(doc.id, queryTerms),
    }));

    // Sort by score and return top-K
    return scores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Perform hybrid search combining vector and keyword results
   * @param vectorResults - Results from vector search
   * @param query - Original query for keyword search
   * @param topK - Number of results to return
   * @param alpha - Weight for vector search (0-1), keyword weight is (1-alpha)
   * @returns Combined and re-ranked search results
   */
  hybridSearch(
    vectorResults: SearchResult[],
    query: string,
    topK: number = 5,
    alpha: number = 0.7
  ): SearchResult[] {
    // Get keyword search results
    const keywordResults = this.keywordSearch(query, topK * 2);

    // Create a map to combine scores
    const scoreMap = new Map<string, { document: Document; vectorScore: number; keywordScore: number }>();

    // Normalize and add vector scores
    const maxVectorScore = Math.max(...vectorResults.map(r => r.similarity), 1);
    for (const result of vectorResults) {
      const normalizedScore = result.similarity / maxVectorScore;
      scoreMap.set(result.document.id, {
        document: result.document,
        vectorScore: normalizedScore,
        keywordScore: 0,
      });
    }

    // Normalize and add keyword scores
    const maxKeywordScore = Math.max(...keywordResults.map(r => r.similarity), 1);
    for (const result of keywordResults) {
      const normalizedScore = result.similarity / maxKeywordScore;
      const existing = scoreMap.get(result.document.id);
      if (existing) {
        existing.keywordScore = normalizedScore;
      } else {
        scoreMap.set(result.document.id, {
          document: result.document,
          vectorScore: 0,
          keywordScore: normalizedScore,
        });
      }
    }

    // Calculate combined scores
    const combinedResults: SearchResult[] = Array.from(scoreMap.values()).map(entry => ({
      document: entry.document,
      similarity: alpha * entry.vectorScore + (1 - alpha) * entry.keywordScore,
    }));

    // Sort by combined score and return top-K
    return combinedResults
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Update BM25 parameters
   * @param k1 - Term frequency saturation parameter
   * @param b - Length normalization parameter
   */
  updateBM25Params(k1: number, b: number): void {
    this.bm25Params = { k1, b };
    // Rebuild index with new parameters (IDF doesn't change, but we invalidate for consistency)
    this.buildIndex();
  }
}

/**
 * Create a HybridSearchService instance
 * @returns HybridSearchService instance
 */
export function createHybridSearchService(): HybridSearchService {
  return new HybridSearchService();
}
