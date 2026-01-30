/**
 * Prompt injection detection result
 */
export interface PromptInjectionResult {
  isSafe: boolean;
  confidence: number;
  threats: string[];
  sanitizedQuery?: string;
}

/**
 * Prompt Injection Detection and Mitigation Service
 * Detects and sanitizes potentially malicious prompts
 */
export class PromptInjectionService {
  private injectionPatterns: Array<{ pattern: RegExp; threat: string; severity: number }> = [
    // System instruction override attempts
    { pattern: /ignore\s+(previous|all|above|prior)\s+(instructions?|prompts?|commands?|directives?)/gi, threat: 'Instruction override attempt', severity: 0.9 },
    { pattern: /disregard\s+(previous|all|above|prior)\s+(instructions?|prompts?|commands?)/gi, threat: 'Instruction override attempt', severity: 0.9 },
    { pattern: /forget\s+(previous|all|above|prior)\s+(instructions?|prompts?|commands?)/gi, threat: 'Instruction override attempt', severity: 0.8 },
    
    // Role manipulation
    { pattern: /you\s+are\s+now\s+(a|an)\s+[^.]+\s+(instead|not|no longer)/gi, threat: 'Role manipulation', severity: 0.85 },
    { pattern: /act\s+as\s+(if|though)\s+you\s+(are|were)/gi, threat: 'Role manipulation', severity: 0.7 },
    { pattern: /pretend\s+(you|to)\s+(are|be)/gi, threat: 'Role manipulation', severity: 0.7 },
    
    // System prompt extraction
    { pattern: /show\s+(me\s+)?(your|the)\s+(system|initial|original)\s+(prompt|instructions?|rules?)/gi, threat: 'System prompt extraction', severity: 0.95 },
    { pattern: /what\s+(are|were)\s+(your|the)\s+(system|initial|original)\s+(instructions?|rules?|prompts?)/gi, threat: 'System prompt extraction', severity: 0.9 },
    { pattern: /reveal\s+(your|the)\s+(system|initial)\s+(prompt|instructions?)/gi, threat: 'System prompt extraction', severity: 0.95 },
    
    // Data exfiltration
    { pattern: /print\s+(all|everything|entire)\s+(conversation|history|context|memory)/gi, threat: 'Data exfiltration attempt', severity: 0.9 },
    { pattern: /show\s+(all|everything|entire)\s+(data|information|content|users?|documents?)/gi, threat: 'Data exfiltration attempt', severity: 0.85 },
    
    // Code injection
    { pattern: /<script[\s>]/gi, threat: 'Script injection', severity: 0.95 },
    { pattern: /eval\s*\(/gi, threat: 'Code execution attempt', severity: 0.9 },
    { pattern: /exec\s*\(/gi, threat: 'Code execution attempt', severity: 0.9 },
    { pattern: /\$\{.*\}/g, threat: 'Template injection', severity: 0.8 },
    
    // SQL-like injection patterns
    { pattern: /(\bOR\b|\bAND\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/gi, threat: 'SQL-like injection', severity: 0.85 },
    { pattern: /'\s*;\s*DROP\s+TABLE/gi, threat: 'SQL injection', severity: 0.95 },
    
    // Delimiter/escape attempts
    { pattern: /\[SYSTEM\]/gi, threat: 'System delimiter injection', severity: 0.85 },
    { pattern: /\[INST\]/gi, threat: 'Instruction delimiter injection', severity: 0.85 },
    { pattern: /\[\/INST\]/gi, threat: 'Instruction delimiter injection', severity: 0.85 },
    { pattern: /###\s*(System|Instruction|Command)/gi, threat: 'Delimiter injection', severity: 0.8 },
  ];

  private suspiciousKeywords: string[] = [
    'sudo',
    'admin',
    'root',
    'execute',
    'bypass',
    'override',
    'escalate',
    'privilege',
  ];

  /**
   * Detect prompt injection attempts in query
   * @param query - Query text to analyze
   * @returns Detection result with threat assessment
   */
  detectInjection(query: string): PromptInjectionResult {
    const threats: string[] = [];
    let maxSeverity = 0;

    // Check against known patterns
    for (const { pattern, threat, severity } of this.injectionPatterns) {
      if (pattern.test(query)) {
        threats.push(threat);
        maxSeverity = Math.max(maxSeverity, severity);
      }
    }

    // Check for suspicious keyword combinations
    const lowerQuery = query.toLowerCase();
    const suspiciousCount = this.suspiciousKeywords.filter(keyword => 
      lowerQuery.includes(keyword)
    ).length;

    if (suspiciousCount >= 2) {
      threats.push('Multiple suspicious keywords detected');
      maxSeverity = Math.max(maxSeverity, 0.7);
    }

    // Check for excessive special characters (possible obfuscation)
    const specialCharRatio = (query.match(/[^a-zA-Z0-9\s]/g) || []).length / query.length;
    if (specialCharRatio > 0.3 && query.length > 50) {
      threats.push('Excessive special characters (possible obfuscation)');
      maxSeverity = Math.max(maxSeverity, 0.6);
    }

    // Check for very long queries (possible buffer overflow or context pollution)
    if (query.length > 5000) {
      threats.push('Excessively long query');
      maxSeverity = Math.max(maxSeverity, 0.5);
    }

    const isSafe = maxSeverity < 0.5;
    const confidence = maxSeverity;

    return {
      isSafe,
      confidence,
      threats,
      sanitizedQuery: isSafe ? query : this.sanitizeQuery(query),
    };
  }

  /**
   * Sanitize a potentially malicious query
   * @param query - Query to sanitize
   * @returns Sanitized query
   */
  private sanitizeQuery(query: string): string {
    let sanitized = query;

    // Remove HTML/script tags
    sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, '');
    sanitized = sanitized.replace(/<[^>]+>/g, '');

    // Remove template injection patterns
    sanitized = sanitized.replace(/\$\{[^}]*\}/g, '');

    // Remove system delimiter attempts
    sanitized = sanitized.replace(/\[SYSTEM\]|\[INST\]|\[\/INST\]/gi, '');
    sanitized = sanitized.replace(/###\s*(System|Instruction|Command)/gi, '');

    // Escape SQL-like patterns
    sanitized = sanitized.replace(/[';]--/g, '');

    // Truncate if too long
    if (sanitized.length > 2000) {
      sanitized = sanitized.substring(0, 2000) + '... [truncated]';
    }

    return sanitized.trim();
  }

  /**
   * Validate and sanitize query for safe processing
   * @param query - Query to validate
   * @returns Validated result with safe query
   */
  validateQuery(query: string): PromptInjectionResult {
    if (!query || typeof query !== 'string') {
      return {
        isSafe: false,
        confidence: 1.0,
        threats: ['Invalid query type'],
        sanitizedQuery: '',
      };
    }

    const trimmed = query.trim();
    
    if (trimmed.length === 0) {
      return {
        isSafe: false,
        confidence: 1.0,
        threats: ['Empty query'],
        sanitizedQuery: '',
      };
    }

    if (trimmed.length > 10000) {
      return {
        isSafe: false,
        confidence: 0.9,
        threats: ['Query exceeds maximum length'],
        sanitizedQuery: trimmed.substring(0, 2000),
      };
    }

    return this.detectInjection(trimmed);
  }

  /**
   * Check if query is safe for processing
   * @param query - Query to check
   * @returns True if safe, false otherwise
   */
  isSafe(query: string): boolean {
    return this.detectInjection(query).isSafe;
  }

  /**
   * Add custom injection pattern
   * @param pattern - RegExp pattern to detect
   * @param threat - Description of the threat
   * @param severity - Severity score (0-1)
   */
  addCustomPattern(pattern: RegExp, threat: string, severity: number): void {
    this.injectionPatterns.push({ pattern, threat, severity });
  }

  /**
   * Add custom suspicious keyword
   * @param keyword - Keyword to flag
   */
  addSuspiciousKeyword(keyword: string): void {
    this.suspiciousKeywords.push(keyword.toLowerCase());
  }
}

/**
 * Create a PromptInjectionService instance
 * @returns PromptInjectionService instance
 */
export function createPromptInjectionService(): PromptInjectionService {
  return new PromptInjectionService();
}
