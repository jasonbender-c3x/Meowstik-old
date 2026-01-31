# NotebookLM Puppeteer Integration Proposal

## Executive Summary

This proposal outlines a comprehensive approach to programmatically access Google's NotebookLM features through Puppeteer-based web automation. The goal is to create a robust, maintainable API layer that enables headless interaction with NotebookLM's powerful AI research and note-taking capabilities.

**Key Objectives:**
- Enable programmatic document upload and management
- Automate question-answering and research workflows
- Extract generated content (summaries, study guides, FAQs)
- Integrate NotebookLM capabilities into custom applications
- Maintain reliability despite web UI changes

**Expected Benefits:**
- Batch processing of multiple documents
- Integration with existing research workflows
- Automated content generation pipelines
- Enhanced accessibility through custom interfaces

---

## 1. NotebookLM Feature Analysis

### 1.1 Core Features to Automate

#### Document Management
- **Upload Sources**: PDF, Google Docs, text files, web URLs, YouTube videos
- **Source Organization**: Create and manage multiple notebooks
- **Source Limits**: Track document count and size constraints
- **Delete/Modify**: Remove or update existing sources

#### AI-Powered Interactions
- **Ask Questions**: Natural language queries against uploaded sources
- **Citation Extraction**: Retrieve source references for answers
- **Follow-up Queries**: Contextual conversation threads
- **Multi-source Synthesis**: Queries across multiple documents

#### Content Generation
- **Automatic Summaries**: Document and collection-level summaries
- **Study Guide Creation**: Generate structured study materials
- **FAQ Generation**: Extract common questions and answers
- **Audio Overviews**: Generate podcast-style audio summaries
- **Timeline Creation**: Extract chronological information
- **Table of Contents**: Generate document outlines

#### Export and Integration
- **Copy Content**: Extract generated text
- **Export Formats**: Support various output formats
- **Share Notebooks**: Manage sharing and permissions

### 1.2 NotebookLM Web Interface Structure

Based on typical Google application patterns:

```
notebooklm.google.com/
├── Authentication (Google OAuth)
├── Notebook Dashboard
│   ├── Create new notebook
│   ├── List existing notebooks
│   └── Search notebooks
├── Notebook View
│   ├── Source panel
│   │   ├── Add sources button
│   │   └── Source list
│   ├── Chat interface
│   │   ├── Question input
│   │   └── Response history
│   └── Generated content panel
│       ├── Summary
│       ├── Study guide
│       ├── FAQ
│       └── Audio overview
```

---

## 2. Technical Architecture

### 2.1 Technology Stack

**Core Framework:**
- **Puppeteer** (v21+): Headless Chrome automation
- **TypeScript**: Type-safe development
- **Node.js** (v18+): Runtime environment

**Supporting Libraries:**
- **puppeteer-extra**: Plugin system for enhanced capabilities
- **puppeteer-extra-plugin-stealth**: Avoid detection
- **puppeteer-extra-plugin-recaptcha**: Handle CAPTCHA challenges
- **retry**: Implement exponential backoff
- **winston**: Logging and debugging

**Optional Enhancements:**
- **Playwright**: Alternative for multi-browser support
- **Chrome DevTools Protocol**: Advanced debugging
- **Proxy rotation**: Distribute requests

### 2.2 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              NotebookLM API Wrapper                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth       │  │  Notebook    │  │   Content    │      │
│  │   Manager    │  │   Manager    │  │  Generator   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Puppeteer Automation Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │   Page       │  │  Element     │      │
│  │   Manager    │  │   Navigator  │  │  Selectors   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Google NotebookLM                           │
│                  (notebooklm.google.com)                     │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Component Design

#### Browser Manager
```typescript
class BrowserManager {
  private browser: Browser | null;
  private page: Page | null;
  
  async initialize(options?: LaunchOptions): Promise<void>
  async getPage(): Promise<Page>
  async close(): Promise<void>
  async takeScreenshot(path: string): Promise<void>
}
```

#### Authentication Manager
```typescript
class AuthManager {
  async login(email: string, password: string): Promise<boolean>
  async isAuthenticated(): Promise<boolean>
  async refreshSession(): Promise<void>
  async saveCookies(path: string): Promise<void>
  async loadCookies(path: string): Promise<void>
}
```

#### Notebook Manager
```typescript
class NotebookManager {
  async createNotebook(name: string): Promise<string>
  async listNotebooks(): Promise<Notebook[]>
  async openNotebook(id: string): Promise<void>
  async deleteNotebook(id: string): Promise<void>
  async addSource(notebookId: string, source: Source): Promise<void>
  async removeSource(notebookId: string, sourceId: string): Promise<void>
}
```

#### Content Generator
```typescript
class ContentGenerator {
  async askQuestion(question: string): Promise<Answer>
  async generateSummary(): Promise<string>
  async generateStudyGuide(): Promise<StudyGuide>
  async generateFAQ(): Promise<FAQ[]>
  async generateAudioOverview(): Promise<AudioOverview>
}
```

---

## 3. Authentication and Session Management

### 3.1 Google Authentication Strategies

