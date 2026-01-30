/**
 * Example: Testing Entity Recognition Service
 * 
 * Run with: npx ts-node examples/test-entity-recognition.ts
 */

import { createEntityRecognitionService } from '../src/services';

function testEntityRecognition() {
  console.log('=== Entity Recognition Service Test ===\n');

  const entityService = createEntityRecognitionService();

  const testQueries = [
    'Create a Python agent using FastAPI for REST APIs',
    'Build a customer support chatbot with React and Node.js',
    'Deploy a Docker container to AWS with Terraform',
    'Analyze data from PostgreSQL using Python pandas',
    'Create a code review agent for JavaScript and TypeScript',
    'Generate reports from last week using MongoDB',
  ];

  testQueries.forEach((query, idx) => {
    console.log(`Test ${idx + 1}: "${query}"`);
    console.log('─'.repeat(70));

    // Extract entities
    const entities = entityService.extractEntities(query);
    
    if (entities.length === 0) {
      console.log('  No entities detected\n');
      return;
    }

    console.log(`  Found ${entities.length} entities:\n`);
    entities.forEach(entity => {
      console.log(`    • ${entity.text}`);
      console.log(`      Type: ${entity.type}`);
      console.log(`      Confidence: ${(entity.confidence * 100).toFixed(0)}%`);
      console.log(`      Position: ${entity.startIndex}-${entity.endIndex}`);
      console.log('');
    });

    // Show enhanced query
    const enhanced = entityService.enhanceQuery(query);
    if (enhanced !== query) {
      console.log('  Enhanced Query:');
      console.log(`    ${enhanced}\n`);
    }

    // Show entity types
    const types = entityService.getEntityTypes(query);
    console.log('  Entity Types:', types.join(', '));
    console.log('\n');
  });

  // Test entity filtering
  console.log('Filter Test: Technology entities only');
  console.log('─'.repeat(70));
  
  const techQuery = 'Use Python, FastAPI, Docker, and PostgreSQL';
  const techEntities = entityService.filterEntitiesByType(
    techQuery,
    ['technology' as any]
  );
  
  console.log(`Query: "${techQuery}"`);
  console.log(`Found ${techEntities.length} technology entities:`);
  techEntities.forEach(e => {
    console.log(`  • ${e.text}`);
  });
  console.log('');
}

// Run the test
try {
  testEntityRecognition();
  console.log('✓ Test completed successfully');
  process.exit(0);
} catch (error) {
  console.error('✗ Test failed:', error);
  process.exit(1);
}
