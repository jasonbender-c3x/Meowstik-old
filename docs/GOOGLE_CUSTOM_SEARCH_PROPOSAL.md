# Google Custom Search Integration Proposal

## Executive Summary

This document outlines the integration of Google Custom Search API (also known as Programmable Search Engine) into Meowstik's decision-making process. The goal is to enable the system to proactively perform web searches at least once per turn to ground responses in current information, enrich the RAG system, and enhance overall agent generation quality.

## What is Google Custom Search API?

### Overview

Google Custom Search API (formerly Google Custom Search Engine or CSE) is a paid service that allows developers to programmatically perform Google searches and receive structured JSON results. It provides two main options:

1. **Programmable Search Engine (Free Tier)**: Limited free searches per day with customizable search scope
2. **Custom Search JSON API (Paid)**: Full programmatic access with higher quotas

### Key Features

- **Structured Results**: Returns search results in JSON format with titles, snippets, URLs, and metadata
- **Customizable Scope**: Can search the entire web or limit to specific domains
- **Rich Snippets**: Includes page descriptions, thumbnails, and structured data
- **Filtering Options**: Support for date ranges, file types, language, and more
- **Safe Search**: Built-in content filtering options

### API Comparison

| Feature | Free Tier (Programmable SE) | Paid Tier (JSON API) |
|---------|---------------------------|---------------------|
| Daily Queries | 100 queries/day | 10,000 queries/day |
| Cost | Free | $5 per 1,000 queries (after first 100) |
| API Access | Limited | Full programmatic access |
| Custom Search Engine | Required | Required |
| Rate Limiting | Yes | Yes (1 query/second) |

## How Google Custom Search Works

### Architecture Flow

```
User Query → Meowstik Agent Generation
    ↓
Web Search Triggered (automatically)
    ↓
Google Custom Search API Request
    ↓
Search Results (JSON)
    ↓
Results Processing & Grounding
    ↓
Integration with RAG System
    ↓
Enhanced Agent Generation
```

### API Request Structure

```typescript
GET https://www.googleapis.com/customsearch/v1
  ?key={API_KEY}
  &cx={SEARCH_ENGINE_ID}
  &q={QUERY}
  &num=10
  &fields=items(title,snippet,link,displayLink)
```

### Response Structure

```json
{
  "items": [
    {
      "title": "Page Title",
      "snippet": "Brief description of the page content...",
      "link": "https://example.com/page",
      "displayLink": "example.com"
    }
  ]
}
```

## Integration Architecture

### Component Design

```
┌─────────────────────────────────────────────┐
│         EnhancedGeminiService               │
│  (Orchestrates agent generation)            │
└───────────┬─────────────────────────────────┘
            │
            ├─► WebSearchService
            │   • performSearch(query)
            │   • formatResults()
            │   • cacheResults()
            │
            ├─► RAGService
            │   • addDocument() (search results)
            │   • retrieveRelevantDocuments()
            │
            └─► IngestionService
                • ingestSearchResults()
                • processAndIndex()
```

### Service Implementation

#### 1. WebSearchService

**Purpose**: Handle all web search operations using Google Custom Search API

**Key Methods**:
- `performSearch(query: string, options?: SearchOptions): Promise<SearchResult[]>`
- `searchForContext(agentQuery: string): Promise<string>`
- `getCachedResults(query: string): SearchResult[] | null`
- `clearCache(): void`

**Features**:
- API key management
- Request throttling and rate limiting
- Result caching to minimize API calls
- Error handling and fallback mechanisms
- Query optimization

#### 2. Enhanced Integration with RAGService

**Purpose**: Store and index web search results for future retrieval

**Enhancements**:
- New document type: `web_search_result`
- Metadata includes: source URL, search query, timestamp, relevance score
- Automatic deduplication of similar results
- Time-based relevance decay

#### 3. Modified EnhancedGeminiService

**Purpose**: Automatically trigger web searches during agent generation

**Changes**:
- Inject `WebSearchService` dependency
- Trigger search on every `generateAgentWithRAG()` call
- Combine web search results with RAG context
- Format search results for LLM consumption

