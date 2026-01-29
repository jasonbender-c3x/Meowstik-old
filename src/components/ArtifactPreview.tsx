import { AgentSpecification } from '../GeminiService';

interface ArtifactPreviewProps {
  agent: AgentSpecification | null;
}

export function ArtifactPreview({ agent }: ArtifactPreviewProps) {
  if (!agent) {
    return (
      <div className="artifact-preview">
        <h2 className="panel-title">Generated Agent Preview</h2>
        <div style={{ 
          textAlign: 'center', 
          color: '#9ca3af', 
          padding: '3rem',
          fontSize: '1rem'
        }}>
          No agent generated yet. Start a conversation to generate an agent specification.
        </div>
      </div>
    );
  }

  return (
    <div className="artifact-preview">
      <h2 className="panel-title">Generated Agent Preview</h2>
      
      {/* Agent Card Display */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        overflow: 'hidden',
        margin: '1rem',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(to right, #7c3aed, #2563eb)',
          padding: '1.5rem',
          color: 'white',
        }}>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            marginBottom: '0.5rem' 
          }}>
            {agent.name}
          </h3>
          <p style={{ color: '#e0e7ff' }}>{agent.description}</p>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Capabilities */}
          {agent.capabilities && agent.capabilities.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#6b7280',
                textTransform: 'uppercase',
                marginBottom: '0.75rem'
              }}>
                Capabilities
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {agent.capabilities.map((cap, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#ede9fe',
                      color: '#6d28d9',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                    }}
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Parameters */}
          {agent.parameters && Object.keys(agent.parameters).length > 0 && (
            <div>
              <h4 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#6b7280',
                textTransform: 'uppercase',
                marginBottom: '0.75rem'
              }}>
                Parameters
              </h4>
              <div style={{
                backgroundColor: '#f9fafb',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
              }}>
                <pre style={{ 
                  margin: 0, 
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {JSON.stringify(agent.parameters, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* JSON View */}
      <details style={{ margin: '1rem' }}>
        <summary style={{ 
          cursor: 'pointer', 
          fontWeight: '600',
          padding: '0.75rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '0.5rem',
          userSelect: 'none',
        }}>
          View Raw JSON
        </summary>
        <pre className="json-display" style={{ marginTop: '0.5rem' }}>
          {JSON.stringify(agent, null, 2)}
        </pre>
      </details>
    </div>
  );
}
