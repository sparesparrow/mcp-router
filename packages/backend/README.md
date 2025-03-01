# MCP Router - Backend Package

## Overview

The backend package contains the server-side components of the MCP Router application. It provides API endpoints, router services, and system monitoring capabilities. The backend is responsible for executing workflows, managing connections to MCP servers, and providing data persistence.

## Features

- **API Endpoints**: RESTful API for interacting with the system
- **Router Services**: Core router functionality for MCP communication
- **System Monitoring**: Monitoring and metrics collection
- **Database Integration**: Data persistence for workflows and system state
- **MCP Server Implementation**: Implementation of the Model Context Protocol server

## Architecture

The backend is organized using a service-based architecture:

```
backend/
├── src/
│   ├── api/                # API endpoints and controllers
│   │   ├── routes/         # API route definitions
│   │   ├── controllers/    # API controllers
│   │   ├── middleware/     # API middleware
│   │   └── main.ts         # API entry point
│   ├── core/               # Core router functionality
│   │   ├── router/         # Router implementation
│   │   └── discovery/      # Server discovery
│   ├── services/           # Service implementations
│   │   ├── mcp/            # MCP service
│   │   ├── system-monitor/ # System monitoring
│   │   ├── analyzers/      # Code analyzers
│   │   └── transport/      # Transport implementations
│   ├── db/                 # Database models and migrations
│   │   ├── models/         # Database models
│   │   └── migrations/     # Database migrations
│   └── utils/              # Utility functions
└── requirements.txt        # Python dependencies
```

## Key Components

### API

The API module provides RESTful endpoints for interacting with the system. It includes:

- **Routes**: Definitions for API routes
- **Controllers**: Logic for handling API requests
- **Middleware**: Request processing middleware
- **Validation**: Request validation

### Core Router

The core router module provides the central functionality of the MCP Router:

- **Router**: Routes messages between agents and services
- **Discovery**: Discovers available MCP servers
- **Validation**: Validates workflows before execution

### Services

The services module provides various services used by the system:

- **MCP Service**: Implementation of the Model Context Protocol
- **System Monitor**: Monitoring and metrics collection
- **Analyzers**: Code analysis tools
- **Transport**: Communication transport implementations

### Database

The database module provides data persistence for the system:

- **Models**: Database models for workflows, agents, and system state
- **Migrations**: Database schema migrations

## Getting Started

### Prerequisites

- Python 3.11+
- PostgreSQL
- Redis

### Installation

```bash
cd packages/backend
pip install -r requirements.txt
```

### Development

```bash
# Start the development server
python -m uvicorn src.api.main:app --reload

# Run tests
pytest

# Run database migrations
python -m alembic upgrade head
```

## Integration with Other Packages

The backend package integrates with other packages in the monorepo:

- **Shared Package**: Uses types, utilities, and server implementations from the shared package
- **Frontend Package**: Provides API endpoints for the frontend to consume

## Database Configuration

The backend uses PostgreSQL for data persistence. The database connection can be configured using environment variables:

```
DATABASE_URL=postgresql://user:password@localhost:5432/mcp_router
```

## Redis Configuration

The backend uses Redis for caching and message queuing. The Redis connection can be configured using environment variables:

```
REDIS_URL=redis://localhost:6379/0
```

## Feature Flags

The backend uses feature flags to control the availability of features. These flags are defined in the shared package and can be used to enable or disable features at runtime.

```python
from packages.shared.src.constants.feature_flags import is_feature_enabled

# Check if a feature is enabled
if is_feature_enabled('ROUTER_SERVICES'):
    # Use router services
```

## API Documentation

The API is documented using OpenAPI (Swagger). The documentation is available at `/docs` when running the server.

## Contributing

When contributing to the backend package, please ensure that:

1. API endpoints are properly documented
2. Tests are added for new functionality
3. Database migrations are included for schema changes
4. Feature flags are used for incomplete features
5. The code follows the project's coding standards

## License

This package is part of the MCP Router project and is subject to the same license terms. 