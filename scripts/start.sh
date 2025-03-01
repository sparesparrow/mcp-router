#!/bin/bash

# Start script for MCP Router in production mode

# Set error handling
set -e

echo "Starting MCP Router in production mode..."

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

# Build and start the application containers
echo "Building and starting MCP Router..."
docker-compose up -d --build

echo "MCP Router started successfully!"
echo "Frontend: http://localhost:80"
echo "Backend API: http://localhost:8000"

# Show running containers
docker-compose ps 