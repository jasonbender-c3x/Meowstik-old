# Self-Evolution Engine: Captain's Log

## Overview

The Self-Evolution Engine with Captain's Log is a powerful feature that analyzes logs to extract user opinions and automatically generates improvement suggestions for Meowstik. It tracks both "awesomest ideas" and "biggest pet peeves" to continuously improve the system.

## Features

### 🎯 Opinion Analysis
- **Automatic Extraction**: Scans logs for user opinions, ideas, and complaints
- **Smart Categorization**: Classifies opinions as either ideas (improvements) or pet peeves (issues)
- **Contextual Understanding**: Uses keyword analysis to identify sentiment

### 📖 Captain's Log
- **Opinion Tracking**: Maintains a historical record of all user opinions
- **Markdown Format**: Generates a readable `captains-log.md` file
- **Insights Dashboard**: Shows trends, most mentioned topics, and priority areas
- **Downloadable**: Export the Captain's Log directly from the UI

### 🎯 Top 10 Issues Generation
- **Intelligent Prioritization**: Ranks issues based on frequency and impact
- **Grouped Opinions**: Clusters similar opinions together
- **Actionable Issues**: Generates ready-to-create GitHub issues
- **Two Types**: 
  - **Improvement Issues**: Based on user ideas and feature requests
  - **Fix Issues**: Based on pet peeves and complaints (higher priority)

## How It Works

### 1. Log Analysis
The system analyzes logs containing:
- Tool execution logs (success, error, warning)
- User comments and feedback
- Error patterns and their frequency

### 2. Opinion Extraction
Opinions are extracted using keyword detection:

**Idea Keywords** (positive):
- should, could, would be great, awesome, love, prefer, suggest, recommend, etc.

**Pet Peeve Keywords** (negative):
- annoying, frustrating, hate, problem, broken, bug, error, slow, confusing, etc.

### 3. Issue Generation
From the extracted opinions, the system:
1. Groups similar opinions together
2. Calculates priority (pet peeves get 1.5x weight)
3. Generates top 10 actionable issues
4. Creates GitHub issue templates with full context

### 4. Captain's Log
All opinions are saved to `captains-log.md` with:
- Timestamp and summary
- Separate sections for ideas and pet peeves
- Insights showing trends and priority areas

## Usage

### In the Evolution Center UI

1. **Paste or Upload Logs**: Add your tool execution logs and user feedback
2. **Click "Analyze Logs"**: The system will process the logs
3. **View Results**:
   - Summary statistics (logs, errors, opinions, issues)
   - Captain's Log section showing ideas and pet peeves
   - Top 10 issues ranked by priority
   - Error patterns (if any)
   - Auto-generated GitHub issues

4. **Download Captain's Log**: Click the download button to save `captains-log.md`

### Sample Log Format

```
[2026-01-29T12:00:00Z] [ToolName] [success] Operation completed
User comment: I love this feature! It's awesome!
[2026-01-29T12:01:00Z] [ToolName] [error] Something went wrong
User complaint: This error is really frustrating
User suggestion: Would be great if we could add X feature
```

### Programmatic Usage

```typescript
import { LogAnalyzer, IssueGenerator } from './services/EvolutionService';
import { CaptainsLogService } from './services/CaptainsLogService';

// Analyze logs with opinion extraction
const result = LogAnalyzer.analyze(logText, true);

// Access opinions
const ideas = result.opinions?.filter(o => o.type === 'idea');
const peeves = result.opinions?.filter(o => o.type === 'peeve');

// Generate top 10 issues
const topIssues = result.topIssues; // Already generated

// Create GitHub issues
const issues = IssueGenerator.generateIssuesFromTopIssues(topIssues);

// Generate Captain's Log
const entry = {
  timestamp: new Date().toISOString(),
  opinions: result.opinions,
  summary: 'Your summary here',
};
const captainsLog = CaptainsLogService.generateCaptainsLog([entry]);
```

## Example Output

### Captain's Log
```markdown
# Captain's Log - Meowstik Opinions

## Summary
- Total Entries: 1
- Awesome Ideas: 9 🌟
- Pet Peeves: 20 🐛

## Entry: 1/30/2026, 12:25:11 AM

### 🌟 Awesome Ideas (9)
- User comment: I love how Meowstik automatically saves my work
- User feedback: The evolution center should be able to auto-create PRs
...

### 🐛 Pet Peeves (20)
- User complaint: The rate limiting is really frustrating
- User complaint: Error messages need better context
...

## Insights
### Most Mentioned Topics
- error (mentioned 11 times)
- feedback (mentioned 4 times)
```

### Top 10 Issues
1. **Fix: Rate limiting issues** - Priority 7.5 (5 related opinions)
2. **Feature Request: Better validation** - Priority 4 (4 related opinions)
3. **Fix: Database connection errors** - Priority 4.5 (3 related opinions)
...

## Technical Details

### Services

#### OpinionAnalyzer (`src/services/OpinionAnalyzer.ts`)
- Extracts opinions from log text
- Groups similar opinions
- Generates top 10 issues from opinion analysis
- Handles both ideas and pet peeves

#### CaptainsLogService (`src/services/CaptainsLogService.ts`)
- Generates markdown format for Captain's Log
- Maintains historical entries
- Provides insights and trends analysis
- Supports parsing existing logs

#### EvolutionService (`src/services/EvolutionService.ts`)
- Updated to integrate opinion analysis
- Combines error pattern detection with opinion extraction
- Generates comprehensive issues (both error-based and opinion-based)

### Types

All types are defined in `src/types/evolution.ts`:
- `Opinion`: Individual user opinion (idea or peeve)
- `CaptainsLogEntry`: Log entry with opinions and summary
- `TopIssue`: Prioritized issue generated from opinions
- `AnalysisResult`: Complete analysis output

## Benefits

1. **Continuous Improvement**: Automatically identifies improvement areas
2. **User-Centric**: Focuses on actual user feedback and pain points
3. **Prioritized**: Ranks issues by impact and frequency
4. **Actionable**: Generates ready-to-use GitHub issues
5. **Transparent**: Captain's Log provides full visibility into user sentiment
6. **Data-Driven**: Uses trends and statistics to guide development

## Future Enhancements

- Integration with GitHub API to auto-create issues
- Sentiment analysis using AI/ML
- Trend visualization and charts
- Automatic PR generation from top issues
- Integration with conversation history
- Historical analysis across multiple sessions
