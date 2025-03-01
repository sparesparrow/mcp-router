import React from 'react';

interface MermaidPanelProps {
  mermaidCode: string;
  onClose: () => void;
  onUpdate: (code: string) => void;
  onImport: () => void;
}

declare const MermaidPanel: React.FC<MermaidPanelProps>;

export default MermaidPanel; 