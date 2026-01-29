# Evolution Center Integration Guide

## Overview

This guide explains how to integrate the Evolution Center into your development workflow and how it connects with other Meowstik components.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Meowstik Application                         │
│  ┌────────────────┐      ┌─────────────────┐                   │
│  │   Workspace    │      │ Evolution Center│                   │
│  │   (Main UI)    │◄────►│  (Self-Improve) │                   │
│  └────────────────┘      └─────────────────┘                   │
│         │                         │                              │
│         ▼                         ▼                              │
│  ┌──────────────────────────────────────────────┐              │
│  │        Tool Execution & Logging               │              │
│  │  ┌────────┐ ┌──────────┐ ┌───────────┐      │              │
│  │  │terminal│ │http_post │ │file_put   │ ...  │              │
│  │  └────────┘ └──────────┘ └───────────┘      │              │
│  └──────────────────────────────────────────────┘              │
│                      │                                           │
│                      ▼                                           │
│            ┌──────────────────┐                                 │
│            │   Log Storage    │                                 │
│            │  (JSON/Files)    │                                 │
│            └──────────────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
                      │
                      ▼
        ┌──────────────────────────┐
        │   Evolution Center       │
        │   ┌──────────────────┐  │
        │   │  LogAnalyzer     │  │
        │   │  - Parse Logs    │  │
        │   │  - Find Patterns │  │
        │   │  - Categorize    │  │
        │   └──────────────────┘  │
        │            │             │
        │            ▼             │
        │   ┌──────────────────┐  │
        │   │ IssueGenerator   │  │
        │   │  - Format Issues │  │
        │   │  - Add Metadata  │  │
        │   │  - Assign Copilot│  │
        │   └──────────────────┘  │
        └──────────────────────────┘
                      │
                      ▼
        ┌──────────────────────────┐
        │     GitHub Issues        │
        │  ┌────────────────────┐  │
        │  │ Issue #123         │  │
        │  │ Assignee: @copilot │  │
        │  │ Labels: auto-gen   │  │
        │  └────────────────────┘  │
        └──────────────────────────┘
                      │
                      ▼
        ┌──────────────────────────┐
        │  Copilot Resolution      │
        │  - Analyze Issue         │
        │  - Generate PR           │
        │  - Fix Code              │
        └──────────────────────────┘
                      │
                      ▼
        ┌──────────────────────────┐
        │    Tests (tersty)        │
        │  - Validate Fixes        │
        │  - Update Test Suite     │
        │  - Prevent Regression    │
        └──────────────────────────┘
```

## Integration Steps

### Step 1: Enable Tool Execution Logging

Add logging to your tool execution layer:

```typescript
// src/services/ToolExecutor.ts
import { ToolExecutionLog } from '../types/evolution';

class ToolExecutor {
  private logs: ToolExecutionLog[] = [];

