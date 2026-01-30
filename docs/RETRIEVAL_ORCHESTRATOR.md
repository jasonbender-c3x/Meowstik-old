# Retrieval Orchestrator - Advanced RAG System

## Overview

The Retrieval Orchestrator is a sophisticated retrieval system that enhances the RAG (Retrieval-Augmented Generation) capabilities in Meowstik. It provides:

1. **Hybrid Search** - Combines vector similarity and keyword-based BM25 search
2. **Multiple Recall Streams** - Integrates local RAG, Vertex AI Search, and NotebookLM
3. **Entity Recognition** - Extracts structured information from queries
4. **Prompt Injection Protection** - Detects and mitigates security threats
5. **Intelligent Context Management** - Smart context window strategies

## Architecture

### Core Components

#### 1. RetrievalOrchestrator
The main orchestrator that coordinates multiple recall streams and applies context management strategies.

```typescript
import { 
  createRetrievalOrchestrator,
  createRAGService,
  createHybridSearchService,
  createEntityRecognitionService,
  createPromptInjectionService
} from './services';

const orchestrator = createRetrievalOrchestrator(
  ragService,
  hybridSearchService,
  entityRecognitionService,
  promptInjectionService,
  {
    localRAG: { enabled: true, weight: 1.0, topK: 10 },
    vertexAI: { enabled: false, weight: 0.8, topK: 10 },
    notebookLM: { enabled: false, weight: 0.7, topK: 10 },
    useHybridSearch: true,
    vectorWeight: 0.7, // 70% vector, 30% keyword
    maxContextLength: 8000,
    contextWindowStrategy: 'balanced',
    enablePromptInjectionDetection: true,
    useEntityRecognition: true,
  }
);
```

#### 2. HybridSearchService
Implements BM25 keyword search and combines it with vector similarity.

**Features:**
- Tokenization and inverted index building
- TF-IDF and BM25 scoring
- Configurable k1 and b parameters
- Normalized score combination

**Usage:**
```typescript
const hybridSearch = createHybridSearchService();

// Set documents for indexing
hybridSearch.setDocuments(documents);

// Perform keyword-only search
const keywordResults = hybridSearch.keywordSearch(query, 10);

// Perform hybrid search (combines vector + keyword)
const hybridResults = hybridSearch.hybridSearch(
  vectorResults,
  query,
  10,
  0.7 // 70% vector weight, 30% keyword weight
);
```

#### 3. EntityRecognitionService
Extracts structured entities from queries to improve retrieval.

**Recognized Entity Types:**
- `PERSON` - Person names
- `ORGANIZATION` - Organization names
- `LOCATION` - Locations
- `DATE` - Dates and temporal expressions
- `TECHNOLOGY` - Programming languages, frameworks, tools
- `CAPABILITY` - Actions and capabilities
- `TOOL` - Software tools
- `AGENT_TYPE` - Types of agents

**Usage:**
```typescript
const entityRecognition = createEntityRecognitionService();

// Extract entities
const entities = entityRecognition.extractEntities(
  "Create a Python agent using FastAPI"
);
// Returns: [
//   { text: "Python", type: "TECHNOLOGY", confidence: 0.9, ... },
//   { text: "FastAPI", type: "TECHNOLOGY", confidence: 0.9, ... }
// ]

// Enhance query with entity information
const enhanced = entityRecognition.enhanceQuery(query);
```

#### 4. PromptInjectionService
Detects and mitigates prompt injection attacks.

**Detected Threats:**
- Instruction override attempts
- Role manipulation
- System prompt extraction
- Data exfiltration attempts
- Code injection (XSS, eval, exec)
- SQL-like injection
- Delimiter injection

**Usage:**
```typescript
const promptInjection = createPromptInjectionService();

// Validate and detect threats
const result = promptInjection.validateQuery(userQuery);

if (!result.isSafe) {
  console.warn('Threats detected:', result.threats);
  // Use sanitized query
  const safeQuery = result.sanitizedQuery;
}
```

#### 5. VertexAISearchClient
Integrates with Google Cloud Vertex AI Search for enterprise-scale retrieval.

