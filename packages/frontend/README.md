# MCP Router Frontend

The frontend application for the MCP Router project, enabling visual workflow design for Model Context Protocol pipelines.

## Features

- Visual workflow designer for creating and managing MCP workflows
- Support for various node types (LLM, Tool, Resource, Router, etc.)
- Export workflows as JSON or Mermaid diagrams
- Validation of workflow configurations
- Real-time connection to MCP servers

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

### Building for Production

To create a production build:
```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

### Environment Variables

The following environment variables can be set:

- `PUBLIC_URL` - The base URL for the application assets (defaults to `.`)
- `REACT_APP_API_URL` - The URL for the backend API (defaults to `http://localhost:3001`)

## Architecture

The frontend is built with:

- React for UI components
- TypeScript for type safety
- ReactFlow for workflow visualization
- MCP client for protocol communication

## Workflow Components

The application supports several node types:

- **LLM Node**: Represents an LLM agent that performs reasoning
- **Tool Node**: Represents an MCP tool that can be executed
- **Resource Node**: Represents an MCP resource that can be accessed
- **Router Node**: Implements the routing pattern
- **Parallel Node**: Implements the parallelization pattern
- **Orchestrator Node**: Implements the orchestrator-workers pattern
- **Evaluator Node**: Implements the evaluator-optimizer pattern
- **Input/Output Nodes**: Define entry and exit points for workflows
- **Condition Node**: For branching logic

## License

This project is licensed under the MIT License - see the LICENSE file for details. 