#### Strategy 1: Cookie-based Authentication (Recommended)
```typescript
// One-time manual login to capture cookies
async function initialLogin() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('https://notebooklm.google.com');
  
  // Wait for manual login
  console.log('Please log in manually...');
  await page.waitForNavigation({ 
    waitUntil: 'networkidle0',
    timeout: 300000 // 5 minutes
  });
  
  // Save cookies for future use
  const cookies = await page.cookies();
  await fs.writeFile('cookies.json', JSON.stringify(cookies));
  
  await browser.close();
}

// Subsequent automated sessions
async function automaticLogin() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Load saved cookies
  const cookies = JSON.parse(await fs.readFile('cookies.json', 'utf8'));
  await page.setCookie(...cookies);
  
  await page.goto('https://notebooklm.google.com');
  // Should be authenticated
}
```

#### Strategy 2: OAuth Token Injection
```typescript
async function useOAuthToken(accessToken: string) {
  const page = await browser.newPage();
  
  // Inject OAuth token via localStorage or session storage
  await page.evaluateOnNewDocument((token) => {
    localStorage.setItem('auth_token', token);
  }, accessToken);
  
  await page.goto('https://notebooklm.google.com');
}
```

#### Strategy 3: Automated Credential Login
```typescript
async function credentialLogin(email: string, password: string) {
  const page = await browser.newPage();
  
  await page.goto('https://accounts.google.com');
  
  // Email input
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', email);
  await page.click('#identifierNext');
  
  // Password input
  await page.waitForSelector('input[type="password"]', { visible: true });
  await page.type('input[type="password"]', password);
  await page.click('#passwordNext');
  
  // Handle 2FA if present
  await handle2FA(page);
  
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
}
```

### 3.2 Session Persistence

```typescript
class SessionManager {
  private cookiePath: string;
  private sessionTimeout: number = 3600000; // 1 hour
  
  async saveSession(): Promise<void> {
    const cookies = await this.page.cookies();
    const localStorage = await this.page.evaluate(() => 
      JSON.stringify(localStorage)
    );
    
    await fs.writeFile(this.cookiePath, JSON.stringify({
      cookies,
      localStorage,
      timestamp: Date.now()
    }));
  }
  
  async restoreSession(): Promise<boolean> {
    try {
      const session = JSON.parse(await fs.readFile(this.cookiePath, 'utf8'));
      
      // Check if session is still valid
      if (Date.now() - session.timestamp > this.sessionTimeout) {
        return false;
      }
      
      await this.page.setCookie(...session.cookies);
      await this.page.evaluateOnNewDocument((data) => {
        const parsed = JSON.parse(data);
        for (const key in parsed) {
          localStorage.setItem(key, parsed[key]);
        }
      }, session.localStorage);
      
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

---

## 4. Core Automation Strategies

### 4.1 Selector Strategy

**Approach**: Use multiple selector fallbacks for reliability

```typescript
interface SelectorConfig {
  primary: string;
  fallbacks: string[];
  dataTestId?: string;
  ariaLabel?: string;
}

const SELECTORS: Record<string, SelectorConfig> = {
  CREATE_NOTEBOOK_BUTTON: {
    primary: 'button[aria-label="Create new notebook"]',
    fallbacks: [
      'button:has-text("Create")',
      '[data-testid="create-notebook-btn"]'
    ],
    ariaLabel: 'Create new notebook'
  },
  
  ADD_SOURCE_BUTTON: {
    primary: 'button[aria-label="Add source"]',
    fallbacks: [
      'button:has-text("Add source")',
      '[data-testid="add-source-btn"]'
    ]
  },
  
  QUESTION_INPUT: {
    primary: 'textarea[placeholder*="Ask"]',
    fallbacks: [
      'textarea[aria-label*="question"]',
      '[data-testid="question-input"]'
    ]
  }
};

async function smartClick(page: Page, selectorConfig: SelectorConfig) {
  const selectors = [selectorConfig.primary, ...selectorConfig.fallbacks];
  
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.click(selector);
      return;
    } catch (error) {
      continue;
    }
  }
  
  throw new Error('Element not found with any selector');
}
```

### 4.2 Dynamic Content Waiting

```typescript
class WaitStrategy {
  // Wait for network to be idle
  async waitForNetworkIdle(page: Page, timeout = 30000): Promise<void> {
    await page.waitForNetworkIdle({ 
      timeout,
      idleTime: 500 
    });
  }
  
  // Wait for specific element with content
  async waitForContentLoaded(
    page: Page, 
    selector: string,
    minLength = 10
  ): Promise<void> {
    await page.waitForFunction(
      (sel, min) => {
        const element = document.querySelector(sel);
        return element && element.textContent.length > min;
      },
      { timeout: 30000 },
      selector,
      minLength
    );
  }
  
