import React, { useState } from 'react';
import styled from 'styled-components';
import { Card } from './ui/Card';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'monospace'
});

type ExampleType = 'flowchart' | 'sequence' | 'gantt' | 'class';

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 1rem;
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  background: ${props => props.active ? 'var(--color-primary)' : 'var(--color-background-secondary)'};
  color: ${props => props.active ? 'white' : 'var(--color-text-primary)'};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 0.5rem;
  &:hover {
    background: ${props => props.active ? 'var(--color-primary)' : 'var(--color-background-tertiary)'};
  }
`;

const ExampleButton = styled.button`
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  &:hover {
    background: var(--color-primary-dark);
  }
`;

const EditorTextarea = styled.textarea`
  width: 100%;
  height: 300px;
  padding: 1rem;
  background: var(--color-background-tertiary);
  color: var(--color-text-primary);
  font-family: monospace;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  resize: none;
  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

const ErrorMessage = styled.div`
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--color-error-background);
  color: var(--color-error-text);
  border-radius: 4px;
`;

const DiagramContainer = styled.div`
  background: var(--color-background-tertiary);
  padding: 1rem;
  border-radius: 4px;
  min-height: 300px;
  overflow-x: auto;
`;

const MermaidEditor: React.FC = () => {
  // State for source code and error handling
  const [sourceCode, setSourceCode] = useState(`graph TD
    A[Start] --> B[Process]
    B --> C[End]`);
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState('editor');

  // Basic examples for quick insertion
  const examples = {
    flowchart: `graph TD
    A[Start] --> B[Process]
    B --> C[End]`,
    sequence: `sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!`,
    gantt: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2024-01-01, 30d
    Another task     :after a1, 20d`,
    class: `classDiagram
    Class01 <|-- Class02
    Class03 *-- Class04
    Class05 o-- Class06`,
  };

  // Handle source code changes
  const handleSourceChange = (newSource: string) => {
    setSourceCode(newSource);
    try {
      setIsValid(true);
      setError('');
    } catch (err: unknown) {
      setIsValid(false);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Insert example code
  const insertExample = (type: ExampleType) => {
    handleSourceChange(examples[type]);
  };

  // Render the diagram when in preview mode
  React.useEffect(() => {
    if (currentTab === 'preview') {
      try {
        const element = document.getElementById('diagram-preview');
        if (element) {
          element.innerHTML = '';
          mermaid.render('mermaid-diagram', sourceCode, (svgCode: string) => {
            if (element) element.innerHTML = svgCode;
          }, document.createElement('div'));
        }
      } catch (err) {
        setIsValid(false);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
  }, [sourceCode, currentTab]);

  return (
    <div>
      <h2>Mermaid Diagram Editor</h2>
      <TabsContainer>
        <TabButton 
          active={currentTab === 'editor'} 
          onClick={() => setCurrentTab('editor')}
        >
          Editor
        </TabButton>
        <TabButton 
          active={currentTab === 'preview'} 
          onClick={() => setCurrentTab('preview')}
        >
          Preview
        </TabButton>
      </TabsContainer>

      {currentTab === 'editor' && (
        <div>
          <Card>
            <h3>Quick Examples</h3>
            <p>Insert example diagrams to get started</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {Object.keys(examples).map((type) => (
                <ExampleButton
                  key={type}
                  onClick={() => insertExample(type as ExampleType)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </ExampleButton>
              ))}
            </div>
          </Card>

          <Card>
            <h3>Mermaid Source Code</h3>
            <p>Enter your Mermaid diagram source code here</p>
            <EditorTextarea
              value={sourceCode}
              onChange={(e) => handleSourceChange(e.target.value)}
              spellCheck="false"
            />
            {!isValid && (
              <ErrorMessage>
                {error}
              </ErrorMessage>
            )}
          </Card>
        </div>
      )}

      {currentTab === 'preview' && (
        <Card>
          <h3>Diagram Preview</h3>
          <p>Live preview of your Mermaid diagram</p>
          <DiagramContainer id="diagram-preview">
            {/* Diagram will be rendered here */}
          </DiagramContainer>
        </Card>
      )}
    </div>
  );
};

export default MermaidEditor; 