# Meowstik
Agentia Compiler with RAG-Enhanced Agent Generation

## Features

### 🤖 AI-Powered Agent Generation
Generate structured AI agent specifications from natural language descriptions using Google's Gemini API.

### 🧠 RAG (Retrieval-Augmented Generation)
**ENHANCED!** Advanced retrieval orchestrator with multiple recall streams:

**Core Capabilities:**
- **Hybrid Search**: Combines vector similarity with BM25 keyword search
- **Multi-Stream Retrieval**: Local RAG + Vertex AI Search + NotebookLM
- **Entity Recognition**: Extracts structured information from queries
- **Security**: Prompt injection detection and mitigation
- **Smart Context Management**: Intelligent context window strategies

**Recall Sources:**
- Previous conversation history
- Generated agent specifications  
- Documentation and examples
- User notes
- Vertex AI Search (optional - enterprise scale)
- NotebookLM (optional - enhanced document understanding)

**Benefits:**
- **Context-Aware**: Leverages past interactions for better results
- **Secure**: Built-in protection against prompt injection attacks
- **Intelligent**: Entity recognition for better query understanding
- **Scalable**: Multiple recall streams for comprehensive coverage
- **Flexible**: Configurable hybrid search and context strategies

[📚 Retrieval Orchestrator Documentation](./docs/RETRIEVAL_ORCHESTRATOR.md)  
[⚙️ Vertex AI & NotebookLM Setup Guide](./docs/VERTEX_NOTEBOOKLM_SETUP.md)

### 🔬 Self-Evolution Engine with Captain's Log
**NEW!** Analyze logs to extract user opinions and automatically generate improvement suggestions:
- **Opinion Tracking**: Identifies "awesomest ideas" and "biggest pet peeves" from logs
- **Captain's Log**: Maintains historical record of user feedback in markdown format
- **Top 10 Issues**: Automatically prioritizes and generates actionable GitHub issues
- **Smart Analysis**: Groups similar opinions and ranks by impact and frequency

[Read the full Captain's Log documentation](./docs/CAPTAINS_LOG.md)

### 🔐 Secure File System Bridge
Persist agents to disk using the browser's native File System Access API with the `useLocalRepo` React hook.

#### Quick Start

```typescript
import { useLocalRepo } from './src/hooks/useLocalRepo';

function MyComponent() {
  const { directoryHandle, connect, saveAgent, error } = useLocalRepo();

  const handleConnect = async () => {
    await connect(); // Opens directory picker
  };

  const handleSave = async () => {
    await saveAgent('agent.json', JSON.stringify({ name: 'My Agent' }));
  };

  return (
    <div>
      <button onClick={handleConnect}>Connect to Directory</button>
      {directoryHandle && (
        <button onClick={handleSave}>Save Agent</button>
      )}
      {error && <p>{error.message}</p>}
    </div>
  );
}
```

#### Documentation
- [Hook Documentation](./src/hooks/README.md) - Complete API reference and examples
- [RAG Implementation](./docs/RAG_IMPLEMENTATION.md) - RAG system documentation
- [Memory & RAG Guide](./docs/MEMORY_AND_RAG.md) - Memory architecture overview
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Technical details and security features
- [Example Component](./src/AgentPersistenceExample.tsx) - Full working example

#### Features
- ✅ FileSystemDirectoryHandle state management
- ✅ `connect()` - Opens browser directory picker
- ✅ `saveAgent()` - Writes files with streams
- ✅ Comprehensive error handling
- ✅ Input validation & security
- ✅ TypeScript support
- ✅ CodeQL verified (0 alerts)

#### Browser Support
- Chrome/Edge 86+
- Opera 72+
- Firefox (behind flag)

## Development

```bash
# Install dependencies
npm install

# Type check
npm run type-check
```