  // Wait for AI response
  async waitForAIResponse(page: Page): Promise<void> {
    // Wait for loading indicator to appear
    await page.waitForSelector('.loading-indicator', { timeout: 5000 });
    
    // Wait for loading indicator to disappear
    await page.waitForSelector('.loading-indicator', { 
      hidden: true,
      timeout: 60000 
    });
  }
}
```

### 4.3 File Upload Handling

```typescript
async function uploadDocument(
  page: Page,
  filePath: string,
  fileType: 'pdf' | 'txt' | 'docx'
): Promise<void> {
  // Click add source button
  await smartClick(page, SELECTORS.ADD_SOURCE_BUTTON);
  
  // Wait for upload modal
  await page.waitForSelector('[role="dialog"]');
  
  // Find file input (usually hidden)
  const fileInput = await page.$('input[type="file"]');
  
  if (!fileInput) {
    throw new Error('File input not found');
  }
  
  // Upload file
  await fileInput.uploadFile(filePath);
  
  // Wait for upload to complete
  await waitForUploadComplete(page);
}

async function waitForUploadComplete(page: Page): Promise<void> {
  // Wait for progress indicator
  await page.waitForSelector('.upload-progress', { timeout: 5000 });
  
  // Wait for progress to complete
  await page.waitForFunction(
    () => {
      const progress = document.querySelector('.upload-progress');
      return !progress || progress.getAttribute('aria-valuenow') === '100';
    },
    { timeout: 300000 } // 5 minutes for large files
  );
  
  // Wait for processing
  await page.waitForSelector('.source-ready', { timeout: 120000 });
}
```

### 4.4 Question-Answer Workflow

```typescript
interface Answer {
  text: string;
  citations: Citation[];
  confidence?: number;
}

interface Citation {
  source: string;
  page?: number;
  quote: string;
}

async function askQuestion(
  page: Page,
  question: string
): Promise<Answer> {
  // Type question
  await page.waitForSelector(SELECTORS.QUESTION_INPUT.primary);
  await page.type(SELECTORS.QUESTION_INPUT.primary, question);
  
  // Submit
  await page.keyboard.press('Enter');
  
  // Wait for response
  await waitForAIResponse(page);
  
  // Extract answer
  const answerElement = await page.waitForSelector('.answer-content');
  const text = await answerElement.evaluate(el => el.textContent);
  
  // Extract citations
  const citations = await extractCitations(page);
  
  return {
    text: text || '',
    citations
  };
}

async function extractCitations(page: Page): Promise<Citation[]> {
  const citationElements = await page.$$('.citation');
  
  const citations: Citation[] = [];
  
  for (const element of citationElements) {
    const source = await element.$eval('.source-name', el => el.textContent);
    const page = await element.$eval('.page-number', el => el.textContent)
      .catch(() => null);
    const quote = await element.$eval('.quote-text', el => el.textContent);
    
    citations.push({
      source: source || 'Unknown',
      page: page ? parseInt(page) : undefined,
      quote: quote || ''
    });
  }
  
  return citations;
}
```

### 4.5 Content Generation Extraction

```typescript
async function generateAndExtractContent(
  page: Page,
  contentType: 'summary' | 'study-guide' | 'faq' | 'audio'
): Promise<string | object> {
  // Navigate to content generation section
  await navigateToContentSection(page, contentType);
  
  // Click generate button
  await clickGenerateButton(page, contentType);
  
  // Wait for generation
  await waitForGeneration(page);
  
  // Extract content
  return extractGeneratedContent(page, contentType);
}

async function extractGeneratedContent(
  page: Page,
  contentType: string
): Promise<string | object> {
  const selector = `.${contentType}-content`;
  
  await page.waitForSelector(selector);
  
  if (contentType === 'study-guide' || contentType === 'faq') {
    // Structured content
    return page.evaluate((sel) => {
      const sections = Array.from(document.querySelectorAll(`${sel} .section`));
      return sections.map(section => ({
        title: section.querySelector('.title')?.textContent,
        content: section.querySelector('.content')?.textContent
      }));
    }, selector);
  } else {
    // Plain text content
    return page.$eval(selector, el => el.textContent || '');
  }
}
```

---

## 5. API Design

### 5.1 High-Level API Interface

```typescript
import { NotebookLM } from './notebooklm-puppeteer';

// Initialize
const nlm = new NotebookLM({
  headless: true,
  cookiePath: './cookies.json',
  timeout: 30000
});

// Authenticate
await nlm.authenticate({
  email: process.env.GOOGLE_EMAIL,
  password: process.env.GOOGLE_PASSWORD
});

// Create notebook
const notebook = await nlm.createNotebook('My Research Project');

// Add sources
await notebook.addSource({
  type: 'file',
  path: './research-paper.pdf'
});

await notebook.addSource({
  type: 'url',
  url: 'https://example.com/article'
});

// Ask questions
const answer = await notebook.ask('What are the main findings?');
console.log(answer.text);
console.log('Citations:', answer.citations);

// Generate content
const summary = await notebook.generateSummary();
const studyGuide = await notebook.generateStudyGuide();
const faq = await notebook.generateFAQ();

// Export
await notebook.export('./output.json');

// Cleanup
await nlm.close();
```

### 5.2 Detailed API Specification

```typescript
interface NotebookLMOptions {
  headless?: boolean;
  cookiePath?: string;
  timeout?: number;
  userDataDir?: string;
  proxyServer?: string;
  debug?: boolean;
}

