# Web Search Integration Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing and using the Google Custom Search integration in Meowstik. The integration enables automatic web searches during agent generation to ground responses in current information.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting API Credentials](#getting-api-credentials)
3. [Configuration](#configuration)
4. [Usage](#usage)
5. [Code Examples](#code-examples)
6. [Integration with Existing Components](#integration-with-existing-components)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before implementing the web search integration, ensure you have:

- A Google Cloud Platform account
- Access to Google Custom Search API
- A Programmable Search Engine created
- Node.js and npm installed
- Meowstik project set up locally

## Getting API Credentials

### Step 1: Enable Google Custom Search API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services > Library**
4. Search for "Custom Search API"
5. Click **Enable**

### Step 2: Create API Key

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > API Key**
3. Copy the API key (you'll need this for `GOOGLE_CUSTOM_SEARCH_API_KEY`)
4. (Optional) Restrict the API key to Custom Search API only

### Step 3: Create Programmable Search Engine

1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com)
2. Click **Add** to create a new search engine
3. Configure your search engine:
   - **Sites to search**: Enter `www.google.com` to search the entire web
   - **Name**: Give your search engine a name (e.g., "Meowstik Web Search")
   - Click **Create**
4. After creation, click **Control Panel**
5. Under **Basic > Search engine ID**, copy the ID (you'll need this for `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`)
6. Under **Settings > Search features**, ensure "Search the entire web" is enabled

## Configuration

### Environment Variables

Create or update your `.env` file in the project root:

```bash
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Google Custom Search API credentials
GOOGLE_CUSTOM_SEARCH_API_KEY=your_custom_search_api_key_here
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_search_engine_id_here
```

### Service Initialization

Update your application initialization code to include WebSearchService:

```typescript
import { 
  EnhancedGeminiService,
  RAGService,
  StorageService,
  IngestionService,
  WebSearchService
} from '../services';

// Initialize services
const ragService = new RAGService(GEMINI_API_KEY);
const storageService = new StorageService();
const ingestionService = new IngestionService(ragService);
const geminiService = new EnhancedGeminiService(GEMINI_API_KEY);

// Enable RAG
await geminiService.enableRAG(ragService, storageService, ingestionService);

// Initialize and enable web search (NEW)
const webSearchService = new WebSearchService(
  GOOGLE_CUSTOM_SEARCH_API_KEY,
  GOOGLE_CUSTOM_SEARCH_ENGINE_ID,
  {
    enabled: true,
    frequency: 'always',
    maxResultsPerSearch: 5,
    cacheEnabled: true,
    cacheTTL: 3600,
  }
);

geminiService.enableWebSearch(webSearchService);
```

## Usage

### Basic Agent Generation with Web Search

```typescript
// Generate an agent - web search is triggered automatically
const agent = await geminiService.generateAgentWithRAG(
  "Create a customer support agent with modern best practices",
  true  // useRAG flag
);

// The system automatically:
// 1. Performs a web search for the query
// 2. Retrieves relevant RAG context
// 3. Combines both sources
// 4. Generates the agent
// 5. Stores results in RAG for future use
```

### Manual Web Search

```typescript
// Perform a standalone search
const searchResponse = await webSearchService.performSearch(
  "AI customer support best practices 2024",
  {
    numResults: 10,
    dateRestrict: "m1",  // Last month
    language: "en"
  }
);

console.log(`Found ${searchResponse.totalResults} results`);
searchResponse.results.forEach(result => {
  console.log(`- ${result.title}`);
  console.log(`  ${result.link}`);
  console.log(`  ${result.snippet}`);
});
```

### Search with Context Formatting

```typescript
// Get search results formatted for LLM consumption
const contextText = await webSearchService.searchForContext(
  "machine learning frameworks",
  { numResults: 5 }
);

console.log(contextText);
// Output:
// Web Search Results (5 results found):
// 
// [1] TensorFlow - Machine Learning Framework
// Source: tensorflow.org
// URL: https://tensorflow.org
// Summary: An end-to-end open source platform...
```

### Ingesting Search Results into RAG

```typescript
// Perform search
const searchResponse = await webSearchService.performSearch("AI agents");

// Ingest into RAG system
await ingestionService.ingestWebSearchResults(
  searchResponse.results,
  userId,
  "AI agents"
);

// Results are now available for future retrieval
const relevantDocs = await ragService.retrieveRelevantDocuments("AI agents", 5);
```

## Code Examples

### Example 1: React Hook Integration

```typescript
// useWebSearch.ts
import { useState, useEffect } from 'react';
import { WebSearchService } from '../services';

export function useWebSearch(apiKey: string, engineId: string) {
  const [service, setService] = useState<WebSearchService | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (apiKey && engineId) {
      try {
        const searchService = new WebSearchService(apiKey, engineId);
        setService(searchService);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    }
  }, [apiKey, engineId]);

  const search = async (query: string) => {
    if (!service) {
      setError('Search service not initialized');
      return null;
    }

    setIsSearching(true);
    setError(null);

    try {
      const results = await service.performSearch(query);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  return { service, isSearching, error, search };
}
```

### Example 2: Settings Panel Component

```typescript
// WebSearchSettings.tsx
import { useState } from 'react';

interface WebSearchSettingsProps {
  onSave: (apiKey: string, engineId: string) => void;
}

export function WebSearchSettings({ onSave }: WebSearchSettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [engineId, setEngineId] = useState('');

  return (
    <div className="web-search-settings">
      <h3>Web Search Configuration</h3>
      
      <div className="form-group">
        <label htmlFor="customSearchKey">Custom Search API Key:</label>
        <input
          id="customSearchKey"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Google Custom Search API key"
        />
      </div>

      <div className="form-group">
        <label htmlFor="searchEngineId">Search Engine ID:</label>
        <input
          id="searchEngineId"
          type="text"
          value={engineId}
          onChange={(e) => setEngineId(e.target.value)}
          placeholder="Enter your Search Engine ID"
        />
      </div>

      <button onClick={() => onSave(apiKey, engineId)}>
        Save Configuration
      </button>

      <div className="help-text">
        <p>Need credentials?</p>
        <ul>
          <li>
            <a href="https://console.cloud.google.com" target="_blank">
              Get API Key
            </a>
          </li>
          <li>
            <a href="https://programmablesearchengine.google.com" target="_blank">
              Create Search Engine
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
```

### Example 3: Statistics Display

```typescript
// WebSearchStats.tsx
import { useEffect, useState } from 'react';
import { EnhancedGeminiService } from '../services';

interface StatsProps {
  geminiService: EnhancedGeminiService;
}

export function WebSearchStats({ geminiService }: StatsProps) {
  const [stats, setStats] = useState(geminiService.getRAGStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(geminiService.getRAGStats());
    }, 5000);

    return () => clearInterval(interval);
  }, [geminiService]);

  return (
    <div className="web-search-stats">
      <h4>System Statistics</h4>
      <dl>
        <dt>RAG Enabled:</dt>
        <dd>{stats.enabled ? 'Yes' : 'No'}</dd>
        
        <dt>Web Search Enabled:</dt>
        <dd>{stats.webSearchEnabled ? 'Yes' : 'No'}</dd>
        
        <dt>Total Documents:</dt>
        <dd>{stats.documentCount}</dd>
        
        <dt>Cached Searches:</dt>
        <dd>{stats.webSearchCacheSize || 0}</dd>
        
        <dt>Conversations:</dt>
        <dd>{stats.conversationCount}</dd>
        
        <dt>Generated Agents:</dt>
        <dd>{stats.agentCount}</dd>
      </dl>
    </div>
  );
}
```

## Integration with Existing Components

### Updating AgentGenerator Component

Modify the existing `AgentGenerator.tsx` to support web search:

```typescript
// Add to imports
import { WebSearchService } from '../services';

// Add to state
const [webSearchEnabled, setWebSearchEnabled] = useState(false);
const [webSearchService, setWebSearchService] = useState<WebSearchService | null>(null);

// Add initialization function
const initializeWebSearch = (apiKey: string, engineId: string) => {
  try {
    const service = new WebSearchService(apiKey, engineId);
    setWebSearchService(service);
    
    // Enable in enhanced gemini service
    if (enhancedGeminiService) {
      enhancedGeminiService.enableWebSearch(service);
      setWebSearchEnabled(true);
    }
  } catch (error) {
    console.error('Failed to initialize web search:', error);
  }
};

// Add toggle function
const toggleWebSearch = () => {
  if (enhancedGeminiService) {
    if (webSearchEnabled) {
      enhancedGeminiService.disableWebSearch();
    } else {
      enhancedGeminiService.enableWebSearch(webSearchService!);
    }
    setWebSearchEnabled(!webSearchEnabled);
  }
};

// Add UI controls in the settings panel
<div className="web-search-control">
  <label>
    <input
      type="checkbox"
      checked={webSearchEnabled}
      onChange={toggleWebSearch}
      disabled={!webSearchService}
    />
    Enable Web Search
  </label>
</div>
```

### Updating useRAG Hook

Add web search support to the `useRAG` hook:

```typescript
// useRAG.ts modifications
import { WebSearchService } from '../services';

// Add to hook state
const [webSearchService, setWebSearchService] = useState<WebSearchService | null>(null);

// Add initialization
const initializeWebSearch = (apiKey: string, engineId: string) => {
  const service = new WebSearchService(apiKey, engineId);
  setWebSearchService(service);
  geminiService?.enableWebSearch(service);
  return service;
};

// Return from hook
return {
  // ... existing returns
  webSearchService,
  initializeWebSearch,
};
```

## Testing

### Unit Tests

```typescript
// WebSearchService.test.ts
import { WebSearchService } from './WebSearchService';

describe('WebSearchService', () => {
  let service: WebSearchService;

  beforeEach(() => {
    service = new WebSearchService('test-key', 'test-engine', {
      enabled: true,
      cacheEnabled: true,
    });
  });

  test('should initialize with config', () => {
    expect(service.isEnabled()).toBe(true);
  });

  test('should cache search results', async () => {
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          items: [{ title: 'Test', snippet: 'Test snippet', link: 'http://test.com' }],
          searchInformation: { totalResults: '1', searchTime: '0.1' }
        })
      })
    ) as jest.Mock;

    const result = await service.performSearch('test query');
    expect(result.results).toHaveLength(1);
    expect(service.getCacheSize()).toBe(1);
  });

  test('should respect rate limits', () => {
    const status = service.getRateLimitStatus();
    expect(status.rateLimitPerMinute).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```typescript
// EnhancedGeminiService.integration.test.ts
describe('EnhancedGeminiService with WebSearch', () => {
  test('should perform web search during agent generation', async () => {
    const geminiService = new EnhancedGeminiService(GEMINI_API_KEY);
    const webSearchService = new WebSearchService(SEARCH_API_KEY, ENGINE_ID);
    
    geminiService.enableWebSearch(webSearchService);
    
    const agent = await geminiService.generateAgentWithRAG(
      'Create a modern AI chatbot',
      true
    );
    
    expect(agent).toBeDefined();
    expect(agent.name).toBeTruthy();
  });
});
```

### Manual Testing Checklist

- [ ] API credentials are correctly configured
- [ ] Web search returns results for various queries
- [ ] Search results are cached appropriately
- [ ] Rate limiting prevents excessive API calls
- [ ] Search results are integrated into RAG
- [ ] Agent generation uses web search context
- [ ] Settings panel allows enabling/disabling web search
- [ ] Statistics display shows correct information
- [ ] Error handling works for API failures
- [ ] Fallback mode works when search fails

## Troubleshooting

### Common Issues

#### Issue: "API key invalid" error

**Solution:**
1. Verify your API key in Google Cloud Console
2. Check that Custom Search API is enabled
3. Ensure API key restrictions allow Custom Search API
4. Regenerate API key if necessary

#### Issue: "Search engine not found" error

**Solution:**
1. Verify Search Engine ID in Programmable Search Engine console
2. Ensure search engine is set to search the entire web
3. Check that search engine is not deleted

#### Issue: Rate limit exceeded

**Solution:**
1. Reduce `rateLimitPerMinute` in configuration
2. Enable caching to minimize redundant searches
3. Upgrade to paid tier for higher quota
4. Implement conditional searching instead of "always"

#### Issue: No search results returned

**Solution:**
1. Test with simple queries first (e.g., "javascript")
2. Check query formatting
3. Verify search engine configuration
4. Enable SafeSearch if results are filtered
5. Check for regional restrictions

#### Issue: Search is slow

**Solution:**
1. Enable caching with appropriate TTL
2. Reduce `numResults` parameter
3. Use `fields` parameter to limit response size
4. Consider implementing search result summarization

### Debug Mode

Enable detailed logging:

```typescript
const webSearchService = new WebSearchService(apiKey, engineId, {
  enabled: true,
  fallbackOnError: false,  // Throw errors instead of silent fallback
});

// Add console logging in service methods
```

### API Usage Monitoring

Check your API usage:

```typescript
// Get rate limit status
const status = webSearchService.getRateLimitStatus();
console.log(`Requests in last minute: ${status.requestsInLastMinute}`);
console.log(`Remaining: ${status.remainingRequests}`);

// Get cache statistics
console.log(`Cached searches: ${webSearchService.getCacheSize()}`);

// Get RAG stats including web search
const stats = geminiService.getRAGStats();
console.log('System stats:', stats);
```

## Best Practices

1. **Use Caching**: Always enable caching to minimize API costs
2. **Rate Limiting**: Set appropriate rate limits based on your quota
3. **Error Handling**: Enable `fallbackOnError` for production
4. **Query Optimization**: Use specific, focused search queries
5. **Result Filtering**: Use date restrictions and filters when relevant
6. **Cost Monitoring**: Track API usage regularly
7. **Security**: Never commit API keys to version control
8. **Testing**: Test with free tier before scaling up

## Cost Optimization

- Use the free 100 queries/day for development
- Enable aggressive caching (TTL: 3600+ seconds)
- Implement conditional searching (only when RAG is insufficient)
- Batch similar queries when possible
- Use `numResults: 5` instead of 10 to reduce processing time

## Next Steps

After implementing the basic integration:

1. Add search analytics dashboard
2. Implement query suggestion/refinement
3. Add source credibility scoring
4. Create citation UI for search sources
5. Implement semantic deduplication
6. Add multi-language support
7. Integrate alternative search providers

## Support

For issues or questions:
- Review the [proposal document](./GOOGLE_CUSTOM_SEARCH_PROPOSAL.md)
- Check [Google Custom Search API docs](https://developers.google.com/custom-search/v1/overview)
- Open an issue on GitHub

---

*Implementation guide for Meowstik Google Custom Search integration*
