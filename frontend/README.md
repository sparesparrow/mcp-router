# Frontend Directory

This directory contains the React-based frontend application for the MCP Router project.

## Contents

- **src/**: Source code for the React application
- **public/**: Static assets and HTML entry point
- **api/**: API client implementations for communication with the backend
- **types/**: TypeScript type definitions
- **nginx/**: Nginx configuration for production deployment
- **dashboard/**: Dashboard UI components
- **qr-display/**: QR code generation and display components
- **package.json**: NPM dependencies and scripts
- **tsconfig.json**: TypeScript configuration
- **babel.config.js**: Babel configuration for JavaScript transpilation
- **jest.config.ts**: Jest test runner configuration
- **vitest.config.ts**: Vitest configuration for unit testing
- **Dockerfile**: Docker configuration for containerized deployment

## Features

The frontend provides a modern web interface for:
- Visualizing and managing MCP server connections
- Creating and editing LLM agent workflows
- Monitoring MCP server performance and usage
- Testing API endpoints and tool capabilities
- Authentication and user management
- Real-time updates via WebSocket connections

## Technology Stack

- **React**: UI framework
- **TypeScript**: Type-safe JavaScript
- **React Router**: Routing
- **Redux Toolkit**: State management
- **Mermaid.js**: Workflow diagram visualization
- **Tailwind CSS**: Styling
- **Jest/Vitest**: Testing

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run tests:
   ```bash
   npm test
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Integration with MCP Router

The frontend communicates with the MCP Router backend via:
- RESTful API calls for configuration and management
- WebSocket connections for real-time updates and events
- Fetching MCP server capabilities and resources 