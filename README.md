# MCP Router with LLM Agent Workflows

A comprehensive router for Model Context Protocol (MCP) servers with an integrated LLM Agent Workflow Designer.

## Overview

The MCP Router enables communication between various MCP clients and servers, providing a central hub for managing AI workflows through the Model Context Protocol. Its LLM Agent Workflow Designer allows for visual creation of sophisticated agent patterns as described in Anthropic's "Building Effective Agents" guide.

```mermaid
graph TD
    User([User]) --> Router[MCP Router]
    Router --> Designer[Workflow Designer]
    Designer --> AgentPatterns[Agent Patterns]
    Router --> MCPServers[MCP Servers]
    
    subgraph "Agent Patterns"
        PC[Prompt Chaining]
        RT[Routing]
        PR[Parallelization]
        OW[Orchestrator-Workers]
        EO[Evaluator-Optimizer]
        AA[Autonomous Agent]
    end
    
    AgentPatterns --> PC
    AgentPatterns --> RT
    AgentPatterns --> PR
    AgentPatterns --> OW
    AgentPatterns --> EO
    AgentPatterns --> AA
    
    style Router fill:#1E88E5,color:white
    style Designer fill:#4CAF50,color:white
    style AgentPatterns fill:#FF7043,color:white
```

## Features

- **Advanced MCP Protocol Network Routing**: Connect and manage multiple MCP servers
- **LLM Agent Workflow Designer**: Create, monitor, and deploy agent workflows using visual tools
- **Agent Pattern Library**: Implement architectures from Anthropic's agent design patterns
- **Integrated Mermaid Diagrams**: Visualize and document workflows with automatic diagram generation
- **Advanced Testing Framework**: Test and simulate agent workflows before deployment
- **Comprehensive Monitoring**: Track performance metrics and diagnose issues

## Project Structure

The project has been restructured into a monorepo with clear package boundaries:

```
mcp-router/
├── packages/               # Main packages directory
│   ├── frontend/           # React frontend application
│   ├── backend/            # Backend services and API
│   └── shared/             # Shared code between frontend and backend
├── infra/                  # Infrastructure configuration
│   ├── docker/             # Docker configurations
│   └── nginx/              # Nginx configuration
├── docs/                   # Project documentation
├── scripts/                # Build and deployment scripts
└── config/                 # Project-wide configuration
```

### Packages

#### Frontend (`packages/frontend`)

The frontend package contains the React application, organized by features:

```
frontend/
├── public/                 # Static assets
└── src/                    # Source code
    ├── features/           # Feature modules
    │   ├── workflow-designer/    # Workflow designer feature
    │   │   ├── components/       # React components
    │   │   │   ├── Canvas/       # Canvas component
    │   │   │   ├── NodePalette/  # Node palette component
    │   │   │   ├── PropertiesPanel/ # Properties panel
    │   │   │   └── Nodes/        # Node components
    │   │   ├── hooks/            # React hooks
    │   │   └── contexts/         # React contexts
    │   ├── mermaid-integration/  # Mermaid integration feature
    │   └── improvements/         # Code improvements feature
    ├── assets/              # Assets (images, etc.)
    └── utils/               # Utility functions
```

#### Backend (`packages/backend`)

The backend package contains the server-side code:

```
backend/
├── src/                     # Source code
│   ├── api/                 # API endpoints
│   ├── services/            # Service implementations
│   │   ├── analyzers/       # Code analyzers
│   │   ├── mcp/             # MCP services
│   │   │   ├── context/     # Context services
│   │   └── system-monitor/  # System monitoring
│   ├── core/                # Core functionality
│   │   ├── router/          # Router implementation
│   │   └── discovery/       # Server discovery
│   ├── db/                  # Database access
│   │   └── migrations/      # Database migrations
│   └── utils/               # Utility functions
└── tests/                   # Backend tests
```

#### Shared (`packages/shared`)

The shared package contains code used by both frontend and backend:

```
shared/
└── src/                     # Source code
    ├── types/               # TypeScript type definitions
    ├── client/              # Client implementations
    ├── server/              # Server implementations
    └── utils/               # Shared utilities
```

## Migration Status

The project has been restructured from the old organization to the new monorepo structure. Key components have been moved to their appropriate locations:

- Frontend components have been migrated to `packages/frontend/src/features/`
- Backend services have been migrated to `packages/backend/src/services/`
- Shared code has been migrated to `packages/shared/src/`

