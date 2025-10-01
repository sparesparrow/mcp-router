# Docker Quick Reference for MCP Server with AWS Tools

## 🚀 Quick Start (30 seconds)

```bash
# 1. Clone and setup
git clone <repository-url> && cd mcp-router
cp .env.example .env

# 2. Start everything
make quick-start

# 3. Test AWS tools
make aws-validate
```

That's it! Server running at http://localhost:8000

## 📋 Prerequisites

- Docker 20.10+
- Docker Compose 1.29+
- Make (optional, but recommended)
- AWS credentials (optional, for AWS tools)

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│         Docker Host                 │
│  ┌──────────────┐  ┌─────────────┐ │
│  │   Frontend   │  │   Backend   │ │
│  │   (React)    │  │  (FastAPI)  │ │
│  │   Port 3000  │  │  Port 8000  │ │
│  └──────────────┘  └─────────────┘ │
│         │                 │         │
│         └────────┬────────┘         │
│                  │                  │
│         ┌────────▼────────┐         │
│         │  AWS Tools      │         │
│         │  - Credentials  │         │
│         │  - Validation   │         │
│         │  - Profiles     │         │
│         └─────────────────┘         │
└─────────────────────────────────────┘
```

## 🔧 Configuration

### Environment Variables (.env)

```env
# Copy template
cp .env.example .env

# Essential variables
AWS_PROFILE=default
AWS_DEFAULT_REGION=us-east-1
PORT=8000
```

### AWS Credentials Setup

**Option 1: Use existing AWS config (Recommended)**
```bash
# AWS config is automatically mounted
ls ~/.aws/credentials
docker-compose up -d
```

**Option 2: Set environment variables**
```bash
# Edit .env file
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

**Option 3: IAM Roles (AWS infrastructure)**
```bash
# No config needed - automatic
# Just run on EC2/ECS/EKS with IAM role attached
```

## 📦 Make Commands Reference

### Essential Commands

| Command | Description |
|---------|-------------|
| `make quick-start` | Build, start, and verify everything |
| `make up` | Start all services |
| `make down` | Stop all services |
| `make logs` | View all logs |
| `make status` | Show service status |

### AWS Tools Commands

| Command | Description |
|---------|-------------|
| `make aws-validate` | Validate AWS credentials |
| `make aws-list-profiles` | List AWS profiles |
| `make aws-account-info` | Get account information |
| `make aws-test` | Test AWS environment |

### Development Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start with logs attached |
| `make shell-backend` | Open backend shell |
| `make test` | Run all tests |
| `make test-aws` | Run AWS tools tests |

### Monitoring Commands

| Command | Description |
|---------|-------------|
| `make health` | Check service health |
| `make stats` | Show resource usage |
| `make logs-backend` | Backend logs only |
| `make logs-frontend` | Frontend logs only |

### Cleanup Commands

| Command | Description |
|---------|-------------|
| `make clean` | Remove containers/volumes |
| `make clean-images` | Remove images |
| `make clean-all` | Remove everything |

## 🐳 Docker Compose Commands

### Basic Operations

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Restart a service
docker-compose restart backend
```

### Service Management

```bash
# Check status
docker-compose ps

# Execute command
docker-compose exec backend bash

# View environment
docker-compose exec backend env | grep AWS

# Scale services (if supported)
docker-compose up -d --scale backend=3
```

## 🔍 Testing & Verification

### Test AWS Credentials

```bash
# Method 1: Using Make
make aws-validate

# Method 2: Using curl
curl -X POST http://localhost:8000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "message_id": "test-1",
    "message_type": "REQUEST",
    "protocol_version": "2.0",
    "params": {
      "tool": "aws/validate-credentials",
      "params": {}
    }
  }' | jq
```

### List Available Tools

```bash
# All tools
make tools-list

# AWS tools only
make tools-aws

# Using curl
curl http://localhost:8000/api/tools/list | jq '.result.tools[]'
```

### Health Checks

```bash
# All services
make health

# Backend only
curl http://localhost:8000/health

# Check from inside container
docker-compose exec backend curl localhost:8000/health
```

## 🔒 Security Best Practices

### 1. Credentials Management

✅ **DO:**
- Use IAM roles on AWS infrastructure
- Mount credentials read-only: `:ro`
- Use `.env` file (gitignored)
- Rotate credentials regularly

❌ **DON'T:**
- Commit credentials to git
- Store credentials in Dockerfile
- Use root user in containers
- Share credentials across environments

### 2. Container Security

```bash
# Container runs as non-root user (mcpuser)
docker-compose exec backend whoami
# Output: mcpuser

# Files are owned by non-root user
docker-compose exec backend ls -la /app
```

### 3. Network Security

```yaml
# Production: Don't expose backend directly
# Use reverse proxy (nginx, traefik)
services:
  backend:
    expose:
      - "8000"  # Internal only
    # Don't use 'ports' in production
