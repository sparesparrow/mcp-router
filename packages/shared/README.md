# MCP Router - Shared Package

## Overview

The shared package contains common code, types, and utilities used by both the frontend and backend packages of the MCP Router application. This package serves as the foundation for cross-package communication and ensures consistency across the codebase.

## Contents

- **Types**: Common TypeScript type definitions
- **Constants**: Shared constants and configuration
- **Utilities**: Helper functions and utilities
- **Client**: MCP client implementation
- **Server**: MCP server implementation
- **Transport**: Communication transport layer

## Key Features

### MCP Protocol Implementation

The shared package includes a complete implementation of the Model Context Protocol (MCP), which is used for communication between agents in the system. This includes:

- **MCPClient**: Client implementation for connecting to MCP servers
- **MCPServer**: Server implementation for hosting MCP services
- **Transport**: Abstract transport layer with implementations for different communication methods

### Type Definitions

The package provides comprehensive type definitions for:

- **Agent Types**: Definitions for different types of agents in the system
- **MCP Types**: Types related to the Model Context Protocol
- **Router Types**: Types for the router functionality
- **Error Types**: Standardized error types

### Feature Flags

The shared package includes a feature flag system that allows for incremental development and controlled feature rollout. Features can be enabled or disabled at runtime, making it easier to test and deploy new functionality.

## Usage

### Installation

```bash
cd packages/shared
npm install
```

### Building

```bash
npm run build
```

### Importing

From other packages in the monorepo:

```typescript
// Import specific exports
import { MCPClient, AgentNodeType } from '@mcp-router/shared';

// Or import everything
import * as Shared from '@mcp-router/shared';
```

## Development

### Adding New Types

1. Create a new type definition file in the `src/types` directory
2. Export the types from the file
3. Add the export to `src/index.ts`

### Adding New Utilities

1. Create a new utility file in the `src/utils` directory
2. Export the utilities from the file
3. Add the export to `src/index.ts`

### Adding New Feature Flags

1. Open `src/constants/feature-flags.ts`
2. Add a new entry to the `FEATURE_FLAGS` object
3. Provide a name, description, and default value

## Testing

```bash
npm test
```

## Documentation

For more detailed documentation on specific components, see the following:

- [MCP Protocol](./src/README.md)
- [Type Definitions](./src/types/README.md)
- [Utilities](./src/utils/README.md)

## Contributing

When contributing to the shared package, please ensure that:

1. All exports are properly typed
2. Documentation is updated
3. Tests are added for new functionality
4. Breaking changes are clearly documented

## License

This package is part of the MCP Router project and is subject to the same license terms. 