For detailed migration status, see [refactoring.md](docs/refactoring.md).

## Migration Tools

Several scripts have been created to assist with the migration process:

- `scripts/migrate_remaining.sh`: Script for migrating files to the new structure
- `scripts/update_imports.sh`: Script for updating import paths in the migrated files
- `scripts/deduplicate_files.sh`: Script for handling files that exist in multiple locations

## Development

### Prerequisites

- Node.js (v16+)
- Docker and Docker Compose
- Python 3.9+

### Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/mcp-router.git
   cd mcp-router
   ```

2. Install dependencies for all packages:
   ```
   npm install
   ```

3. Start the development environment:
   ```
   docker-compose up -d
   ```

4. Start both frontend and backend development servers:
   ```
   npm run dev
   ```

   Alternatively, you can start them separately:
   ```
   # Start frontend only
   npm run start:frontend

   # Start backend only
   npm run start:backend
   ```

### Building

To build all packages:

```
npm run build
```

To build individual packages:

```
npm run build:frontend
npm run build:backend
npm run build:shared
```

### Project Structure Details

The monorepo is organized into three main packages:

1. **Frontend Package** (`packages/frontend`):
   - React application for the user interface
   - Features-based organization
   - Components for workflow design, monitoring, and visualization

2. **Backend Package** (`packages/backend`):
   - Node.js/Express server
   - MCP routing functionality
   - System monitoring and persistence

3. **Shared Package** (`packages/shared`):
   - Common types and utilities used by both frontend and backend
   - MCP client and server implementations
   - Transport layer abstractions

### Importing Between Packages

When importing from one package to another, use the `@mcp-router` namespace:

```typescript
// Importing from shared package in frontend or backend
import { MCPClient } from '@mcp-router/shared/client/MCPClient';

// Importing from within the same package
import { Button } from '../../components/ui/Button';
```

## License

[Add license information here]

## Contributing

[Add contribution guidelines here]

## Current Status

The project is currently undergoing a major restructuring to migrate from the original directory structure to a modern monorepo structure. The following has been completed:

✅ All files have been migrated to the new monorepo structure  
✅ Original directories (`src/` and `services/`) have been removed  
✅ Import paths have been partially updated  
✅ Package configurations have been set up  

### Remaining Tasks

The following tasks are still in progress:

- Finishing import path updates (there are still some incorrect references)
- Completing TypeScript configuration for all packages
- Setting up proper build pipeline
- Testing the application with the new structure

### Known Issues

- Some import paths may still reference the old directory structure
- You may need to manually update imports when working with specific files
- The build process may fail until all import paths are fixed

If you encounter issues, please check [docs/refactoring.md](docs/refactoring.md) for details on the migration progress.

## Workflow Designer

The integrated LLM Agent Workflow Designer provides a visual interface for creating, editing, and managing AI agent workflows. Built with React Flow, it allows for drag-and-drop creation of complex agent patterns.

```mermaid
graph TD
    subgraph "Workflow Designer Architecture"
        WC[WorkflowCanvas]
        NP[NodePalette]
        PP[PropertiesPanel]
        MP[MermaidPanel]
        RFP[ReactFlowProvider]
        
        WC --> NodeTypes
        WC --> RF[ReactFlow Component]
        
        subgraph "Node Components"
            NodeTypes --> LLM[LLMNode]
            NodeTypes --> Tool[ToolNode]
            NodeTypes --> Router[RouterNode]
            NodeTypes --> Parallel[ParallelNode]
            NodeTypes --> IO[Input/Output]
            NodeTypes --> Condition[ConditionNode]
            NodeTypes --> Resource[ResourceNode]
            NodeTypes --> Orchestrator[OrchestratorNode]
        end
        
        subgraph "React Flow Integration"
            RFP --> WC
            RF --> Nodes
            RF --> Edges
            RF --> Controls
            RF --> Background
        end
    end
    
    style WC fill:#4CAF50,color:white,stroke:#388E3C,stroke-width:2px
    style RFP fill:#2196F3,color:white,stroke:#1976D2,stroke-width:2px
    style NodeTypes fill:#FF9800,color:white,stroke:#F57C00,stroke-width:2px
    style RF fill:#9C27B0,color:white,stroke:#7B1FA2,stroke-width:2px
