declare module 'mermaid' {
  interface MermaidConfig {
    startOnLoad?: boolean;
    theme?: 'default' | 'dark' | 'forest' | 'neutral';
    securityLevel?: 'strict' | 'loose' | 'antiscript';
    fontFamily?: string;
  }

  interface Mermaid {
    initialize: (config: MermaidConfig) => void;
    render: (id: string, text: string, element: HTMLElement) => Promise<void>;
  }

  const mermaid: Mermaid;
  export default mermaid;
} 