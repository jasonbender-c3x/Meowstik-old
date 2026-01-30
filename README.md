# Meowstik
Agentia Compiler with RAG-Enhanced Agent Generation

## Features

### 🤖 AI-Powered Agent Generation
Generate structured AI agent specifications from natural language descriptions using Google's Gemini API.

### 🧠 RAG (Retrieval-Augmented Generation)
**NEW!** Enhanced agent generation with semantic search across:
- Previous conversation history
- Generated agent specifications  
- Documentation and examples
- User notes
- **Web search results** (NEW!)

Benefits:
- **Context-Aware**: Leverages past interactions for better results
- **Consistent**: Similar prompts use successful previous agents as reference
- **Persistent**: All conversations and agents are indexed for future use
- **Discoverable**: Search through all past generations
- **Grounded**: Web search provides current, accurate information

### 🔍 Web Search Integration
**NEW!** Automatic Google Custom Search integration for grounded responses:
- Performs web searches during each agent generation
- Integrates current information from the web
- Enriches RAG system with search results
- Provides verifiable sources and citations
- Reduces hallucination with fact-based generation

[Read the Web Search Integration Guide](./docs/WEB_SEARCH_IMPLEMENTATION_GUIDE.md)
[Read the Custom Search Proposal](./docs/GOOGLE_CUSTOM_SEARCH_PROPOSAL.md)
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
- [Web Search Integration](./docs/WEB_SEARCH_IMPLEMENTATION_GUIDE.md) - Web search setup and usage
- [Custom Search Proposal](./docs/GOOGLE_CUSTOM_SEARCH_PROPOSAL.md) - Technical specification
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

