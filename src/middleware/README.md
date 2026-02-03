# GitHub Middleware

This middleware implements the operational directives for automating GitHub issue/commit lifecycle and self-repair capabilities.

## Features

### 1. Credentials Acquisition
- Fetches GitHub PAT from database or environment variables
- Validates credentials before making API calls
- Priority: Database → Environment Variables

### 2. Issue Creation
- Creates GitHub issues with structured templates
- Automatically tags @github-copilot for automation
- Default labels: ['bug', 'RKS-CORE', 'auto-generated']
- Default assignee: jasonbender

### 3. Continuity Management
- Loads core directive files to prevent "amnesia"
- Injects source of truth into LLM prompts
- Core files: AI_CORE_DIRECTIVE.md, TODO_SYSTEM.md, Short_Term_Memory.md

## Usage

### Basic Example

```typescript
import { middleware } from './middleware/github-middleware';

// Initialize with credentials
await middleware.initialize();

// Create an issue
const issue = await middleware.createIssue({
  title: 'RAG Stack Ingestion Failure',
  problem: 'Ingestion and retrieval paths are misaligned',
  fix: 'Align paths to use artifacts/{app_id}/public/data/knowledge_buckets',
  steps: '1. Update analyze_logs.py\n2. Add user_id to payloads\n3. Restart service'
});

console.log('Issue created:', issue.html_url);
```

### With Continuity Context

```typescript
// Get core context for prompt injection
const context = middleware.getCoreContext();
const promptContext = ContinuityManager.formatForPrompt(context);

// Use in your LLM prompt
const fullPrompt = `${promptContext}\n\nUser Query: ${userQuery}`;
```

## Environment Variables

Set one of these environment variables:
- `GITHUB_PAT` - GitHub Personal Access Token
- `GITHUB_TOKEN` - Alternative name for GitHub token

## API Reference

### CredentialsManager

```typescript
// Acquire token from environment or database
const token = await CredentialsManager.acquireToken();

// Validate token (throws if missing)
CredentialsManager.validateCredentials(token);
```

### GitHubClient

```typescript
const client = new GitHubClient({
  owner: 'jasonbender-c3x',
  repo: 'Meowstik-old',
  token: 'ghp_...'
});

await client.createIssue({
  title: 'Issue Title',
  problem: 'Problem description',
  fix: 'Fix description',
  steps: 'Implementation steps'
});
```

### ContinuityManager

```typescript
// Load core files
const context = ContinuityManager.loadCoreContext('/path/to/project');

// Format for prompt
const formatted = ContinuityManager.formatForPrompt(context);
```

## Related Files

- `docs/AI_CORE_DIRECTIVE.md` - System kernel
- `docs/TODO_SYSTEM.md` - Task queue
- `logs/Short_Term_Memory.md` - Recent context
- `docs/refactor/issues.md` - Issue templates