interface AuthOptions {
  email: string;
  password: string;
  totpSecret?: string; // For 2FA
}

interface Source {
  type: 'file' | 'url' | 'text' | 'youtube';
  path?: string;
  url?: string;
  text?: string;
  title?: string;
}

class NotebookLM {
  constructor(options?: NotebookLMOptions);
  
  // Authentication
  authenticate(options: AuthOptions): Promise<void>;
  isAuthenticated(): Promise<boolean>;
  logout(): Promise<void>;
  
  // Notebook management
  createNotebook(name: string): Promise<Notebook>;
  listNotebooks(): Promise<NotebookInfo[]>;
  openNotebook(id: string): Promise<Notebook>;
  deleteNotebook(id: string): Promise<void>;
  
  // Lifecycle
  close(): Promise<void>;
}

class Notebook {
  readonly id: string;
  readonly name: string;
  
  // Source management
  addSource(source: Source): Promise<SourceInfo>;
  listSources(): Promise<SourceInfo[]>;
  removeSource(sourceId: string): Promise<void>;
  
  // Querying
  ask(question: string): Promise<Answer>;
  askWithContext(question: string, context: ConversationContext): Promise<Answer>;
  
  // Content generation
  generateSummary(): Promise<Summary>;
  generateStudyGuide(): Promise<StudyGuide>;
  generateFAQ(): Promise<FAQ[]>;
  generateAudioOverview(): Promise<AudioOverview>;
  generateTimeline(): Promise<Timeline>;
  
  // Export
  export(format: 'json' | 'markdown' | 'pdf'): Promise<string>;
  
  // Utility
  refresh(): Promise<void>;
  getMetadata(): Promise<NotebookMetadata>;
}
```

### 5.3 Event-Driven Architecture

```typescript
class NotebookLM extends EventEmitter {
  // Emit events for monitoring
  
  on(event: 'upload:start', listener: (file: string) => void);
  on(event: 'upload:progress', listener: (percent: number) => void);
  on(event: 'upload:complete', listener: (source: SourceInfo) => void);
  on(event: 'upload:error', listener: (error: Error) => void);
  
  on(event: 'query:start', listener: (question: string) => void);
  on(event: 'query:response', listener: (answer: Answer) => void);
  on(event: 'query:error', listener: (error: Error) => void);
  
  on(event: 'generation:start', listener: (type: string) => void);
  on(event: 'generation:complete', listener: (content: any) => void);
  on(event: 'generation:error', listener: (error: Error) => void);
}

// Usage
nlm.on('upload:progress', (percent) => {
  console.log(`Upload progress: ${percent}%`);
});

nlm.on('query:response', (answer) => {
  console.log('Got answer:', answer.text);
});
```

---

## 6. Error Handling and Resilience

### 6.1 Error Types and Handling

```typescript
class NotebookLMError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = false
  ) {
    super(message);
    this.name = 'NotebookLMError';
  }
}

// Specific error types
class AuthenticationError extends NotebookLMError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', false);
  }
}

class NetworkError extends NotebookLMError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR', true);
  }
}

class SelectorNotFoundError extends NotebookLMError {
  constructor(selector: string) {
    super(`Selector not found: ${selector}`, 'SELECTOR_ERROR', true);
  }
}

class TimeoutError extends NotebookLMError {
  constructor(operation: string) {
    super(`Operation timed out: ${operation}`, 'TIMEOUT_ERROR', true);
  }
}
```

### 6.2 Retry Logic

```typescript
interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  shouldRetry: (error: Error) => boolean;
}

async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config: RetryOptions = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    shouldRetry: (error) => error instanceof NotebookLMError && error.recoverable,
    ...options
  };
  
  let lastError: Error;
  let delay = config.initialDelay;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === config.maxAttempts || !config.shouldRetry(error as Error)) {
        throw error;
      }
      
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
    }
  }
  
  throw lastError!;
}

// Usage
await withRetry(
  () => notebook.ask('What is the main topic?'),
  { maxAttempts: 5, initialDelay: 2000 }
);
```

### 6.3 Graceful Degradation

```typescript
class RobustNotebookManager {
  async addSourceWithFallback(source: Source): Promise<SourceInfo> {
    try {
      // Try primary method
      return await this.addSourceDirect(source);
    } catch (error) {
      console.warn('Primary upload failed, trying alternative method');
      
      try {
        // Try alternative method (e.g., copy-paste instead of file upload)
        return await this.addSourceViaClipboard(source);
      } catch (fallbackError) {
        // Log both errors
        console.error('All upload methods failed', {
          primary: error,
          fallback: fallbackError
        });
        throw new NotebookLMError('Failed to add source', 'UPLOAD_FAILED');
      }
    }
  }
  
  async extractContentWithFallback(
    contentType: string
  ): Promise<string> {
    const strategies = [
      () => this.extractViaSelector(contentType),
      () => this.extractViaClipboard(contentType),
      () => this.extractViaScreenshotOCR(contentType)
    ];
    
    for (const strategy of strategies) {
      try {
        return await strategy();
      } catch (error) {
        console.warn(`Strategy failed, trying next...`, error);
      }
    }
    
    throw new NotebookLMError('All extraction strategies failed', 'EXTRACTION_FAILED');
  }
}
```

### 6.4 State Recovery

```typescript
class StateManager {
  private checkpoints: Map<string, any> = new Map();
  
