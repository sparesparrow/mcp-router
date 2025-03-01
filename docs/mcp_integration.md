# MCP Workflow Designer Integration Guide

This guide explains how to integrate the MCP Workflow Designer with the Podman Desktop Extension and other MCP servers.

## Architecture

```mermaid
graph TD
    User([User]) --> WD[Workflow Designer]
    WD --> MCR[MCP Router]
    MCR --> PDM[Podman Desktop]
    MCR --> MCP1[Other MCP Servers]
    
    subgraph "Workflow Designer"
        Designer[Visual Designer]
        Executor[Workflow Executor]
        NodePanel[Node Panel]
    end
    
    subgraph "MCP Router"
        Discovery[Server Discovery]
        Auth[Authentication]
        Proxy[Message Proxy]
    end
    
    subgraph "Podman Desktop"
        Extension[MCP Extension]
        Containers[Container Management]
        Images[Image Registry]
    end
    
    WD --> Designer
    WD --> Executor
    WD --> NodePanel
    
    MCR --> Discovery
    MCR --> Auth
    MCR --> Proxy
    
    PDM --> Extension
    PDM --> Containers
    PDM --> Images
    
    Discovery <--> Extension
    Proxy <--> Extension
    
    style WD fill:#1E88E5,color:white
    style MCR fill:#4CAF50,color:white
    style PDM fill:#FF7043,color:white
```

## Integration with Podman Desktop Extension

### Configuration

To connect the Workflow Designer to the Podman Desktop Extension:

1. Ensure the Podman Desktop Extension is exposing its MCP server:

```javascript
// In Podman Desktop Extension (modelcontextprotocol-podman/src/extension.ts)
const defaultTransport: MCPServerTransport = {
  type: 'http-sse',
  port: 3000,
  host: '0.0.0.0', // Allow external connections
  basePath: '/api/v1'
};
```

2. Configure the MCP Router to connect to the Podman Extension:

```javascript
// In MCP Router configuration
{
  "externalServers": [
    {
      "name": "podman-desktop-mcp",
      "host": "localhost", // The host where Podman Desktop is running
      "port": 3000,
      "type": "podman-mcp",
      "auth": {
        "type": "none" // Or "token" if authentication is required
      }
    }
  ]
}
```

### Connection Flow

```mermaid
sequenceDiagram
    participant WD as Workflow Designer
    participant MCR as MCP Router
    participant PD as Podman Desktop
    
    WD->>MCR: Start workflow design
    MCR->>PD: Discover available servers
    PD-->>MCR: Return server list
    MCR-->>WD: Update node panel with servers
    
    WD->>MCR: Execute workflow
    MCR->>PD: Forward MCP commands
    PD-->>MCR: Return results
    MCR-->>WD: Update execution status
```

## Building and Testing

### Prerequisites

- Node.js 16+
- MCP Router running
- Podman Desktop with MCP extension installed

### Setup Steps

1. Configure MCP Router to connect to Podman Desktop

2. Start the development server:
```bash
cd frontend
npm start
```

3. Access the Workflow Designer at http://localhost:3000/workflows

### Testing Workflow

1. Create a new workflow
2. Add Podman server node
3. Connect to container-related tool nodes
4. Execute the workflow to verify connection

## Troubleshooting

### Common Issues

- **Connection failures**: Verify Podman Desktop is exposing the MCP server correctly
- **Missing tools**: Check that the Podman extension has properly registered its tools
- **Execution errors**: Examine logs in both applications for error details

## Security Considerations

- **Network Security**: Use TLS for production deployments
- **Authentication**: Implement token-based auth between components
- **Access Control**: Limit container operations to authorized workflows

## Future Enhancements

```mermaid
gantt
    title Integration Roadmap
    dateFormat  YYYY-MM-DD
    
    section Phase 1
    Basic Integration           :a1, 2025-03-15, 14d
    
    section Phase 2
    Enhanced Security           :a2, 2025-04-01, 14d
    Container Templates         :a3, 2025-04-01, 21d
    
    section Phase 3
    Multi-Container Orchestration :a4, 2025-05-01, 30d
    Resource Optimization       :a5, 2025-05-15, 21d
```
