# Meowstik
Agentia Compiler

## Features

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

