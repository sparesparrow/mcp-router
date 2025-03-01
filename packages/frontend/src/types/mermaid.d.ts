declare module 'mermaid' {
  interface RenderResult {
    svg: string;
    bindFunctions?: (element: Element) => void;
  }

  export function render(
    id: string,
    text: string,
    options?: object
  ): Promise<RenderResult>;

  export function initialize(config: MermaidConfig): void;
  
  export interface MermaidConfig {
    theme?: string;
    startOnLoad?: boolean;
    securityLevel?: 'strict' | 'loose' | 'antiscript';
    themeVariables?: any;
    fontFamily?: string;
    altFontFamily?: string;
    logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    [key: string]: any;
  }
} 