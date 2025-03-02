# MCP Router Developer Guide

This guide provides developers with an overview of the MCP Router architecture, design principles, and best practices for extending and maintaining the codebase.

## Architecture Overview

The MCP Router follows SOLID principles and is organized into several distinct layers:

```
┌───────────────────────────┐
│       Components          │
│ (UI, Container, Presentational) │
├───────────────────────────┤
│       Context Layer       │
│ (Dependency Injection)    │
├───────────────────────────┤
│       Service Layer       │
│ (Business Logic)          │
├───────────────────────────┤
│       Adapter Layer       │
│ (External Dependencies)   │
└───────────────────────────┘
```

### Architecture Class Diagram

The following class diagram illustrates the relationships between the major components of the system, showing how the SOLID principles are implemented:

```mermaid
classDiagram
    %% Main Application Components
    class App {
        +render() ReactNode
    }

    class ReactFlowProvider {
        +children: ReactNode
        +render() ReactNode
    }

    class ServiceProvider {
        +children: ReactNode
        +render() ReactNode
    }

    %% Context Providers
    class ConnectionProvider {
        +connectionService: IConnectionService
        +children: ReactNode
        +render() ReactNode
    }

    class WorkflowProvider {
        +workflowService: IWorkflowService
        +children: ReactNode
        +render() ReactNode
    }

    class NodeTypeProvider {
        +nodeTypeRegistry: INodeTypeRegistry
        +children: ReactNode
        +render() ReactNode
    }

    class NotificationProvider {
        +notificationService: INotificationService
        +children: ReactNode
        +render() ReactNode
    }

    %% Interfaces
    class IConnectionService {
        <<interface>>
        +connect() Promise<void>
        +disconnect() Promise<void>
        +isConnected() boolean
        +getConnectionStatus() ConnectionStatus
        +onStatusChange(handler) Function
    }

    class IWebSocketService {
        <<interface>>
        +connect() Promise<void>
        +disconnect() Promise<void>
        +emit(event, data) void
        +on(event, handler) Function
        +off(event, handler) void
        +isConnected() boolean
    }

    class IHttpService {
        <<interface>>
        +get(url, params) Promise<any>
        +post(url, data) Promise<any>
        +put(url, data) Promise<any>
        +delete(url) Promise<any>
    }

    class IWorkflowService {
        <<interface>>
        +executeWorkflow(method, params) Promise<WorkflowExecutionResult>
        +getAvailableWorkflows() Promise<string[]>
        +saveWorkflow(workflow) Promise<void>
        +loadWorkflow(id) Promise<Workflow>
    }

    class INotificationService {
        <<interface>>
        +notify(message, type, duration) void
        +success(message, duration) void
        +error(message, duration) void
        +warning(message, duration) void
        +info(message, duration) void
        +onNotification(handler) Function
    }

    class INodeTypeRegistry {
        <<interface>>
        +registerNodeType(type, component) void
        +getNodeComponent(type) Component
        +getAllNodeTypes() string[]
        +getNodeTypesRecord() Record<string, Component>
    }

    %% Service Implementations
    class ConnectionService {
        -webSocketService: IWebSocketService
        -status: ConnectionStatus
        -statusListeners: Set<ConnectionStatusHandler>
        +connect() Promise<void>
        +disconnect() Promise<void>
        +isConnected() boolean
        +getConnectionStatus() ConnectionStatus
        +onStatusChange(handler) Function
    }

    class WebSocketService {
        -socket: Socket
        -eventHandlers: Map<string, Set<EventHandler>>
        +connect() Promise<void>
        +disconnect() Promise<void>
        +emit(event, data) void
        +on(event, handler) Function
        +off(event, handler) void
        +isConnected() boolean
    }

    class HttpService {
        -api: AxiosInstance
        +get(url, params) Promise<any>
        +post(url, data) Promise<any>
        +put(url, data) Promise<any>
        +delete(url) Promise<any>
    }

    class WorkflowService {
        -httpService: IHttpService
        -webSocketService: IWebSocketService
        +executeWorkflow(method, params) Promise<WorkflowExecutionResult>
        +getAvailableWorkflows() Promise<string[]>
        +saveWorkflow(workflow) Promise<void>
        +loadWorkflow(id) Promise<Workflow>
    }

    class NotificationService {
        -notifications: Notification[]
        -listeners: Set<NotificationHandler>
        +notify(message, type, duration) void
        +success(message, duration) void
        +error(message, duration) void
        +warning(message, duration) void
        +info(message, duration) void
        +onNotification(handler) Function
    }

    class NodeTypeRegistry {
        -nodeTypes: Map<string, NodeComponent>
        +registerNodeType(type, component) void
        +getNodeComponent(type) NodeComponent
        +getAllNodeTypes() string[]
        +getNodeTypesRecord() Record<string, NodeComponent>
    }

    %% Adapters
    class SharedPackageAdapter {
        +createInMemoryTransport(handler) InMemoryTransport
        +createMCPClient(config) MCPClientCore
        +createMCPServer() MCPServerCore
    }

    %% Main Components
    class WorkflowDesignerContainer {
        -workflow: Workflow
        -saveStatus: string
        -workflowHistory: Workflow[]
        -historyIndex: number
        +handleWorkflowChange(workflow) void
        +handleSave() void
        +handleUndo() void
        +handleRedo() void
        +render() ReactNode
    }

    class WorkflowCanvas {
        +initialWorkflow: Workflow
        +onWorkflowChange: Function
        +readOnly: boolean
        +render() ReactNode
    }

    class WorkflowHeader {
        +workflowName: string
        +saveStatus: string
        +onNameChange: Function
        +onSave: Function
        +onNew: Function
        +onUndo: Function
        +onRedo: Function
        +onExport: Function
        +onImport: Function
        +render() ReactNode
    }

    class BaseNodeComponent {
        +id: string
        +data: any
        +selected: boolean
        +title: ReactNode
        +icon: ReactNode
        +color: object
        +handles: object
        +render() ReactNode
    }

    class ConnectionStatus {
        +render() ReactNode
    }

    class NotificationList {
        +render() ReactNode
    }

    %% Hooks
    class useConnection {
        +connectionStatus: ConnectionStatus
        +isConnected: boolean
        +connect: Function
        +disconnect: Function
    }

    class useWorkflow {
        +executeWorkflow: Function
        +getAvailableWorkflows: Function
        +saveWorkflow: Function
        +loadWorkflow: Function
    }

    class useNodeTypes {
        +registerNodeType: Function
        +getNodeComponent: Function
        +getAllNodeTypes: Function
        +getNodeTypesRecord: Function
    }

    class useNotification {
        +notifications: Notification[]
        +notify: Function
        +success: Function
        +error: Function
        +warning: Function
        +info: Function
        +clearNotifications: Function
    }

    %% Utils
    class ErrorHandler {
        +logError(error, context) void
        +handleError(error, context, userMessage) void
        +createErrorHandler(context) Function
        +withErrorHandling(promise, context, userMessage) Promise<T>
    }

    %% Relationships - Providers
    App --> ReactFlowProvider : contains
    ReactFlowProvider --> ServiceProvider : contains
    ServiceProvider --> ConnectionProvider : contains
    ConnectionProvider --> WorkflowProvider : contains
    WorkflowProvider --> NodeTypeProvider : contains
    NodeTypeProvider --> NotificationProvider : contains
    NotificationProvider --> WorkflowDesignerContainer : contains

    %% Relationships - Services & Interfaces
    IConnectionService <|.. ConnectionService : implements
    IWebSocketService <|.. WebSocketService : implements
    IHttpService <|.. HttpService : implements
    IWorkflowService <|.. WorkflowService : implements
    INotificationService <|.. NotificationService : implements
    INodeTypeRegistry <|.. NodeTypeRegistry : implements

    %% Relationships - Dependencies
    ConnectionService --> IWebSocketService : uses
    WorkflowService --> IHttpService : uses
    WorkflowService --> IWebSocketService : uses
    ConnectionProvider --> IConnectionService : uses
    WorkflowProvider --> IWorkflowService : uses
    NodeTypeProvider --> INodeTypeRegistry : uses
    NotificationProvider --> INotificationService : uses

    %% Relationships - Hooks & Components
    WorkflowDesignerContainer --> WorkflowHeader : contains
    WorkflowDesignerContainer --> WorkflowCanvas : contains
    WorkflowDesignerContainer --> useNotification : uses
    WorkflowDesignerContainer --> useWorkflow : uses
    WorkflowCanvas --> BaseNodeComponent : uses
    ConnectionStatus --> useConnection : uses
    NotificationList --> useNotification : uses

    %% Relationships - Utils
    ConnectionService --> ErrorHandler : uses
    WorkflowService --> ErrorHandler : uses
    HttpService --> ErrorHandler : uses
    WebSocketService --> ErrorHandler : uses

    %% Styling
    classDef appComponents fill:#d0f4de,stroke:#333,stroke-width:1px
    classDef providers fill:#caf0f8,stroke:#333,stroke-width:1px
    classDef interfaces fill:#fecd45,stroke:#333,stroke-width:1px
    classDef implementations fill:#ffb380,stroke:#333,stroke-width:1px
    classDef adapters fill:#b392ac,stroke:#333,stroke-width:1px
    classDef components fill:#a2d2ff,stroke:#333,stroke-width:1px
    classDef hooks fill:#ffd6ff,stroke:#333,stroke-width:1px
    classDef utils fill:#d8e2dc,stroke:#333,stroke-width:1px

    %% Apply styles
    class App,ReactFlowProvider,ServiceProvider appComponents
    class ConnectionProvider,WorkflowProvider,NodeTypeProvider,NotificationProvider providers
    class IConnectionService,IWebSocketService,IHttpService,IWorkflowService,INotificationService,INodeTypeRegistry interfaces
    class ConnectionService,WebSocketService,HttpService,WorkflowService,NotificationService,NodeTypeRegistry implementations
    class SharedPackageAdapter adapters
    class WorkflowDesignerContainer,WorkflowCanvas,WorkflowHeader,BaseNodeComponent,ConnectionStatus,NotificationList components
    class useConnection,useWorkflow,useNodeTypes,useNotification hooks
    class ErrorHandler utils
```

