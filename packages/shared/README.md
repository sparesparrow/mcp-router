# MCP Router - Shared Package

## Overview

The shared package contains common code, types, and utilities used by both the frontend and backend packages of the MCP Router application. This package serves as the foundation for cross-package communication and ensures consistency across the codebase.

## Dual-Environment Architecture

This package is designed to work in both Node.js server environments and browser environments, which have different capabilities and limitations:

### Browser vs Server Environment

- **Browser Environment**: Limited access to Node.js modules. No access to Node.js core modules like `http`, `fs`, etc.
- **Server Environment**: Full access to Node.js modules and APIs.

### How it Works

The package uses a dual-entry point approach:

1. **Server Entry Point**: `dist/src/index.js` - Contains all functionality, including server-specific code
2. **Browser Entry Point**: `dist/src/minimal/index.js` - Contains only browser-compatible code

This is configured in `package.json`:
```json
{
  "main": "dist/src/index.js",    // For Node.js environments
  "browser": "dist/src/minimal/index.js",  // For browser environments
  "types": "dist/src/index.d.ts"  // TypeScript type definitions
}
```

### Browser-Compatible Implementation

The browser-compatible version in `src/minimal/` provides:

- Type definitions identical to the server version
- Browser-safe stubs for server-specific functionality
- All shared utilities that work in both environments

For server-specific functionality, the browser version includes stubs that maintain the same interface but have browser-compatible implementations.

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

## Development Guidelines

When working with this shared package:

### Adding New Functionality

1. **Shared Code**: If the functionality works in both environments, add it to the main package.
2. **Server-Only Code**: If it uses Node.js specific APIs, keep it in the main package.
3. **Browser Stubs**: For server-specific classes/functions needed by the browser, add a stub implementation in `src/minimal/`.

### Testing Browser Compatibility

To ensure the package works properly in browser environments:

```bash
# In the frontend package
npm run test:browser-compatibility
```

This script builds the frontend and verifies no server-specific code has been bundled.

## Architecture Considerations

A potential future improvement would be to separate the codebase into three packages:

1. **shared-core**: Contains only environment-agnostic code and types
2. **shared-server**: Contains server-specific implementations
3. **shared-browser**: Contains browser-specific implementations

This would eliminate the need for runtime stubs and make the architecture more robust.

## Troubleshooting

If you encounter errors like:
```
can't access property "prototype", http.ServerResponse is undefined
```

This indicates that server-specific code is being bundled into the browser build. Check:

1. Webpack aliases in `config-overrides.js`
2. That you're importing from the correct entry points
3. That browser-specific stubs exist for all server functionality used 