## Implementation Strategy

### Phase 1: Core Service Implementation

1. **Create WebSearchService**
   - Set up Google Custom Search API integration
   - Implement caching layer
   - Add rate limiting
   - Create TypeScript types

2. **Configuration Setup**
   - Add environment variables for API keys
   - Create search configuration options
   - Set up default search parameters

### Phase 2: RAG Integration

1. **Extend IngestionService**
   - Add `ingestWebSearchResults()` method
   - Create specialized document type for search results
   - Implement deduplication logic

2. **Update StorageService**
   - Add search result persistence
   - Implement cache management
   - Track search history

### Phase 3: Agent Generation Enhancement

1. **Modify EnhancedGeminiService**
   - Inject WebSearchService
   - Trigger automatic searches
   - Format and combine context from multiple sources

2. **Prompt Engineering**
   - Design prompts to effectively use web search results
   - Add grounding instructions
   - Implement citation mechanisms

### Phase 4: UI and Configuration

1. **Add Settings Panel**
   - API key configuration
   - Enable/disable web search
   - Configure search frequency
   - Set search scope and filters

2. **Usage Statistics**
   - Track API usage
   - Display search quota
   - Show cost estimates

## Technical Specifications

### Environment Variables

```bash
# .env
GOOGLE_CUSTOM_SEARCH_API_KEY=your_api_key_here
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_engine_id_here
GEMINI_API_KEY=your_gemini_key_here
```

### TypeScript Types

```typescript
interface WebSearchOptions {
  numResults?: number;      // Default: 5
  dateRestrict?: string;    // e.g., "d7" for last 7 days
  siteSearch?: string;      // Restrict to specific domain
  fileType?: string;        // e.g., "pdf"
  language?: string;        // e.g., "en"
}

interface SearchResult {
  title: string;
  snippet: string;
  link: string;
  displayLink: string;
  timestamp: Date;
  relevance?: number;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
}
```

### Configuration Options

```typescript
interface WebSearchConfig {
  enabled: boolean;              // Default: true
  frequency: 'always' | 'conditional' | 'manual';  // Default: 'always'
  maxResultsPerSearch: number;   // Default: 5
  cacheEnabled: boolean;         // Default: true
  cacheTTL: number;             // Default: 3600 (1 hour)
  rateLimitPerMinute: number;   // Default: 10
  fallbackOnError: boolean;     // Default: true
}
```

## Usage Examples

### Basic Search Integration

```typescript
// Initialize services
const webSearchService = new WebSearchService(API_KEY, ENGINE_ID);
const enhancedGemini = new EnhancedGeminiService(GEMINI_KEY);

// Enable web search
await enhancedGemini.enableWebSearch(webSearchService);

// Generate agent (automatically triggers web search)
const agent = await enhancedGemini.generateAgentWithRAG(
  "Create a modern customer support agent",
  true  // useRAG flag
);

// Search results are automatically:
// 1. Retrieved from Google
// 2. Added to RAG context
// 3. Used to ground the agent generation
```

### Manual Search Control

```typescript
// Perform standalone search
const searchResults = await webSearchService.performSearch(
  "best practices for AI customer support"
);

// Ingest into RAG
await ingestionService.ingestWebSearchResults(
  searchResults,
  userId,
  "customer-support-research"
);
```

### Search with Options

```typescript
const results = await webSearchService.performSearch(
  "AI agent frameworks",
  {
    numResults: 10,
    dateRestrict: "m1",  // Last month
    language: "en"
  }
);
```

## Benefits

### 1. Current Information
- Access to up-to-date web content
- Real-time trends and best practices
- Latest technology developments

### 2. Grounded Responses
- Verifiable sources for generated content
- Reduced hallucination
- Fact-based agent specifications

### 3. Enhanced Context
- Broader knowledge base
- External validation of concepts
- Diverse perspectives

### 4. Knowledge Enrichment
- Continuous learning from web
- RAG system grows with searches
- Historical search context

## Cost Considerations

### Free Tier (100 queries/day)
- **Use Case**: Personal projects, development
- **Estimated Cost**: $0/month
- **Limitations**: ~3 agent generations per day (if 1 search per generation)