The diagram illustrates:

1. **Component Hierarchy**: From the top-level App component down through the provider chain to the UI components.
2. **Service Interfaces and Implementations**: Each service has a clearly defined interface and implementation, demonstrating the Dependency Inversion Principle.
3. **Context Providers**: How context providers inject service dependencies into the component tree.
4. **Relationships**: The dependencies and relationships between different parts of the system.
5. **Hooks**: Custom hooks that provide access to services through the context system.

### Key Architectural Components

1. **Service Layer**: Contains business logic in service implementations that adhere to service interfaces.
2. **Context Layer**: Provides dependency injection for services through React Context.
3. **Component Layer**: UI components that consume services through context hooks.
4. **Adapter Layer**: Manages integration with external dependencies.

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)

Each service, component, and utility has a single, well-defined responsibility:

- `HttpService`: Handles HTTP communication
- `WebSocketService`: Manages WebSocket connections
- `ConnectionService`: Manages connection state
- `WorkflowService`: Handles workflow operations
- `NotificationService`: Manages user notifications

### Open-Closed Principle (OCP)

The architecture is designed to be extended without modifying existing code:

- `NodeTypeRegistry`: Allows registering new node types without modifying existing code
- Service interfaces: New implementations can be provided without changing consumers

### Liskov Substitution Principle (LSP)

