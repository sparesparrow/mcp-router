# Testing Strategy for MCP Router

This document outlines our comprehensive testing strategy to ensure the quality, reliability, and maintainability of the MCP Router application.

## Testing Levels

### 1. Unit Tests

Unit tests verify individual components and services in isolation.

#### Services

- **Service Interfaces**: Test that service implementations correctly adhere to their interfaces.
- **Service Implementations**: Test all methods with various inputs, edge cases, and error scenarios.
- **Adapters**: Test adapters to ensure they correctly transform data between the application and external dependencies.

**Examples**:
- `HttpService.test.ts`: Tests HTTP request handling, error responses, and request formatting.
- `WebSocketService.test.ts`: Tests connection management, message handling, and error handling.
- `NodeTypeRegistry.test.ts`: Tests registration, retrieval, and management of node types.

#### Utils

- **ErrorHandler.test.ts**: Test error creation, logging, and handling.
- **Other Utilities**: Test each utility function for expected behavior with various inputs.

### 2. Integration Tests

Integration tests verify that multiple units work together as expected.

#### Context Integration

- **Service Context Integration**: Test that context providers correctly expose service functionality and manage state.
- **Nested Context Integration**: Test the interaction between related contexts.

**Examples**:
- `ConnectionContext.test.tsx`: Test that connection state updates correctly, and methods are exposed properly.
- `WorkflowContext.test.tsx`: Test workflow operations and state management.

### 3. Component Tests

Component tests verify that UI components render correctly and handle user interactions as expected.

#### Component Structure

- **Presentational Components**: Test rendering and props handling.
- **Container Components**: Test integration with contexts and state management.
- **Composite Components**: Test interactions between child components.

**Examples**:
- `NotificationList.test.tsx`: Test notification rendering and interactions.
- `WorkflowDesigner.test.tsx`: Test node rendering, interaction, and workflow operations.

### 4. End-to-End Tests

E2E tests verify complete user workflows from start to finish.

#### User Workflows

- **Connection Management**: Test connecting to a backend, handling connection failures, and reconnection.
- **Workflow Design**: Test creating, editing, and deleting workflows.
- **Node Interaction**: Test adding, configuring, and connecting nodes.

## Testing Tools

- **Jest**: Primary testing framework
- **React Testing Library**: Component testing
- **Mock Service Worker**: API mocking
- **Cypress**: End-to-end testing (future implementation)

## Testing Guidelines

### Mocking Strategy

1. **Services**: Mock service interfaces when testing components that use them.
2. **External APIs**: Use mock adapters to simulate external API responses.
3. **Context Providers**: Mock or provide test implementations of context providers for component tests.

### Test Organization

1. **Test Files**: Place test files in `__tests__` directories alongside the code they test.
2. **Test Naming**: Use descriptive names in the format `[Component/Service/Util].test.[ts/tsx]`.
3. **Test Structure**: Use `describe` blocks to group related tests, and `it` blocks for individual test cases.

### Code Coverage Goals

- **Services**: 90%+ coverage
- **Utils**: 90%+ coverage
- **Components**: 80%+ coverage
- **Overall**: 85%+ coverage

## Implementation Plan

### Phase 1: Core Service Testing

1. ✅ Create tests for HttpService
2. Create tests for WebSocketService
3. Create tests for ConnectionService
4. Create tests for ErrorHandler
5. Create tests for NodeTypeRegistry

### Phase 2: Context Provider Testing

1. ✅ Create tests for ConnectionContext
2. Create tests for WorkflowContext
3. Create tests for NodeTypeContext
4. Create tests for NotificationContext

### Phase 3: Component Testing

1. Create tests for base components (BaseNodeComponent, etc.)
2. Create tests for notification system components
3. Create tests for workflow designer components

### Phase 4: Integration and E2E Testing

1. Set up end-to-end testing environment with Cypress
2. Create E2E tests for critical user workflows
3. Implement visual regression testing

## Best Practices

1. **Test Independence**: Each test should be independent of others.
2. **Test Readability**: Write clear, maintainable tests with descriptive names.
3. **Test Coverage**: Focus on testing behavior, not implementation details.
4. **Continuous Testing**: Run tests as part of CI/CD pipelines.
5. **Test-Driven Development**: Consider TDD for new features. 