/**
 * Example: Using the Captain's Log Self-Evolution Engine
 * 
 * This example demonstrates how to use the Captain's Log feature to:
 * 1. Analyze logs for user opinions
 * 2. Generate a Captain's Log
 * 3. Create top 10 issues from opinions
 */

import { LogAnalyzer, IssueGenerator } from '../services/EvolutionService';
import { CaptainsLogService } from '../services/CaptainsLogService';
import type { CaptainsLogEntry } from '../types/evolution';

// Sample logs with user feedback
const sampleLogs = `
[2026-01-29T12:00:00Z] [AgentGenerator] [success] Generated agent
User comment: I love the new agent generator! It's super fast and awesome.
[2026-01-29T12:05:00Z] [RAGService] [error] Failed to retrieve context
User complaint: The RAG service is slow and unreliable, very frustrating.
User suggestion: Would be great if we could cache common queries for better performance.
[2026-01-29T12:10:00Z] [FileSystem] [success] Saved agent to disk
User note: The auto-save feature is fantastic! Prefer if it showed a notification though.
`;

// Analyze logs and extract opinions
const result = LogAnalyzer.analyze(sampleLogs, true);

console.log('Analysis Complete!');
console.log('- Total Logs:', result.totalLogs);
console.log('- Opinions Found:', result.opinions?.length || 0);
console.log('- Ideas:', result.opinions?.filter(o => o.type === 'idea').length || 0);
console.log('- Pet Peeves:', result.opinions?.filter(o => o.type === 'peeve').length || 0);

// Generate Captain's Log
if (result.opinions && result.opinions.length > 0) {
  const entry: CaptainsLogEntry = {
    timestamp: new Date().toISOString(),
    opinions: result.opinions,
    summary: `Analyzed ${result.totalLogs} logs and found ${result.opinions.length} opinions`,
  };

  const captainsLog = CaptainsLogService.generateCaptainsLog([entry]);
  console.log('\nCaptain\'s Log Generated:');
  console.log(captainsLog);

  // Save to file (in a real app)
  // fs.writeFileSync('captains-log.md', captainsLog);
}

// Generate top 10 issues
if (result.topIssues && result.topIssues.length > 0) {
  console.log('\nTop Issues:');
  result.topIssues.forEach((issue, i) => {
    console.log(`${i + 1}. [${issue.type}] ${issue.title} (Priority: ${issue.priority})`);
  });

  // Generate GitHub issues
  const githubIssues = IssueGenerator.generateIssuesFromTopIssues(result.topIssues);
  console.log(`\nGenerated ${githubIssues.length} GitHub issues ready to be created`);
}

export { sampleLogs, result };
