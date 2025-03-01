# MCP Router - Frontend Package

## Overview

The frontend package contains the React application for the MCP Router. It provides a visual workflow designer for creating, editing, and managing agent workflows. The frontend communicates with the backend services to execute workflows and manage the system.

## Features

- **Workflow Designer**: Visual editor for creating and editing agent workflows
- **Node Palette**: Library of available agent nodes
- **Properties Panel**: Editor for node properties and configuration
- **Mermaid Integration**: Generate Mermaid diagrams from workflows
- **ReactFlow Integration**: Powerful graph visualization and editing

## Architecture

The frontend is organized using a feature-based architecture:

```
frontend/
├── src/
│   ├── features/           # Feature modules
│   │   ├── workflow-designer/  # Workflow designer feature
│   │   │   ├── components/     # UI components
│   │   │   ├── hooks/          # React hooks
│   │   │   ├── contexts/       # React contexts
│   │   │   ├── utils/          # Utility functions
│   │   │   └── types/          # TypeScript types
│   │   ├── mermaid-integration/  # Mermaid diagram feature
│   │   └── dashboard/          # Dashboard feature
│   ├── api/                # API clients and services
│   ├── utils/              # Shared utilities
│   ├── components/         # Shared UI components
│   ├── hooks/              # Shared React hooks
│   ├── contexts/           # Shared React contexts
│   ├── types/              # Shared TypeScript types
│   ├── App.tsx             # Main application component
│   └── index.tsx           # Application entry point
└── public/                 # Static assets
```

## Key Components

### Workflow Designer

The workflow designer is the core feature of the frontend. It allows users to create and edit agent workflows using a visual node-based editor. The workflow designer is built using ReactFlow and consists of the following components:

- **Canvas**: The main editing area where nodes and edges are displayed
- **Node Palette**: A panel of available node types that can be dragged onto the canvas
- **Properties Panel**: A panel for editing the properties of selected nodes
- **Toolbar**: A toolbar with actions for the workflow designer

### Mermaid Integration

The Mermaid integration feature allows users to generate Mermaid diagrams from their workflows. This provides an alternative visualization of the workflow that can be shared or embedded in documentation.

### Dashboard

The dashboard feature provides an overview of the system, including active workflows, system status, and performance metrics.

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

```bash
cd packages/frontend
npm install
```

### Development

```bash
# Start the development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Integration with Other Packages

The frontend package integrates with other packages in the monorepo:

- **Shared Package**: Uses types, utilities, and client implementations from the shared package
- **Backend Package**: Communicates with the backend services via API endpoints

## Feature Flags

The frontend uses feature flags to control the availability of features. These flags are defined in the shared package and can be used to enable or disable features at runtime.

```typescript
import { isFeatureEnabled } from '@mcp-router/shared';

// Check if a feature is enabled
if (isFeatureEnabled('REACT_FLOW_INTEGRATION')) {
  // Use ReactFlow integration
}
```

## ReactFlow Integration

The workflow designer is built using ReactFlow, a library for building node-based editors. The integration includes:

- Custom node types for different agent types
- Custom edge types for connections between nodes
- Drag-and-drop functionality for adding nodes
- Interactive editing of node properties
- Validation of workflows

## Contributing

When contributing to the frontend package, please ensure that:

1. Components are properly documented
2. Tests are added for new functionality
3. Feature flags are used for incomplete features
4. The code follows the project's coding standards

## License

This package is part of the MCP Router project and is subject to the same license terms. 