**Configuration:**
```typescript
const vertexClient = createVertexAISearchClient(apiKey, {
  projectId: 'your-project-id',
  location: 'us-central1',
  dataStoreId: 'your-datastore-id',
});

orchestrator.setVertexAIClient(vertexClient);

// Enable in config
orchestrator.updateConfig({
  vertexAI: { enabled: true, weight: 0.8, topK: 10 }
});
```

#### 6. NotebookLMClient
Integrates with Google's NotebookLM for enhanced document understanding.

**Configuration:**
```typescript
const notebookLMClient = createNotebookLMClient(apiKey, {
  notebookId: 'your-notebook-id',
});

orchestrator.setNotebookLMClient(notebookLMClient);

// Enable in config
orchestrator.updateConfig({
  notebookLM: { enabled: true, weight: 0.7, topK: 10 }
});
```

## Context Window Strategies

The orchestrator supports multiple strategies for managing the context window:

### 1. Relevance (Default)
```typescript
contextWindowStrategy: 'relevance'
```
- Returns top-K documents by relevance score
- Best for precision-focused retrieval

### 2. Recency
```typescript
contextWindowStrategy: 'recency'
```
- Prioritizes most recent documents
- Best for time-sensitive information

### 3. Diversity
```typescript
contextWindowStrategy: 'diversity'
```
- Maximizes diversity of document types
- Best for comprehensive context

### 4. Balanced
```typescript
contextWindowStrategy: 'balanced'
```
- Combines relevance (70%) and diversity (30%)
- Best for general use cases

## Integration with EnhancedGeminiService

The orchestrator integrates seamlessly with the existing RAG system:

```typescript
import { 
  createEnhancedGeminiService,
  createRAGService,
  createStorageService,
  createIngestionService,
  createRetrievalOrchestrator,
  createHybridSearchService,
  createEntityRecognitionService,
  createPromptInjectionService
} from './services';

// Create services
const ragService = createRAGService(apiKey);
const storageService = createStorageService();
const ingestionService = createIngestionService(ragService);
const geminiService = createEnhancedGeminiService(apiKey);

// Create orchestrator components
const hybridSearch = createHybridSearchService();
const entityRecognition = createEntityRecognitionService();
const promptInjection = createPromptInjectionService();

// Create orchestrator
const orchestrator = createRetrievalOrchestrator(
  ragService,
  hybridSearch,
  entityRecognition,
  promptInjection
);

// Enable RAG with orchestrator
await geminiService.enableRAG(
  ragService,
  storageService,
  ingestionService,
  orchestrator
);

// Or set orchestrator later
geminiService.setRetrievalOrchestrator(orchestrator);

// Generate agent with enhanced retrieval
const agent = await geminiService.generateAgentWithRAG(
  "Create a customer support agent",
  true // use RAG
);
```

## Orchestrated Retrieval Flow

1. **Security Check** - Query validated for injection attempts
2. **Entity Recognition** - Extract structured entities from query
3. **Query Enhancement** - Augment query with entity information
4. **Parallel Retrieval** - Fetch from all enabled streams simultaneously:
   - Local RAG (hybrid search if enabled)
   - Vertex AI Search (if configured)
   - NotebookLM (if configured)
5. **Result Combination** - Merge results using weighted scoring
6. **Context Strategy** - Apply context window management
7. **Return Results** - Provide orchestrated results with metadata

## Advanced Configuration

### Fine-tuning BM25 Parameters

```typescript
hybridSearch.updateBM25Params(1.5, 0.75);
// k1: 1.5 (term frequency saturation)
// b: 0.75 (length normalization)
```

### Adjusting Hybrid Search Weights

```typescript
orchestrator.updateConfig({
  vectorWeight: 0.8, // 80% vector, 20% keyword
});
```

### Configuring Recall Stream Weights

```typescript
orchestrator.updateConfig({
  localRAG: { enabled: true, weight: 1.0, topK: 10 },
  vertexAI: { enabled: true, weight: 0.9, topK: 10 },
  notebookLM: { enabled: true, weight: 0.8, topK: 10 },
});
```

### Custom Entity Patterns

```typescript
entityRecognition.addCustomPattern(
  /\b(redis|memcached|rabbitmq)\b/gi,
  'cache_system',
  0.9
);
```

### Custom Security Patterns

```typescript
promptInjection.addCustomPattern(
  /malicious_pattern/gi,
  'Custom threat description',
  0.9
);
```

## Performance Characteristics

