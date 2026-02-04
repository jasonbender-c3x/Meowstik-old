/**
 * Example: Using Web Search Integration with Meowstik
 * 
 * This file demonstrates how to integrate Google Custom Search
 * with the Meowstik agent generation system.
 */

import {
  EnhancedGeminiService,
  RAGService,
  StorageService,
  IngestionService,
  WebSearchService,
} from '../services';

// Example 1: Basic Setup with Web Search
async function example1_BasicSetup() {
  console.log('=== Example 1: Basic Setup with Web Search ===\n');

  // Get API keys from environment or configuration
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'your-gemini-key';
  const GOOGLE_CUSTOM_SEARCH_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || 'your-search-key';
  const GOOGLE_CUSTOM_SEARCH_ENGINE_ID = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID || 'your-engine-id';

  // Initialize all services
  const ragService = new RAGService(GEMINI_API_KEY);
  const storageService = new StorageService();
  const ingestionService = new IngestionService(ragService);
  const geminiService = new EnhancedGeminiService(GEMINI_API_KEY);

  // Enable RAG
  await geminiService.enableRAG(ragService, storageService, ingestionService);
  console.log('✓ RAG enabled');

  // Initialize and enable web search
  const webSearchService = new WebSearchService(
    GOOGLE_CUSTOM_SEARCH_API_KEY,
    GOOGLE_CUSTOM_SEARCH_ENGINE_ID,
    {
      enabled: true,
      frequency: 'always',
      maxResultsPerSearch: 5,
      cacheEnabled: true,
      cacheTTL: 3600, // 1 hour cache
    }
  );

  geminiService.enableWebSearch(webSearchService);
  console.log('✓ Web search enabled');

  // Generate an agent with automatic web search
  console.log('\nGenerating agent...');
  const agent = await geminiService.generateAgentWithRAG(
    'Create a modern customer support chatbot with sentiment analysis',
    true // Use RAG (which now includes web search)
  );

  console.log(`\n✓ Agent generated: ${agent.name}`);
  console.log(`Description: ${agent.description}`);
  console.log(`Capabilities: ${agent.capabilities.join(', ')}`);

  // Check statistics
  const stats = geminiService.getRAGStats();
  console.log('\nSystem Statistics:');
  console.log(`- RAG Enabled: ${stats.enabled}`);
  console.log(`- Web Search Enabled: ${stats.webSearchEnabled}`);
  console.log(`- Total Documents: ${stats.documentCount}`);
  console.log(`- Cached Searches: ${stats.webSearchCacheSize}`);
}

// Example 2: Manual Web Search
async function example2_ManualSearch() {
  console.log('\n\n=== Example 2: Manual Web Search ===\n');

  const webSearchService = new WebSearchService(
    process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || '',
    process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID || ''
  );

  // Perform a search
  const searchResponse = await webSearchService.performSearch(
    'AI chatbot best practices 2024',
    {
      numResults: 5,
      dateRestrict: 'm1', // Last month
      language: 'en',
    }
  );

  console.log(`Search Query: "${searchResponse.query}"`);
  console.log(`Total Results: ${searchResponse.totalResults}`);
  console.log(`Search Time: ${searchResponse.searchTime.toFixed(3)}s\n`);

  console.log('Top Results:');
  searchResponse.results.forEach((result, idx) => {
    console.log(`\n${idx + 1}. ${result.title}`);
    console.log(`   ${result.link}`);
    console.log(`   ${result.snippet}`);
  });
}

// Example 3: Search with Context Formatting
async function example3_SearchForContext() {
  console.log('\n\n=== Example 3: Search with Context Formatting ===\n');

  const webSearchService = new WebSearchService(
    process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || '',
    process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID || ''
  );

  // Get formatted context for LLM
  const contextText = await webSearchService.searchForContext(
    'machine learning frameworks comparison',
    { numResults: 3 }
  );

  console.log('Formatted Context for LLM:');
  console.log('----------------------------');
  console.log(contextText);
}

