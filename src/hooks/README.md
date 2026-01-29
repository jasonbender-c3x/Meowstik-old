# useLocalRepo Hook

A React hook for managing local file system access using the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API). This hook allows Meowstik to persist agents to disk with user-granted directory permissions.

## Features

- 🔒 **Secure**: Uses browser's native File System Access API with user permission prompts
- 📁 **Directory Management**: Stores and manages a `FileSystemDirectoryHandle` in React state
- 💾 **File Writing**: Create and write files to the selected directory
- ⚠️ **Error Handling**: Graceful handling of permission denials and user cancellations
- 📝 **TypeScript Support**: Fully typed with TypeScript definitions

## Installation

This hook requires React 16.8+ (for hooks support) and a browser that supports the File System Access API (Chrome 86+, Edge 86+).

## Usage

### Basic Example

```typescript
import { useLocalRepo } from './hooks/useLocalRepo';

function AgentManager() {
  const { directoryHandle, connect, saveAgent, error } = useLocalRepo();

  const handleConnect = async () => {
    await connect();
  };

  const handleSave = async () => {
    try {
      await saveAgent('agent.json', JSON.stringify({ name: 'My Agent' }));
      console.log('Agent saved successfully!');
    } catch (err) {
      console.error('Failed to save agent:', err);
    }
  };

  return (
    <div>
      <button onClick={handleConnect}>
        {directoryHandle ? 'Connected' : 'Connect to Directory'}
      </button>
      
      {directoryHandle && (
        <button onClick={handleSave}>Save Agent</button>
      )}
      
      {error && <p style={{ color: 'red' }}>{error.message}</p>}
    </div>
  );
}
```

## API Reference

### Return Value

The hook returns an object with the following properties:

#### `directoryHandle`
- **Type**: `FileSystemDirectoryHandle | null`
- **Description**: The currently selected directory handle, or `null` if no directory is connected

#### `connect()`
- **Type**: `() => Promise<void>`
- **Description**: Opens the browser's directory picker dialog and stores the selected directory handle
- **Throws**: Sets error state on failure (permission denial, user cancellation, API not supported)

#### `saveAgent(fileName, content)`
- **Type**: `(fileName: string, content: string) => Promise<void>`
- **Parameters**:
  - `fileName`: Name of the file to create or overwrite
  - `content`: String content to write to the file
- **Description**: Writes content to a file in the connected directory
- **Throws**: Error if no directory is connected or if permission is denied

#### `error`
- **Type**: `Error | null`
- **Description**: The most recent error that occurred, or `null` if no error

## Error Handling

The hook handles several error scenarios:

### Permission Denied
When the user denies permission to access the directory:
```typescript
error.message === 'Permission to access directory was denied'
```

### User Cancellation
When the user cancels the directory picker dialog:
```typescript
error.message === 'Directory selection was cancelled'
```

### No Directory Connected
When trying to save without connecting first:
```typescript
error.message === 'No directory connected. Call connect() first.'
```

### Browser Support
When the File System Access API is not available:
```typescript
error.message === 'File System Access API is not supported in this browser'
```

## Browser Compatibility

The File System Access API is supported in:
- Chrome/Edge 86+
- Opera 72+

**Note**: This API is not available in:
- Firefox (as of 2024)
- Safari (as of 2024)

For production use, always check for API availability and provide fallback mechanisms.

## Security Considerations

1. **User Permission**: The browser always prompts the user for permission before accessing the file system
2. **Same-Origin Policy**: File handles cannot be shared across different origins
3. **Transient User Activation**: Some operations require recent user interaction
4. **HTTPS Required**: The API requires a secure context (HTTPS or localhost)

## Example: Complete Agent Persistence

```typescript
import { useLocalRepo } from './hooks/useLocalRepo';

interface Agent {
  id: string;
  name: string;
  config: Record<string, unknown>;
}

function AgentPersistence() {
  const { directoryHandle, connect, saveAgent, error } = useLocalRepo();
  const [agents, setAgents] = useState<Agent[]>([]);

  const handleSaveAllAgents = async () => {
    if (!directoryHandle) {
      alert('Please connect to a directory first');
      return;
    }

    try {
      for (const agent of agents) {
        const fileName = `${agent.id}.json`;
        const content = JSON.stringify(agent, null, 2);
        await saveAgent(fileName, content);
      }
      alert('All agents saved successfully!');
    } catch (err) {
      console.error('Failed to save agents:', err);
    }
  };

  return (
    <div>
      <h2>Agent Persistence</h2>
      
      {!directoryHandle ? (
        <button onClick={connect}>Connect to Directory</button>
      ) : (
        <>
          <p>Connected to: {directoryHandle.name}</p>
          <button onClick={handleSaveAllAgents}>Save All Agents</button>
        </>
      )}
      
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          Error: {error.message}
        </div>
      )}
    </div>
  );
}
```

## License

MIT