  async saveCheckpoint(key: string, state: any): Promise<void> {
    this.checkpoints.set(key, {
      state,
      timestamp: Date.now()
    });
    
    // Persist to disk
    await fs.writeFile(
      `./checkpoints/${key}.json`,
      JSON.stringify(state)
    );
  }
  
  async loadCheckpoint(key: string): Promise<any | null> {
    // Try memory first
    const memoryCheckpoint = this.checkpoints.get(key);
    if (memoryCheckpoint) return memoryCheckpoint.state;
    
    // Try disk
    try {
      const data = await fs.readFile(`./checkpoints/${key}.json`, 'utf8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  
  async recoverFromCheckpoint(key: string): Promise<boolean> {
    const state = await this.loadCheckpoint(key);
    if (!state) return false;
    
    // Restore state
    await this.restoreState(state);
    return true;
  }
}
```

---

## 7. Security and Compliance

### 7.1 Credential Management

```typescript
// Use environment variables
const auth = {
  email: process.env.GOOGLE_EMAIL!,
  password: process.env.GOOGLE_PASSWORD!
};

// Use encrypted storage
import { SecretManager } from './security/secrets';

const secretManager = new SecretManager({
  encryptionKey: process.env.ENCRYPTION_KEY
});

await secretManager.storeSecret('google_credentials', {
  email: 'user@example.com',
  password: 'secure_password'
});

const credentials = await secretManager.getSecret('google_credentials');
```

### 7.2 Cookie Security

```typescript
class SecureCookieManager {
  async saveCookies(cookies: Cookie[]): Promise<void> {
    // Encrypt before saving
    const encrypted = await this.encrypt(JSON.stringify(cookies));
    await fs.writeFile(this.cookiePath, encrypted);
    
    // Set restrictive permissions
    await fs.chmod(this.cookiePath, 0o600);
  }
  
  async loadCookies(): Promise<Cookie[]> {
    const encrypted = await fs.readFile(this.cookiePath, 'utf8');
    const decrypted = await this.decrypt(encrypted);
    return JSON.parse(decrypted);
  }
  
  private async encrypt(data: string): Promise<string> {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.COOKIE_ENCRYPTION_KEY!, 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      data: encrypted.toString('hex'),
      authTag: authTag.toString('hex')
    });
  }
}
```

### 7.3 Rate Limiting

```typescript
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;
  
  constructor(maxRequests = 60, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  
  async checkLimit(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(
      time => now - time < this.windowMs
    );
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      
      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      return this.checkLimit();
    }
    
    this.requests.push(now);
  }
}

// Usage in API methods
async function ask(question: string): Promise<Answer> {
  await this.rateLimiter.checkLimit();
  // ... proceed with request
}
```

### 7.4 Data Privacy

```typescript
interface PrivacyOptions {
  logSensitiveData: boolean;
  persistQueries: boolean;
  persistAnswers: boolean;
  anonymizeExports: boolean;
}

class PrivacyManager {
  constructor(private options: PrivacyOptions) {}
  
  sanitizeLog(message: string, data: any): void {
    if (!this.options.logSensitiveData) {
      // Remove PII from logs
      data = this.removePII(data);
    }
    
    logger.info(message, data);
  }
  
  private removePII(data: any): any {
    // Redact email, names, etc.
    const sanitized = JSON.parse(JSON.stringify(data));
    
    if (sanitized.email) {
      sanitized.email = '[REDACTED]';
    }
    
    if (sanitized.questions) {
      sanitized.questions = sanitized.questions.map(() => '[REDACTED]');
    }
    
    return sanitized;
  }
}
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { NotebookManager } from '../src/notebook-manager';

