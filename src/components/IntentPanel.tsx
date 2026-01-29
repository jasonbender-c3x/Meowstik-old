import { useState, useRef, useEffect } from 'react';
import { ConversationMessage } from '../GeminiService';

interface IntentPanelProps {
  onSendMessage?: (message: string) => void;
  conversationHistory?: ConversationMessage[];
}

export function IntentPanel({ onSendMessage, conversationHistory = [] }: IntentPanelProps) {
  const [prompt, setPrompt] = useState('');
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when conversation history updates
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && onSendMessage) {
      onSendMessage(prompt);
      setPrompt('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="intent-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h2 className="panel-title">Conversation</h2>
      
      {/* Conversation History Display */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '1rem',
        backgroundColor: '#f9fafb',
        borderRadius: '0.5rem',
        marginBottom: '1rem'
      }}>
        {conversationHistory.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#9ca3af', 
            padding: '2rem' 
          }}>
            No conversation history yet. Start by entering a prompt below.
          </div>
        ) : (
          <>
            {conversationHistory.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: msg.role === 'user' ? '#e0e7ff' : '#ffffff',
                  border: msg.role === 'user' ? '1px solid #c7d2fe' : '1px solid #e5e7eb',
                }}
              >
                <div style={{
                  fontWeight: 'bold',
                  color: msg.role === 'user' ? '#4f46e5' : '#059669',
                  marginBottom: '0.25rem',
                  fontSize: '0.875rem',
                }}>
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                  {msg.timestamp && (
                    <span style={{ 
                      fontWeight: 'normal', 
                      marginLeft: '0.5rem',
                      color: '#6b7280',
                      fontSize: '0.75rem' 
                    }}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div style={{ 
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-word',
                  color: '#374151',
                  fontSize: '0.875rem',
                }}>
                  {msg.parts}
                </div>
              </div>
            ))}
            <div ref={historyEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit}>
        <textarea
          className="intent-textarea"
          placeholder="Enter your prompt here... (Shift+Enter for new line, Enter to send)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{ marginBottom: '0.5rem' }}
        />
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '1rem',
          }}
          disabled={!prompt.trim()}
        >
          Send Message
        </button>
      </form>
    </div>
  );
}
