/**
 * Example: Testing Hybrid Search Service
 * 
 * Run with: npx ts-node examples/test-hybrid-search.ts
 * Or debug in your IDE by setting breakpoints
 */

import { 
  createRAGService, 
  createHybridSearchService,
  Document 
} from '../src/services';

async function testHybridSearch() {
  console.log('=== Hybrid Search Service Test ===\n');

  // Create services
  const apiKey = process.env.GOOGLE_API_KEY || 'your-api-key-here';
  const ragService = createRAGService(apiKey);
  const hybridSearch = createHybridSearchService();

  // Sample documents
  const sampleDocs = [
    {
      content: 'Python is a high-level programming language known for its simplicity and readability. It is widely used in data science, web development, and automation.',
      metadata: { type: 'documentation' as const, title: 'Python Overview' }
    },
    {
      content: 'JavaScript is the language of the web, used for both frontend and backend development. Node.js enables JavaScript to run on servers.',
      metadata: { type: 'documentation' as const, title: 'JavaScript Overview' }
    },
    {
      content: 'FastAPI is a modern Python web framework for building APIs. It is fast, easy to use, and supports async operations.',
      metadata: { type: 'documentation' as const, title: 'FastAPI Guide' }
    },
    {
      content: 'React is a JavaScript library for building user interfaces. It uses a component-based architecture and virtual DOM.',
      metadata: { type: 'documentation' as const, title: 'React Introduction' }
    },
    {
      content: 'Docker is a containerization platform that packages applications with their dependencies for consistent deployment.',
      metadata: { type: 'documentation' as const, title: 'Docker Basics' }
    }
  ];

  console.log('Step 1: Adding documents to RAG...');
  const documents: Document[] = [];
  for (const doc of sampleDocs) {
    try {
      const added = await ragService.addDocument(doc.content, doc.metadata);
      documents.push(added);
      console.log(`  ✓ Added: ${doc.metadata.title}`);
    } catch (error) {
      console.error(`  ✗ Failed to add ${doc.metadata.title}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`\nTotal documents indexed: ${documents.length}\n`);

  // Set documents for hybrid search
  hybridSearch.setDocuments(documents);
  console.log('Step 2: Hybrid search index built\n');

  // Test queries
  const testQueries = [
    'Python web framework',
    'JavaScript frontend library',
    'containerization deployment',
  ];

  for (const query of testQueries) {
    console.log(`Query: "${query}"`);
    console.log('─'.repeat(50));

    // Vector search only
    console.log('\n  Vector Search Results:');
    try {
      const vectorResults = await ragService.retrieveRelevantDocuments(query, 3);
      vectorResults.forEach((result, idx) => {
        console.log(`    ${idx + 1}. ${result.document.metadata.title} (score: ${result.similarity.toFixed(3)})`);
      });
    } catch (error) {
      console.error('    Error:', error instanceof Error ? error.message : error);
    }

    // Keyword search only
    console.log('\n  Keyword Search Results (BM25):');
    const keywordResults = hybridSearch.keywordSearch(query, 3);
    keywordResults.forEach((result, idx) => {
      console.log(`    ${idx + 1}. ${result.document.metadata.title} (score: ${result.similarity.toFixed(3)})`);
    });

    // Hybrid search
    console.log('\n  Hybrid Search Results (70% vector, 30% keyword):');
    try {
      const vectorResults = await ragService.retrieveRelevantDocuments(query, 5);
      const hybridResults = hybridSearch.hybridSearch(vectorResults, query, 3, 0.7);
      hybridResults.forEach((result, idx) => {
        console.log(`    ${idx + 1}. ${result.document.metadata.title} (score: ${result.similarity.toFixed(3)})`);
      });
    } catch (error) {
      console.error('    Error:', error instanceof Error ? error.message : error);
    }

    console.log('\n');
  }
}

// Run the test
testHybridSearch()
  .then(() => {
    console.log('✓ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Test failed:', error);
    process.exit(1);
  });
