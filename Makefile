.PHONY: help build up down restart logs test clean aws-test

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)MCP Server with AWS Tools - Docker Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

build: ## Build Docker images
	@echo "$(BLUE)Building Docker images...$(NC)"
	docker-compose build

up: ## Start all services
	@echo "$(BLUE)Starting services...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)Services started!$(NC)"
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"

down: ## Stop all services
	@echo "$(YELLOW)Stopping services...$(NC)"
	docker-compose down
	@echo "$(GREEN)Services stopped!$(NC)"

restart: down up ## Restart all services

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs only
	docker-compose logs -f backend

logs-frontend: ## View frontend logs only
	docker-compose logs -f frontend

status: ## Show service status
	@echo "$(BLUE)Service Status:$(NC)"
	@docker-compose ps

shell-backend: ## Open shell in backend container
	docker-compose exec backend bash

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend sh

# AWS Tools specific commands
aws-test: ## Test AWS credentials in container
	@echo "$(BLUE)Testing AWS credentials...$(NC)"
	@docker-compose exec backend python -c "import os; print('AWS_ACCESS_KEY_ID:', 'Set' if os.getenv('AWS_ACCESS_KEY_ID') else 'Not Set')"
	@docker-compose exec backend python -c "import os; print('AWS_DEFAULT_REGION:', os.getenv('AWS_DEFAULT_REGION', 'Not Set'))"

aws-validate: ## Validate AWS credentials via MCP tool
	@echo "$(BLUE)Validating AWS credentials via MCP...$(NC)"
	@curl -s -X POST http://localhost:8000/api/tools/execute \
		-H "Content-Type: application/json" \
		-d '{"message_id":"test-1","message_type":"REQUEST","protocol_version":"2.0","params":{"tool":"aws/validate-credentials","params":{}}}' \
		| jq '.result'

aws-list-profiles: ## List AWS profiles
	@echo "$(BLUE)Listing AWS profiles...$(NC)"
	@curl -s -X POST http://localhost:8000/api/tools/execute \
		-H "Content-Type: application/json" \
		-d '{"message_id":"test-2","message_type":"REQUEST","protocol_version":"2.0","params":{"tool":"aws/list-profiles","params":{}}}' \
		| jq '.result'

aws-account-info: ## Get AWS account information
	@echo "$(BLUE)Getting AWS account info...$(NC)"
	@curl -s -X POST http://localhost:8000/api/tools/execute \
		-H "Content-Type: application/json" \
		-d '{"message_id":"test-3","message_type":"REQUEST","protocol_version":"2.0","params":{"tool":"aws/get-account-info","params":{}}}' \
		| jq '.result'

# Testing
test: ## Run tests in container
	@echo "$(BLUE)Running tests...$(NC)"
	docker-compose exec backend pytest tests/ -v

test-aws: ## Run AWS tools tests
	@echo "$(BLUE)Running AWS tools tests...$(NC)"
	docker-compose exec backend pytest tests/test_aws_tools.py -v

# Health checks
health: ## Check service health
	@echo "$(BLUE)Checking backend health...$(NC)"
	@curl -s http://localhost:8000/health | jq .
	@echo "$(BLUE)Checking frontend health...$(NC)"
	@curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000

# API exploration
tools-list: ## List all available MCP tools
	@echo "$(BLUE)Listing all MCP tools...$(NC)"
	@curl -s http://localhost:8000/api/tools/list | jq '.result.tools[] | {name: .name, description: .description}'

tools-aws: ## List AWS tools only
	@echo "$(BLUE)Listing AWS tools...$(NC)"
	@curl -s http://localhost:8000/api/tools/list | jq '.result.tools[] | select(.name | startswith("aws/")) | {name: .name, description: .description}'

# Development
dev: ## Start services in development mode with logs
	docker-compose up

dev-build: ## Rebuild and start in development mode
	docker-compose up --build

rebuild: ## Force rebuild all images
	docker-compose build --no-cache

# Cleanup
clean: ## Remove containers, networks, and volumes
	@echo "$(YELLOW)Cleaning up Docker resources...$(NC)"
	docker-compose down -v
	@echo "$(GREEN)Cleanup complete!$(NC)"

clean-images: ## Remove built images
	@echo "$(YELLOW)Removing Docker images...$(NC)"
	docker-compose down --rmi local
	@echo "$(GREEN)Images removed!$(NC)"

clean-all: ## Remove everything (containers, networks, volumes, images)
	@echo "$(RED)Removing all Docker resources...$(NC)"
	docker-compose down -v --rmi all
	@echo "$(GREEN)Everything cleaned!$(NC)"

# Production
prod-build: ## Build production images
	@echo "$(BLUE)Building production images...$(NC)"
	docker-compose -f docker-compose.yml build --no-cache

prod-up: ## Start production services
	@echo "$(BLUE)Starting production services...$(NC)"
	docker-compose -f docker-compose.yml up -d

# Monitoring
stats: ## Show container resource usage
	docker stats

inspect-backend: ## Inspect backend container
	docker-compose exec backend env

# Database operations (if applicable)
db-migrate: ## Run database migrations
	docker-compose exec backend alembic upgrade head

db-rollback: ## Rollback last migration
	docker-compose exec backend alembic downgrade -1

# Backup
backup: ## Backup data volume
	@echo "$(BLUE)Creating backup...$(NC)"
	@docker run --rm -v mcp-router_backend-data:/data -v $(PWD)/backups:/backup alpine tar czf /backup/backend-data-$(shell date +%Y%m%d-%H%M%S).tar.gz -C /data .
	@echo "$(GREEN)Backup created in ./backups/$(NC)"

# Quick commands
quick-start: build up health ## Quick start: build, start, and check health
	@echo "$(GREEN)✓ MCP Server is ready!$(NC)"
	@echo ""
	@echo "$(BLUE)Quick Links:$(NC)"
	@echo "  Backend API: http://localhost:8000"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Health: http://localhost:8000/health"
	@echo "  API Docs: http://localhost:8000/docs"
	@echo ""
	@echo "$(BLUE)Next steps:$(NC)"
	@echo "  make tools-list    - List all available tools"
	@echo "  make aws-validate  - Validate AWS credentials"
	@echo "  make logs          - View logs"

# Installation
install-deps: ## Install local dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	npm install
	cd packages/backend && pip install -r requirements.txt
	@echo "$(GREEN)Dependencies installed!$(NC)"

# Documentation
docs: ## Open documentation
	@echo "$(BLUE)Documentation:$(NC)"
	@echo "  Main README: ./README.md"
	@echo "  AWS Tools: ./docs/mcp-aws-tools.md"
	@echo "  Docker Setup: ./docs/docker-aws-setup.md"
	@echo "  Quick Start: ./docs/aws-quickstart.md"