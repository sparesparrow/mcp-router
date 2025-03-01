#!/bin/bash

# MCP Router development script

# Set error handling
set -e

echo "Setting up MCP Router development environment..."

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed or not in PATH"
    exit 1
fi

# Check for .env file
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Warning: .env file not found. Copying from .env.example..."
        cp .env.example .env
        echo "Please review .env file and update values as needed."
    else
        echo "Error: Neither .env nor .env.example file found."
        exit 1
    fi
fi

# Check if user wants to start backend services only
if [ "$1" = "backend" ]; then
    echo "Starting backend services (database, redis, and API) only..."
    docker-compose up -d db redis backend
    echo "Backend services started! API available at http://localhost:8000"
    exit 0
fi

# Check if user wants to start just the database and redis
if [ "$1" = "services" ]; then
    echo "Starting database and redis only..."
    docker-compose up -d db redis
    echo "Database and redis services started!"
    exit 0
fi

# Check if Node.js is installed for local frontend development
if ! command -v node &> /dev/null; then
    echo "Warning: Node.js is not installed. Will use containerized frontend."
    echo "Starting all services in containers..."
    docker-compose up -d
    echo "All services started in containers!"
    echo "Frontend: http://localhost:80"
    echo "Backend API: http://localhost:8000"
    exit 0
fi

# Start database and backend services in containers
echo "Starting backend services in containers..."
docker-compose up -d db redis backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Start the frontend in development mode with hot reloading
echo "Starting frontend in development mode..."
echo "Backend API: http://localhost:8000"
npm start 