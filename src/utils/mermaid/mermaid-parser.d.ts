import { Workflow } from '../../types/agent-types';

export function parseMermaidToWorkflow(mermaidCode: string): Workflow;
export function generateNaturalLanguagePrompt(mermaidCode: string): Promise<string>;
export function mermaidToCode(mermaidCode: string, language?: 'typescript' | 'python'): string;
export function mermaidToAgentPattern(mermaidCode: string): string; 