  async executeTool(toolName: string, params: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await this.runTool(toolName, params);
      
      // Log success
      this.logExecution({
        timestamp: new Date().toISOString(),
        toolName,
        status: 'success',
        message: `Tool executed successfully in ${Date.now() - startTime}ms`,
        context: { params, duration: Date.now() - startTime }
      });
      
      return result;
    } catch (error) {
      // Log error
      this.logExecution({
        timestamp: new Date().toISOString(),
        toolName,
        status: 'error',
        message: error.message,
        stack: error.stack,
        context: { params }
      });
      
      throw error;
    }
  }

  private logExecution(log: ToolExecutionLog): void {
    this.logs.push(log);
    
    // Persist to file or database
    this.persistLog(log);
  }

  private async persistLog(log: ToolExecutionLog): Promise<void> {
    // Option 1: Append to log file
    await fs.appendFile(
      'logs/tool-execution.log',
      JSON.stringify(log) + '\n'
    );
    
    // Option 2: Store in database
    // await db.logs.insert(log);
    
    // Option 3: Send to logging service
    // await loggingService.send(log);
  }

  getLogs(): ToolExecutionLog[] {
    return this.logs;
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}
```

### Step 2: Create Log Export Functionality

Add a way to export logs for analysis:

```typescript
// src/services/LogExporter.ts
export class LogExporter {
  static async exportToFile(): Promise<void> {
    const executor = ToolExecutor.getInstance();
    const logs = executor.getLogs();
    
    const blob = new Blob(
      [JSON.stringify(logs, null, 2)], 
      { type: 'application/json' }
    );
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tool-logs-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  static async loadFromFile(file: File): Promise<ToolExecutionLog[]> {
    const text = await file.text();
    return JSON.parse(text);
  }
}
```

### Step 3: Add Export Button to Workspace

```typescript
// src/components/IntentPanel.tsx
import { LogExporter } from '../services/LogExporter';

export function IntentPanel() {
  const handleExportLogs = async () => {
    await LogExporter.exportToFile();
  };

  return (
    <div className="intent-panel">
      {/* ... existing content ... */}
      <button onClick={handleExportLogs}>
        Export Execution Logs
      </button>
    </div>
  );
}
```

### Step 4: Implement GitHub API Integration (Optional)

For automatic issue creation:

```typescript
// src/services/GitHubService.ts
import { Octokit } from '@octokit/rest';
import { GitHubIssue } from '../types/evolution';

export class GitHubService {
  private octokit: Octokit;
  
  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async createIssue(
    owner: string,
    repo: string,
    issue: GitHubIssue
  ): Promise<{ number: number; url: string }> {
    const response = await this.octokit.rest.issues.create({
      owner,
      repo,
      title: issue.title,
      body: issue.body,
      labels: issue.labels,
      assignees: issue.assignees,
    });

    return {
      number: response.data.number,
      url: response.data.html_url,
    };
  }

