import { useState, useEffect, useRef } from 'react';
import { Cpu, Settings, Trash2, Database, FolderOpen, Loader2, Check, FlaskConical } from 'lucide-react';
import { IntentPanel } from './IntentPanel';
import { ArtifactPreview } from './ArtifactPreview';
import { EvolutionCenter } from './EvolutionCenter';
import { getGeminiService, ConversationMessage, AgentSpecification } from '../GeminiService';
import { useRAG } from '../hooks/useRAG';
import { useLocalRepo } from '../hooks/useLocalRepo';
import './MeowstikLayout.css';

type ActiveView = 'workspace' | 'evolution';
type SyncStatus = 'idle' | 'syncing' | 'saved';

export function MeowstikLayout() {
  const [dividerPosition, setDividerPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [generatedAgent, setGeneratedAgent] = useState<AgentSpecification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showRAGPanel, setShowRAGPanel] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [activeView, setActiveView] = useState<ActiveView>('workspace');

  // Initialize Gemini service
  const [geminiService, setGeminiService] = useState<ReturnType<typeof getGeminiService> | null>(null);
  
  // Initialize RAG
  const rag = useRAG(apiKey || null);
  
  // Initialize local repo hook
  const { directoryHandle, connect, saveAgent, error: repoError } = useLocalRepo();
  
  // Ref for debounce timer
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Check for API key in environment or localStorage
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      try {
        const service = getGeminiService();
        setGeminiService(service);
      } catch (err) {
        console.error('Failed to initialize Gemini service:', err);
      }
    }
  }, []);

  // Auto-sync generatedAgent to disk with debounce
  useEffect(() => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    // Don't sync if no agent or no directory connected
    if (!generatedAgent || !directoryHandle) {
      return;
    }

    // Set syncing status
    setSyncStatus('idle');

    // Start debounce timer (1000ms)
    debounceTimerRef.current = window.setTimeout(async () => {
      try {
        setSyncStatus('syncing');
        
        // Create filename from agent name or use default
        const fileName = generatedAgent.name 
          ? `${generatedAgent.name.toLowerCase().replace(/\s+/g, '-')}.json`
          : 'agent.json';
        
        // Write JSON string to disk
        const jsonContent = JSON.stringify(generatedAgent, null, 2);
        await saveAgent(fileName, jsonContent);
        
        setSyncStatus('saved');
        
        // Reset to idle after 2 seconds
        window.setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (err) {
        console.error('Failed to sync agent to disk:', err);
        setSyncStatus('idle');
      }
    }, 1000);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [generatedAgent, directoryHandle, saveAgent]);

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
    // Use RAG-enhanced service if available, otherwise fall back to regular service
    const serviceToUse = rag.geminiService || geminiService;
    
    if (!serviceToUse) {
      setError('Please configure your Gemini API key in settings');
      setShowSettings(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let agent;
      
      // Use RAG-enhanced generation if available
      if (rag.geminiService && rag.ragEnabled) {
        agent = await rag.geminiService.generateAgentWithRAG(message, true);
      } else {
        agent = await serviceToUse.generateAgent(message);
      }
      
      setGeneratedAgent(agent);
      
      // Update conversation history from service
      const history = serviceToUse.getConversationHistory();
      setConversationHistory(history);
      
      // Save conversation if RAG is available
      if (rag.isInitialized) {
        await rag.saveConversation();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error generating agent:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    const serviceToUse = rag.geminiService || geminiService;
    
    if (!serviceToUse) {
      console.warn('Gemini service not initialized');
      return;
    }
    serviceToUse.clearHistory();
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
            {rag.isInitialized ? 'with RAG & Conversation Memory' : 'with Conversation Memory'}
          </span>
          {rag.isInitialized && (
            <span style={{
              marginLeft: '0.5rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              fontSize: '0.75rem',
              borderRadius: '0.25rem',
              fontWeight: '500',
            }}>
              RAG Active
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Sync Status Indicator */}
          {directoryHandle && syncStatus !== 'idle' && (
            <div
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: syncStatus === 'syncing' ? '#fef3c7' : '#d1fae5',
                color: syncStatus === 'syncing' ? '#92400e' : '#065f46',
                border: `1px solid ${syncStatus === 'syncing' ? '#fbbf24' : '#10b981'}`,
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              {syncStatus === 'syncing' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Saved
                </>
              )}
            </div>
          )}
          
          {/* Connect to Local Repo Button */}
          <button
            onClick={connect}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: directoryHandle ? '#10b981' : 'transparent',
              color: directoryHandle ? 'white' : '#10b981',
              border: '1px solid #10b981',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            title={directoryHandle ? 'Connected to local directory' : 'Connect to local directory for auto-save'}
          >
            <FolderOpen size={16} />
            {directoryHandle ? 'Connected' : 'Connect Folder'}
          </button>
          
          {rag.isInitialized && (
            <button
              onClick={() => setShowRAGPanel(!showRAGPanel)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: showRAGPanel ? '#4f46e5' : 'transparent',
                color: showRAGPanel ? 'white' : '#4f46e5',
                border: '1px solid #4f46e5',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              title="RAG Statistics"
            >
              <Database size={16} />
              RAG Stats
            </button>
          )}
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

      {/* RAG Stats Panel */}
      {showRAGPanel && rag.isInitialized && (
        <div style={{
          backgroundColor: '#ede9fe',
          borderBottom: '1px solid #8b5cf6',
          padding: '1rem 1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', margin: 0 }}>
              RAG System Statistics
            </h3>
            <button
              onClick={rag.toggleRAG}
              style={{
                padding: '0.25rem 0.75rem',
                backgroundColor: rag.ragEnabled ? '#10b981' : '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.75rem',
              }}
            >
              {rag.ragEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: '0.375rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Total Documents
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
                {rag.getStats().documentCount}
              </div>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: '0.375rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Conversations
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
                {rag.getStats().conversationCount}
              </div>
            </div>
            <div style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: '0.375rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                Agents Indexed
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
                {rag.getStats().agentCount}
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.75rem' }}>
            RAG enhances agent generation by retrieving relevant context from documentation, past conversations, and previously generated agents.
          </p>
        </div>
      )}

      {/* Error Display */}
      {(error || repoError) && (
        <div style={{
          backgroundColor: '#fee2e2',
          borderBottom: '1px solid #ef4444',
          padding: '0.75rem 1.5rem',
          color: '#991b1b',
          fontSize: '0.875rem',
        }}>
          {error && <div>Error: {error}</div>}
          {repoError && <div>Repo Error: {repoError.message}</div>}
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
            <IntentPanel 
              onSendMessage={handleSendMessage}
              conversationHistory={conversationHistory}
            />
          </div>
          
          <div 
            className="divider"
            onMouseDown={handleMouseDown}
          />
          
          <div 
            className="right-pane"
            style={{ width: `${100 - dividerPosition}%` }}
          >
            <ArtifactPreview agent={generatedAgent} />
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
