# System Context Monitor

A comprehensive system monitoring solution with cognitive workflows and enhanced security.

## Features

- Enhanced security with API key validation and rate limiting
- Comprehensive protocol validation for MCP messages
- Real-time monitoring through WebSocket connections
- Tool registry with validation and metrics collection
- Redis-based rate limiting and caching
- Structured logging with context tracking
- Extensive test coverage

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/system-context-monitor.git
cd system-context-monitor
```

2. Install dependencies with Poetry:
```bash
poetry install
```

Or with pip:
```bash
pip install -r services/requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start Redis and PostgreSQL:
```bash
docker-compose up -d redis db
```

5. Run database migrations:
```bash
poetry run alembic upgrade head
```

## Development

1. Start the development server:
```bash
poetry run uvicorn services.api.main:app --reload
```

2. Run tests:
```bash
poetry run pytest tests/
```

3. Run linting:
```bash
poetry run black services/
poetry run isort services/
poetry run mypy services/
```

## API Documentation

Once running, visit:
- OpenAPI documentation: http://localhost:8000/docs
- ReDoc documentation: http://localhost:8000/redoc

## Architecture

The System Context Monitor is built with:
- FastAPI for high-performance API endpoints
- WebSocket support for real-time monitoring
- Redis for rate limiting and caching
- PostgreSQL for persistent storage
- Structured logging with context tracking
- Comprehensive test suite

### Security Features

- API key validation
- Rate limiting with Redis
- Protocol validation for all messages
- Security headers
- CORS configuration
- Input validation with Pydantic

### Monitoring Features

- Real-time system metrics
- Tool execution metrics
- Error tracking and categorization
- Performance monitoring
- Resource usage tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Material-UI for the component library
- FastAPI for the backend framework
- Docker for containerization
- The open-source community for various tools and libraries

Below is the new `diagrams.md` file containing the requested Mermaid diagrams. All diagrams have been created following the Mermaid Diagram Generator standards (mermaid-generator.mdc), including proper syntax validation, incremental building, and style management.

---

# Diagrams for the System Context Monitor

This file includes multiple Mermaid diagrams documenting the architecture, workflows, and processes of our System Context Monitor codebase.

---

## 1. High-Level Code Structure Diagram

This diagram visualizes the overall directory structure and main modules in the project.

```mermaid
graph LR
    A[SystemContextMonitor]
    A --> B[core]
    A --> C[services]
    A --> D[frontend]
    A --> E[infrastructure]

    B --> B1[agents]
    B --> B2[cognitive]
    B --> B3[workflows]

    C --> C1[monitoring]
    C --> C2[context]

    D --> D1[Dashboard UI]
    D --> D2[Workflow Manager]
    D --> D3[Monitoring Panel]
```

---

## 2. System Monitoring Workflow Flow Diagram

This flowchart illustrates the process within the SystemMonitoringWorkflow—from context validation to service initialization, concurrent monitoring, and error handling.

```mermaid
flowchart TD
    A[Start Workflow Execution]
    B[Validate Context]
    C[Initialize Services]
    D[Setup Service Map]
    E[Create Service Instances]
    F[Start Monitoring]
    G[Run Services Concurrently]
    H[Return Initial State]
    I{Error Occurred?}
    J[Perform Cleanup]
    K[Stop All Services]
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    G -- Error --> I
    I -- Yes --> J
    J --> K
```

---

## 3. Cognitive Orchestrator Workflow Execution Sequence Diagram

This sequence diagram details how the CognitiveOrchestrator executes a workflow, including context validation, resource checks, execution, and state updates.

```mermaid
sequenceDiagram
    participant Client
    participant Orchestrator
    participant Workflow
    Client->>Orchestrator: execute_workflow(workflow_id, context)
    Orchestrator->>Orchestrator: Validate context (Pydantic)
    Orchestrator->>Workflow: Instantiate workflow instance
    Orchestrator->>Orchestrator: Check resource limits
    Orchestrator->>Workflow: execute(context)
    Workflow-->>Orchestrator: Return results or error
    Orchestrator->>Orchestrator: Update state (completed/failed)
    Orchestrator-->>Client: Return execution_id
```

---

## 4. Context Management Flow Diagram

This diagram highlights the process of adding context data and notifying subscribers via the ContextShepherd module.

```mermaid
sequenceDiagram
    participant App
    participant Shepherd as ContextShepherd
    participant Subscriber
    App->>Shepherd: add_context(source, content, importance)
    Shepherd->>Shepherd: Validate context data
    Shepherd->>Subscriber: Notify subscriber of update
```

---

## 5. Monitoring Service Lifecycle Diagram

This flowchart outlines the lifecycle of a monitoring service—from initialization and metric collection to error handling and cleanup.

```mermaid
flowchart TD
    A[Initialize Monitoring Service]
    B[Start Service]
    C[Enter Monitoring Loop]
    D[Check Resource Usage]
    E[Collect Metric]
    F[Store Metric]
    G[Cleanup Old Metrics]
    H[Error Handling]
    I[Stop Service]
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> C
    C -- Error --> H
    H --> I
```

---

## 6. Service Initialization Error Handling Diagram

This sequence diagram visualizes the error handling flow during service initialization, especially when configuration data is invalid.

```mermaid
sequenceDiagram
    participant Workflow as SystemMonitoringWorkflow
    participant Service as MonitoringService
    participant Logger
    Workflow->>Service: Create service instance with config
    Service->>Service: Validate configuration (e.g., output_dir exists)
    alt Config Valid
        Service-->>Workflow: Instance created successfully
    else Invalid Config
        Service-->>Workflow: Raise error ("dict' object has no attribute 'output_dir'")
        Workflow->>Logger: Log error
    end
```

---

## 7. Clipboard Service Monitoring Flow Diagram

This diagram shows the flow of clipboard monitoring—from periodic checking to detecting content changes and notifying subscribers.

```mermaid
sequenceDiagram
    participant Clipboard as ClipboardService
    participant Provider as pyperclip
    participant Handler as _handle_clipboard_change
    participant Subscriber
    Clipboard->>Provider: Get current content
    alt Content Changed
        Clipboard->>Handler: Process new content
        Handler->>Subscriber: Notify change
    else No Change
        Clipboard->>Clipboard: Continue monitoring
    end
```

---

## 8. Test Execution Flow Diagram

This diagram illustrates the overall test execution flow, highlighting service startup, workflow execution, error logging, and cleanup sequences.

```mermaid
sequenceDiagram
    participant TestRunner as run_tests.py
    participant Service as MonitoringService
    participant Workflow as SystemMonitoringWorkflow
    participant Logger
    TestRunner->>Service: Start service
    Service-->>TestRunner: Service started
    TestRunner->>Workflow: Execute workflow
    Workflow-->>Logger: Log error (e.g., resource limit exceeded)
    TestRunner->>Service: Stop service
    Service-->>TestRunner: Service stopped
```