```

## 🐛 Troubleshooting

### Problem: Container exits immediately

```bash
# Check logs
docker-compose logs backend

# Common causes:
# 1. Missing dependencies - rebuild
make rebuild

# 2. Permission issues
docker-compose exec backend ls -la /app

# 3. Configuration errors
docker-compose config
```

### Problem: Can't access AWS credentials

```bash
# Check mounted credentials
docker-compose exec backend ls -la /home/mcpuser/.aws/

# Check environment variables
docker-compose exec backend env | grep AWS

# Test from inside container
docker-compose exec backend python -c "import boto3; print(boto3.Session().get_credentials())"
```

### Problem: Health check failing

```bash
# Check backend is actually running
docker-compose ps

# Check logs for errors
docker-compose logs backend | tail -50

# Test health endpoint manually
docker-compose exec backend curl localhost:8000/health

# If still failing, increase start period
# Edit docker-compose.yml:
healthcheck:
  start_period: 60s
```

### Problem: Port already in use

```bash
# Find process using port 8000
lsof -i :8000
# or
netstat -tuln | grep 8000

# Kill process or change port
# Edit docker-compose.yml:
ports:
  - "8001:8000"  # Use different host port
```

### Problem: Permission denied on AWS files

```bash
# Make AWS files readable
chmod 644 ~/.aws/credentials
chmod 644 ~/.aws/config

# Or set ownership
sudo chown -R $USER:$USER ~/.aws
```

## 📊 Monitoring

### Resource Usage

```bash
# Real-time stats
make stats

# Or directly
docker stats

# Specific container
docker stats mcp-router_backend_1
```

### Logs Analysis

```bash
# Follow logs
make logs

# Search logs
docker-compose logs backend | grep ERROR

# Save logs to file
docker-compose logs > logs.txt

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Health Monitoring

```bash
# Automated health checks
watch -n 5 'curl -s http://localhost:8000/health | jq'

# Check service dependencies
docker-compose exec backend curl frontend:80
```

## 🚀 Production Deployment

### Pre-deployment Checklist

- [ ] Update `.env` with production values
- [ ] Remove development volume mounts
- [ ] Configure IAM roles (don't mount credentials)
- [ ] Set up monitoring and logging
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set resource limits
- [ ] Test health checks
- [ ] Backup strategy in place
- [ ] Disaster recovery plan

### Production Build

```bash
# Build production images
make prod-build

# Start production services
make prod-up

# Verify
make health
make aws-validate
```

### Resource Limits

Edit `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### AWS Deployment

#### Amazon ECS
```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name mcp-server

# 2. Push image
docker build -t mcp-server .
docker tag mcp-server:latest <account>.dkr.ecr.region.amazonaws.com/mcp-server:latest
docker push <account>.dkr.ecr.region.amazonaws.com/mcp-server:latest

# 3. Create ECS task with IAM role
aws ecs create-task-definition --cli-input-json file://task-definition.json
```

#### Amazon EKS
```bash
# 1. Configure IRSA
kubectl create serviceaccount mcp-server

# 2. Deploy
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

## 🔄 Updates & Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull

# Rebuild images
make rebuild

# Restart services
make restart

# Verify
make health
```

### Updating Dependencies

```bash
# Update Python packages
docker-compose exec backend pip install --upgrade boto3

# Rebuild image to persist
docker-compose build backend
```

### Backup & Restore

```bash
# Backup data volume
make backup

# Restore (create restoration script)
docker run --rm \
  -v mcp-router_backend-data:/data \
  -v $(PWD)/backups:/backup \
  alpine tar xzf /backup/backup.tar.gz -C /data
```

## 📚 Additional Resources

- [Full AWS Tools Documentation](./docs/mcp-aws-tools.md)
- [Docker Setup Guide](./docs/docker-aws-setup.md)
- [Quick Start Guide](./docs/aws-quickstart.md)
- [Main README](./README.md)

## 🆘 Getting Help

1. Check logs: `make logs`
2. Verify health: `make health`
3. Test AWS: `make aws-validate`
4. Read docs: `make docs`
5. Open issue on GitHub

## 💡 Tips & Tricks

### Quick Restart After Code Changes

```bash
# Backend only
docker-compose restart backend
docker-compose logs -f backend

# Or rebuild if dependencies changed
docker-compose up -d --build backend
```

### Debug Inside Container

```bash
# Open shell
make shell-backend

# Then inside container:
python
>>> import boto3
>>> boto3.Session().get_credentials()
>>> exit()
```

### Multiple Environments

```bash
# Use different compose files
docker-compose -f docker-compose.dev.yml up    # Dev
docker-compose -f docker-compose.yml up        # Prod
docker-compose -f docker-compose.test.yml up   # Test
```

### Clean Development Environment

```bash
# Complete cleanup and fresh start
make clean-all
make quick-start
```

---

**Ready to deploy? Run `make quick-start` now!** 🚀