```

### Features

- Visual node-based workflow editor
- Support for all agent patterns from Anthropic's guide
- Mermaid diagram integration for documentation
- Import/export functionality
- Undo/redo history

### Technical Notes

#### React Flow Integration

The Workflow Designer uses React Flow for the node-based interface. To ensure proper functioning:

1. All React Flow components must be wrapped in a `ReactFlowProvider`
2. Components need proper sizing with defined width and height
3. ResizeObserver errors are handled gracefully

#### ResizeObserver Error Handling

The application handles the common "ResizeObserver loop completed with undelivered notifications" error that can occur with React Flow. This error is mostly harmless and is suppressed with a global error handler to prevent it from disrupting the user experience.

```mermaid
%%{init: { 'theme': 'default', 'themeVariables': { 
  'actorBkg': '#2196F3', 'actorTextColor': 'white', 
  'actorLineColor': '#1976D2',
  'sequenceNumberColor': '#333'
}}}%%
sequenceDiagram
    participant User
    participant React as React App
    participant WC as WorkflowCanvas
    participant RFP as ReactFlowProvider
    participant RF as ReactFlow
    participant RO as ResizeObserver
    participant EH as Error Handler
    
    User->>React: Open Workflow Designer
    React->>WC: Mount Component
    WC->>RFP: Wrap with Provider
    
    Note over WC: Initialize error handler
    WC->>EH: Add global error listener
    
    RFP->>RF: Initialize ReactFlow
    RF->>RO: Create ResizeObserver
    
    loop Component Resizing
        RO->>RO: Observe size changes
        RO-->>EH: "Loop completed" error
        EH-->>EH: Suppress error if ResizeObserver related
    end
    
    User->>React: Close component
    React->>WC: Unmount
    WC->>EH: Remove error listener
```

The implementation:
- Uses a global error event listener to catch and suppress these specific errors
- Properly cleans up event listeners on component unmount
- Provides helpful error messages for actual issues

### Node Types

The Workflow Designer supports various node types for building sophisticated agent workflows:

```mermaid
classDiagram
    class NodeBase {
        +string id
        +string label
        +NodeType type
        +XYPosition position
    }
    
    class LLMNode {
        +string model
        +number temperature
        +number maxTokens
        +string systemPrompt
        +string promptTemplate
    }
    
    class ToolNode {
        +string serverName
        +string toolName
        +object inputSchema
        +object argumentMapping
    }
    
    class RouterNode {
        +string routingField
        +array routes
        +string defaultTargetNodeId
    }
    
    class ParallelNode {
        +string mode
        +array targetNodeIds
        +string aggregationStrategy
    }
    
    class InputNode {
        +object inputSchema
    }
    
    class OutputNode {
        +string outputTemplate
    }
    
    NodeBase <|-- LLMNode
    NodeBase <|-- ToolNode
    NodeBase <|-- RouterNode
    NodeBase <|-- ParallelNode
    NodeBase <|-- InputNode
    NodeBase <|-- OutputNode
    
    note for NodeBase "All nodes extend from NodeBase"
    note for RouterNode "Routes to different nodes based on input"
    note for ParallelNode "Executes multiple nodes in parallel"
```

### Error Handling

Error handling in the Workflow Designer follows a structured approach:

```mermaid
flowchart TD
    Error[Error Occurs] --> Check{Error Type?}
    Check -->|ResizeObserver| Suppress[Suppress Error]
    Check -->|Import Error| Display[Display Error UI]
    Check -->|Node Error| Log[Log & Show in UI]
    Check -->|Other| Report[Report to Console]
    
    Suppress --> Continue[Continue Operation]
    Display --> Recovery[Allow User Recovery]
    Log --> Debug[Debug Information]
    Report --> Fallback[Use Fallback]
    
    style Error fill:#F44336,color:white
    style Check fill:#FF9800,color:white
    style Suppress fill:#4CAF50,color:white
    style Display fill:#2196F3,color:white
