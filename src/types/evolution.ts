/**
 * Evolution Center Types
 */

export interface ToolExecutionLog {
  timestamp: string;
  toolName: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

export interface ErrorPattern {
  id: string;
  type: string;
  message: string;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  affectedTools: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  logs: ToolExecutionLog[];
}

export interface GitHubIssue {
  title: string;
  body: string;
  labels: string[];
  assignees: string[];
}

export interface AnalysisResult {
  totalLogs: number;
  errorCount: number;
  patterns: ErrorPattern[];
  issuesCreated: GitHubIssue[];
  timestamp: string;
}
