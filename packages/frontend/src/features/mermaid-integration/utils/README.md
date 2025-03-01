# Mermaid Utilities

This directory contains utility functions for working with Mermaid diagrams in the context of LLM agent workflows.

## Contents

- **mermaid-generator.ts**: Functions for converting workflows to Mermaid diagrams
- **mermaid-parser.ts**: Functions for parsing Mermaid diagrams into workflow objects

## Mermaid Generator

The `mermaid-generator.ts` file provides functions for:

- Converting a workflow object to a Mermaid diagram string
- Formatting Mermaid diagrams for display
- Adding click handlers to diagram elements
- Extracting nodes from diagrams
- Generating simplified workflow previews

### Usage

```typescript
import { generateMermaidDiagram, formatMermaidForDisplay } from '../utils/mermaid/mermaid-generator';

// Create a Mermaid diagram from a workflow
const workflow = {
  id: 'example',
  name: 'Example Workflow',
  nodes: [...],
  edges: [...]
};

const mermaidCode = generateMermaidDiagram(workflow, {
  direction: 'TD',
  theme: 'default',
  includeNodeData: true
});

// Format for display in HTML
const htmlCode = formatMermaidForDisplay(mermaidCode);
```

## Mermaid Parser

The `mermaid-parser.ts` file provides functions for:

- Parsing a Mermaid diagram string into a workflow object
- Generating natural language descriptions of diagrams
- Converting Mermaid diagrams to code implementations
- Generating pattern-specific implementations based on diagram structure

### Usage

```typescript
import { parseMermaidToWorkflow, mermaidToCode } from '../utils/mermaid/mermaid-parser';

// Parse a Mermaid diagram into a workflow
const mermaidCode = `
flowchart TD
    A["LLM Node"] --> B["Tool Node"]
    B --> C["Output Node"]
`;

const workflow = parseMermaidToWorkflow(mermaidCode);

// Generate code from a Mermaid diagram
const implementationCode = mermaidToCode(mermaidCode, 'typescript');
```

## Integration with Workflow Designer

These utilities are primarily used by the Workflow Designer components to:

1. **Export workflows**: When a user wants to export their visual workflow as a Mermaid diagram
2. **Import workflows**: When a user wants to create a workflow from a Mermaid diagram
3. **Generate documentation**: When creating documentation with embedded diagrams
4. **Generate code**: When generating implementations from workflow designs

## Node Type Handling

The parser and generator handle these agent node types:

- **LLM**: Large Language Model nodes
- **Tool**: Function call nodes
- **Resource**: Data resource nodes
- **Router**: Request routing nodes
- **Parallel**: Concurrent processing nodes
- **Orchestrator**: Task coordination nodes
- **Evaluator**: Quality assessment nodes
- **Input/Output**: Workflow entry/exit nodes
- **Condition**: Conditional logic nodes 