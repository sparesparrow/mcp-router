# Shared Package Architecture Design

## Current Architecture

The current shared package architecture uses a dual-entry point approach:

- `main`: Server-side code (includes all functionality)
- `browser`: Browser-safe code (excludes Node.js-specific functionality)

While this approach works, it has several limitations:
1. Relies on runtime stubs that could diverge from actual implementations
2. Requires careful webpack configuration
3. Creates potential for bundling server code in the browser
4. Increases maintenance complexity

## Proposed Architecture: Multi-Package Approach

We recommend refactoring the shared code into three separate packages:

```
mcp-router/
├── packages/
│   ├── shared-core/        # Environment-agnostic code only
│   ├── shared-server/      # Server-specific extensions of core
│   ├── shared-browser/     # Browser-specific extensions of core
│   ├── frontend/           # Frontend application
│   └── backend/            # Backend application
```

### 1. shared-core

Contains only environment-agnostic code:
- TypeScript interfaces and types
- Pure utility functions
- Constants and enumerations
- JSON schema definitions

Example:
```typescript
// In shared-core
export interface Message {
  id: string;
  content: string;
  // ...
}

export enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  // ...
}
```

### 2. shared-server

Extends the core with server-specific implementations:
- Server-specific transport mechanisms
- HTTP server wrappers
- Database connectors
- Authentication helpers

Example:
```typescript
// In shared-server
import { Message, MessageType } from '@mcp-router/shared-core';
import * as http from 'http';

export class HttpServer {
  // Real server implementation using Node.js http module
  // ...
}
```

### 3. shared-browser

Extends the core with browser-specific implementations:
- Browser-specific transport (WebSockets, Fetch API)
- UI components
- Browser storage utilities

Example:
```typescript
// In shared-browser
import { Message, MessageType } from '@mcp-router/shared-core';

export class HttpClient {
  // Browser implementation using fetch API
  // ...
}
```

## Implementation Plan

### Phase 1: Code Analysis
1. Identify all shared types and interfaces
2. Categorize code by environment compatibility
3. Map dependencies between components

### Phase 2: Create shared-core
1. Extract environment-agnostic code into a new package
2. Update build pipeline for this package
3. Create appropriate exports

### Phase 3: Create environment-specific packages
1. Create shared-server package with server implementations
2. Create shared-browser package with browser implementations
3. Ensure all interfaces remain compatible

### Phase 4: Update Applications
1. Update frontend to use shared-core and shared-browser
2. Update backend to use shared-core and shared-server
3. Remove the old shared package

## Benefits

This architecture provides several advantages:
1. **Clear boundaries**: Each package has a specific scope and environment target
2. **Type safety**: Strong typing across packages without runtime stubs
3. **Bundle optimization**: Frontend bundles only include browser-compatible code
4. **Scalability**: Easier to extend with additional environment-specific packages
5. **Maintainability**: Each package can evolve independently with clear interfaces

## Conclusion

Moving to a multi-package architecture for shared code is an investment in maintainability and correctness. While it requires upfront effort, it will prevent environment-specific bugs and reduce maintenance complexity in the long term. 