# Vertex AI and NotebookLM Integration Guide

## Overview

This guide explains how to set up and configure Vertex AI Search and NotebookLM as additional recall streams in the Meowstik RAG system.

## Vertex AI Search Setup

### Prerequisites

1. Google Cloud Project with billing enabled
2. Vertex AI API enabled
3. Service account with appropriate permissions

### Step 1: Enable Vertex AI Search

```bash
gcloud services enable discoveryengine.googleapis.com
```

### Step 2: Create a Data Store

1. Go to the [Vertex AI Search Console](https://console.cloud.google.com/gen-app-builder/engines)
2. Click "Create Data Store"
3. Choose data source:
   - Website URLs
   - Cloud Storage
   - BigQuery
   - Unstructured documents
4. Configure data store settings
5. Note your Data Store ID

### Step 3: Get API Credentials

```bash
# Create service account
gcloud iam service-accounts create meowstik-rag \
    --description="Service account for Meowstik RAG" \
    --display-name="Meowstik RAG"

# Grant necessary permissions
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:meowstik-rag@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/discoveryengine.editor"

# Create and download key
gcloud iam service-accounts keys create meowstik-rag-key.json \
    --iam-account=meowstik-rag@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### Step 4: Configure in Meowstik

```typescript
import { 
  createVertexAISearchClient,
  createRetrievalOrchestrator 
} from './services';

// Read service account key
const serviceAccountKey = JSON.parse(
  fs.readFileSync('meowstik-rag-key.json', 'utf8')
);

// Get access token (you'll need to implement token refresh)
const accessToken = await getAccessToken(serviceAccountKey);

// Create Vertex AI client
const vertexClient = createVertexAISearchClient(accessToken, {
  projectId: 'your-project-id',
  location: 'us-central1',
  dataStoreId: 'your-datastore-id',
});

// Test connection
const isConnected = await vertexClient.testConnection();
console.log('Vertex AI connected:', isConnected);

// Add to orchestrator
orchestrator.setVertexAIClient(vertexClient);
orchestrator.updateConfig({
  vertexAI: { 
    enabled: true, 
    weight: 0.8,  // Adjust based on data quality
    topK: 10 
  }
});
```

### Access Token Helper

```typescript
import { GoogleAuth } from 'google-auth-library';

async function getAccessToken(serviceAccountKey: any): Promise<string> {
  const auth = new GoogleAuth({
    credentials: serviceAccountKey,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  
  if (!accessToken.token) {
    throw new Error('Failed to get access token');
  }

  return accessToken.token;
}
```

### Vertex AI Search Features

**Query Expansion**
Vertex AI automatically expands queries with synonyms and related terms.

**Spell Correction**
Automatic spell correction is enabled by default.

**Result Snippets**
Returns relevant snippets from documents with highlighting.

**Advanced Filtering**
Supports metadata filtering and faceted search.

### Configuration Options

```typescript
// Update Vertex AI client configuration
vertexClient.updateConfig({
  location: 'us-central1', // Change region
  dataStoreId: 'new-datastore-id', // Switch data stores
});
```

### Cost Considerations

Vertex AI Search pricing (as of 2024):
- First 1,000 queries/month: Free
- Additional queries: $0.50 per 1,000 queries
- Data storage: $0.20 per GB/month

**Optimization Tips:**
1. Set appropriate topK limits
2. Cache frequent queries
3. Use local RAG for internal documents
4. Enable Vertex AI only for external knowledge

## NotebookLM Integration

### Prerequisites

1. Google account
2. Access to NotebookLM (currently in beta)
3. API access (request from Google)

### Step 1: Create a Notebook

1. Go to [NotebookLM](https://notebooklm.google.com)
2. Create a new notebook
3. Add sources:
   - Upload PDFs
   - Add Google Docs
   - Paste web URLs
   - Copy text directly
4. Note your Notebook ID (from URL)

### Step 2: Get API Access

**Note:** NotebookLM API is currently limited access. Request access at:
https://notebooklm.google.com/api-access

Once approved, you'll receive:
- API key
- API endpoint
- Rate limits

### Step 3: Configure in Meowstik

```typescript
import { 
  createNotebookLMClient,
  createRetrievalOrchestrator 
} from './services';

// Create NotebookLM client
const notebookLMClient = createNotebookLMClient(apiKey, {
  notebookId: 'your-notebook-id',
  // Optional: custom API endpoint
  apiEndpoint: 'https://notebooklm.google.com/api/v1',
});

// Test connection
const isConnected = await notebookLMClient.testConnection();
console.log('NotebookLM connected:', isConnected);

// Add to orchestrator
orchestrator.setNotebookLMClient(notebookLMClient);
orchestrator.updateConfig({
  notebookLM: { 
    enabled: true, 
    weight: 0.7,  // Adjust based on use case
    topK: 10 
  }
});
```

### Adding Sources Programmatically

```typescript
// Add a text source
const sourceId = await notebookLMClient.addSource(
  "Your text content here",
  'text'
);

// Add a URL source
const urlSourceId = await notebookLMClient.addSource(
  "https://example.com/document",
  'url'
);

// List all sources
const sources = await notebookLMClient.listSources();
console.log('Notebook sources:', sources);
```

### Using NotebookLM for Summarization

```typescript
// Generate a summary based on notebook sources
const summary = await notebookLMClient.generateSummary(
  "Summarize the key points about RAG systems"
);

console.log('Summary:', summary);
```

### NotebookLM Features

**Source Understanding**
- Deep analysis of uploaded documents
- Cross-reference between sources
- Citation tracking

**Contextual Search**
- Understands document context
- Returns relevant passages with citations
- Maintains source attribution

**Audio Overviews**
- Can generate audio summaries (not yet in API)
- Conversational explanations

### Cost Considerations

NotebookLM pricing:
- Free tier: Limited usage
- Pro tier: Higher limits (pricing TBD)

**Note:** API pricing may differ from web interface pricing.

## Multi-Stream Configuration

### Recommended Configurations

#### 1. Maximum Recall (All Streams)
```typescript
orchestrator.updateConfig({
  localRAG: { enabled: true, weight: 1.0, topK: 10 },
  vertexAI: { enabled: true, weight: 0.9, topK: 10 },
  notebookLM: { enabled: true, weight: 0.8, topK: 10 },
  useHybridSearch: true,
  vectorWeight: 0.7,
  contextWindowStrategy: 'balanced',
});
```

**Use Case:** When you need comprehensive coverage from all sources.

**Cost:** High (all API calls)

#### 2. Cost-Optimized (Local + One External)
```typescript
orchestrator.updateConfig({
  localRAG: { enabled: true, weight: 1.0, topK: 15 },
  vertexAI: { enabled: true, weight: 0.8, topK: 5 },
  notebookLM: { enabled: false, weight: 0.7, topK: 10 },
  useHybridSearch: true,
  vectorWeight: 0.7,
});
```

**Use Case:** Balance cost and coverage.

**Cost:** Medium (reduced external calls)

#### 3. Fast Local-Only
```typescript
orchestrator.updateConfig({
  localRAG: { enabled: true, weight: 1.0, topK: 10 },
  vertexAI: { enabled: false, weight: 0.8, topK: 10 },
  notebookLM: { enabled: false, weight: 0.7, topK: 10 },
  useHybridSearch: true,
  vectorWeight: 0.7,
});
```

**Use Case:** When external knowledge is not needed.

**Cost:** Zero (no external API calls)

### Stream Selection Strategy

```typescript
// Dynamically enable streams based on query
async function selectStreams(query: string, orchestrator: RetrievalOrchestrator) {
  const entities = entityRecognition.extractEntities(query);
  
  // Enable Vertex AI for technical queries
  const hasTechEntities = entities.some(e => 
    e.type === 'TECHNOLOGY' || e.type === 'TOOL'
  );
  
  // Enable NotebookLM for research queries
  const hasResearchKeywords = /research|study|paper|article/i.test(query);
  
  orchestrator.updateConfig({
    vertexAI: { enabled: hasTechEntities, weight: 0.9, topK: 10 },
    notebookLM: { enabled: hasResearchKeywords, weight: 0.8, topK: 10 },
  });
}
```

## Monitoring and Debugging

### Check Stream Status

```typescript
const stats = orchestrator.getStats();
console.log('Stream Status:', stats.streamStatus);
// {
//   localRAG: true,
//   vertexAI: true,
//   notebookLM: false
// }
```

### Inspect Retrieval Results

```typescript
const result = await orchestrator.retrieve(query);

console.log('Total results:', result.metadata.totalResults);
console.log('Processing time:', result.metadata.processingTime, 'ms');
console.log('Context length:', result.metadata.contextLength, 'chars');

// Per-stream results
for (const stream of result.metadata.streamResults) {
  console.log(`${stream.source}:`, {
    results: stream.results.length,
    latency: stream.latency,
    error: stream.error,
  });
}
```

### Error Handling

```typescript
try {
  const result = await orchestrator.retrieve(query);
  
  // Check for stream errors
  const failedStreams = result.metadata.streamResults
    .filter(s => s.error)
    .map(s => s.source);
  
  if (failedStreams.length > 0) {
    console.warn('Some streams failed:', failedStreams);
  }
  
  // Use results anyway (other streams succeeded)
  const documents = result.documents;
} catch (error) {
  console.error('Retrieval failed:', error);
  // Fallback to basic search
}
```

## Security Best Practices

### 1. Secure API Keys

```typescript
// DO NOT hardcode keys
// ❌ Bad
const apiKey = 'AIza...';

// ✅ Good - Use environment variables
const apiKey = process.env.VERTEX_AI_API_KEY;
```

### 2. Implement Token Refresh

```typescript
class TokenManager {
  private token: string | null = null;
  private expiry: Date | null = null;

  async getToken(): Promise<string> {
    if (this.token && this.expiry && this.expiry > new Date()) {
      return this.token;
    }

    // Refresh token
    this.token = await this.refreshToken();
    this.expiry = new Date(Date.now() + 3600 * 1000); // 1 hour
    return this.token;
  }

  private async refreshToken(): Promise<string> {
    // Implement token refresh logic
    return 'new-token';
  }
}
```

### 3. Sanitize Queries

```typescript
// Always use prompt injection detection
orchestrator.updateConfig({
  enablePromptInjectionDetection: true,
});

const result = await orchestrator.retrieve(query);
if (!result.securityCheck.isSafe) {
  console.warn('Security threats:', result.securityCheck.threats);
  // Handle accordingly
}
```

### 4. Limit External Calls

```typescript
// Implement rate limiting
const rateLimiter = new RateLimiter(100, 60000); // 100 calls per minute

if (rateLimiter.tryAcquire()) {
  const result = await orchestrator.retrieve(query);
} else {
  // Use cached result or local-only search
}
```

## Troubleshooting

### Vertex AI Issues

**Error: "Invalid credentials"**
- Verify service account key is correct
- Check IAM permissions
- Ensure token is not expired

**Error: "Data store not found"**
- Verify dataStoreId is correct
- Check project and location match
- Ensure data store is created and indexed

**Error: "Quota exceeded"**
- Check Cloud Console quotas
- Implement rate limiting
- Reduce topK or disable for some queries

### NotebookLM Issues

**Error: "Notebook not found"**
- Verify notebookId from URL
- Ensure notebook is not deleted
- Check API access permissions

**Error: "Source limit exceeded"**
- Remove unused sources
- Create separate notebooks for different topics
- Use Vertex AI for large document sets

**Error: "API access denied"**
- Verify you have API access approval
- Check API key is valid
- Ensure correct API endpoint

## Performance Optimization

### 1. Parallel Retrieval

All streams run in parallel automatically:
```typescript
// Automatically parallel - no change needed
const result = await orchestrator.retrieve(query);
```

### 2. Result Caching

```typescript
class CachedOrchestrator {
  private cache = new Map<string, OrchestratedResult>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  async retrieve(query: string): Promise<OrchestratedResult> {
    const cached = this.cache.get(query);
    if (cached) {
      return cached;
    }

    const result = await this.orchestrator.retrieve(query);
    this.cache.set(query, result);
    
    // Clear after TTL
    setTimeout(() => this.cache.delete(query), this.ttl);
    
    return result;
  }
}
```

### 3. Adaptive topK

```typescript
// Adjust topK based on query complexity
const entities = entityRecognition.extractEntities(query);
const isComplex = entities.length > 3 || query.length > 200;

orchestrator.updateConfig({
  localRAG: { enabled: true, weight: 1.0, topK: isComplex ? 15 : 5 },
  vertexAI: { enabled: true, weight: 0.8, topK: isComplex ? 10 : 3 },
});
```

## Example: Complete Setup

```typescript
import {
  createRAGService,
  createStorageService,
  createIngestionService,
  createEnhancedGeminiService,
  createRetrievalOrchestrator,
  createHybridSearchService,
  createEntityRecognitionService,
  createPromptInjectionService,
  createVertexAISearchClient,
  createNotebookLMClient,
} from './services';

// Initialize base RAG services
const apiKey = process.env.GOOGLE_API_KEY!;
const ragService = createRAGService(apiKey);
const storageService = createStorageService();
const ingestionService = createIngestionService(ragService);
const geminiService = createEnhancedGeminiService(apiKey);

// Initialize orchestrator components
const hybridSearch = createHybridSearchService();
const entityRecognition = createEntityRecognitionService();
const promptInjection = createPromptInjectionService();

// Create orchestrator
const orchestrator = createRetrievalOrchestrator(
  ragService,
  hybridSearch,
  entityRecognition,
  promptInjection,
  {
    localRAG: { enabled: true, weight: 1.0, topK: 10 },
    vertexAI: { enabled: false, weight: 0.8, topK: 10 },
    notebookLM: { enabled: false, weight: 0.7, topK: 10 },
    useHybridSearch: true,
    vectorWeight: 0.7,
    maxContextLength: 8000,
    contextWindowStrategy: 'balanced',
    enablePromptInjectionDetection: true,
    useEntityRecognition: true,
  }
);

// Optional: Setup Vertex AI
if (process.env.VERTEX_AI_ENABLED === 'true') {
  const vertexToken = await getAccessToken();
  const vertexClient = createVertexAISearchClient(vertexToken, {
    projectId: process.env.VERTEX_PROJECT_ID!,
    location: process.env.VERTEX_LOCATION!,
    dataStoreId: process.env.VERTEX_DATASTORE_ID!,
  });
  
  orchestrator.setVertexAIClient(vertexClient);
  orchestrator.updateConfig({
    vertexAI: { enabled: true, weight: 0.8, topK: 10 }
  });
}

// Optional: Setup NotebookLM
if (process.env.NOTEBOOKLM_ENABLED === 'true') {
  const notebookLMClient = createNotebookLMClient(
    process.env.NOTEBOOKLM_API_KEY!,
    { notebookId: process.env.NOTEBOOKLM_NOTEBOOK_ID! }
  );
  
  orchestrator.setNotebookLMClient(notebookLMClient);
  orchestrator.updateConfig({
    notebookLM: { enabled: true, weight: 0.7, topK: 10 }
  });
}

// Enable RAG with orchestrator
await geminiService.enableRAG(
  ragService,
  storageService,
  ingestionService,
  orchestrator
);

// Use it!
const agent = await geminiService.generateAgentWithRAG(
  "Create a Python agent for data analysis",
  true
);

console.log('Generated agent:', agent);
```

## Environment Variables

```bash
# .env file
GOOGLE_API_KEY=your_gemini_api_key

# Vertex AI (optional)
VERTEX_AI_ENABLED=true
VERTEX_PROJECT_ID=your-project-id
VERTEX_LOCATION=us-central1
VERTEX_DATASTORE_ID=your-datastore-id

# NotebookLM (optional)
NOTEBOOKLM_ENABLED=true
NOTEBOOKLM_API_KEY=your-notebooklm-key
NOTEBOOKLM_NOTEBOOK_ID=your-notebook-id
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/jasonbender-c3x/Meowstik/issues
- Vertex AI Support: https://cloud.google.com/vertex-ai/docs/support
- NotebookLM Support: https://notebooklm.google.com/help

## License

MIT License - See LICENSE file for details.
