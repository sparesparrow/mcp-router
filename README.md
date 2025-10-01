# MCP Router

A robust workflow designer and router for agent-based systems.

## Development Environment

This project uses DevContainer for consistent development environments. You can use Visual Studio Code with the Remote Containers extension for the best experience.

### Using DevContainer

1. Install [Docker](https://www.docker.com/products/docker-desktop) and [Visual Studio Code](https://code.visualstudio.com/)
2. Install the [Remote Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
3. Clone this repository
4. Open the repository in Visual Studio Code
5. When prompted, click "Reopen in Container" or run the "Remote-Containers: Open Folder in Container" command

### Manual Setup

If you prefer not to use DevContainer:

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Start development servers
npm run dev
```

## Project Structure

```
mcp-router/
├── packages/
│   ├── frontend/     # React-based UI
│   ├── backend/      # Node.js backend server with Python MCP server
│   └── shared/       # Shared types and utilities
├── integration-tests/ # Integration and E2E tests
├── docs/             # Documentation
│   ├── mcp-aws-tools.md  # AWS Tools documentation
│   └── ...
├── docker-compose.yml
└── README.md
```

## Features

### MCP Server Capabilities

The backend includes a Model Context Protocol (MCP) server with the following capabilities:

- **System Monitoring**: Performance metrics, diagnostics, network analysis
- **Workflow Management**: Analysis and optimization of workflows
- **AI Integration**: Code generation, analysis, and diagram generation
- **AWS Tools**: Environment variable and credential management
  - Retrieve AWS credentials from multiple sources
  - Set AWS environment variables programmatically
  - List and manage AWS profiles
  - Validate credentials and get account information
  - See [AWS Tools Documentation](./docs/mcp-aws-tools.md) for details

### Key Features

- Visual workflow designer for creating agent-based systems
- Real-time workflow execution and monitoring
- Integration with multiple MCP servers
- Secure credential management for AWS and other services
- WebSocket support for real-time updates
- Docker containerization for easy deployment

## Docker Deployment

### Quick Start with Make

The easiest way to get started:

```bash
# Build and start all services
make quick-start

# Or step by step:
make build      # Build images
make up         # Start services
make health     # Check health
make logs       # View logs
```

### Docker Compose

To run the application using Docker Compose:

```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### AWS Credentials in Docker

Configure AWS credentials using one of these methods:

**1. Environment Variables (.env file):**
```bash
cp .env.example .env
# Edit .env with your AWS credentials
docker-compose up -d
```

**2. Mount AWS Config:**
```bash
# Already configured in docker-compose.yml
# Mounts ~/.aws to container automatically
docker-compose up -d
```

**3. IAM Roles (Production):**
```bash
# When running on AWS (EC2/ECS/EKS)
# No configuration needed - uses instance role
docker-compose up -d
```

See [Docker AWS Setup Guide](./docs/docker-aws-setup.md) for detailed instructions.

### Common Docker Commands

```bash
# AWS Tools Testing
make aws-validate        # Validate AWS credentials
make aws-list-profiles   # List AWS profiles
make aws-account-info    # Get account information

# Service Management
make status             # Show service status
make restart            # Restart services
make logs-backend       # View backend logs only

# Development
make dev                # Start with logs attached
make shell-backend      # Open shell in backend
make test               # Run tests

# Cleanup
make clean              # Remove containers and volumes
make clean-all          # Remove everything including images
```

## Testing

```bash
# Run all tests
npm test

# Run integration tests
npm run test:integration

# Run Cypress E2E tests
npm run test:cypress

# Open Cypress interactively
cd integration-tests && npm run cypress:open
```

## Continuous Integration

This project uses GitHub Actions for CI/CD. The following workflows are available:

- **Continuous Integration**: Triggered on every push and pull request
  - Linting and formatting checks
  - Node.js and Python unit tests
  - Docker builds
  - Integration tests (optional)
  - Performance tests (optional)
- **Release**: Triggered when a new tag is pushed

See [CI Workflow Fixes](./CI_WORKFLOW_FIXES.md) for detailed information about the CI/CD setup.

## Browser Compatibility

The shared package has been designed to work in both Node.js and browser environments. For browser usage, a minimal version is provided that excludes server-specific dependencies.

## Documentation

### Quick Links
- **[Documentation Index](./docs/INDEX.md)** - Complete documentation index
- **[AWS Tools Guide](./docs/mcp-aws-tools.md)** - AWS tools full reference
- **[Docker Quick Reference](./DOCKER_README.md)** - Docker commands cheat sheet
- **[AWS Quick Start](./docs/aws-quickstart.md)** - Get started in 5 minutes

### By Topic
- **[Docker Setup](./docs/docker-aws-setup.md)** - Complete Docker deployment guide
- **[MCP Integration](./docs/mcp_integration.md)** - MCP workflow designer integration
- **[Developer Guide](./docs/developer-guide.md)** - Development guidelines
- **[Architecture](./docs/ARCHITECTURE.md)** - System architecture
- **[Testing](./docs/testing-strategy.md)** - Testing strategy

### Implementation Details
- **[AWS Implementation](./CHANGELOG_AWS_MCP.md)** - AWS MCP tools changelog
- **[Docker Implementation](./DOCKER_IMPLEMENTATION_SUMMARY.md)** - Docker setup details

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [Developer Guide](./docs/developer-guide.md) for detailed contribution guidelines.