### Hybrid Search
- **BM25 Indexing**: O(n) where n = total terms
- **BM25 Search**: O(m) where m = documents
- **Hybrid Combination**: O(k) where k = results to combine

### Entity Recognition
- **Pattern Matching**: O(p * q) where p = patterns, q = query length
- **Overlap Removal**: O(e log e) where e = entities found

### Prompt Injection Detection
- **Pattern Matching**: O(p * q) where p = patterns, q = query length
- **Fast fail**: Returns immediately on high-severity threat

### Orchestrated Retrieval
- **Parallel Streams**: Concurrent execution (fastest stream determines latency)
- **Result Combination**: O(r) where r = total results
- **Context Strategy**: O(r log r) for sorting

## Best Practices

### 1. Enable Hybrid Search for Better Recall
```typescript
useHybridSearch: true,
vectorWeight: 0.7, // Adjust based on use case
```

### 2. Use Balanced Strategy for General Use
```typescript
contextWindowStrategy: 'balanced',
```

### 3. Enable Security Checks
```typescript
enablePromptInjectionDetection: true,
```

### 4. Configure Multiple Streams for Redundancy
```typescript
localRAG: { enabled: true, weight: 1.0, topK: 10 },
vertexAI: { enabled: true, weight: 0.9, topK: 10 },
```

### 5. Monitor Orchestrator Statistics
```typescript
const stats = orchestrator.getStats();
console.log('Stream status:', stats.streamStatus);
console.log('Configuration:', stats.config);
```

## Troubleshooting

### Poor Retrieval Quality
1. Check hybrid search is enabled
2. Adjust vectorWeight (try 0.5-0.9)
3. Verify documents are properly indexed
4. Review entity recognition results

### Security False Positives
1. Review detected threats
2. Add custom patterns to allowlist
3. Adjust severity thresholds

### High Latency
1. Reduce topK for each stream
2. Disable unused streams
3. Use 'relevance' strategy (fastest)
4. Consider caching results

### Vertex AI / NotebookLM Issues
1. Verify API credentials
2. Test connection with testConnection()
3. Check quota and rate limits
4. Review error logs

## API Reference

### RetrievalOrchestrator

#### `retrieve(query: string): Promise<OrchestratedResult>`
Main retrieval method that orchestrates all enabled streams.

**Returns:**
```typescript
{
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
```

#### `updateConfig(config: Partial<RetrievalOrchestratorConfig>)`
Update orchestrator configuration.

#### `getStats()`
Get current orchestrator status and configuration.

### HybridSearchService

#### `setDocuments(documents: Document[])`
Index documents for keyword search.

#### `keywordSearch(query: string, topK: number): SearchResult[]`
Perform BM25 keyword search.

#### `hybridSearch(vectorResults: SearchResult[], query: string, topK: number, alpha: number): SearchResult[]`
Combine vector and keyword search results.

### EntityRecognitionService

#### `extractEntities(query: string): Entity[]`
Extract entities from query.

#### `enhanceQuery(query: string): string`
Enhance query with entity information.

#### `getEntityTypes(query: string): EntityType[]`
Get unique entity types found in query.

### PromptInjectionService

#### `validateQuery(query: string): PromptInjectionResult`
Validate query for security threats.

#### `isSafe(query: string): boolean`
Quick check if query is safe.

#### `detectInjection(query: string): PromptInjectionResult`
Detailed injection detection.

## Migration Guide

### From Basic RAG to Orchestrated RAG

**Before:**
```typescript
const context = await geminiService.retrieveContext(query, 5);
```

**After:**
```typescript
// Create orchestrator
const orchestrator = createRetrievalOrchestrator(
  ragService,
  hybridSearch,
  entityRecognition,
  promptInjection
);

// Set on gemini service
geminiService.setRetrievalOrchestrator(orchestrator);

// Use as before - orchestrator is used automatically
const context = await geminiService.retrieveContext(query, 5);
```

## Future Enhancements

- [ ] Query rewriting and expansion
- [ ] Cross-encoder reranking
- [ ] Semantic caching for repeated queries
- [ ] Multi-modal entity recognition
- [ ] Adaptive context window sizing
- [ ] Real-time stream health monitoring
- [ ] A/B testing for retrieval strategies

## License

MIT License - See LICENSE file for details.
