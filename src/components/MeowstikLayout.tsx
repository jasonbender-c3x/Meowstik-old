import { useState } from 'react';
import { Cpu, FlaskConical } from 'lucide-react';
import { IntentPanel } from './IntentPanel';
import { ArtifactPreview } from './ArtifactPreview';
import { EvolutionCenter } from './EvolutionCenter';
import './MeowstikLayout.css';

type ActiveView = 'workspace' | 'evolution';

export function MeowstikLayout() {
  const [dividerPosition, setDividerPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('workspace');

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newPosition = (e.clientX / window.innerWidth) * 100;
      setDividerPosition(Math.max(20, Math.min(80, newPosition)));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSendMessage = async (message: string) => {
    if (!geminiService) {
      setError('Please configure your Gemini API key in settings');
      setShowSettings(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const agent = await geminiService.generateAgent(message);
      setGeneratedAgent(agent);
      
      // Update conversation history from service
      const history = geminiService.getConversationHistory();
      setConversationHistory(history);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error generating agent:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (!geminiService) {
      console.warn('Gemini service not initialized');
      return;
    }
    geminiService.clearHistory();
    setConversationHistory([]);
    setGeneratedAgent(null);
    setError(null);
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey);
      try {
        // Reinitialize service with new key
        const service = getGeminiService();
        setGeminiService(service);
        setShowSettings(false);
        setError(null);
      } catch (err) {
        setError('Failed to initialize Gemini service. Please check your API key.');
      }
    }
  };

  return (
    <div 
      className="meowstik-layout"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <header className="meowstik-header">
        <div className="logo-container">
          <Cpu className="logo-icon" size={32} />
          <h1 className="logo-text">Meowstik</h1>
          <span style={{ 
            marginLeft: '1rem', 
            fontSize: '0.875rem', 
            color: '#6b7280',
            fontWeight: 'normal' 
          }}>
            with Conversation Memory
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleClearHistory}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            title="Clear conversation history"
          >
            <Trash2 size={16} />
            Clear History
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: '0.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            title="Settings"
          >
            <Settings size={24} />
          </button>
        </div>
        
        <nav className="nav-tabs">
          <button
            onClick={() => setActiveView('workspace')}
            className={`nav-tab ${activeView === 'workspace' ? 'active' : ''}`}
          >
            <Cpu size={18} />
            <span>Workspace</span>
          </button>
          <button
            onClick={() => setActiveView('evolution')}
            className={`nav-tab ${activeView === 'evolution' ? 'active' : ''}`}
          >
            <FlaskConical size={18} />
            <span>Evolution Center</span>
          </button>
        </nav>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{
          backgroundColor: '#fef3c7',
          borderBottom: '1px solid #fbbf24',
          padding: '1rem 1.5rem',
        }}>
          <label style={{ 
            display: 'block', 
            fontSize: '0.875rem', 
            fontWeight: '500', 
            marginBottom: '0.5rem' 
          }}>
            Gemini API Key
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '40rem' }}>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
              }}
            />
            <button
              onClick={handleSaveApiKey}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
              }}
            >
              Save
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
            Get your API key from{' '}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#4f46e5', textDecoration: 'underline' }}
            >
              Google AI Studio
            </a>
          </p>
          <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem', fontWeight: '500' }}>
            ⚠️ Security Notice: API keys are stored unencrypted in browser localStorage. 
            Only use this for development/testing. Do not use production API keys.
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          borderBottom: '1px solid #ef4444',
          padding: '0.75rem 1.5rem',
          color: '#991b1b',
          fontSize: '0.875rem',
        }}>
          Error: {error}
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div style={{
          backgroundColor: '#dbeafe',
          borderBottom: '1px solid #3b82f6',
          padding: '0.75rem 1.5rem',
          color: '#1e40af',
          fontSize: '0.875rem',
        }}>
          Generating response...
        </div>
      )}
      
      {activeView === 'workspace' ? (
        <div className="split-pane-container">
          <div 
            className="left-pane"
            style={{ width: `${dividerPosition}%` }}
          >
            <IntentPanel />
          </div>
          
          <div 
            className="divider"
            onMouseDown={handleMouseDown}
          />
          
          <div 
            className="right-pane"
            style={{ width: `${100 - dividerPosition}%` }}
          >
            <ArtifactPreview />
          </div>
        </div>
      ) : (
        <div className="evolution-container">
          <EvolutionCenter />
        </div>
      )}
    </div>
  );
}
