import { useState } from 'react';

export function IntentPanel() {
  const [prompt, setPrompt] = useState('');

  return (
    <div className="intent-panel">
      <h2 className="panel-title">Intent Panel</h2>
      <textarea
        className="intent-textarea"
        placeholder="Enter your prompt here..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
    </div>
  );
}
