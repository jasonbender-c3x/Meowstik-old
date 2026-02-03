/**
 * GitHub Middleware for Issue/Commit Lifecycle Automation (V1.0)
 * Implements the operational directives from the fix issue
 */

/**
 * Configuration interface for GitHub middleware
 */
interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
}

/**
 * Issue creation payload interface
 */
interface IssuePayload {
  title: string;
  body: string;
  labels?: string[];
  assignee?: string;
}

/**
 * 1. Credentials Acquisition & Environment Check
 * Attempts to obtain GitHub Personal Access Token (PAT)
 */
export class CredentialsManager {
  /**
   * Fetch GitHub PAT from environment or database
   * Priority: Database (secrets table) -> Environment Variables
   */
  static async acquireToken(): Promise<string | null> {
    // First, try environment variables (if in Node.js)
    const envToken = (typeof process !== 'undefined' && process.env) 
      ? (process.env.GITHUB_PAT || process.env.GITHUB_TOKEN)
      : null;
    
    if (envToken) {
      console.log('✓ GitHub token found in environment variables');
      return envToken;
    }

    // Second, try to fetch from secrets database (if schema exists)
    try {
      const dbToken = await this.fetchFromDatabase();
      if (dbToken) {
        console.log('✓ GitHub token found in database');
        return dbToken;
      }
    } catch (error) {
      console.warn('⚠ Could not fetch from database:', error);
    }

    // No token found
    console.error('✗ GitHub credentials missing');
    return null;
  }

  /**
   * Fetch token from database secrets table
   * This is a placeholder - actual implementation depends on database schema
   */
  private static async fetchFromDatabase(): Promise<string | null> {
    // TODO: Implement actual database query
    // Query: SELECT value FROM secrets WHERE key = 'GITHUB_PAT'
    // Reference: shared/schema.ts
    return null;
  }

  /**
   * Validate that credentials are present
   * Throws error if missing, prompting operator
   */
  static validateCredentials(token: string | null): asserts token is string {
    if (!token) {
      throw new Error(
        'GitHub credentials missing. Please set GITHUB_PAT in environment variables.'
      );
    }
  }
}

/**
 * 2. API Execution Protocol
 * Uses standard HTTP primitives for GitHub REST API calls
 */
export class GitHubClient {
  private config: GitHubConfig;
  private baseURL = 'https://api.github.com';

  constructor(config: GitHubConfig) {
    this.config = config;
  }

  /**
   * 2.1 Issue Creation
   * POST /repos/{owner}/{repo}/issues
   */
  async createIssue(issueData: {
    title: string;
    problem: string;
    fix: string;
    steps: string;
  }): Promise<any> {
    const payload: IssuePayload = {
      title: issueData.title,
      body: `### Problem
${issueData.problem}

### Fix
${issueData.fix}

### Implementation
${issueData.steps}

---
*Note: @github-copilot Please generate a PR to implement the fix described in the steps above.*
`,
      labels: ['bug', 'RKS-CORE', 'auto-generated'],
      assignee: 'jasonbender'
    };

    const endpoint = `/repos/${this.config.owner}/${this.config.repo}/issues`;
    
    return this.makeRequest('POST', endpoint, payload);
  }

  /**
   * Make HTTP request to GitHub API
   */
  private async makeRequest(
    method: string,
    endpoint: string,
    body?: any
  ): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

/**
 * 3. Continuity Mandate
 * Ensures core directives are always available
 */
export class ContinuityManager {
  private static CORE_FILES = [
    'docs/AI_CORE_DIRECTIVE.md',
    'docs/TODO_SYSTEM.md',
    'logs/Short_Term_Memory.md'
  ];

  /**
   * Load and return content of core files (Source of Truth)
   * This should be injected with every LLM prompt to prevent amnesia
   * Note: This is a placeholder for browser environment
   * In Node.js environment, this would use fs.readFileSync
   */
  static async loadCoreContext(basePath: string = '.'): Promise<Map<string, string>> {
    const context = new Map<string, string>();

    // In browser environment, files would need to be fetched via HTTP
    // or loaded through file system access API
    // This is a placeholder implementation
    for (const filePath of this.CORE_FILES) {
      try {
        // Attempt to fetch from server if available
        const response = await fetch(`/${filePath}`);
        if (response.ok) {
          const content = await response.text();
          context.set(filePath, content);
        } else {
          console.warn(`⚠ Core file not found: ${filePath}`);
        }
      } catch (error) {
        console.warn(`⚠ Could not load ${filePath} (may not be in browser context)`);
      }
    }

    return context;
  }

  /**
   * Format core context for prompt injection
   */
  static formatForPrompt(context: Map<string, string>): string {
    let formatted = '## System Context (Source of Truth)\n\n';
    
    for (const [file, content] of context.entries()) {
      formatted += `### ${file}\n\n${content}\n\n---\n\n`;
    }

    return formatted;
  }
}

/**
 * Main middleware orchestrator
 */
export class MeowstikMiddleware {
  private client: GitHubClient | null = null;
  private initialized = false;

  /**
   * Initialize middleware with credentials
   */
  async initialize(): Promise<void> {
    const token = await CredentialsManager.acquireToken();
    CredentialsManager.validateCredentials(token);

    this.client = new GitHubClient({
      owner: 'jasonbender-c3x',
      repo: 'Meowstik-old',
      token
    });

    this.initialized = true;
    console.log('✓ Meowstik Middleware initialized');
  }

  /**
   * Create GitHub issue from template
   */
  async createIssue(issueData: {
    title: string;
    problem: string;
    fix: string;
    steps: string;
  }): Promise<any> {
    if (!this.initialized || !this.client) {
      throw new Error('Middleware not initialized. Call initialize() first.');
    }

    return this.client.createIssue(issueData);
  }

  /**
   * Get core context for continuity
   */
  async getCoreContext(basePath?: string): Promise<Map<string, string>> {
    return ContinuityManager.loadCoreContext(basePath);
  }
}

// Export singleton instance
export const middleware = new MeowstikMiddleware();
