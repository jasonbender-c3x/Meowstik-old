# Memory and RAG Implementation Guide

## Overview

This document describes the conversation history (short-term memory) implementation in Meowstik and provides guidance on implementing RAG (Retrieval Augmented Generation) capabilities.

## Current Implementation

### Conversation History (Short-Term Memory) ✅

The application now implements proper conversation history using Google Gemini's chat sessions:

#### Key Components

1. **GeminiService** (`src/GeminiService.ts`)
   - Uses `startChat()` instead of `generateContent()` for stateful conversations
   - Maintains conversation history in memory
   - Provides methods to:
     - `getConversationHistory()` - Retrieve full conversation history
     - `clearHistory()` - Reset conversation and chat session
     - `getHistoryLength()` - Get count of messages

2. **MeowstikLayout** (`src/components/MeowstikLayout.tsx`)
   - Manages conversation state at the application level
   - Displays conversation history in IntentPanel
   - Provides "Clear History" functionality

3. **AgentGenerator** (`src/components/AgentGenerator.tsx`)
   - Uses chat sessions for maintaining context across generations
   - Displays conversation history in UI
   - Includes system instruction for consistent responses

4. **MeowstikAI Service** (`services/MeowstikAI.ts`)
   - Updated to support chat sessions
   - Consistent system prompts across all services

#### How It Works

```typescript
// Initialize chat session with system instruction
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction: 'Your consistent system prompt here...',
});

const chatSession = model.startChat({
  history: [],
});

// Send messages through chat session (maintains history automatically)
const result = await chatSession.sendMessage(userPrompt);
```

#### Benefits

- ✅ **Context Awareness**: Model can reference previous messages
- ✅ **Consistent Responses**: System instruction applied to all messages
- ✅ **Iterative Refinement**: Users can refine agents based on previous generations
- ✅ **History Tracking**: Full conversation history available for review

## Future Implementation: RAG (Retrieval Augmented Generation) 🚧

RAG is not currently implemented but can be added to provide:
- Long-term memory across sessions
- Knowledge base integration
- Document retrieval and context injection

### Recommended RAG Architecture

#### 1. Vector Database Integration

Choose a vector database for semantic search:

```typescript
// Example with ChromaDB, Pinecone, or similar
import { ChromaClient } from 'chromadb';

class RAGService {
  private vectorDB: ChromaClient;
  
  async storeDocument(content: string, metadata: object) {
    // Convert to embeddings and store
    const embedding = await this.generateEmbedding(content);
    await this.vectorDB.add({
      embeddings: [embedding],
      documents: [content],
      metadatas: [metadata],
    });
  }
  
  async retrieveRelevantContext(query: string, topK: number = 5) {
    const queryEmbedding = await this.generateEmbedding(query);
    const results = await this.vectorDB.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
    });
    return results;
  }
}
```

#### 2. Embedding Generation

Use Google's embedding models or alternatives:

```typescript
async generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ 
    model: 'text-embedding-004' 
  });
  
  const result = await model.embedContent(text);
  return result.embedding.values;
}
```

#### 3. Context Injection

Combine retrieved context with user prompts:

```typescript
async generateWithRAG(userPrompt: string) {
  // Retrieve relevant context
  const context = await this.ragService.retrieveRelevantContext(userPrompt);
  
  // Inject context into prompt
  const enhancedPrompt = `
Context from knowledge base:
${context.documents.join('\n\n')}

User request: ${userPrompt}

Please generate a response considering the above context.
  `;
  
  // Send through chat session
  return await this.chatSession.sendMessage(enhancedPrompt);
}
```

#### 4. Document Indexing Strategy

```typescript
// Index agent specifications for future reference
async indexAgentSpec(agent: AgentSpec) {
  const content = `
Agent: ${agent.name}
Description: ${agent.description}
Capabilities: ${agent.capabilities.join(', ')}
  `;
  
  await this.ragService.storeDocument(content, {
    type: 'agent',
    name: agent.name,
    timestamp: new Date().toISOString(),
  });
}
```

### RAG Implementation Steps

1. **Choose Vector Database**
   - ChromaDB (local, lightweight)
   - Pinecone (cloud, scalable)
   - Weaviate (self-hosted, feature-rich)
   - Qdrant (high-performance, Rust-based)

2. **Set Up Embedding Pipeline**
   - Use Google's `text-embedding-004` model
   - Or use OpenAI embeddings, Sentence Transformers, etc.

3. **Index Existing Knowledge**
   - Previous agent specifications
   - Documentation
   - Example prompts and responses

4. **Implement Retrieval Logic**
   - Semantic search on user queries
   - Filter by metadata (type, date, relevance)
   - Rank and select top-K results

5. **Enhance Prompts**
   - Inject retrieved context before user prompt
   - Use clear formatting to separate context from query
   - Track what context was used for each response

6. **Add UI Controls**
   - Toggle RAG on/off
   - Display sources used
   - Allow manual context selection
   - Show confidence scores

### Example RAG Integration

```typescript
export class EnhancedGeminiService extends GeminiService {
  private ragService: RAGService;
  
  constructor(apiKey: string, ragConfig: RAGConfig) {
    super(apiKey);
    this.ragService = new RAGService(ragConfig);
  }
  
  async generateAgentWithRAG(
    prompt: string, 
    useRAG: boolean = true
  ): Promise<AgentSpecification> {
    let enhancedPrompt = prompt;
    
    if (useRAG) {
      // Retrieve relevant context
      const context = await this.ragService.retrieveRelevantContext(
        prompt, 
        5 // top 5 results
      );
      
      // Enhance prompt with context
      enhancedPrompt = `
Previous relevant agents and examples:
${context.documents.join('\n\n')}

---

User request: ${prompt}

Generate a new agent considering the above examples.
      `;
    }
    
    // Use existing chat session logic
    return await this.generateAgent(enhancedPrompt);
  }
}
```

## Testing Conversation History

To verify conversation history is working:

1. **Start a conversation**: "Create a simple chatbot agent"
2. **Follow up**: "Add sentiment analysis capability"
3. **Refine further**: "Make it more friendly in tone"

The model should reference previous messages and build upon them.

## Performance Considerations

### Short-Term Memory
- ✅ Lightweight - stored in memory
- ✅ Fast - no external lookups
- ⚠️ Limited to current session
- ⚠️ Lost on page refresh (can be persisted to localStorage)

### RAG (When Implemented)
- ⚠️ Requires vector database
- ⚠️ Embedding generation adds latency
- ✅ Enables long-term memory
- ✅ Scales to large knowledge bases

## Security Considerations

1. **API Keys**: Store securely, never commit to git
2. **User Data**: Consider privacy when storing conversations
3. **Rate Limiting**: Implement to prevent abuse
4. **Context Injection**: Sanitize retrieved context to prevent prompt injection

## References

- [Google Gemini Chat Sessions](https://ai.google.dev/gemini-api/docs/text-generation#chat)
- [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)
- [Vector Database Comparison](https://github.com/erikschlegel/vector-db-comparison)

## Future Enhancements

- [ ] Implement RAG with vector database
- [ ] Add persistent storage for conversation history
- [ ] Implement semantic search across past conversations
- [ ] Add conversation summarization for long threads
- [ ] Implement conversation branching/forking
- [ ] Add export/import of conversation history
- [ ] Implement multi-session management

---

*Last Updated: January 29, 2026*