  async createIssuesBatch(
    owner: string,
    repo: string,
    issues: GitHubIssue[]
  ): Promise<Array<{ number: number; url: string }>> {
    const created = [];
    
    for (const issue of issues) {
      const result = await this.createIssue(owner, repo, issue);
      created.push(result);
      
      // Rate limiting: wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return created;
  }
}
```

### Step 5: Add GitHub Integration to Evolution Center

```typescript
// Update src/components/EvolutionCenter.tsx
export function EvolutionCenter() {
  const [githubToken, setGithubToken] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateIssues = async () => {
    if (!githubToken) {
      alert('Please enter GitHub token');
      return;
    }

    setCreating(true);
    try {
      const github = new GitHubService(githubToken);
      const created = await github.createIssuesBatch(
        'jasonbender-c3x',
        'Meowstik',
        analysisResult.issuesCreated
      );
      
      alert(`Created ${created.length} issues successfully!`);
    } catch (error) {
      alert(`Failed to create issues: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  // ... rest of component
}
```

## Workflow Example

### Daily Development Workflow

1. **Morning**: Start work, execute tools normally
2. **During Development**: Tools log all executions automatically
3. **End of Day**: 
   - Open Evolution Center
   - Export logs from workspace OR upload log file
   - Click "Analyze Logs"
   - Review error patterns
4. **Issue Creation**:
   - For patterns with 3+ occurrences, create GitHub issues
   - Issues are automatically assigned to @copilot
5. **Copilot Resolution**:
   - Copilot analyzes the issues
   - Generates pull requests with fixes
   - Code review and merge
6. **Testing**:
   - Update tests in `tersty/` directory
   - Run tests to verify fixes
   - Close issues when resolved

### Weekly Review Workflow

1. **Monday**: Review last week's issues
2. **Tuesday**: Analyze trends in error patterns
3. **Wednesday**: Adjust min occurrence threshold if needed
4. **Thursday**: Update test coverage based on fixes
5. **Friday**: Export comprehensive logs for analysis

## Configuration

### Environment Variables

```env
# .env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
GITHUB_OWNER=jasonbender-c3x
GITHUB_REPO=Meowstik
LOG_LEVEL=info
LOG_FILE_PATH=logs/tool-execution.log
MIN_OCCURRENCES=3
```

### Evolution Center Settings

```typescript
// src/config/evolution.config.ts
export const evolutionConfig = {
  minOccurrences: 3,
  maxIssuesPerRun: 10,
  severityThresholds: {
    critical: ['crash', 'fatal', 'security'],
    high: ['data loss', 'corruption'],
    medium: ['timeout', 'network'],
    low: []
  },
  autoCreateIssues: false, // Set to true for automatic creation
  githubRepo: {
    owner: 'jasonbender-c3x',
    repo: 'Meowstik'
  }
};
```

## Testing Integration

### Before Making Changes

```bash
# Export current logs
cd Meowstik
node -e "require('./src/services/LogExporter').exportToFile()"

# Analyze in Evolution Center
# - Upload logs
# - Check for existing patterns
# - Baseline: X errors
```

### After Making Changes

```bash
# Export new logs
node -e "require('./src/services/LogExporter').exportToFile()"

# Compare in Evolution Center
# - Should see reduced errors
# - Verify fixes resolved patterns
```

### Update Tests

```bash
# Add tests for fixed issues
cp tersty/templates/component-test-template.json tersty/tests/MyComponent.test.json

# Edit test file
# Add test cases for the fix

# Run tests
npm test
```

## Monitoring

### Key Metrics to Track

1. **Error Rate**: Total errors / Total logs
2. **Pattern Count**: Number of recurring patterns
3. **Resolution Time**: Time from issue creation to closure
4. **Test Coverage**: Percentage of components with tests
5. **Issue Backlog**: Open auto-generated issues

### Dashboard Example

```typescript
// src/components/EvolutionDashboard.tsx
export function EvolutionDashboard() {
  const [metrics, setMetrics] = useState({
    errorRate: 0,
    patternCount: 0,
    avgResolutionTime: 0,
    testCoverage: 0,
    openIssues: 0
  });

  // Calculate and display metrics
  return (
    <div className="dashboard">
      <MetricCard label="Error Rate" value={`${metrics.errorRate}%`} />
      <MetricCard label="Patterns" value={metrics.patternCount} />
      <MetricCard label="Avg Resolution" value={`${metrics.avgResolutionTime}d`} />
      <MetricCard label="Test Coverage" value={`${metrics.testCoverage}%`} />
      <MetricCard label="Open Issues" value={metrics.openIssues} />
    </div>
  );
}
```

## Best Practices

### 1. Regular Analysis
- Run evolution analysis at least once per week
- More frequently during active development
- After major feature releases

### 2. Threshold Tuning
- Start with minOccurrences=3
- Increase if too many issues generated
- Decrease if missing important patterns

### 3. Issue Management
- Review auto-generated issues before creating
- Add context and reproduction steps
- Link related issues
- Update issue descriptions as needed

### 4. Test Discipline
- Create tests for every fixed issue
- Use tersty templates consistently
- Keep tests up-to-date with code changes
- Run full test suite before releases

### 5. Log Hygiene
- Use structured logging format (JSON)
- Include sufficient context
- Capture stack traces for errors
- Rotate log files regularly
- Archive old logs for trend analysis

## Troubleshooting

### Issue: Logs Not Appearing

**Problem**: Evolution Center doesn't show any logs

**Solutions**:
1. Check log file path is correct
2. Verify file permissions
3. Ensure logging is enabled in config
4. Check browser console for errors

### Issue: No Patterns Detected

**Problem**: Analysis runs but finds no patterns

**Solutions**:
1. Lower the minOccurrences threshold
2. Check log format is supported
3. Verify error logs contain stack traces
4. Review normalization logic

### Issue: Too Many Issues Generated

**Problem**: Every analysis creates dozens of issues

**Solutions**:
1. Increase minOccurrences threshold
2. Improve error normalization
3. Filter out known/expected errors
4. Group similar error types better

### Issue: GitHub API Rate Limiting

**Problem**: Can't create issues due to rate limits

**Solutions**:
1. Reduce batch size
2. Add delays between requests
3. Use GitHub App instead of PAT
4. Create issues manually from exports

## Future Enhancements

- **Trend Analysis**: Track error rates over time
- **ML Pattern Detection**: Use machine learning for grouping
- **Automated PR Generation**: Copilot creates PRs automatically
- **Integration with CI/CD**: Fail builds on critical patterns
- **Slack/Email Notifications**: Alert on critical issues
- **Custom Rules Engine**: Define custom pattern matching rules

## Support

For questions or issues with Evolution Center integration:

1. Check this documentation
2. Review sample implementation
3. Open an issue on GitHub
4. Contact: jason@oceanshorestech.com
