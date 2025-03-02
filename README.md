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
│   ├── backend/      # Node.js backend server
│   └── shared/       # Shared types and utilities
├── integration-tests/ # Integration and E2E tests
├── docker-compose.yml
└── README.md
```

## Docker Deployment

To run the application using Docker:

```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose up -d
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
- **Release**: Triggered when a new tag is pushed

## Browser Compatibility

The shared package has been designed to work in both Node.js and browser environments. For browser usage, a minimal version is provided that excludes server-specific dependencies.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request