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

```
mcp-router/
├── src/                  # Main TypeScript source code
│   ├── components/       # React components for workflow designer
│   ├── core/             # Core routing functionality
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   │   └── mermaid/      # Mermaid diagram utilities
│   └── web/              # Web server implementation
├── public/               # Static frontend assets
├── config/               # Configuration files
├── docs/                 # Documentation
├── backend/              # Python backend components
├── dev/                  # Development resources and prototypes
├── services/             # Microservices and supporting services
├── test_logs/            # Test execution logs
├── frontend/             # React-based frontend application
├── tests/                # Automated tests
├── nginx/                # Nginx configuration
├── screenshots/          # Application screenshots
├── dashboard/            # Dashboard components
├── test_coverage/        # Code coverage reports
├── core/                 # Core Python modules
├── system_context_monitor/ # System monitoring components
├── Projects/             # Related projects and subprojects
├── alembic/              # Database migration scripts
├── start.sh              # Production startup script
├── dev.sh                # Development startup script
└── docker-compose.yml    # Docker Compose configuration
```

## Directory Documentation

- [src/](src/README.md) - Main TypeScript source code
  - [src/components/](src/components/README.md) - React components for workflow designer
  - [src/utils/mermaid/](src/utils/mermaid/) - Mermaid diagram utilities
- [public/](public/README.md) - Static frontend assets
- [config/](config/README.md) - Configuration files
- [docs/](docs/README.md) - Documentation
- [backend/](backend/README.md) - Python backend components
- [dev/](dev/README.md) - Development resources and prototypes
- [services/](services/README.md) - Microservices and supporting services
- [test_logs/](test_logs/README.md) - Test execution logs
- [frontend/](frontend/README.md) - React-based frontend application
- [tests/](tests/README.md) - Automated tests
- [nginx/](nginx/README.md) - Nginx configuration
- [screenshots/](screenshots/README.md) - Application screenshots
- [dashboard/](dashboard/README.md) - Dashboard components
- [test_coverage/](test_coverage/README.md) - Code coverage reports
- [core/](core/README.md) - Core Python modules
- [system_context_monitor/](system_context_monitor/README.md) - System monitoring components
- [Projects/](Projects/README.md) - Related projects and subprojects
- [alembic/](alembic/README.md) - Database migration scripts

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- Python 3.9 or higher (for backend)
- Modern web browser

### Installation

#### Main Application

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Build for production
npm run build
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

#### Backend

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

#### Using Development Script

For quick development setup:

```bash
./dev.sh
```

#### Production Deployment

For production deployment:

```bash
./start.sh
```

## Accessing the Application

- **Main Dashboard**: http://localhost:8080/
- **Workflow Designer**: http://localhost:8080/workflow-designer
- **API Documentation**: http://localhost:8080/docs

## LLM Agent Workflow Designer

The Workflow Designer provides a visual interface for creating, testing, and deploying agent workflows based on Anthropic's agent patterns.

![Workflow Designer Screenshot](screenshots/workflow-designer.png)

Key capabilities:
- Drag-and-drop interface for connecting agent components
- Pattern library with pre-built agent architectures
- MCP server integration for resources, tools, and prompts
- Visual execution monitoring
- Testing and simulation framework
- Mermaid diagram import/export

### Workflow Designer Components

The workflow designer consists of these main components:

1. **WorkflowCanvas**: Main canvas for designing agent workflows
2. **MermaidPanel**: Interface for editing and importing/exporting mermaid diagrams
3. **Node Components**: Specialized components for different node types (LLM, Tool, Router, etc.)

For more details, see the [Workflow Designer Components README](src/components/README.md).

## Agent Patterns

The designer implements all core agent patterns from Anthropic's "Building Effective Agents" guide:

1. **Prompt Chaining**: Sequential LLM processing with validation gates
2. **Routing**: Dynamic classification and specialized handler routing
3. **Parallelization**: Concurrent task processing with aggregation
4. **Orchestrator-Workers**: Coordinated multi-agent task distribution
5. **Evaluator-Optimizer**: Iterative improvement with evaluation feedback
6. **Autonomous Agent**: Independent planning and execution loop

## Documentation

- [Frontend README](frontend/README.md)
- [Workflow Designer Components](src/components/README.md)
- [LLM Agent Workflow Designer](docs/workflow-designer.md)
- [Agent Pattern Library](docs/agent-patterns.md)
- [API Documentation](docs/api.md)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