// Example 4: Ingesting Search Results into RAG
async function example4_IngestSearchResults() {
  console.log('\n\n=== Example 4: Ingesting Search Results into RAG ===\n');

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
  const ragService = new RAGService(GEMINI_API_KEY);
  const ingestionService = new IngestionService(ragService);
  const storageService = new StorageService();

  const webSearchService = new WebSearchService(
    process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || '',
    process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID || ''
  );

  // Perform search
  console.log('Searching for: "natural language processing tools"');
  const searchResponse = await webSearchService.performSearch(
    'natural language processing tools',
    { numResults: 5 }
  );

  console.log(`✓ Found ${searchResponse.results.length} results`);

  // Ingest into RAG
  const userId = storageService.getUserId();
  await ingestionService.ingestWebSearchResults(
    searchResponse.results,
    userId,
    'natural language processing tools'
  );

  console.log('✓ Search results ingested into RAG');

  // Now retrieve relevant documents
  const relevantDocs = await ragService.retrieveRelevantDocuments(
    'NLP libraries and frameworks',
    5
  );

  console.log(`\n✓ Retrieved ${relevantDocs.length} relevant documents from RAG`);
  relevantDocs.forEach((doc, idx) => {
    console.log(`\n${idx + 1}. ${doc.document.metadata.title || 'Untitled'}`);
    console.log(`   Similarity: ${(doc.similarity * 100).toFixed(1)}%`);
    console.log(`   Type: ${doc.document.metadata.type}`);
  });
}

// Example 5: Rate Limit Management
async function example5_RateLimitManagement() {
  console.log('\n\n=== Example 5: Rate Limit Management ===\n');

  const webSearchService = new WebSearchService(
    process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || '',
    process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID || '',
    {
      rateLimitPerMinute: 5, // Lower rate limit
      fallbackOnError: true, // Graceful degradation
    }
  );

  // Check rate limit status
  let status = webSearchService.getRateLimitStatus();
  console.log('Initial Rate Limit Status:');
  console.log(`- Requests in last minute: ${status.requestsInLastMinute}`);
  console.log(`- Remaining requests: ${status.remainingRequests}`);
  console.log(`- Rate limit: ${status.rateLimitPerMinute}/min`);

  // Perform a search
  await webSearchService.performSearch('test query 1');
  console.log('\n✓ Search 1 completed');

  // Check status again
  status = webSearchService.getRateLimitStatus();
  console.log(`- Remaining requests: ${status.remainingRequests}`);

  // Perform another search
  await webSearchService.performSearch('test query 2');
  console.log('\n✓ Search 2 completed');

  status = webSearchService.getRateLimitStatus();
  console.log(`- Remaining requests: ${status.remainingRequests}`);
}

// Example 6: Cache Management
async function example6_CacheManagement() {
  console.log('\n\n=== Example 6: Cache Management ===\n');

  const webSearchService = new WebSearchService(
    process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || '',
    process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID || '',
    {
      cacheEnabled: true,
      cacheTTL: 300, // 5 minutes
    }
  );

  console.log('Initial cache size:', webSearchService.getCacheSize());

  // First search - hits API
  console.log('\nPerforming first search (hits API)...');
  const start1 = Date.now();
  await webSearchService.performSearch('javascript frameworks');
  const time1 = Date.now() - start1;
  console.log(`✓ Completed in ${time1}ms`);
  console.log('Cache size:', webSearchService.getCacheSize());

  // Second search - uses cache
  console.log('\nPerforming same search again (uses cache)...');
  const start2 = Date.now();
  await webSearchService.performSearch('javascript frameworks');
  const time2 = Date.now() - start2;
  console.log(`✓ Completed in ${time2}ms`);
  console.log('Cache size:', webSearchService.getCacheSize());

  console.log(`\nCache speedup: ${(time1 / time2).toFixed(2)}x faster`);

  // Clear cache
  webSearchService.clearCache();
  console.log('\nCache cleared. Size:', webSearchService.getCacheSize());
}

// Example 7: Error Handling
async function example7_ErrorHandling() {
  console.log('\n\n=== Example 7: Error Handling ===\n');

  // Test with graceful fallback
  const webSearchService1 = new WebSearchService(
    'invalid-key',
    'invalid-engine',
    {
      fallbackOnError: true, // Returns empty results instead of throwing
    }
  );

  console.log('Testing with invalid credentials (fallback enabled)...');
  try {
    const result = await webSearchService1.performSearch('test query');
    console.log(`✓ Fallback worked. Results: ${result.results.length}`);
  } catch (error) {
    console.log('✗ Error:', error);
  }

  // Test without fallback
  const webSearchService2 = new WebSearchService(
    'invalid-key',
    'invalid-engine',
    {
      fallbackOnError: false, // Throws errors
    }
  );

  console.log('\nTesting with invalid credentials (fallback disabled)...');
  try {
    await webSearchService2.performSearch('test query');
    console.log('✓ Search completed');
  } catch (error) {
    console.log('✗ Error caught:', error instanceof Error ? error.message : error);
  }
}