```

### Data Flow and Component Hierarchy

The following diagram illustrates the data flow and component hierarchy in the Workflow Designer, highlighting how the ResizeObserver error is handled:

```mermaid
flowchart TD
    subgraph "Application Hierarchy"
        direction LR
        App[App.tsx] --> RFP1[ReactFlowProvider]
        RFP1 --> MCP[MCPProvider]
        MCP --> AppContent[AppContent]
        AppContent --> WD[WorkflowDesigner]
        WD --> WC[WorkflowCanvas]
        WC --> RFP2[ReactFlowProvider]
        RFP2 --> WCI[WorkflowCanvasInner]
        
        subgraph "WorkflowCanvasInner Components"
            WCI --> NP[NodePalette]
            WCI --> MainCanvas[Main Canvas]
            WCI --> PP[PropertiesPanel]
            MainCanvas --> RF[ReactFlow]
            MainCanvas --> Error[Error Display]
            MainCanvas --> Toolbar[Toolbar]
        end
    end
    
    style App fill:#1E88E5,color:white
    style RFP1 fill:#2196F3,color:white
    style RFP2 fill:#2196F3,color:white
    style WC fill:#4CAF50,color:white,stroke:#388E3C,stroke-width:2px
    style WCI fill:#66BB6A,color:white
    style Error fill:#F44336,color:white
```

```mermaid
flowchart TD
    subgraph "Data & Error Flow"
        direction TB
        
        User([User]) -->|Interaction| WC[WorkflowCanvas]
        WC -->|Initialization| EH[Error Handler]
        WC -->|Mount| RF[ReactFlow Component]
        
        RF -->|Uses| RO[ResizeObserver]
        RF -->|Updates| NS[Node State]
        RF -->|Updates| ES[Edge State]
        
        subgraph "Error Flow"
            direction LR
            RO -->|Triggers| ROE[ResizeObserver Error]
            ROE -->|Captured by| EH
            EH -->|Filters| FilteredErrors[Filtered Errors]
            FilteredErrors -->|Suppressed| SD[Suppress Display]
            
            ROE -->|Dev Only| DevConsole[Development Console]
        end
        
        subgraph "State Management"
            NS -->|Triggers| WF[Workflow Update]
            ES -->|Triggers| WF
            WF -->|Notifies| Parent[Parent Component]
        end
    end
    
    style User fill:#673AB7,color:white
    style WC fill:#4CAF50,color:white
    style RF fill:#9C27B0,color:white
    style RO fill:#FF9800,color:white
    style ROE fill:#F44336,color:white
    style EH fill:#2196F3,color:white
    style SD fill:#4CAF50,color:white
    style DevConsole fill:#757575,color:white
```

### Preventing ResizeObserver Errors

The application uses the following strategies to prevent ResizeObserver errors from affecting the user experience:

1. **Global Error Handler**: A global error event listener is attached when the WorkflowCanvas component mounts to catch ResizeObserver errors:

```typescript
// Handle ResizeObserver error globally
const errorHandler = typeof window !== 'undefined' ? (e: ErrorEvent) => {
  if (e.message.includes('ResizeObserver loop limit exceeded') || 
      e.message.includes('ResizeObserver loop completed with undelivered notifications')) {
    // Prevent the error from showing in console
    e.stopImmediatePropagation();
  }
} : null;

if (typeof window !== 'undefined' && errorHandler) {
  window.addEventListener('error', errorHandler);
}
```

2. **Proper Cleanup**: The error handler is removed when the component unmounts:

```typescript
useEffect(() => {
  // Cleanup function to remove global error handler when component unmounts
  return () => {
    if (typeof window !== 'undefined' && errorHandler) {
      window.removeEventListener('error', errorHandler);
    }
  };
}, []);
```

3. **ReactFlow Error Handling**: The ReactFlow component includes an `onError` handler to catch any errors it generates:

```typescript
<ReactFlow
  // Other props...
  onError={(error) => {
    console.error('ReactFlow error:', error);
    setError(`ReactFlow error: ${typeof error === 'object' && error !== null && 'message' in error 
      ? (error as { message: string }).message 
      : String(error)}`);
  }}
/>
```

4. **Component Wrapping**: The entire workflow designer is properly wrapped in a ReactFlowProvider both at the application level and component level:

```typescript
// App.tsx
const App: React.FC = () => {
  return (
    <ReactFlowProvider>
      <MCPProvider>
        <AppContent />
      </MCPProvider>
    </ReactFlowProvider>
  );
};

