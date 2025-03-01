# Tests Directory

This directory contains automated tests for the MCP Router project.

## Contents

- **api/**: Tests for API endpoints
- **core/**: Tests for core functionality
- **middleware/**: Tests for middleware components
- **conftest.py**: Pytest fixtures and configuration
- **test_monitoring.py**: Tests for monitoring functionality
- **test_transport.py**: Tests for transport layer
- **test_protocol.py**: Tests for MCP protocol implementation
- **test_metrics_collector.py**: Tests for metrics collection
- **test_server.py**: Tests for server implementation
- **test_security_manager.py**: Tests for security functionality
- **test_services.py**: Tests for service implementations

## Test Structure

The tests follow a hierarchical structure:
- Unit tests for individual components
- Integration tests for combined components
- API tests for endpoint behavior
- End-to-end tests for complete workflows

## Running Tests

Tests can be run using pytest:

```bash
# Run all tests
pytest

# Run a specific test file
pytest tests/test_server.py

# Run tests with specific markers
pytest -m "not slow"

# Run tests with coverage
pytest --cov=app
```

## Integration with CI/CD

These tests are automatically run as part of the CI/CD pipeline:
- On every pull request
- Before deployment to staging
- Before deployment to production

Test results are available in the GitHub Actions workflow or in the `test_logs` directory.

## Adding New Tests

When adding new functionality, please follow these guidelines:
1. Create unit tests for individual functions/methods
2. Create integration tests for component interactions
3. Create API tests for any new endpoints
4. Update existing tests if modifying current functionality 