### Paid Tier
- **Cost**: $5 per 1,000 queries (after first 100 free)
- **Use Case**: Production use, frequent generations
- **Example**: 
  - 1,000 agent generations/month = 1,000 searches
  - First 100 free, remaining 900 = $4.50/month
  - 10,000 generations/month = ~$50/month

### Optimization Strategies

1. **Caching**: Cache search results to avoid duplicate API calls
2. **Conditional Searching**: Only search when query is significantly different
3. **Batch Processing**: Group similar queries
4. **Smart Triggers**: Only search when RAG context is insufficient

## Security Considerations

### API Key Management
- Store API keys in environment variables
- Never commit keys to version control
- Use separate keys for development/production
- Implement key rotation

### Rate Limiting
- Respect Google's rate limits (1 query/second)
- Implement exponential backoff on errors
- Queue requests to prevent throttling

### Content Filtering
- Enable SafeSearch by default
- Validate result URLs
- Sanitize search result content
- Filter sensitive information

## Testing Strategy

### Unit Tests
- WebSearchService API integration
- Result formatting and parsing
- Cache operations
- Error handling

### Integration Tests
- End-to-end search flow
- RAG integration
- Agent generation with search
- Multiple service coordination

### Manual Testing
- API quota usage
- Search result quality
- Context relevance
- Performance impact

## Future Enhancements

### Short-term (Phase 5)
- [ ] Search result ranking and filtering
- [ ] Multi-query search strategies
- [ ] Source credibility scoring
- [ ] Search result summarization

### Long-term (Phase 6)
- [ ] Semantic search result matching
- [ ] Automatic search query refinement
- [ ] Citation and attribution UI
- [ ] Search analytics dashboard
- [ ] Alternative search providers (Bing, DuckDuckGo)

## Getting Started

### Setup Instructions

1. **Obtain API Credentials**
   ```
   1. Visit https://console.cloud.google.com
   2. Enable Custom Search API
   3. Create API key
   4. Create Programmable Search Engine at https://programmablesearchengine.google.com
   5. Get Search Engine ID (cx parameter)
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env and add:
   GOOGLE_CUSTOM_SEARCH_API_KEY=your_key
   GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_id
   ```

3. **Install Dependencies**
   ```bash
   npm install
   # No additional dependencies needed - uses native fetch API
   ```

4. **Enable in UI**
   - Navigate to Settings
   - Enter API credentials
   - Toggle "Web Search" to enabled
   - Configure search frequency

## Alternatives Considered

### 1. Web Scraping
- **Pros**: No API costs
- **Cons**: Unreliable, slow, legal issues, blocked by sites

### 2. Bing Search API
- **Pros**: Similar features, different pricing
- **Cons**: Less comprehensive, separate integration needed

### 3. DuckDuckGo API
- **Pros**: Privacy-focused, free tier
- **Cons**: Limited features, no official API

### 4. SerpAPI
- **Pros**: Aggregates multiple search engines
- **Cons**: Additional abstraction layer, higher cost

**Decision**: Google Custom Search API chosen for reliability, comprehensive results, and reasonable pricing.

## Conclusion

Integrating Google Custom Search API into Meowstik will significantly enhance the system's ability to generate well-grounded, current, and accurate agent specifications. By automatically performing web searches during each generation cycle, the system can:

1. Access the latest information and best practices
2. Ground responses in verifiable web sources
3. Continuously enrich the RAG system with diverse knowledge
4. Reduce hallucination and improve accuracy

The implementation is straightforward, cost-effective for reasonable usage, and provides significant value to the agent generation process.

## References

- [Google Custom Search JSON API Documentation](https://developers.google.com/custom-search/v1/overview)
- [Programmable Search Engine Setup](https://programmablesearchengine.google.com/about/)
- [API Pricing](https://developers.google.com/custom-search/v1/overview#pricing)
- [Best Practices](https://developers.google.com/custom-search/docs/tutorial/introduction)

---

*Prepared for the Meowstik project - Integration of Google Custom Search for Enhanced Agent Generation*