// WorkflowCanvas component
const WorkflowCanvas: React.FC<WorkflowCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  );
};
```

## Mermaid Integration

The Workflow Designer includes robust Mermaid diagram generation capabilities, allowing users to visualize and document their workflows.

### Mermaid Diagram Generator

```mermaid
classDiagram
    class MermaidGenerator {
        -DiagramType diagramType
        -StyleManager styleManager
        -SyntaxValidator syntaxValidator
        +generate(workflow: Workflow): string
        -validateWorkflow(workflow: Workflow): void
        -createGraph(workflow: Workflow): string
        -applyStyles(diagram: string): string
    }
    
    class StyleManager {
        -Styles defaultStyles
        -ColorTheme colorTheme
        +applyStyles(diagram: string, styles: Styles): string
        -validateStyles(styles: Styles): ValidatedStyles
        -applyTheme(diagram: string, theme: ColorTheme): string
    }
    
    class SyntaxValidator {
        -ValidationRules rules
        +validate(diagram: string): ValidationResult
        -checkSyntax(diagram: string): SyntaxIssue[]
        -formatIssues(issues: SyntaxIssue[]): string
    }
    
    MermaidGenerator --> StyleManager: uses
    MermaidGenerator --> SyntaxValidator: uses
```

### Workflow to Mermaid Process

The process of converting a workflow to a Mermaid diagram follows these steps:

```mermaid
flowchart TD
    WorkflowObj[Workflow Object] --> Validation[Validate Workflow]
    Validation --> Generation[Generate Mermaid Syntax]
    Generation --> Styling[Apply Styles]
    Styling --> Validation2[Validate Syntax]
    Validation2 --> Render[Render Diagram]
    
    subgraph "Generation Process"
        Generation --> Nodes[Process Nodes]
        Generation --> Edges[Process Edges]
        Generation --> Layout[Apply Layout]
        
        Nodes --> NT[Node Types]
        Nodes --> NP[Node Positions]
        Nodes --> ND[Node Data]
        
        Edges --> ET[Edge Types]
        Edges --> EP[Edge Paths]
        Edges --> EL[Edge Labels]
    end
    
    subgraph "Style Application"
        Styling --> Colors[Apply Colors]
        Styling --> Fonts[Apply Fonts]
        Styling --> Shapes[Apply Shapes]
        Styling --> Theme[Apply Theme]
    end
    
    style WorkflowObj fill:#4CAF50,color:white
    style Validation fill:#FFC107,color:black
    style Generation fill:#2196F3,color:white
    style Styling fill:#9C27B0,color:white
    style Render fill:#F44336,color:white
```

### MermaidPanel Component

The `MermaidPanel` component in the Workflow Designer allows users to:

1. View the Mermaid representation of their workflow
2. Edit the Mermaid code directly
3. Import a workflow from Mermaid code
4. Export a workflow as a Mermaid diagram

```mermaid
%%{init: { 'theme': 'default', 'themeVariables': { 
  'actorBkg': '#2196F3', 'actorTextColor': 'white', 
  'actorLineColor': '#1976D2',
  'signalColor': '#333',
  'sequenceNumberColor': '#333'
}}}%%
sequenceDiagram
    participant User
    participant WC as WorkflowCanvas
    participant MP as MermaidPanel
    participant MG as MermaidGenerator
    participant MR as MermaidRenderer
    
    User->>WC: Toggle Mermaid Panel
    WC->>MP: Show Panel with Current Workflow
    MP->>MG: Generate Diagram
    MG-->>MP: Return Mermaid Code
    
    alt View Mode
        MP->>MR: Render Diagram
        MR-->>MP: Return SVG
        MP-->>User: Display Diagram
    else Edit Mode
        MP-->>User: Show Editable Code
        User->>MP: Edit Code
        MP->>MG: Validate Syntax
    end
    
    opt Import Workflow
        User->>MP: Import from Mermaid
        MP->>MG: Parse Mermaid to Workflow
        MG-->>MP: Return Workflow Object
        MP->>WC: Update Workflow
    end
    
    opt Export Workflow
        User->>MP: Export to Mermaid
        MP->>MG: Generate Optimized Diagram
        MG-->>MP: Return Exportable Code
        MP-->>User: Download or Copy
    end
```

### Using the Mermaid Integration

The Mermaid integration in the Workflow Designer provides several benefits:

1. **Documentation**: Generate clear, visual documentation of your agent workflows
2. **Sharing**: Share workflows with team members in a readable format
3. **Version Control**: Store workflow representations in version control
4. **Integration**: Include workflow diagrams in project documentation

To use the Mermaid integration:

1. Create your workflow in the visual editor
2. Click the "Show Mermaid" button in the toolbar
3. View, edit, or export the Mermaid diagram
4. Use the diagram in your documentation or share with others