describe('NotebookManager', () => {
  let manager: NotebookManager;
  
  beforeEach(() => {
    manager = new NotebookManager(mockPage);
  });
  
  it('should create a notebook', async () => {
    const notebook = await manager.createNotebook('Test Notebook');
    expect(notebook.name).toBe('Test Notebook');
    expect(notebook.id).toBeDefined();
  });
  
  it('should handle creation errors', async () => {
    mockPage.click.mockRejectedValue(new Error('Element not found'));
    
    await expect(
      manager.createNotebook('Test')
    ).rejects.toThrow(SelectorNotFoundError);
  });
});
```

### 8.2 Integration Tests

```typescript
describe('NotebookLM Integration', () => {
  let nlm: NotebookLM;
  
  beforeAll(async () => {
    nlm = new NotebookLM({ headless: true });
    await nlm.authenticate({
      email: process.env.TEST_EMAIL!,
      password: process.env.TEST_PASSWORD!
    });
  });
  
  afterAll(async () => {
    await nlm.close();
  });
  
  it('should complete full workflow', async () => {
    // Create notebook
    const notebook = await nlm.createNotebook('Integration Test');
    
    // Add source
    await notebook.addSource({
      type: 'file',
      path: './test-data/sample.pdf'
    });
    
    // Ask question
    const answer = await notebook.ask('What is the main topic?');
    expect(answer.text).toBeTruthy();
    expect(answer.citations.length).toBeGreaterThan(0);
    
    // Generate content
    const summary = await notebook.generateSummary();
    expect(summary.text.length).toBeGreaterThan(100);
    
    // Cleanup
    await nlm.deleteNotebook(notebook.id);
  });
});
```

### 8.3 E2E Tests with Real Browser

```typescript
describe('E2E: Real Browser Tests', () => {
  it('should handle real NotebookLM interactions', async () => {
    const nlm = new NotebookLM({
      headless: false,
      slowMo: 100 // Slow down for visibility
    });
    
    try {
      await nlm.authenticate({
        email: process.env.E2E_EMAIL!,
        password: process.env.E2E_PASSWORD!
      });
      
      const notebook = await nlm.createNotebook('E2E Test');
      
      // Take screenshots at each step
      await notebook.page.screenshot({ 
        path: './screenshots/1-created.png' 
      });
      
      await notebook.addSource({
        type: 'text',
        text: 'This is a test document about machine learning.',
        title: 'ML Test Doc'
      });
      
      await notebook.page.screenshot({ 
        path: './screenshots/2-source-added.png' 
      });
      
      const answer = await notebook.ask('What is this document about?');
      expect(answer.text.toLowerCase()).toContain('machine learning');
      
      await notebook.page.screenshot({ 
        path: './screenshots/3-answer.png' 
      });
      
    } finally {
      await nlm.close();
    }
  }, 120000); // 2 minute timeout
});
```

### 8.4 Selector Validation Tests

```typescript
describe('Selector Stability', () => {
  it('should validate all selectors exist', async () => {
    const page = await browser.newPage();
    await page.goto('https://notebooklm.google.com');
    
    const results: Record<string, boolean> = {};
    
    for (const [name, config] of Object.entries(SELECTORS)) {
      let found = false;
      
      for (const selector of [config.primary, ...config.fallbacks]) {
        try {
          await page.waitForSelector(selector, { timeout: 1000 });
          found = true;
          break;
        } catch {
          continue;
        }
      }
      
      results[name] = found;
    }
    
    // Report which selectors failed
    const failures = Object.entries(results)
      .filter(([_, found]) => !found)
      .map(([name, _]) => name);
    
    expect(failures).toEqual([]);
  });
});
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [x] Project setup and dependencies
- [x] Browser manager implementation
- [x] Basic authentication (cookie-based)
- [x] Selector discovery and mapping
- [x] Error handling framework
- [x] Logging infrastructure

**Deliverables:**
- Working browser automation
- Authenticated sessions
- Basic error handling

### Phase 2: Core Features (Weeks 3-5)
- [ ] Notebook CRUD operations
- [ ] File upload automation
- [ ] Question-answer workflow
- [ ] Citation extraction
- [ ] Retry and resilience logic
- [ ] Unit tests

**Deliverables:**
- Functional notebook management
- Working Q&A automation
- Test coverage >80%

### Phase 3: Content Generation (Weeks 6-7)
- [ ] Summary generation
- [ ] Study guide generation
- [ ] FAQ generation
- [ ] Timeline extraction
- [ ] Audio overview handling
- [ ] Export functionality

**Deliverables:**
- All content generation features
- Export in multiple formats

### Phase 4: Polish & Production (Weeks 8-10)
- [ ] Rate limiting
- [ ] Advanced error recovery
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Documentation
- [ ] Integration tests
- [ ] E2E tests

**Deliverables:**
- Production-ready library
- Comprehensive documentation
- Full test suite

### Phase 5: Advanced Features (Weeks 11-12)
- [ ] Multi-notebook batch processing
- [ ] Webhook/event system
- [ ] Monitoring and metrics
- [ ] CLI tool
- [ ] REST API wrapper
- [ ] Docker containerization

**Deliverables:**
- Advanced automation capabilities
- Deployment-ready solution

---

## 10. Deployment and Maintenance

### 10.1 Deployment Architecture

```yaml
# docker-compose.yml
version: '3.8'

services:
  notebooklm-api:
    build: .
    environment:
      - GOOGLE_EMAIL=${GOOGLE_EMAIL}
      - GOOGLE_PASSWORD=${GOOGLE_PASSWORD}
      - HEADLESS=true
      - PORT=3000
    ports:
      - "3000:3000"
    volumes:
      - ./cookies:/app/cookies
      - ./data:/app/data
    restart: unless-stopped
    
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
      
volumes:
  redis-data:
```

```dockerfile
# Dockerfile
FROM node:18-slim

# Install Chrome
RUN apt-get update && apt-get install -y \
  chromium \
  chromium-sandbox \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### 10.2 Monitoring

```typescript
import { Gauge, Counter, Histogram } from 'prom-client';

