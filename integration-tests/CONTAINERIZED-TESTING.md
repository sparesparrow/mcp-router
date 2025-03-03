# Containerized Integration Testing for MCP-Router

This document outlines the containerized approach for running integration tests on the MCP-Router project. Using Docker containers ensures consistent test environments and better isolation of test dependencies.

## Prerequisites

- Docker installed on your system
- Docker Compose installed on your system
- Node.js 18+ (for local development)

## Test Container Architecture

The containerized testing setup consists of the following services:

1. **Backend Test Service (`backend-test`)**: 
   - Runs the MCP-Router backend API in test mode
   - Includes all backend dependencies
   - Exposes port 3001

2. **Frontend Test Service (`frontend-test`)**: 
   - Runs the MCP-Router frontend in test mode
   - Configured to connect to the backend-test service
   - Exposes port 3000

3. **Test Runner Service (`test-runner`)**: 
   - Contains all testing tools (Jest, Cypress, etc.)
   - Runs the test suites against the backend and frontend services
   - Outputs test results, logs, and coverage reports

## Running Containerized Tests

### Quick Start

To run all integration tests in containers:

```bash
cd integration-tests
npm run test:container
```

This command:
1. Builds all necessary containers
2. Starts the backend and frontend services
3. Waits for services to be healthy
4. Runs all test suites
5. Captures logs and test results
6. Cleans up containers

### Manual Execution

You can also run each step manually:

```bash
# Build the test containers
npm run docker:build

# Start the backend and frontend services
npm run docker:up

# Run the tests
docker-compose -f docker-compose.test.yml run --rm test-runner

# View logs
npm run docker:logs

# Clean up
npm run docker:down
```

## Test Artifacts

The test execution produces the following artifacts:

- **Test Coverage**: Available in `../test_coverage/`
- **Test Logs**: Available in `../test_logs/`
- **Screenshots**: Available in `../screenshots/` (for Cypress tests)

## Customizing Test Execution

You can run specific test suites by overriding the test runner command:

```bash
# Run only API tests
docker-compose -f docker-compose.test.yml run --rm test-runner npm run test:api

# Run only E2E tests
docker-compose -f docker-compose.test.yml run --rm test-runner npm run test:e2e

# Run only Cypress tests
docker-compose -f docker-compose.test.yml run --rm test-runner npm run test:cypress
```

## CI/CD Integration

To integrate with CI/CD pipelines, add the following step to your workflow:

```yaml
- name: Run Integration Tests
  run: |
    cd integration-tests
    npm run test:container
```

## Troubleshooting

### Services Not Starting

If services fail to start:
- Check the logs: `npm run docker:logs`
- Ensure ports 3000 and 3001 are not in use by other applications
- Try increasing the timeout in `scripts/run-containerized-tests.sh`

### Test Failures

If tests fail:
- Review test logs in `../test_logs/`
- Check for errors in the Docker container logs
- Ensure all services are healthy before tests run 