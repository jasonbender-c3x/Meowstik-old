/**
 * Example: Using the GitHub Middleware
 * Demonstrates how to create issues and maintain continuity
 */

import { middleware, ContinuityManager } from './github-middleware';

/**
 * Example 1: Create a GitHub issue from the templates
 */
async function createIssueExample() {
  try {
    // Initialize middleware (acquires credentials)
    await middleware.initialize();

    // Create Issue 1: RAG Stack Ingestion Failure
    const issue1 = await middleware.createIssue({
      title: 'RAG Stack Ingestion Failure (Rule 1 Violation)',
      problem: `The Retrieval-Augmented Generation (RAG) stack is silently failing.
- Ingestion: Python script writes to root-level Firestore collection (tech_core)
- Retrieval: TypeScript backend looks in /artifacts/{appId}/public/data/knowledge_buckets
- Result: The "Brain" and "Eyes" are misaligned`,
      fix: `Align the Ingestion Path with the Retrieval Path:
1. Enforce Rule 1 (Strict Paths)
2. Use the same authorized location for both Python and TypeScript
3. Attach user_id to every record for proper isolation`,
      steps: `1. Locate ingestion script: scripts/analyze_logs.py
2. Inject App ID: Retrieve __app_id environment variable
3. Construct Path: Update Firestore collection reference
   - Old: db.collection("tech_core")
   - New: db.collection("artifacts").document(app_id).collection("public")...
4. Schema Compliance: Update data payload to include userId
5. Restart ingestion service`
    });

    console.log('✓ Created Issue 1:', issue1.html_url);

    // Create Issue 3: Memory Log Evaporation
    const issue3 = await middleware.createIssue({
      title: 'Memory Log Evaporation (Demand Paging Side-Effect)',
      problem: `Critical memory files (logs/personal.md, logs/Short_Term_Memory.md, logs/execution.md) are not being updated.
- Cause: "Demand Paging" optimization instructed LLM to ignore these files
- Result: System "Amnesia" - no persistence to long-term storage`,
      fix: `Decouple Reading (Demand Paging) from Writing (Persistence):
- Ignore log content in prompts (save space)
- Still append to logs at end of every turn`,
      steps: `1. Update prompts/core-directives.md with MANDATORY POST-ACTION
2. Verify files exist: touch logs/Short_Term_Memory.md logs/personal.md logs/execution.md
3. Add write hooks to append_file tool usage`
    });

    console.log('✓ Created Issue 3:', issue3.html_url);

  } catch (error) {
    console.error('✗ Error creating issues:', error);
  }
}

/**
 * Example 2: Load core context for LLM prompts
 */
function loadContextExample() {
  // Load core files
  const context = middleware.getCoreContext();
  
  console.log('Loaded core files:');
  for (const [file, content] of context.entries()) {
    console.log(`- ${file} (${content.length} chars)`);
  }

  // Format for prompt injection
  const formatted = ContinuityManager.formatForPrompt(context);
  
  // This would be injected into every LLM prompt
  console.log('\nFormatted context for prompt:');
  console.log(formatted.substring(0, 200) + '...');
}

/**
 * Example 3: Credentials check without creating issues
 */
async function checkCredentialsExample() {
  try {
    await middleware.initialize();
    console.log('✓ Credentials valid and middleware ready');
  } catch (error) {
    console.error('✗ Credentials missing:', error);
    console.log('Please set GITHUB_PAT in environment variables');
  }
}

// Run examples
if (require.main === module) {
  console.log('='.repeat(60));
  console.log('GitHub Middleware Examples');
  console.log('='.repeat(60));
  
  // Example 1: Create issues (commented out to prevent accidental creation)
  // createIssueExample();
  
  // Example 2: Load context
  console.log('\nExample 2: Loading Core Context\n');
  loadContextExample();
  
  // Example 3: Check credentials
  console.log('\nExample 3: Checking Credentials\n');
  checkCredentialsExample();
}

export { createIssueExample, loadContextExample, checkCredentialsExample };
