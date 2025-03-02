/**
 * Workflow Designer Feature Entry Point
 * Exports the main WorkflowDesigner component and related types and utilities.
 */
import WorkflowDesignerContainer from './containers/WorkflowDesignerContainer';

// Re-export the main component
export default WorkflowDesignerContainer;

// Re-export types and utilities for consumers
export * from './types/agent-types';
export { generateMermaidDiagram } from './utils/mermaid/mermaid-generator';
export { parseMermaidToWorkflow } from './utils/mermaid/mermaid-parser';
