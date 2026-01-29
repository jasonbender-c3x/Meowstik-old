export function ArtifactPreview() {
  // Sample JSON card data for demonstration
  const sampleCard = {
    title: "Sample Card",
    description: "This is a preview of a JSON card",
    metadata: {
      created: new Date().toISOString(),
      version: "1.0.0"
    }
  };

  return (
    <div className="artifact-preview">
      <h2 className="panel-title">Artifact Preview</h2>
      <pre className="json-display">
        {JSON.stringify(sampleCard, null, 2)}
      </pre>
    </div>
  );
}
