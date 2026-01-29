# RAG Integration in Meowstik

## Overview

Meowstik now includes a **Retrieval-Augmented Generation (RAG)** system that enhances agent generation by providing relevant context from:
- Previous conversation history
- Generated agent specifications
- Documentation files
- User notes

## Features

### 🔍 Semantic Search
- Uses Google's `text-embedding-004` model for high-quality embeddings
- Cosine similarity for finding relevant documents
- Metadata filtering for targeted searches

### 💾 Persistent Storage
- localStorage-based storage for browser persistence
- Automatic conversation history saving
- Agent specification indexing
- User profile tracking with unique IDs

### 📚 Content Ingestion
- Automatic ingestion of markdown documentation
- Conversation history indexing
- Generated agent specifications
- Example agents for bootstrapping

### 🎛️ User Controls
- Toggle RAG on/off in UI
- View RAG statistics (document count, conversations, agents)
- Clear RAG data
- Enable/disable per-generation

## Architecture

### Services

#### 1. RAGService (`src/services/RAGService.ts`)
Manages embeddings and document retrieval:
- `generateEmbedding(text)` - Generate embedding vectors
- `addDocument(content, metadata)` - Add document to index
- `retrieveRelevantDocuments(query, topK, filter)` - Semantic search
- `getDocuments(filter)` - Get filtered documents
- `clearDocuments()` - Clear all indexed content

#### 2. StorageService (`src/services/StorageService.ts`)
Handles persistent storage:
- `getUserId()` - Get or create unique user ID
- `saveDocuments(documents)` - Persist documents to localStorage
- `loadDocuments()` - Load persisted documents
- `saveConversationHistory(history)` - Save conversation
- `loadConversationHistory()` - Load conversation
- `exportData()` / `importData(json)` - Export/import all data

#### 3. IngestionService (`src/services/IngestionService.ts`)
Processes and indexes content:
- `ingestMarkdown(content, metadata)` - Process markdown files
- `ingestConversationHistory(history, userId)` - Index conversations
- `ingestAgent(agent, userId)` - Index agent specifications
- `ingestUserNote(content, userId, title, tags)` - Index user notes

#### 4. EnhancedGeminiService (`src/services/EnhancedGeminiService.ts`)
Extends GeminiService with RAG capabilities:
- `generateAgentWithRAG(prompt, useRAG)` - Generate with context injection
- `retrieveContext(query, topK)` - Get relevant context
- `searchAgents(query, topK)` - Find similar agents
- `searchConversations(query, topK)` - Search conversation history
- `saveConversation()` - Persist current conversation

### React Integration

#### useRAG Hook (`src/hooks/useRAG.ts`)
React hook for RAG functionality:
```typescript
const {
  // Services
  ragService,
  storageService,
  geminiService,
  
  // State
  isInitialized,
  ragEnabled,
  error,
  
  // Actions
  toggleRAG,
  saveConversation,
  clearRAGData,
  
  // Queries
  getStats,
  searchAgents,
  searchConversations,
} = useRAG(apiKey);
```

## Usage

### Basic Setup

1. **Enter API Key** - Configure your Google Gemini API key in settings
2. **RAG Auto-Initializes** - System initializes automatically on first use
3. **Documentation Indexed** - All markdown files are ingested
4. **Example Agents Added** - Sample agents provide initial context

### Generating Agents with RAG

```typescript
// RAG automatically enhances prompts with relevant context
const agent = await geminiService.generateAgentWithRAG(
  "Create a customer support agent",
  true // useRAG flag
);
```

### Context Retrieval Flow

When you generate an agent:

1. **User enters prompt** → "Create a customer support agent"
2. **RAG retrieves context** → Finds similar agents, relevant conversations, and documentation
3. **Context injection** → Relevant examples and information added to prompt
4. **Enhanced generation** → Gemini generates agent with full context
5. **Auto-save** → New agent is indexed for future retrievals

### Viewing RAG Stats

Click the **"RAG Stats"** button in the header to see:
- Total indexed documents
- Number of conversation turns
- Number of indexed agents

### Toggling RAG

You can enable/disable RAG without losing indexed data:
- **Enabled** (default) - Context is retrieved and injected
- **Disabled** - Generates without RAG (still saves to index)

## Data Storage

### What Gets Stored

1. **Documents**
   - Type: documentation, conversation, agent, user_note
   - Content: Full text
   - Embedding: Vector representation (768 dimensions)
   - Metadata: userId, source, title, tags, timestamp

2. **User Profile**
   - Unique ID (auto-generated)
   - Creation date
   - Last active timestamp
   - Preferences (optional)

3. **Conversation History**
   - All user-model interactions
   - Timestamps
   - Indexed as conversation turns

4. **Generated Agents**
   - Full agent specifications
   - Indexed with capabilities, tools, personality

### Storage Location

All data is stored in browser `localStorage` with prefix `meowstik_`:
- `meowstik_user_id` - User identifier
- `meowstik_user_profile` - User profile data
- `meowstik_documents` - All indexed documents with embeddings
- `meowstik_conversation_history` - Conversation messages
- `meowstik_generated_agents` - Agent specifications

