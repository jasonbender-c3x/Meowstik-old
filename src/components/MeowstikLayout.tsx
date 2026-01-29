import { useState } from 'react';
import { Cpu } from 'lucide-react';
import { IntentPanel } from './IntentPanel';
import { ArtifactPreview } from './ArtifactPreview';
import './MeowstikLayout.css';

export function MeowstikLayout() {
  const [dividerPosition, setDividerPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

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
      </header>
      
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
    </div>
  );
}
