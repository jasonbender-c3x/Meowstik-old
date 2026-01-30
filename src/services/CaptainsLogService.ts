import type { Opinion, CaptainsLogEntry } from '../types/evolution';

/**
 * Manages the Captain's Log - a markdown file storing user opinions
 */
export class CaptainsLogService {
  /**
   * Generate markdown content for Captain's Log
   */
  static generateCaptainsLog(entries: CaptainsLogEntry[]): string {
    let markdown = `# Captain's Log - Meowstik Opinions\n\n`;
    markdown += `*Tracking the awesomest ideas and biggest pet peeves about Meowstik*\n\n`;
    markdown += `Last Updated: ${new Date().toISOString()}\n\n`;
    markdown += `---\n\n`;

    // Add summary statistics
    const totalIdeas = entries.reduce((sum, entry) => 
      sum + entry.opinions.filter(o => o.type === 'idea').length, 0
    );
    const totalPeeves = entries.reduce((sum, entry) => 
      sum + entry.opinions.filter(o => o.type === 'peeve').length, 0
    );

    markdown += `## Summary\n\n`;
    markdown += `- **Total Entries:** ${entries.length}\n`;
    markdown += `- **Awesome Ideas:** ${totalIdeas} 🌟\n`;
    markdown += `- **Pet Peeves:** ${totalPeeves} 🐛\n\n`;
    markdown += `---\n\n`;

    // Add entries in reverse chronological order
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    for (const entry of sortedEntries) {
      markdown += `## Entry: ${new Date(entry.timestamp).toLocaleString()}\n\n`;
      
      if (entry.summary) {
        markdown += `### Summary\n${entry.summary}\n\n`;
      }

      // Ideas section
      const ideas = entry.opinions.filter(o => o.type === 'idea');
      if (ideas.length > 0) {
        markdown += `### 🌟 Awesome Ideas (${ideas.length})\n\n`;
        for (const idea of ideas) {
          markdown += `- ${idea.text}\n`;
          if (idea.context) {
            markdown += `  - *Context: ${idea.context}*\n`;
          }
        }
        markdown += `\n`;
      }

      // Pet peeves section
      const peeves = entry.opinions.filter(o => o.type === 'peeve');
      if (peeves.length > 0) {
        markdown += `### 🐛 Pet Peeves (${peeves.length})\n\n`;
        for (const peeve of peeves) {
          markdown += `- ${peeve.text}\n`;
          if (peeve.context) {
            markdown += `  - *Context: ${peeve.context}*\n`;
          }
        }
        markdown += `\n`;
      }

      markdown += `---\n\n`;
    }

    // Add insights section
    markdown += `## Insights\n\n`;
    markdown += this.generateInsights(entries);

    return markdown;
  }

  /**
   * Generate insights from the log entries
   */
  private static generateInsights(entries: CaptainsLogEntry[]): string {
    let insights = '';

    const allOpinions = entries.flatMap(e => e.opinions);
    const ideas = allOpinions.filter(o => o.type === 'idea');
    const peeves = allOpinions.filter(o => o.type === 'peeve');

    insights += `### Most Mentioned Topics\n\n`;
    insights += this.analyzeTrends(allOpinions);
    insights += `\n`;

    insights += `### Priority Areas\n\n`;
    if (peeves.length > 0) {
      insights += `- **Critical:** Address ${peeves.length} pet peeve${peeves.length > 1 ? 's' : ''} to improve user satisfaction\n`;
    }
    if (ideas.length > 0) {
      insights += `- **Opportunity:** Implement ${ideas.length} idea${ideas.length > 1 ? 's' : ''} to enhance functionality\n`;
    }
    insights += `\n`;

    return insights;
  }

  /**
   * Analyze trends in opinions
   */
  private static analyzeTrends(opinions: Opinion[]): string {
    const wordFrequency = new Map<string, number>();

    for (const opinion of opinions) {
      const words = opinion.text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 4); // Only words longer than 4 chars

      for (const word of words) {
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      }
    }

    const topWords = Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topWords.length === 0) {
      return '*No trends detected yet*\n';
    }

    return topWords.map(([word, count]) => 
      `- **${word}** (mentioned ${count} time${count > 1 ? 's' : ''})`
    ).join('\n') + '\n';
  }

  /**
   * Parse existing Captain's Log markdown
   */
  static parseCaptainsLog(markdown: string): CaptainsLogEntry[] {
    const entries: CaptainsLogEntry[] = [];
    
    // This is a simple parser - in practice, you might want a more robust solution
    const entryMatches = markdown.match(/## Entry: (.+?)(?=## Entry:|## Insights|$)/gs);
    
    if (!entryMatches) return entries;

    for (const entryText of entryMatches) {
      const timestampMatch = entryText.match(/## Entry: (.+)/);
      if (!timestampMatch) continue;

      const opinions: Opinion[] = [];
      
      // Extract ideas
      const ideasMatch = entryText.match(/### 🌟 Awesome Ideas[\s\S]*?(?=###|---)/);
      if (ideasMatch) {
        const ideaLines = ideasMatch[0].match(/^- (.+)$/gm);
        if (ideaLines) {
          for (const line of ideaLines) {
            opinions.push({
              id: `opinion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'idea',
              text: line.replace(/^- /, ''),
              timestamp: new Date(timestampMatch[1]).toISOString(),
              source: 'captains-log',
            });
          }
        }
      }

      // Extract peeves
      const peevesMatch = entryText.match(/### 🐛 Pet Peeves[\s\S]*?(?=###|---)/);
      if (peevesMatch) {
        const peeveLines = peevesMatch[0].match(/^- (.+)$/gm);
        if (peeveLines) {
          for (const line of peeveLines) {
            opinions.push({
              id: `opinion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'peeve',
              text: line.replace(/^- /, ''),
              timestamp: new Date(timestampMatch[1]).toISOString(),
              source: 'captains-log',
            });
          }
        }
      }

      entries.push({
        timestamp: new Date(timestampMatch[1]).toISOString(),
        opinions,
        summary: '',
      });
    }

    return entries;
  }

  /**
   * Append a new entry to the Captain's Log
   */
  static appendEntry(existingLog: string, newEntry: CaptainsLogEntry): string {
    // Parse existing entries
    const existingEntries = this.parseCaptainsLog(existingLog);
    
    // Add new entry
    existingEntries.push(newEntry);
    
    // Regenerate the log
    return this.generateCaptainsLog(existingEntries);
  }
}