### Data Export/Import

```typescript
// Export all RAG data
const json = storageService.exportData();
// Save to file...

// Import RAG data
storageService.importData(json);
```

## Free Tier Considerations

### Google Gemini API
- **Embeddings**: 5,000 free per month (text-embedding-004)
- **Generation**: Free tier available for Gemini 1.5 Flash
- **Rate Limits**: Respect API rate limits

### Browser Storage
- **localStorage**: ~5-10MB typical limit
- **Documents**: Each document ~1-5KB (including embedding)
- **Capacity**: ~1,000-5,000 documents depending on size

## Performance

### Initialization
- First load: ~2-5 seconds (ingests documentation)
- Subsequent loads: ~500ms (loads from localStorage)

### Embedding Generation
- ~200-500ms per document
- Batch processing for multiple documents

### Retrieval
- Client-side cosine similarity: <50ms
- Top-K search: O(n) where n = document count

## Best Practices

### 1. Regular Conversation Saving
Conversations are saved automatically after each generation. For manual saving:
```typescript
await rag.saveConversation();
```

### 2. Periodic Data Export
Export your RAG data periodically to avoid data loss:
```typescript
const backup = storageService.exportData();
// Save to file or cloud storage
```

### 3. Clear Old Data
If localStorage is filling up, selectively remove old documents or clear all:
```typescript
rag.clearRAGData(); // Clears everything
```

### 4. Monitor Stats
Keep an eye on document count in RAG Stats panel.

## Troubleshooting

### RAG Not Initializing
- **Check API Key**: Ensure valid Gemini API key is configured
- **Console Errors**: Check browser console for error messages
- **Clear Storage**: Try clearing localStorage and reinitializing

### Context Not Being Used
- **RAG Disabled**: Check if RAG is enabled in stats panel
- **No Relevant Documents**: System needs indexed content to retrieve
- **First Generation**: First agent has no prior context

### Storage Quota Exceeded
- **Export & Clear**: Export data, then clear localStorage
- **Selective Deletion**: Remove old conversations/agents manually
- **Browser Limits**: Check browser's localStorage limits

## Future Enhancements

Planned improvements:
- [ ] Firebase/Firestore backend option for cloud storage
- [ ] Vertex AI integration for larger scale
- [ ] Advanced chunking strategies
- [ ] Hybrid search (semantic + keyword)
- [ ] Multi-user support with authentication
- [ ] Agent similarity clustering
- [ ] Conversation summarization
- [ ] Real-time search UI
- [ ] Context source attribution in UI

## API Reference

### RAGService

```typescript
class RAGService {
  async generateEmbedding(text: string): Promise<number[]>
  async addDocument(content: string, metadata: DocumentMetadata): Promise<Document>
  async retrieveRelevantDocuments(query: string, topK?: number, filter?: Partial<DocumentMetadata>): Promise<SearchResult[]>
  getDocuments(filter?: Partial<DocumentMetadata>): Document[]
  removeDocument(id: string): boolean
  clearDocuments(): void
  getDocumentCount(): number
}
```

### StorageService

```typescript
class StorageService {
  getUserId(): string
  getUserProfile(): UserProfile
  saveUserProfile(profile: UserProfile): void
  saveDocuments(documents: Document[]): void
  loadDocuments(): Document[]
  saveConversationHistory(history: ConversationMessage[]): void
  loadConversationHistory(): ConversationMessage[]
  saveGeneratedAgents(agents: AgentSchema[]): void
  loadGeneratedAgents(): AgentSchema[]
  clearAll(): void
  exportData(): string
  importData(jsonData: string): void
}
```

### EnhancedGeminiService

```typescript
class EnhancedGeminiService extends GeminiService {
  enableRAG(ragService, storageService, ingestionService): void
  disableRAG(): void
  isRAGAvailable(): boolean
  async retrieveContext(query: string, topK?: number): Promise<SearchResult[]>
  async generateAgentWithRAG(prompt: string, useRAG?: boolean): Promise<AgentSpecification>
  async saveConversation(): Promise<void>
  getRAGStats(): { enabled: boolean; documentCount: number; conversationCount: number; agentCount: number }
  async searchAgents(query: string, topK?: number): Promise<SearchResult[]>
  async searchConversations(query: string, topK?: number): Promise<SearchResult[]>
}
```

## Security Considerations

⚠️ **Important Security Notes**:

1. **API Keys**: Stored unencrypted in localStorage - **use only for development**
2. **User Data**: All data stored locally in browser - **no cloud backup by default**
3. **No Authentication**: Single-user system - **no multi-user isolation**
4. **Browser Storage**: Vulnerable to XSS - **trust only your own code**

For production use, implement:
- Server-side API key management
- Proper authentication and authorization
- Encrypted storage
- Backend database (Firestore, etc.)

---

*For questions or issues, please open an issue on GitHub or contact jason@oceanshorestech.com*
