import React from 'react';
import { useLocalRepo } from './hooks/useLocalRepo';

/**
 * Example component demonstrating the useLocalRepo hook usage.
 * This component allows users to:
 * 1. Connect to a local directory
 * 2. Save agent data to files in that directory
 * 3. See error messages if something goes wrong
 */
export function AgentPersistenceExample() {
  const { directoryHandle, connect, saveAgent, error } = useLocalRepo();
  const [agentName, setAgentName] = React.useState('example-agent');
  const [agentContent, setAgentContent] = React.useState(JSON.stringify({
    name: 'Example Agent',
    version: '1.0.0',
    description: 'An example agent configuration',
  }, null, 2));

  const handleConnect = async () => {
    await connect();
  };

  const handleSave = async () => {
    if (!agentName.trim()) {
      alert('Please enter a file name');
      return;
    }

    try {
      const fileName = agentName.endsWith('.json') ? agentName : `${agentName}.json`;
      await saveAgent(fileName, agentContent);
      alert(`Agent saved successfully as ${fileName}!`);
    } catch (err) {
      console.error('Failed to save agent:', err);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Meowstik - Agent Persistence</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Step 1: Connect to Directory</h2>
        <button 
          onClick={handleConnect}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: directoryHandle ? '#4CAF50' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {directoryHandle ? `✓ Connected: ${directoryHandle.name}` : 'Connect to Directory'}
        </button>
      </div>

      {directoryHandle && (
        <div style={{ marginBottom: '20px' }}>
          <h2>Step 2: Save Agent</h2>
          
          <div style={{ marginBottom: '10px' }}>
            <label>
              File Name:
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                style={{
                  marginLeft: '10px',
                  padding: '5px',
                  width: '200px',
                }}
                placeholder="agent-name"
              />
            </label>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>
              Agent Content:
              <textarea
                value={agentContent}
                onChange={(e) => setAgentContent(e.target.value)}
                style={{
                  display: 'block',
                  marginTop: '5px',
                  width: '100%',
                  minHeight: '200px',
                  fontFamily: 'monospace',
                  padding: '10px',
                }}
              />
            </label>
          </div>

          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            💾 Save Agent
          </button>
        </div>
      )}

      {error && (
        <div 
          style={{
            marginTop: '20px',
            padding: '10px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            border: '1px solid #ef5350',
          }}
        >
          <strong>Error:</strong> {error.message}
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>How it works:</h3>
        <ol>
          <li>Click "Connect to Directory" to open the file picker</li>
          <li>Select a directory where you want to save agent files</li>
          <li>The browser will ask for permission to access the directory</li>
          <li>Once connected, you can save agent configurations as JSON files</li>
          <li>The files will be created in your selected directory</li>
        </ol>
        
        <h3>Browser Support:</h3>
        <p>This feature requires the File System Access API, which is available in Chrome 86+, Edge 86+, and Opera 72+.</p>
      </div>
    </div>
  );
}
