# MCP Router

A Model Context Protocol (MCP) Router for orchestrating AI services, audio services, and WebSocket communication.

## Project Overview

The MCP Router is a backend service that provides a unified API for interacting with various AI and audio services. It follows the SOLID principles and implements a clean architecture to ensure maintainability and extensibility.

## Features

- **AI Service Integration**: Connect to AI models like Claude for text generation
- **Audio Service Integration**: Text-to-speech capabilities via ElevenLabs
- **WebSocket Support**: Real-time bidirectional communication
- **Service Registry**: Dependency injection system for service management
- **Specialized Routers**: Modular API design with dedicated routers for different services
- **Tools & Workflows**: Support for AI tools and complex reasoning workflows

## Architecture

The project follows a clean architecture with:

- **Interfaces**: Abstract service definitions
- **Services**: Concrete implementations of interfaces
- **Infrastructure**: Cross-cutting concerns like service registry and provider
- **API Routers**: FastAPI routers for HTTP endpoints

## Project Structure

```
packages/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── interfaces/         # Service interfaces
│   │   │   ├── services/           # Service implementations
│   │   │   ├── infrastructure/     # Cross-cutting concerns
│   │   │   ├── routers/            # API routers
│   │   │   │   ├── specialized/    # Specialized routers
│   │   │   │   ├── mcp_router.py   # Main MCP router
│   │   │   │   ├── tools_router.py # Tools router
│   │   │   │   └── workflows_router.py # Workflows router
│   │   │   └── main.py             # FastAPI application
│   │   └── config/                 # Configuration
│   ├── tests/                      # Unit and integration tests
│   └── requirements.txt            # Python dependencies
└── frontend/                       # Frontend code (to be implemented)
```

## Getting Started

### Prerequisites

- Python 3.9+
- FastAPI
- Uvicorn
- Other dependencies listed in requirements.txt

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   pip install -r packages/backend/requirements.txt
   ```
3. Set up environment variables (see `.env.example`)
4. Run the server:
   ```
   cd packages/backend
   uvicorn api.main:app --reload
   ```

## API Endpoints

### MCP API

- `GET /api/mcp/info` - Get information about available MCP services
- `GET /api/mcp/ai/info` - Get information about the AI service
- `POST /api/mcp/ai/generate` - Generate text with the AI service
- `GET /api/mcp/audio/info` - Get information about the audio service
- `POST /api/mcp/audio/synthesize` - Convert text to speech
- `GET /api/mcp/audio/voices` - Get available voices
- `WebSocket /api/mcp/ws` - WebSocket endpoint for real-time communication

### Tools API

- `GET /api/tools/info` - Get information about available tools
- `POST /api/tools/calculator` - Use the calculator tool
- `POST /api/tools/web_search` - Use the web search tool

### Workflows API

- `GET /api/workflows/info` - Get information about available workflows
- `POST /api/workflows/sequential_thinking` - Use the sequential thinking workflow
- `POST /api/workflows/chain_of_thought` - Use the chain of thought workflow

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
