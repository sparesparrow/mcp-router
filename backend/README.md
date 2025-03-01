# Backend Directory

This directory contains the Python backend components for the MCP Router project.

## Contents

- **app/**: Main application code for the Python backend
  - **services/**: Backend services implementation
  - **main.py**: FastAPI application entry point
- **requirements.txt**: Python dependencies
- **.env.example**: Example environment variables for the backend
- **Dockerfile**: Docker configuration for the backend
- **pyproject.toml**: Python project configuration

## Purpose

The backend provides additional functionality to the MCP Router including:
- Advanced agent workflow management
- Database integration for persistent storage
- Python-based MCP server implementations
- Extended analytics and monitoring capabilities
- Integration with Python ML/AI libraries

## Getting Started

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Copy the environment example:
   ```bash
   cp .env.example .env
   ```

4. Start the backend server:
   ```bash
   cd app
   uvicorn main:app --reload
   ```

The backend will be available at http://localhost:8000 by default.

## API Documentation

Once running, view the interactive API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Available Endpoints

- `GET /`: Welcome message
- `GET /health`: Health check
- `POST /api/ai/stream-llm`: Stream responses from an LLM
- `POST /api/ai/text-to-speech`: Convert text to speech
- `POST /api/ai/sound-effects`: Generate sound effects

## Integrating with Frontend

The backend exposes APIs that can be consumed by the React frontend. Make sure CORS is properly configured for your production environment. 