const metrics = {
  activeNotebooks: new Gauge({
    name: 'notebooklm_active_notebooks',
    help: 'Number of active notebooks'
  }),
  
  questionsTotal: new Counter({
    name: 'notebooklm_questions_total',
    help: 'Total questions asked',
    labelNames: ['status']
  }),
  
  questionDuration: new Histogram({
    name: 'notebooklm_question_duration_seconds',
    help: 'Time to get answer',
    buckets: [1, 5, 10, 30, 60]
  }),
  
  uploadsTotal: new Counter({
    name: 'notebooklm_uploads_total',
    help: 'Total file uploads',
    labelNames: ['type', 'status']
  })
};

// Usage
async function ask(question: string): Promise<Answer> {
  const end = metrics.questionDuration.startTimer();
  
  try {
    const answer = await this.doAsk(question);
    metrics.questionsTotal.inc({ status: 'success' });
    return answer;
  } catch (error) {
    metrics.questionsTotal.inc({ status: 'error' });
    throw error;
  } finally {
    end();
  }
}
```

### 10.3 Health Checks

```typescript
class HealthChecker {
  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkBrowser(),
      this.checkAuthentication(),
      this.checkNotebookLMAvailability()
    ]);
    
    return {
      status: checks.every(c => c.ok) ? 'healthy' : 'unhealthy',
      checks: {
        browser: checks[0],
        auth: checks[1],
        notebooklm: checks[2]
      },
      timestamp: new Date().toISOString()
    };
  }
  
  private async checkBrowser(): Promise<Check> {
    try {
      const page = await this.browser.newPage();
      await page.close();
      return { ok: true, message: 'Browser operational' };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }
  
  private async checkAuthentication(): Promise<Check> {
    try {
      const isAuth = await this.authManager.isAuthenticated();
      return { 
        ok: isAuth, 
        message: isAuth ? 'Authenticated' : 'Not authenticated' 
      };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }
}

// Express endpoint
app.get('/health', async (req, res) => {
  const health = await healthChecker.checkHealth();
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

### 10.4 Maintenance Procedures

**Daily:**
- Monitor error rates
- Check authentication status
- Review performance metrics

**Weekly:**
- Validate selectors still work
- Update cookies/sessions
- Review and clear logs
- Check for NotebookLM UI changes

**Monthly:**
- Update dependencies
- Review and update selectors
- Performance optimization
- Security audit

**Quarterly:**
- Major version updates
- Architecture review
- Load testing
- Disaster recovery drill

---

## 11. Risk Analysis and Mitigation

### 11.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| UI changes break selectors | High | High | Multi-level selector fallbacks, regular validation |
| Authentication failures | High | Medium | Multiple auth strategies, session persistence |
| Rate limiting | Medium | Medium | Request throttling, exponential backoff |
| Detection as bot | High | Low | Stealth plugins, human-like timing |
| Large file timeouts | Medium | Medium | Configurable timeouts, chunked uploads |

### 11.2 Legal and ToS Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Terms of Service violation | High | Review Google ToS, limit to personal use |
| API abuse | Medium | Rate limiting, respectful automation |
| Data privacy issues | High | Secure credential storage, data encryption |

### 11.3 Operational Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Session expiration | Medium | Auto-refresh, graceful re-authentication |
| Memory leaks | Medium | Proper cleanup, resource monitoring |
| Concurrent access issues | Low | Mutex/locking for shared resources |
| Cost of Chrome instances | Low | Container limits, instance pooling |

---

## 12. Alternative Approaches

### 12.1 Playwright vs Puppeteer

**Consider Playwright if:**
- Need multi-browser support
- Want better debugging tools
- Require auto-waiting features
- Need mobile browser testing

```typescript
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

// Similar API to Puppeteer
await page.goto('https://notebooklm.google.com');
await page.fill('input[type="text"]', 'my question');
await page.click('button[type="submit"]');
```

### 12.2 Selenium WebDriver

**Consider Selenium if:**
- Need extensive ecosystem
- Require Grid for distributed testing
- Want language-agnostic solution

### 12.3 API Reverse Engineering

**Consider if:**
- More efficient than browser automation
- Better performance
- Less resource intensive

**Challenges:**
- More fragile (internal APIs change)
- May require authentication tokens
- Likely violates ToS

### 12.4 Chrome Extension

**Consider if:**
- Need user-initiated automation
- Want to avoid authentication issues
- Require real-time interaction

---

## 13. Example Use Cases

### 13.1 Research Paper Analysis

```typescript
async function analyzeResearchPapers(papers: string[]): Promise<Report> {
  const nlm = new NotebookLM();
  await nlm.authenticate(credentials);
  
  const notebook = await nlm.createNotebook('Research Analysis');
  
  // Upload all papers
  for (const paper of papers) {
    await notebook.addSource({ type: 'file', path: paper });
  }
  
  // Generate comprehensive analysis
  const summary = await notebook.generateSummary();
  const faq = await notebook.generateFAQ();
  
  // Ask specific questions
  const methodology = await notebook.ask('What methodology was used?');
  const findings = await notebook.ask('What are the key findings?');
  const limitations = await notebook.ask('What are the limitations?');
  
  return {
    summary,
    faq,
    methodology: methodology.text,
    findings: findings.text,
    limitations: limitations.text
  };
}
```

### 13.2 Study Material Generator

```typescript
async function generateStudyMaterials(
  textbook: string,
  chapters: number[]
): Promise<StudyPackage> {
  const nlm = new NotebookLM();
  await nlm.authenticate(credentials);
  
  const materials: StudyPackage = {
    summaries: [],
    studyGuides: [],
    faqs: [],
    flashcards: []
  };
  
  for (const chapter of chapters) {
    const notebook = await nlm.createNotebook(`Chapter ${chapter}`);
    await notebook.addSource({ type: 'file', path: textbook });
    
    // Generate materials
    materials.summaries.push(await notebook.generateSummary());
    materials.studyGuides.push(await notebook.generateStudyGuide());
    materials.faqs.push(await notebook.generateFAQ());
    
    // Generate flashcards from FAQs
    const faq = materials.faqs[materials.faqs.length - 1];
    materials.flashcards.push(...convertFAQToFlashcards(faq));
  }
  
  return materials;
}
```

### 13.3 Document Q&A Bot

```typescript
import express from 'express';

const app = express();
const nlm = new NotebookLM();

// Initialize on startup
let notebook: Notebook;

app.post('/setup', async (req, res) => {
  const { documents } = req.body;
  
  notebook = await nlm.createNotebook('QA Bot');
  
  for (const doc of documents) {
    await notebook.addSource(doc);
  }
  
  res.json({ status: 'ready' });
});

app.post('/ask', async (req, res) => {
  const { question } = req.body;
  
  if (!notebook) {
    return res.status(400).json({ error: 'Setup required' });
  }
  
  const answer = await notebook.ask(question);
  res.json(answer);
});

app.listen(3000);
```

---

## 14. Performance Optimization

### 14.1 Connection Pooling

```typescript
class BrowserPool {
  private available: Browser[] = [];
  private inUse: Set<Browser> = new Set();
  private maxSize: number;
  
  constructor(maxSize = 5) {
    this.maxSize = maxSize;
  }
  
  async acquire(): Promise<Browser> {
    if (this.available.length > 0) {
      const browser = this.available.pop()!;
      this.inUse.add(browser);
      return browser;
    }
    
    if (this.inUse.size < this.maxSize) {
      const browser = await puppeteer.launch();
      this.inUse.add(browser);
      return browser;
    }
    
    // Wait for a browser to become available
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.acquire();
  }
  
  release(browser: Browser): void {
    this.inUse.delete(browser);
    this.available.push(browser);
  }
}
```

### 14.2 Caching

```typescript
class ResponseCache {
  private cache: Map<string, CachedResponse> = new Map();
  private ttl: number = 3600000; // 1 hour
  
  get(question: string): Answer | null {
    const cached = this.cache.get(question);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(question);
      return null;
    }
    
    return cached.answer;
  }
  
  set(question: string, answer: Answer): void {
    this.cache.set(question, {
      answer,
      timestamp: Date.now()
    });
  }
}
```

### 14.3 Batch Processing

```typescript
async function batchAskQuestions(
  notebook: Notebook,
  questions: string[]
): Promise<Answer[]> {
  const answers: Answer[] = [];
  const batchSize = 5;
  
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    
    const batchAnswers = await Promise.all(
      batch.map(q => notebook.ask(q))
    );
    
    answers.push(...batchAnswers);
    
    // Rate limiting between batches
    if (i + batchSize < questions.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return answers;
}
```

---

## 15. Conclusion

This proposal outlines a comprehensive approach to building a Puppeteer-based automation layer for Google NotebookLM. The proposed solution balances:

- **Robustness**: Multiple fallback strategies and error handling
- **Security**: Encrypted credential storage and rate limiting  
- **Maintainability**: Modular architecture and comprehensive testing
- **Performance**: Caching, pooling, and batch processing
- **User Experience**: Clean API and event-driven updates

### Next Steps

1. **Prototype Development** (Week 1-2)
   - Build authentication and basic notebook management
   - Validate selector strategies
   - Test on sample notebooks

2. **Stakeholder Review** (Week 3)
   - Demo prototype
   - Gather feedback
   - Adjust approach based on findings

3. **Full Implementation** (Week 4-10)
   - Follow roadmap phases
   - Iterative development with regular demos
   - Continuous testing and validation

4. **Production Deployment** (Week 11-12)
   - Security audit
   - Performance testing
   - Documentation finalization
   - Production release

### Success Metrics

- **Reliability**: >95% success rate for core operations
- **Performance**: <5s average response time for Q&A
- **Coverage**: Support for all major NotebookLM features
- **Maintainability**: <1 day to adapt to UI changes
- **Security**: Zero security incidents

### Risks and Considerations

While this approach provides programmatic access to NotebookLM, it's important to:

1. Respect Google's Terms of Service
2. Implement rate limiting to avoid abuse
3. Be prepared for maintenance as the UI evolves
4. Consider that official APIs may eventually replace this approach

This automation should be viewed as a bridge solution until official NotebookLM APIs become available, enabling valuable integrations while being prepared to migrate to official solutions when they exist.
