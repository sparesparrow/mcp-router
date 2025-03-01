#!/bin/bash

# Exit on error
set -e

# Load environment variables
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    exit 1
fi
source .env

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

log_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

wait_for_healthy() {
    local container=$1
    local timeout=$2
    local interval=$3
    local elapsed=0

    while [ $elapsed -lt $timeout ]; do
        if [ "$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null)" == "healthy" ]; then
            return 0
        fi
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    return 1
}

# Test setup
log_info "Starting test setup..."

# Ensure docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    log_error "docker-compose is not installed"
fi

# Start all containers
log_info "Starting containers..."
docker-compose up --build -d

# Wait for containers to be healthy
log_info "Waiting for containers to be healthy..."
for container in $BACKEND_CONTAINER $FRONTEND_CONTAINER $DB_CONTAINER $REDIS_CONTAINER; do
    if ! wait_for_healthy $container $HEALTH_CHECK_TIMEOUT $HEALTH_CHECK_INTERVAL; then
        log_error "Container $container failed to become healthy within $HEALTH_CHECK_TIMEOUT seconds"
    fi
done

log_success "All containers are healthy"

# Test 1: Backend Health Check
log_info "Testing backend health check..."
health_response=$(curl -s -w "%{http_code}" http://localhost:$BACKEND_PORT/health)
http_code=${health_response: -3}
response_body=${health_response:0:${#health_response}-3}

if [ "$http_code" != "200" ]; then
    log_error "Backend health check failed with HTTP code $http_code: $response_body"
fi
log_success "Backend health check passed"

# Test 2: Workflow List
log_info "Testing workflow list endpoint..."
workflow_response=$(curl -s -w "%{http_code}" http://localhost:$BACKEND_PORT/api/workflows)
http_code=${workflow_response: -3}
response_body=${workflow_response:0:${#workflow_response}-3}

if [ "$http_code" != "200" ]; then
    log_error "Workflow list failed with HTTP code $http_code: $response_body"
fi

if ! echo "$response_body" | grep -q "system_monitoring"; then
    log_error "Expected workflow 'system_monitoring' not found in response"
fi
log_success "Workflow list test passed"

# Test 3: Execute Workflow
log_info "Testing workflow execution..."
execution_response=$(curl -s -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"workflow_id\":\"$TEST_WORKFLOW_ID\",\"context\":$TEST_CONTEXT_DATA}" \
    http://localhost:$BACKEND_PORT/api/workflows/execute)
http_code=${execution_response: -3}
response_body=${execution_response:0:${#execution_response}-3}

if [ "$http_code" != "200" ]; then
    log_error "Workflow execution failed with HTTP code $http_code: $response_body"
fi

# Extract execution_id from response
execution_id=$(echo $response_body | grep -o '"execution_id":"[^"]*' | cut -d'"' -f4)
if [ -z "$execution_id" ]; then
    log_error "Failed to get execution_id from response"
fi
log_success "Workflow execution test passed"

# Test 4: Check Workflow Status
log_info "Testing workflow status..."
sleep 2  # Give the workflow some time to process

status_response=$(curl -s -w "%{http_code}" \
    http://localhost:$BACKEND_PORT/api/workflows/$execution_id/status)
http_code=${status_response: -3}
response_body=${status_response:0:${#status_response}-3}

if [ "$http_code" != "200" ]; then
    log_error "Workflow status check failed with HTTP code $http_code: $response_body"
fi
log_success "Workflow status test passed"

# Test 5: WebSocket Connection
log_info "Testing WebSocket connection..."
# Use wscat to test WebSocket connection (you may need to install it: npm install -g wscat)
if ! command -v wscat &> /dev/null; then
    log_info "Installing wscat..."
    npm install -g wscat
fi

# Test WebSocket connection
timeout 5 wscat -c "ws://localhost:$BACKEND_PORT/ws" 2>&1 | grep -q "Connected" || \
    log_error "WebSocket connection failed"
log_success "WebSocket connection test passed"

# Test 6: Redis Connection
log_info "Testing Redis connection..."
redis_ping=$(docker exec $REDIS_CONTAINER redis-cli ping)
if [ "$redis_ping" != "PONG" ]; then
    log_error "Redis connection failed"
fi
log_success "Redis connection test passed"

# Test 7: Database Connection
log_info "Testing database connection..."
db_check=$(docker exec $DB_CONTAINER psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT 1;" 2>&1)
if ! echo "$db_check" | grep -q "1 row"; then
    log_error "Database connection failed"
fi
log_success "Database connection test passed"

# Cleanup
log_info "Running cleanup..."
docker-compose down

log_success "All tests completed successfully!" 