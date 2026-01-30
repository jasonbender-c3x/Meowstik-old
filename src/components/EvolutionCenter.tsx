import { useState } from 'react';
import { FlaskConical, AlertCircle, CheckCircle, XCircle, Loader2, Upload, FileText, BookOpen, Lightbulb, Bug } from 'lucide-react';
import { LogAnalyzer, IssueGenerator } from '../services/EvolutionService';
import { CaptainsLogService } from '../services/CaptainsLogService';
import type { AnalysisResult, ErrorPattern, TopIssue, CaptainsLogEntry } from '../types/evolution';

export function EvolutionCenter() {
  const [logInput, setLogInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [minOccurrences, setMinOccurrences] = useState(3);
  const [captainsLog, setCaptainsLog] = useState<string>('');

  const handleAnalyze = async () => {
    if (!logInput.trim()) {
      setError('Please provide tool execution logs to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Simulate analysis delay (replace with actual async operation if needed)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const result = LogAnalyzer.analyze(logInput, true);
      
      // Generate issues for recurring patterns
      const errorIssues = IssueGenerator.generateIssuesForPatterns(result.patterns, minOccurrences);
      
      // Generate issues from opinions (top 10)
      const opinionIssues = result.topIssues 
        ? IssueGenerator.generateIssuesFromTopIssues(result.topIssues)
        : [];
      
      result.issuesCreated = [...errorIssues, ...opinionIssues];

      // Generate Captain's Log
      if (result.opinions && result.opinions.length > 0) {
        const entry: CaptainsLogEntry = {
          timestamp: new Date().toISOString(),
          opinions: result.opinions,
          summary: `Analyzed ${result.totalLogs} logs and found ${result.opinions.length} opinions (${result.opinions.filter(o => o.type === 'idea').length} ideas, ${result.opinions.filter(o => o.type === 'peeve').length} pet peeves)`,
        };
        const log = CaptainsLogService.generateCaptainsLog([entry]);
        setCaptainsLog(log);
      }

      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze logs');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadCaptainsLog = () => {
    const blob = new Blob([captainsLog], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captains-log.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setLogInput(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="evolution-center h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Evolution Center</h2>
            <p className="text-purple-100 text-sm">Analyze tool execution logs and auto-generate improvement issues</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Input Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Tool Execution Logs</h3>
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">Upload Log File</span>
              <input
                type="file"
                accept=".log,.txt,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <textarea
            value={logInput}
            onChange={(e) => setLogInput(e.target.value)}
            placeholder="Paste tool execution logs here or upload a log file..."
            className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
          />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Min Occurrences:</label>
              <input
                type="number"
                value={minOccurrences}
                onChange={(e) => setMinOccurrences(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500">errors to create issue</span>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !logInput.trim()}
              className="ml-auto px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FlaskConical className="w-5 h-5" />
                  Analyze Logs
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Results Section */}
        {analysisResult && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">Total Logs</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{analysisResult.totalLogs}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Errors Found</span>
                </div>
                <p className="text-2xl font-bold text-red-600">{analysisResult.errorCount}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-sm font-medium">Opinions Found</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">{analysisResult.opinions?.length || 0}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Issues Generated</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">{analysisResult.issuesCreated.length}</p>
              </div>
            </div>

            {/* Captain's Log Section */}
            {analysisResult.opinions && analysisResult.opinions.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Captain's Log</h3>
                      <p className="text-sm text-gray-600">Opinions extracted from logs</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadCaptainsLog}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Download captains-log.md
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ideas */}
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      <h4 className="font-semibold text-gray-900">🌟 Awesome Ideas</h4>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {analysisResult.opinions.filter(o => o.type === 'idea').map(opinion => (
                        <div key={opinion.id} className="text-sm text-gray-700 pl-3 border-l-2 border-yellow-300">
                          {opinion.text}
                        </div>
                      ))}
                      {analysisResult.opinions.filter(o => o.type === 'idea').length === 0 && (
                        <p className="text-sm text-gray-500 italic">No ideas found in logs</p>
                      )}
                    </div>
                  </div>

                  {/* Pet Peeves */}
                  <div className="bg-white rounded-lg p-4 border border-red-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Bug className="w-5 h-5 text-red-500" />
                      <h4 className="font-semibold text-gray-900">🐛 Pet Peeves</h4>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {analysisResult.opinions.filter(o => o.type === 'peeve').map(opinion => (
                        <div key={opinion.id} className="text-sm text-gray-700 pl-3 border-l-2 border-red-300">
                          {opinion.text}
                        </div>
                      ))}
                      {analysisResult.opinions.filter(o => o.type === 'peeve').length === 0 && (
                        <p className="text-sm text-gray-500 italic">No pet peeves found in logs</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top 10 Issues from Opinions */}
            {analysisResult.topIssues && analysisResult.topIssues.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Top 10 Issues from Opinion Analysis
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    (Prioritized by frequency and impact)
                  </span>
                </h3>
                <div className="space-y-3">
                  {analysisResult.topIssues.map((issue, index) => (
                    <TopIssueCard key={index} issue={issue} rank={index + 1} />
                  ))}
                </div>
              </div>
            )}

            {/* Error Patterns */}
            {analysisResult.patterns.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Patterns Detected</h3>
                <div className="space-y-4">
                  {analysisResult.patterns.map((pattern) => (
                    <ErrorPatternCard key={pattern.id} pattern={pattern} />
                  ))}
                </div>
              </div>
            )}

            {/* Generated Issues */}
            {analysisResult.issuesCreated.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Auto-Generated GitHub Issues
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    (Ready to be created and assigned to @copilot)
                  </span>
                </h3>
                <div className="space-y-4">
                  {analysisResult.issuesCreated.map((issue, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h4 className="font-semibold text-gray-900 mb-2">{issue.title}</h4>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {issue.labels.map((label) => (
                          <span key={label} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            {label}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Assignees: {issue.assignees.map(a => `@${a}`).join(', ')}
                      </p>
                      <details className="text-sm">
                        <summary className="cursor-pointer text-purple-600 hover:text-purple-700 font-medium">
                          View Issue Body
                        </summary>
                        <pre className="mt-2 p-3 bg-white border border-gray-200 rounded overflow-auto text-xs">
                          {issue.body}
                        </pre>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysisResult.patterns.length === 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-lg font-semibold text-gray-900">No Error Patterns Detected</p>
                <p className="text-gray-600">The analyzed logs don't contain any recurring error patterns.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorPatternCard({ pattern }: { pattern: ErrorPattern }) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{pattern.type}</h4>
          <p className="text-sm text-gray-600 mt-1">{pattern.message}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(pattern.severity)}`}>
          {pattern.severity}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
        <div>
          <span className="text-gray-500">Occurrences:</span>
          <span className="ml-2 font-semibold text-gray-900">{pattern.occurrences}</span>
        </div>
        <div>
          <span className="text-gray-500">Affected Tools:</span>
          <span className="ml-2 font-semibold text-gray-900">{pattern.affectedTools.length}</span>
        </div>
      </div>

      <div className="mt-2">
        <span className="text-xs text-gray-500">Tools: </span>
        <span className="text-xs text-gray-700">{pattern.affectedTools.join(', ')}</span>
      </div>
    </div>
  );
}

function TopIssueCard({ issue, rank }: { issue: TopIssue; rank: number }) {
  const getTypeIcon = () => {
    return issue.type === 'improvement' ? (
      <Lightbulb className="w-5 h-5 text-yellow-500" />
    ) : (
      <Bug className="w-5 h-5 text-red-500" />
    );
  };

  const getPriorityColor = () => {
    if (issue.priority >= 5) return 'bg-red-100 text-red-700 border-red-200';
    if (issue.priority >= 3) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm">
          {rank}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {getTypeIcon()}
              <h4 className="font-semibold text-gray-900">{issue.title}</h4>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor()}`}>
              Priority: {issue.priority}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">{issue.description.split('\n')[0]}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className={`px-2 py-1 rounded ${issue.type === 'improvement' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {issue.type === 'improvement' ? 'Enhancement' : 'Bug Fix'}
            </span>
            <span>•</span>
            <span>{issue.relatedOpinions.length} related opinion{issue.relatedOpinions.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

