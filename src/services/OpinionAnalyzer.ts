import type { Opinion, TopIssue } from '../types/evolution';

/**
 * Analyzes logs to extract user opinions about Meowstik
 */
export class OpinionAnalyzer {
  // Keywords that indicate positive ideas/suggestions
  private static readonly IDEA_KEYWORDS = [
    'should', 'could', 'would be great', 'would be nice', 'awesome',
    'love', 'like', 'prefer', 'better if', 'suggest', 'recommend',
    'improvement', 'enhance', 'feature', 'add', 'implement', 'great idea'
  ];

  // Keywords that indicate negative feedback/pet peeves
  private static readonly PEEVE_KEYWORDS = [
    'annoying', 'frustrating', 'hate', 'dislike', 'issue', 'problem',
    'broken', 'bug', 'error', 'fail', 'bad', 'worst', 'terrible',
    'slow', 'confusing', 'complicated', 'difficult', 'pain'
  ];

  /**
   * Extract opinions from log text
   */
  static extractOpinions(logText: string, source: string = 'logs'): Opinion[] {
    const opinions: Opinion[] = [];
    const lines = logText.split('\n');

    for (const line of lines) {
      const lowercaseLine = line.toLowerCase();
      
      // Check for ideas
      const hasIdeaKeyword = this.IDEA_KEYWORDS.some(keyword => 
        lowercaseLine.includes(keyword.toLowerCase())
      );
      
      // Check for pet peeves
      const hasPeeveKeyword = this.PEEVE_KEYWORDS.some(keyword => 
        lowercaseLine.includes(keyword.toLowerCase())
      );

      if (hasIdeaKeyword && !hasPeeveKeyword) {
        opinions.push({
          id: `opinion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'idea',
          text: line.trim(),
          timestamp: new Date().toISOString(),
          source,
        });
      } else if (hasPeeveKeyword && !hasIdeaKeyword) {
        opinions.push({
          id: `opinion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'peeve',
          text: line.trim(),
          timestamp: new Date().toISOString(),
          source,
        });
      }
    }

    return opinions;
  }

  /**
   * Generate top 10 issues from opinions
   */
  static generateTopIssues(opinions: Opinion[]): TopIssue[] {
    const issues: TopIssue[] = [];

    // Group similar opinions
    const ideaGroups = this.groupSimilarOpinions(
      opinions.filter(o => o.type === 'idea')
    );
    const peeveGroups = this.groupSimilarOpinions(
      opinions.filter(o => o.type === 'peeve')
    );

    // Generate issues from ideas (improvements)
    for (const group of ideaGroups.values()) {
      issues.push({
        title: `Feature Request: ${this.summarizeOpinionGroup(group)}`,
        description: this.generateIssueDescription(group, 'improvement'),
        priority: group.length, // More mentions = higher priority
        type: 'improvement',
        relatedOpinions: group.map(o => o.id),
      });
    }

    // Generate issues from pet peeves (fixes)
    for (const group of peeveGroups.values()) {
      issues.push({
        title: `Fix: ${this.summarizeOpinionGroup(group)}`,
        description: this.generateIssueDescription(group, 'fix'),
        priority: group.length * 1.5, // Pet peeves get higher priority
        type: 'fix',
        relatedOpinions: group.map(o => o.id),
      });
    }

    // Sort by priority and return top 10
    return issues.sort((a, b) => b.priority - a.priority).slice(0, 10);
  }

  /**
   * Group similar opinions together
   */
  private static groupSimilarOpinions(opinions: Opinion[]): Map<string, Opinion[]> {
    const groups = new Map<string, Opinion[]>();

    for (const opinion of opinions) {
      // Extract key words for grouping
      const words = opinion.text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3);

      // Find if this opinion is similar to an existing group
      let foundGroup = false;
      for (const [groupKey, group] of groups.entries()) {
        const groupWords = groupKey.split('|');
        const commonWords = words.filter(w => groupWords.includes(w));
        
        if (commonWords.length >= 2) {
          group.push(opinion);
          foundGroup = true;
          break;
        }
      }

      // Create new group if no similar one found
      if (!foundGroup) {
        const key = words.slice(0, 3).join('|');
        groups.set(key, [opinion]);
      }
    }

    return groups;
  }

  /**
   * Summarize a group of opinions
   */
  private static summarizeOpinionGroup(opinions: Opinion[]): string {
    // Take the first opinion as representative
    const representative = opinions[0].text;
    
    // Extract meaningful portion (first 60 chars or until punctuation)
    const summary = representative.length > 60
      ? representative.substring(0, 60) + '...'
      : representative;

    return summary;
  }

  /**
   * Generate issue description from opinion group
   */
  private static generateIssueDescription(opinions: Opinion[], type: string): string {
    const count = opinions.length;
    const examples = opinions.slice(0, 3).map(o => `- ${o.text}`).join('\n');

    return `This ${type} was identified from ${count} user opinion${count > 1 ? 's' : ''} in the logs.

### Representative Opinions:
${examples}

### Context:
${type === 'improvement' 
  ? 'Users have expressed interest in this feature or enhancement. Implementing this would reinforce positive user behavior and improve the system.'
  : 'Users have reported this as a pain point or issue. Fixing this would reduce frustration and improve user experience.'
}

### Recommended Actions:
1. Review the user feedback carefully
2. ${type === 'improvement' ? 'Design and implement the requested feature' : 'Investigate and fix the reported issue'}
3. Add tests to prevent regression
4. Update documentation if needed

---
*Auto-generated from Captain's Log analysis*`;
  }
}
