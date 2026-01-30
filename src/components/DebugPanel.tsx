import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ConversationMessage } from '../GeminiService';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, children, defaultOpen = false }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{
      marginBottom: '1rem',
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          backgroundColor: '#f9fafb',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: '500',
          fontSize: '0.875rem',
          textAlign: 'left',
        }}
      >
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {title}
      </button>
      {isOpen && (
        <div style={{
          padding: '1rem',
          backgroundColor: 'white',
          maxHeight: '400px',
          overflowY: 'auto',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

interface DebugPanelProps {
  systemInstruction?: string;
  conversationHistory: ConversationMessage[];
  ragDocuments?: Array<{ id: string; content: string; metadata?: Record<string, unknown> }>;
  retrievedContext?: Array<{ content: string; similarity: number }>;
}

export function DebugPanel({ 
  systemInstruction, 
  conversationHistory,
  ragDocuments = [],
  retrievedContext = []
}: DebugPanelProps) {
  return (
    <div style={{
      backgroundColor: '#fef3c7',
      borderBottom: '1px solid #fbbf24',
      padding: '1rem 1.5rem',
    }}>
      <h3 style={{ 
        fontSize: '0.875rem', 
        fontWeight: '600', 
        marginBottom: '0.75rem',
        color: '#92400e'
      }}>
        Debug Information
      </h3>
      
      <CollapsibleSection title="System Prompt / Instructions" defaultOpen={false}>
        {systemInstruction ? (
          <pre style={{
            fontSize: '0.75rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'monospace',
            color: '#374151',
            margin: 0,
            lineHeight: '1.5',
          }}>
            {systemInstruction}
          </pre>
        ) : (
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            No system instruction available
          </p>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Short-Term Memory (Conversation Context)" defaultOpen={false}>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          Messages in current session: {conversationHistory.length}
        </div>
        {conversationHistory.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {conversationHistory.map((msg, idx) => (
              <div
                key={`debug-${msg.role}-${msg.timestamp.getTime()}-${idx}`}
                style={{
                  padding: '0.5rem',
                  backgroundColor: msg.role === 'user' ? '#e0e7ff' : '#f3f4f6',
                  borderRadius: '0.25rem',
                  border: '1px solid #d1d5db',
                }}
              >
                <div style={{
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  color: msg.role === 'user' ? '#4f46e5' : '#059669',
                  marginBottom: '0.25rem',
                }}>
                  {msg.role.toUpperCase()} ({msg.timestamp.toLocaleString()})
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#374151',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '100px',
                  overflowY: 'auto',
                }}>
                  {msg.parts.substring(0, 500)}{msg.parts.length > 500 ? '...' : ''}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            No conversation history in current session
          </p>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="RAG Retrieved Context" defaultOpen={false}>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          Retrieved documents: {retrievedContext.length}
        </div>
        {retrievedContext.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {retrievedContext.map((doc, idx) => (
              <div
                key={`context-${idx}`}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.25rem',
                  border: '1px solid #d1d5db',
                }}
              >
                <div style={{
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  color: '#7c3aed',
                  marginBottom: '0.25rem',
                }}>
                  Context {idx + 1} - Similarity: {(doc.similarity * 100).toFixed(1)}%
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#374151',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '100px',
                  overflowY: 'auto',
                }}>
                  {doc.content.substring(0, 300)}{doc.content.length > 300 ? '...' : ''}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            No context retrieved from RAG in last query
          </p>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="RAG Document Library" defaultOpen={false}>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          Total indexed documents: {ragDocuments.length}
        </div>
        {ragDocuments.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {ragDocuments.slice(0, 10).map((doc, idx) => (
              <div
                key={doc.id || `doc-${idx}`}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.25rem',
                  border: '1px solid #d1d5db',
                }}
              >
                <div style={{
                  fontWeight: '600',
                  fontSize: '0.75rem',
                  color: '#0891b2',
                  marginBottom: '0.25rem',
                }}>
                  {doc.id || `Document ${idx + 1}`}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#374151',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '80px',
                  overflowY: 'auto',
                }}>
                  {doc.content.substring(0, 200)}{doc.content.length > 200 ? '...' : ''}
                </div>
                {doc.metadata && (
                  <div style={{
                    fontSize: '0.65rem',
                    color: '#9ca3af',
                    marginTop: '0.25rem',
                  }}>
                    {`Type: ${doc.metadata.type || 'unknown'} | Source: ${doc.metadata.source || 'unknown'}`}
                  </div>
                )}
              </div>
            ))}
            {ragDocuments.length > 10 && (
              <p style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
                Showing 10 of {ragDocuments.length} documents
              </p>
            )}
          </div>
        ) : (
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            No documents indexed in RAG system
          </p>
        )}
      </CollapsibleSection>

      <div style={{
        marginTop: '0.75rem',
        padding: '0.5rem',
        backgroundColor: '#fef3c7',
        borderRadius: '0.25rem',
        fontSize: '0.75rem',
        color: '#92400e',
      }}>
        ℹ️ This panel shows all context and data being used by the AI model to generate responses.
      </div>
    </div>
  );
}
