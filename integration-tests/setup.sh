#!/bin/bash

# Setup script for MCP-Router integration tests

echo "Setting up MCP-Router integration tests..."

# Navigate to the root directory
cd ..

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Build the shared package with browser compatibility
echo "Building shared package with browser compatibility..."
npm run build:shared:minimal

# Build the backend package
echo "Building backend package..."
npm run build:backend:minimal

# Build the frontend package
echo "Building frontend package..."
npm run build:frontend

# Install integration test dependencies
echo "Installing integration test dependencies..."
cd integration-tests
npm install

echo "Setup complete! You can now run the integration tests with 'npm test'" 