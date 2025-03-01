export type Principle = 'SingleResponsibility' | 'OpenClosed' | 'LiskovSubstitution' | 'InterfaceSegregation' | 'DependencyInversion';

export interface AST {
  type: string;
  body: ASTNode[];
}

export interface ASTNode {
  type: string;
  name?: string;
  body?: ASTNode[];
  params?: ASTNode[];
  properties?: ASTNode[];
  methods?: ASTNode[];
}

export interface Violation {
  principle: Principle;
  message: string;
  location?: {
    line: number;
    column: number;
  };
  severity: 'error' | 'warning' | 'info';
  code?: string;
  suggestions?: string[];
}

export interface Analysis {
  violations: Violation[];
  timestamp: Date;
  metrics: Record<string, number>;
} 