# MCP Router Frontend

This package contains the frontend application for the MCP Router, built with a focus on SOLID principles.

## Architecture Overview

The frontend is structured around the following architectural principles:

### Service-Oriented Architecture

- **Services**: Core business logic and functionality is encapsulated in services.
- **Interfaces**: All services implement well-defined interfaces.
- **Contexts**: React contexts provide access to services throughout the component tree.
- **Adapters**: Adapters provide clean interfaces to external dependencies.

### Component Architecture

- **Container Components**: Manage state and logic.
- **Presentational Components**: Focus on UI rendering.
- **Base Components**: Provide standardized behavior and styling.

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)

Each class and component has a single responsibility:

- **HttpService**: Handles HTTP communication.
- **WebSocketService**: Manages WebSocket connections.
- **ConnectionService**: Handles connection state.
- **WorkflowService**: Manages workflow operations.
- **Components**: Split into logical, focused pieces.

### Open-Closed Principle (OCP)

Classes are open for extension but closed for modification:

- **NodeTypeRegistry**: Allows registering new node types without modifying existing code.
- **Service Interfaces**: Enable creating new implementations without changing consumers.

### Liskov Substitution Principle (LSP)

Subtypes can be substituted for their base types:

- **Service Implementations**: Adhere strictly to their interface contracts.
- **Component Hierarchy**: Base components define consistent behavior patterns.

### Interface Segregation Principle (ISP)

Clients depend only on interfaces they use:

- **Small, Focused Interfaces**: e.g., IHttpService, IWebSocketService.
- **Composed Interfaces**: e.g., IMessageTransport extends ITransport, IMessageSender, IMessageReceiver.

### Dependency Inversion Principle (DIP)

High-level modules depend on abstractions:

- **Service Dependency Injection**: Components consume service interfaces, not implementations.
- **Context-Based DI**: React contexts provide services to components.
- **Adapters**: Shield the application from external dependency details.

## Code Organization

- **/src/services/interfaces**: Service interface definitions.
- **/src/services/implementations**: Concrete service implementations.
- **/src/services/adapters**: Adapters for external dependencies.
- **/src/contexts/services**: React contexts for service consumption.
- **/src/features**: Feature modules with their own components.
- **/src/components**: Shared components used across features.
- **/src/utils**: Utility functions and helpers.

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run start
   ```

3. Build for production:
   ```
   npm run build
   ```

## Testing

The architecture is designed for testability:

- Services can be tested in isolation with mock dependencies.
- Components can be tested with mock services.
- E2E tests can use real services with test configurations.

Run tests with:
```
npm run test
```

## Adding a New Feature

1. Create service interfaces in `/src/services/interfaces/`
2. Implement services in `/src/services/implementations/`
3. Create React contexts in `/src/contexts/services/`
4. Add components in `/src/features/your-feature/`
5. Register any new services in `ServiceProvider.tsx`

## Adding a New Node Type

1. Create a new node component in `/src/features/workflow-designer/components/Nodes/`
2. Create its data type in `/src/features/workflow-designer/types/agent-types.ts`
3. Register the node type in `ServiceProvider.tsx`