Interfaces are designed to ensure implementations can be substituted:

- Service implementations can be swapped as long as they adhere to the interface
- `BaseNodeComponent`: Provides common functionality for all node types

### Interface Segregation Principle (ISP)

Interfaces are focused and client-specific:

- Service interfaces only expose methods required by their consumers
- Component props are designed to only include required properties

### Dependency Inversion Principle (DIP)

Components depend on abstractions, not concrete implementations:

- Components access services through context hooks
- Services are instantiated and injected at the application root

## Key Design Patterns

### Service Pattern

Services encapsulate business logic and are accessed through interfaces:

```typescript
// Interface
interface IHttpService {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, data: any): Promise<T>;
  // ...
}

// Implementation
class HttpService implements IHttpService {
  // ...
}
```

### Context-based Dependency Injection

Services are provided to components through React Context:

```typescript
// Context Provider
export const ConnectionProvider: React.FC<ConnectionProviderProps> = ({ 
  connectionService, 
  children 
}) => {
  // ...
  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
};

// Hook for consuming the service
export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};
```

### Adapter Pattern

Adapters decouple the application from external dependencies:

```typescript
// Adapter for the shared package
export class SharedPackageAdapter {
  // Methods that adapt the shared package API to the application's needs
}
```

### Registry Pattern

