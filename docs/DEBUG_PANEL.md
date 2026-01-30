# Debug Panel Documentation

## Overview

The Debug Panel is a new feature in Meowstik that provides comprehensive visibility into the AI system's internal state, memory, and context. It addresses the issue of inconsistent or confusing system prompt tools and lack of visibility into what data is being sent to the AI model.

## Features

### 1. System Prompt / Instructions Viewer
- **Purpose**: Displays the exact system instruction being sent to the Gemini AI model
- **Use Case**: Helps understand how the AI is being prompted and debug unexpected behaviors
- **Access**: Collapsible section in Debug Panel

### 2. Short-Term Memory (Conversation Context)
- **Purpose**: Shows all messages in the current conversation session
- **Content**: 
  - User messages with timestamps
  - Model responses with timestamps
  - Message count indicator
- **Use Case**: Understand what context the model has access to for generating responses
- **Access**: Collapsible section in Debug Panel

### 3. RAG Retrieved Context
- **Purpose**: Displays the documents retrieved from RAG system for the last query
- **Content**:
  - Document content preview (first 300 characters)
  - Similarity score for each retrieved document
  - Number of documents retrieved
- **Use Case**: Debug RAG retrieval and understand what context influenced the response
- **Access**: Collapsible section in Debug Panel

### 4. RAG Document Library
- **Purpose**: Shows all documents indexed in the RAG system
- **Content**:
  - Document ID
  - Content preview (first 200 characters)
  - Document metadata (type, source)
  - Total document count (shows first 10, indicates total)
- **Use Case**: Verify what knowledge is available to the RAG system
- **Access**: Collapsible section in Debug Panel

## How to Access

1. Click the **Debug** button in the application header (orange button with bug icon)
2. The Debug Panel will appear below the header
3. Click on any section header to expand/collapse that section
4. All sections are collapsed by default to minimize visual clutter

## Implementation Details

### New Components

#### `DebugPanel.tsx`
- React component with collapsible sections
- Props:
  - `systemInstruction`: string - The system prompt
  - `conversationHistory`: ConversationMessage[] - Chat history
  - `ragDocuments`: Document[] - All RAG documents
  - `retrievedContext`: Array<{content, similarity}> - Last retrieved context

### API Changes

#### `GeminiService.ts`
- **New Method**: `getSystemInstruction()` - Returns the system instruction string

#### `EnhancedGeminiService.ts`
- **New Field**: `lastRetrievedContext` - Stores last RAG retrieval results
- **New Method**: `getLastRetrievedContext()` - Returns last retrieved context
- **New Method**: `getAllRAGDocuments()` - Returns all documents in RAG system
- **Modified**: `generateAgentWithRAG()` - Now stores retrieved context

### UI Changes

#### `MeowstikLayout.tsx`
- Added Debug button in header
- Added `showDebugPanel` state
- Integrated DebugPanel component
- Passes all necessary data to DebugPanel

## Usage Example

```typescript
// User enters a prompt
User: "Create an agent for data processing"

// Click Debug button to see:
1. System Instruction:
   "You are an expert AI assistant that generates agent specifications in JSON format..."

2. Short-Term Memory:
   - USER (10:30:15): "Create an agent for data processing"
   - MODEL (10:30:16): {"name": "DataProcessor", ...}

3. RAG Retrieved Context:
   - Context 1 (Relevance: 87.3%): Previous agent for similar task...
   - Context 2 (Relevance: 72.1%): Documentation about data processing...

4. RAG Document Library:
   - Document 1: "agent_example_1" - Data processing agent example...
   - Document 2: "conversation_2024_01_15" - Previous conversation about...
   - Total: 127 documents indexed
```

## Benefits

1. **Transparency**: See exactly what the AI model receives
2. **Debugging**: Identify why responses are unexpected
3. **Context Awareness**: Understand how RAG influences responses
4. **Memory Management**: Monitor conversation history size
5. **Knowledge Base Inspection**: Verify RAG document indexing

## Technical Notes

- Debug panel updates in real-time as conversations progress
- Context retrieval is tracked only for RAG-enhanced queries
- Document previews are truncated to prevent UI clutter
- All data shown is exactly what the AI model receives
- No additional API calls are made to display debug information

## Future Enhancements

Potential future additions:
- Export debug information to file
- Search/filter functionality in document library
- Token usage statistics
- Response timing metrics
- Model parameter visualization
- Cache file viewer (if cache.md and Short_Term_Memory.md are implemented)
