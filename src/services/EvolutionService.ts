import type { ToolExecutionLog, ErrorPattern, GitHubIssue, AnalysisResult, TopIssue } from '../types/evolution';
import { OpinionAnalyzer } from './OpinionAnalyzer';

/**
 * Parse tool execution logs and identify error patterns
 */
export class LogAnalyzer {
  /**
   * Parse raw log data into structured format
   */
  static parseLogs(rawLogs: string): ToolExecutionLog[] {
    const logs: ToolExecutionLog[] = [];
    
    try {
      // Try to parse as JSON array
      const parsed = JSON.parse(rawLogs);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // If not JSON, parse line by line
      const lines = rawLogs.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const log = JSON.parse(line);
          logs.push(log);
        } catch {
          // Try to extract from plain text log format
          const match = line.match(/\[(\d{4}-\d{2}-\d{2}.*?)\]\s*\[(\w+)\]\s*\[(\w+)\]\s*(.*)/);
          if (match) {
            logs.push({
              timestamp: match[1],
              toolName: match[2],
              status: match[3].toLowerCase() as 'success' | 'error' | 'warning',
              message: match[4],
            });
          }
        }
      }
    }
    
    return logs;
  }

  /**
   * Identify recurring error patterns from logs
   */
  static identifyErrorPatterns(logs: ToolExecutionLog[]): ErrorPattern[] {
    const errorLogs = logs.filter(log => log.status === 'error');
    const patterns = new Map<string, ErrorPattern>();

    for (const log of errorLogs) {
      // Create a pattern key based on error type and message signature
      const patternKey = this.generatePatternKey(log);
      
      if (patterns.has(patternKey)) {
        const pattern = patterns.get(patternKey)!;
        pattern.occurrences++;
        pattern.lastSeen = log.timestamp;
        pattern.logs.push(log);
        
        // Add tool name if not already present
        if (!pattern.affectedTools.includes(log.toolName)) {
          pattern.affectedTools.push(log.toolName);
        }
      } else {
        // Create new pattern
        patterns.set(patternKey, {
          id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: this.extractErrorType(log),
          message: this.normalizeErrorMessage(log.message),
          occurrences: 1,
          firstSeen: log.timestamp,
          lastSeen: log.timestamp,
          affectedTools: [log.toolName],
          severity: this.determineSeverity(log),
          logs: [log],
        });
      }
    }

    // Convert to array and sort by occurrences (descending)
    return Array.from(patterns.values()).sort((a, b) => b.occurrences - a.occurrences);
  }

  /**
   * Generate a unique pattern key for grouping similar errors
   */
  private static generatePatternKey(log: ToolExecutionLog): string {
    const errorType = this.extractErrorType(log);
    const normalizedMessage = this.normalizeErrorMessage(log.message);
    return `${errorType}:${normalizedMessage}`;
  }

  /**
   * Extract error type from log
   */
  private static extractErrorType(log: ToolExecutionLog): string {
    // Try to extract from stack trace
    if (log.stack) {
      const match = log.stack.match(/(\w+Error):/);
      if (match) return match[1];
    }

    // Try to extract from message
    const messageMatch = log.message.match(/^(\w+Error):/);
    if (messageMatch) return messageMatch[1];

    // Default categorization
    if (log.message.toLowerCase().includes('timeout')) return 'TimeoutError';
    if (log.message.toLowerCase().includes('network')) return 'NetworkError';
    if (log.message.toLowerCase().includes('permission')) return 'PermissionError';
    if (log.message.toLowerCase().includes('not found')) return 'NotFoundError';
    
    return 'GeneralError';
  }

  /**
   * Normalize error message for pattern matching
   */
  private static normalizeErrorMessage(message: string): string {
    // Remove specific values (IDs, timestamps, paths, etc.)
    return message
      .replace(/\d+/g, 'N') // Replace numbers with N
      .replace(/\/[^\s]+/g, '/PATH') // Replace paths
      .replace(/\b[a-f0-9]{8,}\b/gi, 'ID') // Replace hex IDs
      .toLowerCase()
      .trim()
      .substring(0, 100); // Limit length for grouping
  }

  /**
   * Determine error severity
   */
  private static determineSeverity(log: ToolExecutionLog): 'critical' | 'high' | 'medium' | 'low' {
    const message = log.message.toLowerCase();
    
    if (message.includes('crash') || message.includes('fatal') || message.includes('critical')) {
      return 'critical';
    }
    if (message.includes('security') || message.includes('vulnerability')) {
      return 'critical';
    }
    if (message.includes('data loss') || message.includes('corruption')) {
      return 'high';
    }
    if (message.includes('timeout') || message.includes('network')) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Perform complete analysis on logs
   */
  static analyze(rawLogs: string, includeOpinions: boolean = true): AnalysisResult {
    const logs = this.parseLogs(rawLogs);
    const patterns = this.identifyErrorPatterns(logs);
    const errorCount = logs.filter(log => log.status === 'error').length;

    const result: AnalysisResult = {
      totalLogs: logs.length,
      errorCount,
      patterns,
      issuesCreated: [],
      timestamp: new Date().toISOString(),
    };

    // Analyze opinions if requested
    if (includeOpinions) {
      result.opinions = OpinionAnalyzer.extractOpinions(rawLogs);
      result.topIssues = OpinionAnalyzer.generateTopIssues(result.opinions);
    }

    return result;
  }
}

