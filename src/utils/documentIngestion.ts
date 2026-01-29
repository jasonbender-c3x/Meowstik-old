import type { IngestionService } from '../services/IngestionService';

/**
 * Markdown documentation files to ingest into RAG
 * Maps filename to content - content will be loaded at runtime
 */
export interface MarkdownFile {
  path: string;
  title: string;
  tags?: string[];
}

/**
 * List of documentation files to ingest
 */
export const DOCUMENTATION_FILES: MarkdownFile[] = [
  {
    path: 'README.md',
    title: 'Meowstik README',
    tags: ['overview', 'quickstart', 'features'],
  },
  {
    path: 'AGENT_GENERATOR.md',
    title: 'Agent Generator Documentation',
    tags: ['agent', 'generator', 'guide'],
  },
  {
    path: 'CONTRIBUTING.md',
    title: 'Contributing Guidelines',
    tags: ['contributing', 'development'],
  },
  {
    path: 'CONVERSATION_HISTORY_COMPLETE.md',
    title: 'Conversation History Implementation',
    tags: ['conversation', 'history', 'chat'],
  },
  {
    path: 'DOCUMENTATION_INDEX.md',
    title: 'Documentation Index',
    tags: ['docs', 'index'],
  },
  {
    path: 'IMPLEMENTATION_NOTES.md',
    title: 'Implementation Notes',
    tags: ['implementation', 'technical'],
  },
  {
    path: 'IMPLEMENTATION_SUMMARY.md',
    title: 'Implementation Summary',
    tags: ['implementation', 'summary'],
  },
  {
    path: 'docs/MEMORY_AND_RAG.md',
    title: 'Memory and RAG Guide',
    tags: ['memory', 'rag', 'guide'],
  },
];

/**
 * Fetch and ingest markdown documentation files
 * @param ingestionService - Ingestion service instance
 * @param userId - User ID
 */
export async function ingestDocumentation(
  ingestionService: IngestionService,
  userId: string
): Promise<void> {
  console.log('Starting documentation ingestion...');
  
  for (const file of DOCUMENTATION_FILES) {
    try {
      // Fetch the markdown file
      const response = await fetch(`/${file.path}`);
      
      if (!response.ok) {
        console.warn(`Failed to fetch ${file.path}: ${response.status}`);
        continue;
      }
      
      const content = await response.text();
      
      // Ingest the markdown content
      await ingestionService.ingestMarkdown(content, {
        userId,
        source: file.path,
        title: file.title,
        tags: file.tags,
      });
      
      console.log(`✓ Ingested ${file.path}`);
    } catch (error) {
      console.error(`Failed to ingest ${file.path}:`, error);
    }
  }
  
  console.log('Documentation ingestion complete!');
}

/**
 * Example agent specifications for initial ingestion
 * These serve as examples for the RAG system
 */
export const EXAMPLE_AGENTS = [
  {
    id: 'example-customer-support',
    name: 'Customer Support Agent',
    description: 'Handles customer inquiries and support tickets',
    role: 'Customer Support Specialist',
    capabilities: ['ticket management', 'FAQ responses', 'escalation handling'],
    tools: [
      { name: 'ticket-system', description: 'Access to support ticket database' },
      { name: 'knowledge-base', description: 'Search company knowledge base' },
    ],
    personality: {
      tone: 'friendly and professional',
      traits: ['patient', 'empathetic', 'solution-oriented'],
    },
    metadata: {
      version: '1.0.0',
      author: 'system',
      tags: ['support', 'customer-service'],
    },
  },
  {
    id: 'example-code-reviewer',
    name: 'Code Review Agent',
    description: 'Reviews code for best practices and potential issues',
    role: 'Code Quality Analyst',
    capabilities: ['static analysis', 'style checking', 'security review'],
    tools: [
      { name: 'linter', description: 'Run code linters and formatters' },
      { name: 'security-scanner', description: 'Scan for security vulnerabilities' },
    ],
    personality: {
      tone: 'constructive and educational',
      traits: ['detail-oriented', 'thorough', 'helpful'],
    },
    metadata: {
      version: '1.0.0',
      author: 'system',
      tags: ['code-review', 'development', 'quality'],
    },
  },
  {
    id: 'example-data-analyst',
    name: 'Data Analyst Agent',
    description: 'Analyzes data and generates insights',
    role: 'Data Analyst',
    capabilities: ['data visualization', 'statistical analysis', 'report generation'],
    tools: [
      { name: 'data-query', description: 'Query databases and data sources' },
      { name: 'visualization', description: 'Create charts and graphs' },
    ],
    personality: {
      tone: 'analytical and precise',
      traits: ['data-driven', 'thorough', 'insightful'],
    },
    metadata: {
      version: '1.0.0',
      author: 'system',
      tags: ['data', 'analytics', 'insights'],
    },
  },
];

/**
 * Ingest example agents
 * @param ingestionService - Ingestion service instance
 * @param userId - User ID
 */
export async function ingestExampleAgents(
  ingestionService: IngestionService,
  userId: string
): Promise<void> {
  console.log('Ingesting example agents...');
  
  await ingestionService.ingestAgents(EXAMPLE_AGENTS as any, userId);
  
  console.log('✓ Example agents ingested');
}