// Example 8: Advanced Search Options
async function example8_AdvancedSearchOptions() {
  console.log('\n\n=== Example 8: Advanced Search Options ===\n');

  const webSearchService = new WebSearchService(
    process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || '',
    process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID || ''
  );

  // Search with date restriction
  console.log('1. Search limited to last week:');
  const recent = await webSearchService.performSearch(
    'AI news',
    { dateRestrict: 'd7', numResults: 3 }
  );
  console.log(`   Found ${recent.results.length} results`);

  // Search specific site
  console.log('\n2. Search specific domain:');
  const siteSpecific = await webSearchService.performSearch(
    'machine learning',
    { siteSearch: 'github.com', numResults: 3 }
  );
  console.log(`   Found ${siteSpecific.results.length} results from github.com`);

  // Search for specific file type
  console.log('\n3. Search for PDF files:');
  const pdfSearch = await webSearchService.performSearch(
    'neural networks',
    { fileType: 'pdf', numResults: 3 }
  );
  console.log(`   Found ${pdfSearch.results.length} PDF results`);
}

// Example 9: Complete Integration Flow
async function example9_CompleteFlow() {
  console.log('\n\n=== Example 9: Complete Integration Flow ===\n');

  // Initialize all services
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
  const SEARCH_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || '';
  const SEARCH_ENGINE_ID = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID || '';

  console.log('1. Initializing services...');
  const ragService = new RAGService(GEMINI_API_KEY);
  const storageService = new StorageService();
  const ingestionService = new IngestionService(ragService);
  const geminiService = new EnhancedGeminiService(GEMINI_API_KEY);
  const webSearchService = new WebSearchService(SEARCH_API_KEY, SEARCH_ENGINE_ID);

  console.log('2. Enabling RAG and Web Search...');
  await geminiService.enableRAG(ragService, storageService, ingestionService);
  geminiService.enableWebSearch(webSearchService);

  console.log('3. Generating agent with web search grounding...');
  const agent = await geminiService.generateAgentWithRAG(
    'Create an AI research assistant that can analyze academic papers',
    true
  );

  console.log('\n✓ Agent Generated:');
  console.log(`   Name: ${agent.name}`);
  console.log(`   Description: ${agent.description}`);
  console.log(`   Capabilities: ${agent.capabilities.length}`);

  console.log('\n4. Checking system statistics...');
  const stats = geminiService.getRAGStats();
  console.log(`   - Documents indexed: ${stats.documentCount}`);
  console.log(`   - Web search enabled: ${stats.webSearchEnabled}`);
  console.log(`   - Cached searches: ${stats.webSearchCacheSize}`);

  console.log('\n5. Searching previous knowledge base...');
  const similarAgents = await geminiService.searchAgents('research assistant', 3);
  console.log(`   - Found ${similarAgents.length} similar agents`);
}

// Main execution
async function runExamples() {
  try {
    // Check if API keys are configured
    if (!process.env.GEMINI_API_KEY) {
      console.log('⚠️  GEMINI_API_KEY not found in environment variables');
      console.log('   Set it in .env file or export it before running examples');
    }

    if (!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY || !process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID) {
      console.log('⚠️  Google Custom Search credentials not found');
      console.log('   Set GOOGLE_CUSTOM_SEARCH_API_KEY and GOOGLE_CUSTOM_SEARCH_ENGINE_ID');
      console.log('   See docs/WEB_SEARCH_IMPLEMENTATION_GUIDE.md for setup instructions');
    }

    console.log('\n' + '='.repeat(60));
    console.log('Meowstik Web Search Integration Examples');
    console.log('='.repeat(60));

    // Run examples (uncomment the ones you want to try)
    
    // await example1_BasicSetup();
    // await example2_ManualSearch();
    // await example3_SearchForContext();
    // await example4_IngestSearchResults();
    // await example5_RateLimitManagement();
    // await example6_CacheManagement();
    // await example7_ErrorHandling();
    // await example8_AdvancedSearchOptions();
    // await example9_CompleteFlow();

    console.log('\n' + '='.repeat(60));
    console.log('Examples completed!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error running examples:', error);
  }
}

// Export examples for use in other modules
export {
  example1_BasicSetup,
  example2_ManualSearch,
  example3_SearchForContext,
  example4_IngestSearchResults,
  example5_RateLimitManagement,
  example6_CacheManagement,
  example7_ErrorHandling,
  example8_AdvancedSearchOptions,
  example9_CompleteFlow,
};

// Run if executed directly
if (require.main === module) {
  runExamples();
}
