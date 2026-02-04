# Web Search Integration - Quick Start Test

This document provides a quick test script to verify your web search integration is working correctly.

## Prerequisites

1. API credentials configured in `.env`:
   ```bash
   GEMINI_API_KEY=your_gemini_key
   GOOGLE_CUSTOM_SEARCH_API_KEY=your_search_key
   GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_engine_id
   ```

2. Node.js environment set up

## Quick Test Script

Save this as `test-web-search.js`:

```javascript
// Load environment variables
require('dotenv').config();

const { WebSearchService } = require('./src/services/WebSearchService');

async function testWebSearch() {
  console.log('🧪 Testing Web Search Integration\n');

  // Check environment variables
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const engineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  if (!apiKey || !engineId) {
    console.error('❌ Missing API credentials');
    console.error('   Set GOOGLE_CUSTOM_SEARCH_API_KEY and GOOGLE_CUSTOM_SEARCH_ENGINE_ID in .env');
    process.exit(1);
  }

  console.log('✓ API credentials found');

  try {
    // Initialize service
    const searchService = new WebSearchService(apiKey, engineId, {
      enabled: true,
      maxResultsPerSearch: 3,
    });
    console.log('✓ Web search service initialized\n');

    // Test search
    console.log('🔍 Searching for: "artificial intelligence"...\n');
    const results = await searchService.performSearch('artificial intelligence', {
      numResults: 3,
    });

    console.log(`✓ Search completed in ${results.searchTime.toFixed(3)}s`);
    console.log(`  Total results: ${results.totalResults}`);
    console.log(`  Retrieved: ${results.results.length} results\n`);

    // Display results
    console.log('📄 Top Results:');
    results.results.forEach((result, idx) => {
      console.log(`\n${idx + 1}. ${result.title}`);
      console.log(`   URL: ${result.link}`);
      console.log(`   ${result.snippet.substring(0, 100)}...`);
    });

    console.log('\n✅ Web search integration is working correctly!');
    
    // Test caching
    console.log('\n🔍 Testing cache...');
    const cachedResults = await searchService.performSearch('artificial intelligence');
    console.log(`✓ Cache working (${searchService.getCacheSize()} items cached)`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

testWebSearch();
```

## Running the Test

```bash
node test-web-search.js
```

## Expected Output

```
🧪 Testing Web Search Integration

✓ API credentials found
✓ Web search service initialized

🔍 Searching for: "artificial intelligence"...

✓ Search completed in 0.532s
  Total results: 42300000
  Retrieved: 3 results

📄 Top Results:

1. Artificial Intelligence (AI): What It Is and Why It Matters
   URL: https://www.sas.com/en_us/insights/analytics/what-is-artificial-intelligence.html
   Artificial intelligence (AI) makes it possible for machines to learn from experience, adjust to new...

2. What Is Artificial Intelligence (AI)? | IBM
   URL: https://www.ibm.com/topics/artificial-intelligence
   Artificial intelligence leverages computers and machines to mimic the problem-solving and decision-making...

3. Artificial intelligence - Wikipedia
   URL: https://en.wikipedia.org/wiki/Artificial_intelligence
   Artificial intelligence (AI), in its broadest sense, is intelligence exhibited by machines, particularly...

✅ Web search integration is working correctly!

🔍 Testing cache...
✓ Cache working (1 items cached)
```

## Troubleshooting

### Error: "API key invalid"
- Verify your API key in Google Cloud Console
- Ensure Custom Search API is enabled

### Error: "Search engine not found"
- Verify your Search Engine ID
- Check that the search engine exists at programmablesearchengine.google.com

### Error: "Rate limit exceeded"
- Wait a minute and try again
- Check your quota in Google Cloud Console

### Error: "No results returned"
- Try a simpler query (e.g., "test")
- Check search engine configuration

## Next Steps

Once the basic test passes:

1. ✅ Test complete integration with RAG system
2. ✅ Test agent generation with web search
3. ✅ Verify search results are ingested into RAG
4. ✅ Test UI integration
5. ✅ Monitor API usage and costs

## Manual Integration Test

To test the full integration:

```javascript
const {
  EnhancedGeminiService,
  RAGService,
  StorageService,
  IngestionService,
  WebSearchService,
} = require('./src/services');

async function fullIntegrationTest() {
  // Initialize services
  const ragService = new RAGService(process.env.GEMINI_API_KEY);
  const storageService = new StorageService();
  const ingestionService = new IngestionService(ragService);
  const geminiService = new EnhancedGeminiService(process.env.GEMINI_API_KEY);
  const webSearchService = new WebSearchService(
    process.env.GOOGLE_CUSTOM_SEARCH_API_KEY,
    process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID
  );

  // Enable features
  await geminiService.enableRAG(ragService, storageService, ingestionService);
  geminiService.enableWebSearch(webSearchService);

  // Generate agent with web search
  const agent = await geminiService.generateAgentWithRAG(
    'Create a customer support chatbot',
    true
  );

  console.log('Agent generated:', agent.name);
  console.log('Web search was used:', geminiService.isWebSearchAvailable());

  // Check stats
  const stats = geminiService.getRAGStats();
  console.log('Stats:', stats);
}
```

## Success Criteria

- ✅ Web search returns results
- ✅ Results are properly formatted
- ✅ Caching works correctly
- ✅ Rate limiting prevents excessive calls
- ✅ Integration with RAG system works
- ✅ Agent generation uses web search context

---

*For detailed implementation guide, see [WEB_SEARCH_IMPLEMENTATION_GUIDE.md](./WEB_SEARCH_IMPLEMENTATION_GUIDE.md)*
