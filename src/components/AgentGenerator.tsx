import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';
import { Sparkles, Code2, Eye, Settings, Send, Loader2, Trash2 } from 'lucide-react';
import type { AgentSchema } from '../types/agent';
import type { ConversationMessage } from '../GeminiService';

export default function AgentGenerator() {
  const [prompt, setPrompt] = useState('');
  const [generatedAgent, setGeneratedAgent] = useState<AgentSchema | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [leftPanelWidth, setLeftPanelWidth] = useState(40); // percentage
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when conversation history updates
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  // Initialize chat session when API key is set
  useEffect(() => {
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
          systemInstruction: `You are an expert AI assistant that generates agent specifications in JSON format.
Given a natural language description, you must respond with ONLY valid JSON, no additional text or explanations.

The JSON should follow this schema:
{
  "id": "unique-agent-id",
  "name": "Agent Name",
  "description": "Brief description",
  "role": "The agent's primary role",
  "capabilities": ["capability1", "capability2"],
  "tools": [{"name": "tool-name", "description": "tool description"}],
  "personality": {
    "tone": "professional/friendly/etc",
    "traits": ["trait1", "trait2"]
  },
  "metadata": {
    "version": "1.0.0",
    "author": "user",
    "tags": ["tag1", "tag2"]
  }
}

Return ONLY valid JSON, no markdown formatting or explanation.
You have access to conversation history and should consider previous context when generating responses.`
        });
        
        const session = model.startChat({
          history: [],
        });
        setChatSession(session);
      } catch (err) {
        console.error('Failed to initialize chat session:', err);
      }
    }
  }, [apiKey]);

  const handleClearHistory = () => {
    setConversationHistory([]);
    setGeneratedAgent(null);
    setError(null);
    
    // Reinitialize chat session
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: `You are an expert AI assistant that generates agent specifications in JSON format.`
      });
      setChatSession(model.startChat({ history: [] }));
    }
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('Please enter your Gemini API key in settings');
      setShowSettings(true);
      return;
    }

    if (!prompt.trim()) {
      setError('Please enter a prompt to generate an agent');
      return;
    }

    if (!chatSession) {
      setError('Chat session not initialized. Please check your API key.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Add user message to history
      const userMessage: ConversationMessage = {
        role: 'user',
        parts: prompt,
        timestamp: new Date(),
      };
      setConversationHistory(prev => [...prev, userMessage]);

      // Send through chat session (maintains history)
      const result = await chatSession.sendMessage(prompt);
      const response = result.response;
      const text = response.text();
      
      // Add model response to history
      const modelMessage: ConversationMessage = {
        role: 'model',
        parts: text,
        timestamp: new Date(),
      };
      setConversationHistory(prev => [...prev, modelMessage]);
      
      // Try to extract JSON from the response
      let jsonText = text.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```\n?$/g, '');
      }
      
      const agentData = JSON.parse(jsonText);
      setGeneratedAgent(agentData);
      setPrompt(''); // Clear input after successful generation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate agent');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const startX = e.clientX;
    const startWidth = leftPanelWidth;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const containerWidth = window.innerWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newWidth = Math.max(20, Math.min(60, startWidth + deltaPercent));
      setLeftPanelWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Agentia Agent Generator</h1>
          <span className="text-sm text-gray-500 font-normal">with Conversation Memory</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearHistory}
            className="px-3 py-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors flex items-center gap-2"
            title="Clear conversation history"
          >
            <Trash2 className="w-5 h-5" />
            Clear History
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gemini API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Gemini API key"
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-600 mt-2">
            Get your API key from{' '}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline"
            >
              Google AI Studio
            </a>
          </p>
          <p className="text-xs text-orange-600 mt-1">
            ⚠️ For demo purposes only. API key is stored in browser memory and will be lost on page refresh.
          </p>
        </div>
      )}

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel - Chat Interface */}
        <div
          className="lg:border-r border-gray-200 bg-white flex flex-col min-h-[300px] lg:min-h-0 w-full"
          style={{
            width: window.matchMedia('(min-width: 1024px)').matches ? `${leftPanelWidth}%` : '100%',
          }}
        >
          <div className="p-6 flex-1 flex flex-col overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversation</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Conversation History */}
            <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-50 rounded-lg">
              {conversationHistory.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No conversation history yet.</p>
                  <p className="text-sm">Start by describing an agent below.</p>
                </div>
              ) : (
                <>
                  {conversationHistory.map((msg, idx) => (
                    <div
                      key={`${msg.role}-${msg.timestamp.getTime()}-${idx}`}
                      className={`mb-3 p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-100 border border-blue-200'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold ${
                          msg.role === 'user' ? 'text-blue-700' : 'text-green-700'
                        }`}>
                          {msg.role === 'user' ? 'You' : 'Assistant'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                        {msg.parts}
                      </div>
                    </div>
                  ))}
                  <div ref={historyEndRef} />
                </>
              )}
            </div>

            {/* Input Area */}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="E.g., 'Create a customer support agent that can handle billing inquiries...'"
              className="p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32"
            />

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="mt-4 w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Generate Agent
                </>
              )}
            </button>
          </div>
        </div>

        {/* Resizer (Desktop only) */}
        <div
          className="hidden lg:block w-1 bg-gray-200 hover:bg-purple-400 cursor-col-resize transition-colors"
          onMouseDown={startResize}
        />

        {/* Right Panel - Preview/Code View */}
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          {/* View Toggle */}
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex gap-2">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'preview'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                viewMode === 'code'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Code2 className="w-4 h-4" />
              Code
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-6">
            {!generatedAgent ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Generate an agent to see preview</p>
                </div>
              </div>
            ) : viewMode === 'preview' ? (
              <AgentCard agent={generatedAgent} />
            ) : (
              <CodeView agent={generatedAgent} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Agent Card Preview Component
function AgentCard({ agent }: { agent: AgentSchema }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">{agent.name}</h2>
          <p className="text-purple-100">{agent.role}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Description</h3>
            <p className="text-gray-700">{agent.description}</p>
          </div>

          {/* Capabilities */}
          {agent.capabilities && agent.capabilities.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Capabilities</h3>
              <div className="flex flex-wrap gap-2">
                {agent.capabilities.map((cap, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                  >
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          {agent.tools && agent.tools.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Tools</h3>
              <div className="space-y-2">
                {agent.tools.map((tool, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">{tool.name}</div>
                    <div className="text-sm text-gray-600">{tool.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personality */}
          {agent.personality && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Personality</h3>
              <div className="space-y-2">
                {agent.personality.tone && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Tone: </span>
                    <span className="text-sm text-gray-600">{agent.personality.tone}</span>
                  </div>
                )}
                {agent.personality.traits && agent.personality.traits.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {agent.personality.traits.map((trait, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          {agent.metadata && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {agent.metadata.version && (
                  <div>
                    <span className="font-medium">Version: </span>
                    {agent.metadata.version}
                  </div>
                )}
                {agent.metadata.author && (
                  <div>
                    <span className="font-medium">Author: </span>
                    {agent.metadata.author}
                  </div>
                )}
              </div>
              {agent.metadata.tags && agent.metadata.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {agent.metadata.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Code View Component
function CodeView({ agent }: { agent: AgentSchema }) {
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(agent, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
          <span className="text-sm font-medium text-gray-300">agent.json</span>
          <button
            onClick={handleCopy}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition-colors"
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="p-6 overflow-auto text-sm">
          <code className="text-green-400 font-mono">{jsonString}</code>
        </pre>
      </div>
    </div>
  );
}