The `NodeTypeRegistry` allows for dynamic registration of node types:

```typescript
// Node Type Registry
export class NodeTypeRegistry implements INodeTypeRegistry {
  private nodeTypes: Map<string, NodeComponent> = new Map();

  registerNodeType(type: string, component: NodeComponent): void {
    this.nodeTypes.set(type, component);
  }
  
  // ...
}
```

## Extending the Application

### Adding a New Service

1. Define an interface in `services/interfaces/`
2. Implement the service in `services/implementations/`
3. Create a context provider in `contexts/services/`
4. Update the `ServiceProvider` to include your new service
5. Create a hook to access the service

### Adding a New Node Type

1. Create a new component for the node type
2. Register the node type in the `NodeTypeRegistry`
3. Implement any needed service methods for the node type

### Adding a New Feature

1. Identify required services or create new ones
2. Implement components that use these services
3. Update routing if needed
4. Add tests for the new feature

## Best Practices

### Code Organization

- Keep related files together (interfaces, implementations, tests)
- Use clear, descriptive names for files and directories
- Follow the established project structure

### Error Handling

- Use the `ErrorHandler` utility for consistent error handling
- Create specific error types using `AppError` for better error identification
- Handle errors at the appropriate level (service, component)

### State Management

- Use React Context for global state
- Use local component state for UI-specific state
- Consider performance implications of context updates

### Testing

- Follow the testing strategy outlined in `testing-strategy.md`
- Write tests for all new code
- Use test-driven development when appropriate

## Common Patterns

### Async Operations

```typescript
// Example of async operation with error handling
async function fetchData() {
  try {
    const result = await httpService.get('/api/data');
    return result;
  } catch (error) {
    handleError(error, 'fetchData', 'Failed to fetch data');
    throw error;
  }
}
```

### Context Usage

```typescript
// Example of using a service through context
function MyComponent() {
  const { connectionService } = useConnection();
  
  const handleConnect = async () => {
    try {
      await connectionService.connect();
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    <button onClick={handleConnect}>Connect</button>
  );
}
```

## Troubleshooting

### Common Issues

- **Context Error**: Ensure components are wrapped with the appropriate providers
- **Service Method Error**: Check that the service implementation matches the interface
- **Type Errors**: Ensure types are defined and used correctly

### Debugging Tools

- React DevTools for component hierarchy
- Redux DevTools (if using Redux)
- Browser Developer Tools for networking and performance

## Contributing

Please follow these guidelines when contributing to the project:

1. Follow the SOLID principles and patterns outlined in this guide
2. Write tests for all new code
3. Document new features and changes
4. Use descriptive commit messages
5. Create pull requests for review

## Resources

- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [React Hooks](https://reactjs.org/docs/hooks-intro.html) 