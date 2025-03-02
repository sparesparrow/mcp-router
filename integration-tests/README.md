# MCP-Router Integration Tests

This package contains comprehensive integration tests for the MCP-Router project. These tests verify that the interactions between frontend, backend, and shared packages work correctly.

## Test Categories

The integration test suite includes:

### 1. Shared Package Browser Compatibility Tests
Tests that verify the shared package exports all required types and utilities, and that Node.js server dependencies aren't pulled into browser environments.

### 2. API Integration Tests
Tests for the integration between backend API and the shared package.

### 3. End-to-End (E2E) Integration Tests
Tests that use Puppeteer to verify the full application workflow, confirming the frontend loads without HTTP module errors.

### 4. Workflow Module Integration Tests
Tests that verify frontend components correctly use types from the shared package.

## Running Tests

```bash
# Install dependencies
npm install

# Run all integration tests
npm test

# Run only E2E tests
npm run test:e2e

# Run only API tests
npm run test:api
```

## Test Configuration

- `jest.config.js`: Main Jest configuration
- `jest.e2e.config.js`: Configuration for E2E tests
- `jest.api.config.js`: Configuration for API tests

## Requirements

Before running the integration tests, make sure:

1. All packages (shared, backend, frontend) are built
2. The shared package has a browser-compatible build
3. Port 3000 is available for the frontend
4. Port 3001 is available for the backend

## Troubleshooting

If tests fail with module resolution errors, make sure:

1. All packages have been built (`npm run build` in the root)
2. The browser-compatible version of the shared package is built (`npm run build:shared:minimal` in the root)
3. TypeScript path mappings in `tsconfig.json` are correctly set up 