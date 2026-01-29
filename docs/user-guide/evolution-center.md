# Evolution Center Documentation

## Overview

The Evolution Center is a self-improvement system for Meowstik that analyzes tool execution logs, identifies recurring error patterns, and automatically generates GitHub issues assigned to @copilot for resolution. This enables the LLM to evolve by iterating on both frontend and backend code.

## Features

### 1. **Log Analysis**
- Parses tool execution logs in multiple formats (JSON, plain text)
- Identifies errors and warnings
- Groups similar errors into patterns
- Calculates error severity and frequency

### 2. **Error Pattern Detection**
- Recognizes recurring error types (TimeoutError, PermissionError, NetworkError, etc.)
- Normalizes error messages for pattern matching
- Tracks occurrences across multiple tools
- Determines severity level (critical, high, medium, low)

### 3. **Automatic Issue Generation**
- Creates detailed GitHub issues for recurring problems
- Includes error context, affected tools, and sample logs
- Assigns issues to @copilot for automated resolution
- Applies appropriate labels for categorization

### 4. **Test Integration**
- Links to the `tersty` test database
- Encourages test updates after fixes
- Tracks test coverage for each component

## How It Works

### Analysis Workflow

```
1. User uploads or pastes tool execution logs
   ↓
2. LogAnalyzer parses and categorizes entries
   ↓
3. Error patterns are identified and grouped
   ↓
4. Patterns meeting threshold generate GitHub issues
   ↓
5. Issues are formatted and ready for creation
   ↓
6. User reviews and submits issues to GitHub
```

### Log Format Support

The Evolution Center supports multiple log formats:

**JSON Array Format:**
```json
[
  {
    "timestamp": "2026-01-29T10:15:30Z",
    "toolName": "http_post",
    "status": "error",
    "message": "Network timeout after 30000ms"
  }
]
```

**JSON Lines Format:**
```json
{"timestamp": "2026-01-29T10:15:30Z", "toolName": "http_post", "status": "error", "message": "Timeout"}
```

**Plain Text Format:**
```
[2026-01-29T10:15:30Z] [http_post] [error] Network timeout after 30000ms
```

### Error Pattern Grouping

Errors are grouped using smart normalization:

- Numbers are replaced with 'N'
- File paths are replaced with '/PATH'
- Hex IDs are replaced with 'ID'
- Error types are extracted from stack traces
- Similar messages are grouped together

**Example:**
```
"Error: Permission denied when writing to /var/log/app.log"
"Error: Permission denied when writing to /etc/config.conf"
```
Both normalize to:
```
"error: permission denied when writing to /path"
```

### Severity Determination

Severity is automatically assigned based on keywords:

- **Critical**: crash, fatal, critical, security, vulnerability, data loss, corruption
- **High**: authentication, authorization, database
- **Medium**: timeout, network, warning
- **Low**: informational, debug

### Issue Generation

Issues are created with:

1. **Title**: `[Auto-Generated] ErrorType: Message summary`
2. **Body**: Includes:
   - Error pattern ID
   - Severity and occurrence count
   - Affected tools list
   - Sample error logs
   - Recommended actions
   - Link to Evolution Center
3. **Labels**:
   - `auto-generated`
   - `evolution-center`
   - `severity:X`
   - `bug`
   - `tool:X` (for each affected tool)
4. **Assignees**: `@copilot`

## Usage Guide

### Basic Usage

1. **Navigate to Evolution Center**
   - Click the "Evolution Center" tab in the header

2. **Load Logs**
   - Option A: Paste logs directly into the textarea
   - Option B: Click "Upload Log File" and select a log file

3. **Configure Threshold**
   - Set "Min Occurrences" to determine when issues are created
   - Default: 3 occurrences

4. **Analyze**
   - Click "Analyze Logs" button
   - Wait for analysis to complete

5. **Review Results**
   - Check summary statistics (Total Logs, Errors Found, Issues Generated)
   - Review detected error patterns
   - Examine auto-generated issues

6. **Create GitHub Issues**
   - Copy issue content from the "Auto-Generated GitHub Issues" section
   - Create issues manually in GitHub
   - Or integrate with GitHub API for automatic creation

### Advanced Features

#### Custom Severity Rules
Modify `LogAnalyzer.determineSeverity()` to add custom severity rules for your specific use case.

#### Custom Issue Templates
Modify `IssueGenerator.generateIssueBody()` to customize the issue format and content.

#### Integration with CI/CD
Export analysis results as JSON and integrate with your CI/CD pipeline to automatically create issues.

## Architecture

### Components

