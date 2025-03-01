/**
 * MermaidPanel.tsx
 * Component for displaying and editing Mermaid diagrams
 */

import * as React from 'react';
const { useState, useEffect } = React;

interface MermaidPanelProps {
  mermaidCode: string;
  onClose: () => void;
  onUpdate: (code: string) => void;
  onImport: (code: string) => void;
}

export const MermaidPanel: React.FC<MermaidPanelProps> = ({
  mermaidCode,
  onClose,
  onUpdate,
  onImport,
}) => {
  const [code, setCode] = useState<string>(mermaidCode);
  const [preview, setPreview] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Update preview when code changes
  useEffect(() => {
    try {
      // In a real implementation, we would render the mermaid diagram here
      // For now, we'll just set the preview to the code
      setPreview(code);
      setError(null);
    } catch (err) {
      setError(`Failed to render diagram: ${err}`);
    }
  }, [code]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    onUpdate(e.target.value);
  };

  const handleImport = () => {
    try {
      onImport(code);
    } catch (err) {
      setError(`Failed to import diagram: ${err}`);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          width: '80%',
          height: '80%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0 }}>Mermaid Diagram</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            flexGrow: 1,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '50%',
              padding: '16px',
              borderRight: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <label
              style={{
                fontWeight: 'bold',
                marginBottom: '8px',
              }}
            >
              Mermaid Code
            </label>
            <textarea
              value={code}
              onChange={handleCodeChange}
              style={{
                flexGrow: 1,
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontFamily: 'monospace',
                resize: 'none',
              }}
              placeholder="Enter Mermaid diagram code here..."
            />
          </div>

          <div
            style={{
              width: '50%',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <label
              style={{
                fontWeight: 'bold',
                marginBottom: '8px',
              }}
            >
              Preview
            </label>
            <div
              style={{
                flexGrow: 1,
                padding: '16px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                overflow: 'auto',
                background: '#f8fafc',
              }}
            >
              {error ? (
                <div style={{ color: 'red' }}>{error}</div>
              ) : (
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{preview}</pre>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={handleImport}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Import Diagram
          </button>
        </div>
      </div>
    </div>
  );
};

export default MermaidPanel; 