#!/bin/bash

# Script to run containerized integration tests for MCP-Router

set -e

# Navigate to the integration-tests directory
cd "$(dirname "$0")/.."

echo "Starting containerized integration tests..."

# Remove previous containers if they exist
docker-compose -f docker-compose.test.yml down -v 2>/dev/null || true

# Build and start the test containers
echo "Building and starting test containers..."
docker-compose -f docker-compose.test.yml build
docker-compose -f docker-compose.test.yml up -d backend-test frontend-test

# Wait for services to be ready
echo "Waiting for services to be healthy..."
TIMEOUT=120
ELAPSED=0
while ! docker-compose -f docker-compose.test.yml ps | grep backend-test | grep -q "(healthy)" || \
      ! docker-compose -f docker-compose.test.yml ps | grep frontend-test | grep -q "(healthy)"; do
  if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "Timeout waiting for services to be healthy"
    docker-compose -f docker-compose.test.yml logs
    docker-compose -f docker-compose.test.yml down -v
    exit 1
  fi
  echo "Waiting for services to be healthy... ($ELAPSED/$TIMEOUT seconds)"
  sleep 5
  ELAPSED=$((ELAPSED + 5))
done

echo "Services are healthy. Running tests..."

# Run test runner container
TEST_EXIT_CODE=0
docker-compose -f docker-compose.test.yml run --rm test-runner || TEST_EXIT_CODE=$?

# Capture logs from all services
echo "Capturing logs..."
docker-compose -f docker-compose.test.yml logs > ../test_logs/docker-compose.log

# Clean up containers
echo "Cleaning up test containers..."
docker-compose -f docker-compose.test.yml down -v

# Exit with test runner exit code
echo "Tests completed with exit code: $TEST_EXIT_CODE"
exit $TEST_EXIT_CODE 