/**
 * Generate GitHub issues from error patterns
 */
export class IssueGenerator {
  // Priority thresholds
  private static readonly HIGH_PRIORITY_THRESHOLD = 5;
  private static readonly MEDIUM_PRIORITY_THRESHOLD = 3;

  /**
   * Generate a GitHub issue from an error pattern
   */
  static generateIssue(pattern: ErrorPattern): GitHubIssue {
    const title = `[Auto-Generated] ${pattern.type}: ${pattern.message.substring(0, 80)}`;
    
    const body = this.generateIssueBody(pattern);
    
    const labels = this.generateLabels(pattern);
    
    return {
      title,
      body,
      labels,
      assignees: [], // Leave empty - will be assigned during issue creation
    };
  }

  /**
   * Generate issue body with details
   */
  private static generateIssueBody(pattern: ErrorPattern): string {
    const affectedToolsList = pattern.affectedTools.map(tool => `- ${tool}`).join('\n');
    const sampleLogs = pattern.logs.slice(0, 3).map(log => 
      `\`\`\`\nTimestamp: ${log.timestamp}\nTool: ${log.toolName}\nMessage: ${log.message}\n\`\`\``
    ).join('\n\n');

    return `## Auto-Generated Issue from Evolution Center

**Error Pattern ID:** ${pattern.id}
**Error Type:** ${pattern.type}
**Severity:** ${pattern.severity}
**Occurrences:** ${pattern.occurrences}
**First Seen:** ${pattern.firstSeen}
**Last Seen:** ${pattern.lastSeen}

### Description
This issue was automatically generated by the Evolution Center after detecting a recurring error pattern in tool execution logs.

**Error Message Pattern:**
\`\`\`
${pattern.message}
\`\`\`

### Affected Tools
${affectedToolsList}

### Sample Error Logs
${sampleLogs}

### Recommended Actions
1. Review the error logs to understand the root cause
2. Implement error handling or fix the underlying issue
3. Update tests in the \`tersty\` directory
4. Verify the fix resolves the issue
5. Close this issue once resolved

### Evolution Context
This issue is part of the self-evolution process. The system has identified this as a recurring problem that needs attention to improve stability and reliability.

---
*Generated by Meowstik Evolution Center on ${new Date().toISOString()}*
`;
  }

  /**
   * Generate appropriate labels for the issue
   */
  private static generateLabels(pattern: ErrorPattern): string[] {
    const labels = ['auto-generated', 'evolution-center'];
    
    // Add severity label
    labels.push(`severity:${pattern.severity}`);
    
    // Add type label
    labels.push('bug');
    
    // Add tool-specific labels
    for (const tool of pattern.affectedTools) {
      labels.push(`tool:${tool.toLowerCase()}`);
    }
    
    return labels;
  }

  /**
   * Generate issues for patterns that meet criteria
   */
  static generateIssuesForPatterns(
    patterns: ErrorPattern[],
    minOccurrences: number = 3
  ): GitHubIssue[] {
    return patterns
      .filter(pattern => pattern.occurrences >= minOccurrences)
      .map(pattern => this.generateIssue(pattern));
  }

  /**
   * Generate GitHub issues from top issues list
   */
  static generateIssuesFromTopIssues(topIssues: TopIssue[]): GitHubIssue[] {
    return topIssues.map(issue => ({
      title: issue.title,
      body: issue.description,
      labels: [
        'auto-generated',
        'captains-log',
        issue.type === 'improvement' ? 'enhancement' : 'bug',
        `priority:${this.determinePriorityLevel(issue.priority)}`
      ],
      assignees: [], // Leave empty - will be assigned during issue creation
    }));
  }

  /**
   * Determine priority level from numeric priority
   */
  private static determinePriorityLevel(priority: number): string {
    if (priority >= this.HIGH_PRIORITY_THRESHOLD) return 'high';
    if (priority >= this.MEDIUM_PRIORITY_THRESHOLD) return 'medium';
    return 'low';
  }
}
