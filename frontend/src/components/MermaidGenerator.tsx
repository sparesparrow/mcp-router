import React, { useCallback, useEffect, useState, ChangeEvent } from 'react';
import mermaid from 'mermaid';
import { useWebSocket } from '../hooks/useWebSocket';
import { Card, TextArea, Alert, Spinner } from '../components/ui';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'monospace'
});

interface MermaidGeneratorProps {
  serverUrl: string;
  apiKey: string;
  onError?: (error: Error) => void;
}

interface DiagramResult {
  id: string;
  diagram: string;
  type: string;
  error?: string;
}

const DIAGRAM_TYPES = ['flowchart', 'sequence', 'class'] as const;

export const MermaidGenerator: React.FC<MermaidGeneratorProps> = ({
  serverUrl,
  apiKey,
  onError
}) => {
  const [inputText, setInputText] = useState('');
  const [diagrams, setDiagrams] = useState<DiagramResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { 
    connect,
    disconnect,
    sendMessage,
    lastMessage,
    connectionStatus
  } = useWebSocket({
    url: `${serverUrl}/ws`,
    headers: {
      'X-API-Key': apiKey
    }
  });

  // Connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Handle incoming messages
  useEffect(() => {
    if (!lastMessage) return;

    try {
      const response = JSON.parse(lastMessage);
      if (response.error) {
        setError(response.error.message);
        onError?.(new Error(response.error.message));
        return;
      }

      if (response.result && response.result.diagram) {
        setDiagrams(prev => {
          const newDiagrams = [...prev];
          const index = newDiagrams.findIndex(d => d.id === response.id);
          if (index >= 0) {
            newDiagrams[index] = {
              id: response.id,
              diagram: response.result.diagram,
              type: response.result.type
            };
          } else {
            newDiagrams.push({
              id: response.id,
              diagram: response.result.diagram,
              type: response.result.type
            });
          }
          return newDiagrams;
        });
      }
    } catch (e) {
      setError('Failed to parse server response');
      onError?.(e as Error);
    }
  }, [lastMessage, onError]);

  // Render diagrams when they change
  useEffect(() => {
    diagrams.forEach(async (diagram) => {
      try {
        const element = document.getElementById(`diagram-${diagram.id}`);
        if (element) {
          element.innerHTML = ''; // Clear previous content
          await mermaid.render(`svg-${diagram.id}`, diagram.diagram, element);
        }
      } catch (e) {
        console.error(`Failed to render diagram ${diagram.id}:`, e);
        setDiagrams(prev => prev.map(d => 
          d.id === diagram.id 
            ? { ...d, error: 'Failed to render diagram' }
            : d
        ));
      }
    });
  }, [diagrams]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(event.target.value);
  }, []);

  const generateDiagrams = useCallback(async () => {
    if (!inputText.trim() || connectionStatus !== 'connected') return;

    setIsGenerating(true);
    setError(null);
    setDiagrams([]);

    try {
      // Generate diagrams in parallel
      DIAGRAM_TYPES.forEach((type) => {
        sendMessage({
          id: `diagram-${type}-${Date.now()}`,
          method: 'tools/call',
          params: {
            name: 'ai/generate-mermaid',
            arguments: {
              text: inputText,
              diagram_type: type,
              style: {
                theme: 'default',
                direction: 'TB'
              }
            }
          }
        });
      });
    } catch (e) {
      setError('Failed to generate diagrams');
      onError?.(e as Error);
    } finally {
      setIsGenerating(false);
    }
  }, [inputText, connectionStatus, sendMessage, onError]);

  return (
    <div className="mermaid-generator">
      <Card className="input-panel">
        <h2>Mermaid Diagram Generator</h2>
        <TextArea
          value={inputText}
          onChange={handleInputChange}
          placeholder="Enter text to visualize as diagrams..."
          rows={5}
          disabled={isGenerating}
        />
        <button
          onClick={generateDiagrams}
          disabled={!inputText.trim() || isGenerating || connectionStatus !== 'connected'}
        >
          {isGenerating ? 'Generating...' : 'Generate Diagrams'}
        </button>
      </Card>

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <div className="diagrams-grid">
        {DIAGRAM_TYPES.map(type => (
          <Card key={type} className="diagram-card">
            <h3>{type.charAt(0).toUpperCase() + type.slice(1)} Diagram</h3>
            {isGenerating ? (
              <div className="loading">
                <Spinner />
                <span>Generating diagram...</span>
              </div>
            ) : (
              <div 
                id={`diagram-${type}`} 
                className="diagram-container"
              >
                {diagrams.find(d => d.type === type)?.error && (
                  <Alert type="error">
                    {diagrams.find(d => d.type === type)?.error}
                  </Alert>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      <style>{`
        .mermaid-generator {
          padding: 1rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .input-panel {
          margin-bottom: 1rem;
        }

        .input-panel h2 {
          margin-bottom: 1rem;
        }

        .input-panel button {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background-color: var(--color-primary);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .input-panel button:disabled {
          background-color: var(--color-disabled);
          cursor: not-allowed;
        }

        .diagrams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }

        .diagram-card {
          min-height: 300px;
        }

        .diagram-card h3 {
          margin-bottom: 1rem;
          text-align: center;
        }

        .diagram-container {
          width: 100%;
          height: 100%;
          min-height: 250px;
          overflow: auto;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 250px;
          gap: 1rem;
        }

        .diagram-container svg {
          max-width: 100%;
          height: auto;
        }
      `}</style>
    </div>
  );
};

export default MermaidGenerator; 