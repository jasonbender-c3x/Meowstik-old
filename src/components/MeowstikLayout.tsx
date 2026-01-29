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