```
EvolutionCenter (UI Component)
    ├── Log Input & File Upload
    ├── Analysis Controls
    ├── Results Display
    │   ├── Summary Statistics
    │   ├── Error Pattern Cards
    │   └── Generated Issues
    └── Integration with Services

LogAnalyzer (Service)
    ├── parseLogs() - Parse raw logs
    ├── identifyErrorPatterns() - Group errors
    ├── extractErrorType() - Categorize errors
    ├── normalizeErrorMessage() - Pattern matching
    ├── determineSeverity() - Assign severity
    └── analyze() - Complete analysis

IssueGenerator (Service)
    ├── generateIssue() - Create issue object
    ├── generateIssueBody() - Format issue body
    ├── generateLabels() - Create labels
    └── generateIssuesForPatterns() - Batch generation
```

### Data Flow

```
Raw Logs → LogAnalyzer → Error Patterns → IssueGenerator → GitHub Issues
                                ↓
                          Test Database (tersty)
```

## Integration Points

### 1. GitHub API Integration (Future)
```typescript
// Example integration
async function createGitHubIssue(issue: GitHubIssue) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  
  await octokit.rest.issues.create({
    owner: 'jasonbender-c3x',
    repo: 'Meowstik',
    title: issue.title,
    body: issue.body,
    labels: issue.labels,
    assignees: issue.assignees,
  });
}
```

### 2. Test Database Integration
The Evolution Center references the `tersty` test database:
- Recommends creating tests for fixed issues
- Links to test templates
- Tracks test coverage

### 3. Logging Integration
To integrate with your logging system:

```typescript
// Example: Log tool execution
function executeTool(toolName: string, params: any) {
  try {
    const result = tool.execute(params);
    logExecution({
      timestamp: new Date().toISOString(),
      toolName,
      status: 'success',
      message: 'Tool executed successfully',
    });
    return result;
  } catch (error) {
    logExecution({
      timestamp: new Date().toISOString(),
      toolName,
      status: 'error',
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
```

## Best Practices

### 1. Regular Analysis
- Run analysis weekly or after major changes
- Track trends over time
- Monitor recurring issues

### 2. Threshold Tuning
- Start with minOccurrences=3
- Adjust based on issue volume
- Higher threshold for less critical systems

### 3. Log Management
- Keep logs structured (JSON preferred)
- Include context (tool name, timestamp, status)
- Capture stack traces for errors

### 4. Issue Management
- Review auto-generated issues before creating
- Add additional context if needed
- Link related issues
- Track resolution time

### 5. Test Coverage
- Create tests for every fixed issue
- Use tersty templates
- Update tests with code changes

## Troubleshooting

### Issue: No Patterns Detected
- **Cause**: Logs don't contain errors or errors are too unique
- **Solution**: Check log format, reduce normalization, lower threshold

### Issue: Too Many Issues Generated
- **Cause**: Threshold too low or many unique errors
- **Solution**: Increase minOccurrences, improve error grouping

### Issue: Wrong Severity Assigned
- **Cause**: Keywords not matching your error types
- **Solution**: Customize `determineSeverity()` method

### Issue: Can't Parse Logs
- **Cause**: Unsupported log format
- **Solution**: Convert to supported format or extend parser

## Future Enhancements

1. **Automatic GitHub Issue Creation**
   - Direct API integration
   - OAuth authentication
   - Batch issue creation

2. **Trend Analysis**
   - Historical error tracking
   - Pattern visualization
   - Predictive analytics

3. **Smart Grouping**
   - ML-based pattern recognition
   - Context-aware grouping
   - Cross-tool correlation

4. **Resolution Tracking**
   - Monitor issue resolution
   - Track fix effectiveness
   - Suggest preventive measures

5. **Copilot Integration**
   - Automatic PR generation
   - Suggested fixes
   - Code review automation

## API Reference

### LogAnalyzer

#### `static parseLogs(rawLogs: string): ToolExecutionLog[]`
Parses raw log data into structured format.

#### `static identifyErrorPatterns(logs: ToolExecutionLog[]): ErrorPattern[]`
Identifies and groups recurring error patterns.

#### `static analyze(rawLogs: string): AnalysisResult`
Performs complete analysis on logs.

### IssueGenerator

#### `static generateIssue(pattern: ErrorPattern): GitHubIssue`
Generates a GitHub issue from an error pattern.

#### `static generateIssuesForPatterns(patterns: ErrorPattern[], minOccurrences: number): GitHubIssue[]`
Generates issues for all patterns meeting the threshold.

## Contributing

To contribute to the Evolution Center:

1. Review the architecture documentation
2. Check existing issues and PRs
3. Follow the coding standards
4. Add tests for new features
5. Update documentation

## License

Part of the Meowstik project. See LICENSE file for details.
