# Refactoring Guide for mcp-router

This guide addresses common issues that you might encounter during the refactoring process to the monorepo structure, and provides solutions to resolve these issues.

## Table of Contents

1. [Import Path Issues](#import-path-issues)
2. [Circular Dependencies](#circular-dependencies)
3. [Performance Optimization](#performance-optimization)
4. [Build Process](#build-process)
5. [Debugging Tips](#debugging-tips)

## Import Path Issues

### Problem

After restructuring the codebase into a monorepo, you might encounter import errors due to:
- Outdated relative import paths
- Missing type definitions
- Incorrect path aliases

### Solution

#### 1. Update Path Aliases in tsconfig.json

Each package's `tsconfig.json` should contain proper path aliases:

```json
// packages/frontend/tsconfig.json
{
  "compilerOptions": {
    // ... other options
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@mcp-router/shared/*": ["../shared/src/*"],
      "@mcp-router/frontend/*": ["src/*"]
    }
  }
}
```

#### 2. Use the Fix Imports Script

Run the `fix-imports.js` script to automatically update relative imports to use path aliases:

```bash
node scripts/fix-imports.js
```

#### 3. Manual Path Updates

For imports that couldn't be fixed automatically, use the following patterns:

```typescript
// Instead of
import { SomeType } from '../../../shared/src/types';

// Use
import { SomeType } from '@mcp-router/shared/types';
```

#### 4. Check for Missing Types

If you encounter type errors, make sure all necessary types are exported from the shared package:

```typescript
// packages/shared/src/index.ts
export * from './types/mcp';
export * from './types/agent-types';
export * from './types/errors';
// etc.
```

## Circular Dependencies

### Problem

Circular dependencies can cause build failures and runtime issues. These occur when two or more modules depend on each other, creating a dependency cycle.

### Solution

#### 1. Identify Circular Dependencies

Use the `check-circular-deps.js` script to identify circular dependencies:

```bash
node scripts/check-circular-deps.js
```

#### 2. Break Dependency Cycles

Common techniques to resolve circular dependencies:

##### Extract Shared Code
Move shared functionality to a new module that both dependent modules can import.

```typescript
// Before:
// moduleA.ts imports from moduleB.ts
// moduleB.ts imports from moduleA.ts

// After:
// Create shared.ts
// moduleA.ts imports from shared.ts
// moduleB.ts imports from shared.ts
```

##### Use Dependency Injection
Pass dependencies as parameters instead of importing them directly.

```typescript
// Before:
import { ServiceB } from './serviceB';
export class ServiceA {
  private serviceB = new ServiceB();
}

// After:
export class ServiceA {
  constructor(private serviceB: any) {}
}
```

##### Use Interfaces
Define interfaces to establish contracts between modules.

```typescript
// interfaces.ts
export interface IServiceA {
  methodA(): void;
}

export interface IServiceB {
  methodB(): void;
}

// serviceA.ts
import { IServiceA, IServiceB } from './interfaces';
export class ServiceA implements IServiceA {
  constructor(private serviceB: IServiceB) {}
  methodA() {}
}
```

## Performance Optimization

### Problem

The workflow designer, particularly the Canvas component, may experience performance issues when handling many nodes.

### Solution

#### 1. Use React.memo for Components

Wrap components with `React.memo` to prevent unnecessary re-renders:

```typescript
import React, { memo } from 'react';

const MyComponent = (props) => {
  // Component implementation
};

// Basic memo
export default memo(MyComponent);

// With custom comparison function for more control
export default memo(MyComponent, (prevProps, nextProps) => {
  // Return true if props are equal (no re-render needed)
  // Return false if props are different (re-render needed)
  return prevProps.id === nextProps.id && prevProps.name === nextProps.name;
});
```

#### 2. Optimize State Updates

Use the performance utilities in `packages/frontend/src/features/workflow-designer/utils/performance.ts`:

```typescript
import { useDebounceChanges } from '../../utils/performance';

const YourComponent = () => {
  // Instead of using the standard hooks
  // const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  // const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Use the debounced version
  const { onNodesChange, onEdgesChange } = useDebounceChanges(setNodes, setEdges);
};
```

#### 3. Implement Virtualization for Large Workflows

For workflows with many nodes, only render nodes that are visible in the viewport:

```typescript
import { useOptimizedNodeRendering } from '../../utils/performance';

const YourComponent = () => {
  const { nodes } = useReactFlow();
  const viewport = useViewport();
  
  // Only get nodes visible in the viewport when there are many nodes
  const visibleNodes = useOptimizedNodeRendering(nodes, viewport);
  
  // Render visibleNodes instead of all nodes
};
```

#### 4. Use useCallback and useMemo

Optimize function and value creation:

```typescript
const handleNodeClick = useCallback((event, node) => {
  // Handle node click
}, [dependencies]);

const memoizedValue = useMemo(() => {
  // Calculate expensive value
  return result;
}, [dependencies]);
```

## Build Process

### Problem

The build process might fail due to missing dependencies, incorrect build configurations, or type errors.

### Solution

#### 1. Update Package Dependencies

Ensure all packages have correct dependencies in their respective `package.json` files:

```json
// packages/frontend/package.json
{
  "dependencies": {
    "@mcp-router/shared": "workspace:*"
  }
}
```

#### 2. Check Build Scripts

Make sure the build scripts in the root `package.json` are properly configured:

```json
{
  "scripts": {
    "build": "npm run build:shared && npm run build:backend && npm run build:frontend",
    "build:shared": "cd packages/shared && npm run build",
    "build:backend": "cd packages/backend && npm run build",
    "build:frontend": "cd packages/frontend && npm run build"
  }
}
```

#### 3. Fix Type Errors

Run TypeScript check to identify and fix type errors:

```bash
npx tsc --noEmit
```

## Debugging Tips

### Isolate Issues

When facing complex issues, try to isolate them by building and testing packages individually:

```bash
cd packages/shared && npm run build
cd packages/backend && npm run build
cd packages/frontend && npm run dev
```

### Check for Missing Exports

Make sure all necessary types and functions are properly exported from their respective packages:

```typescript
// packages/shared/src/index.ts
export * from './types';
export * from './utils';
export * from './client';
export * from './server';
```

### Use TypeScript's Path Mapping Debug Flag

When debugging import path issues, use the `--traceResolution` flag:

```bash
npx tsc --traceResolution
```

### Review Import Statements

Look for these common import issues:

- Using relative imports instead of path aliases
- Importing from the wrong package
- Circular dependencies
- Missing exports

### Test Component Rendering

When working on the workflow designer, test with a small number of nodes first to ensure everything works correctly before scaling up.

## Conclusion

Refactoring a codebase to a monorepo structure requires careful attention to imports, dependencies, and build configurations. By following the guidelines in this document, you can resolve common issues and ensure a smooth transition to the new structure.

For further assistance, consult the official TypeScript documentation on module resolution and path mapping. 