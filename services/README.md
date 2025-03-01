# Services Directory

This directory contains microservices and supporting services for the MCP Router project.

## Contents

- **api/**: API endpoints and service interfaces
- **monitoring/**: System monitoring services and analytics
- **transport/**: Transport layer implementations for MCP communication
- **context/**: Context management services for MCP
- **migrations/**: Database migration scripts
- **main.py**: Main entry point for the services
- **requirements.txt**: Python dependencies for the services
- **__init__.py**: Python package initialization

## Architecture

The system is built with a modular architecture using FastAPI and follows clean architecture principles:

- **API Layer**: FastAPI routes and endpoints
- **Service Layer**: Business logic and service implementations
- **Interface Layer**: Abstract interfaces for dependency injection
- **Monitoring Layer**: System monitoring services

## Key Components

### AI Services

- **Claude Adapter**: Integration with Anthropic's Claude AI model
- **ElevenLabs Adapter**: Text-to-speech capabilities

### Monitoring Services

- **Screenshot Service**: Captures and analyzes screen content
- **Network Monitoring**: Network traffic monitoring
- **Clipboard Monitoring**: Clipboard content monitoring

### Core Infrastructure

- **Service Container**: Dependency injection system
- **WebSocket Support**: Real-time communication
- **MCP (Model Context Protocol)**: Protocol for AI model interaction

## Getting Started

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   ```bash
   export ANTHROPIC_API_KEY=your_api_key
   export ELEVENLABS_API_KEY=your_api_key
   ```

3. Run the application:
   ```bash
   uvicorn main:app --reload
   ```

4. Access the API documentation:
   ```
   http://localhost:8000/docs
   ```

## Integration with MCP Router

These services complement the main MCP Router by providing:
- Advanced monitoring capabilities for MCP servers
- Additional AI service integrations
- Extended analytics for MCP traffic
- Context management services for improving AI responses
- Real-time WebSocket communication for monitoring and alerts

## API Endpoints

- `/api/monitoring/*`: Monitoring-related endpoints
- `/api/mcp/*`: AI and audio-related endpoints
- `/api/tools/*`: Tool information and metadata

## WebSocket Endpoints

- `/api/monitoring/ws`: Real-time monitoring updates
- `/api/mcp/ws`: Real-time AI and audio streaming

## Development

The codebase follows these principles:

- **Interface-based design**: All services implement interfaces
- **Dependency injection**: Services are registered and resolved through a container
- **Async/await**: Asynchronous programming throughout
- **Type annotations**: Comprehensive typing for better code quality 