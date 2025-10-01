# Docker Setup with AWS MCP Tools

This guide explains how to run the MCP Server with AWS tools using Docker.

## Quick Start

### 1. Basic Setup

```bash
# Clone the repository
git clone <repository-url>
cd mcp-router

# Create .env file from example
cp .env.example .env

# Edit .env with your AWS credentials
nano .env
```

### 2. Build and Run

```bash
# Build and start services
docker-compose up -d

# Check logs
docker-compose logs -f backend

# Test the server
curl http://localhost:8000/health
```

### 3. Verify AWS Tools

```bash
# List available AWS tools
curl http://localhost:8000/api/tools/list | jq '.result.tools[] | select(.name | startswith("aws/"))'

# Test AWS credentials
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

## AWS Credentials Configuration

There are multiple ways to configure AWS credentials in Docker:

### Option 1: Environment Variables (Recommended for Testing)

Edit `.env` file:
```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_DEFAULT_REGION=us-east-1
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

### Option 2: Mount AWS Credentials File (Recommended for Development)

The `docker-compose.yml` already includes a volume mount:
```yaml
volumes:
  - ~/.aws:/home/mcpuser/.aws:ro
```

This mounts your local AWS credentials into the container. Make sure you have:
- `~/.aws/credentials` - Your AWS credentials
- `~/.aws/config` - Your AWS configuration

**Note**: Credentials are mounted read-only (`:ro`) for security.

### Option 3: IAM Roles (Recommended for Production)

When running on AWS infrastructure (EC2, ECS, EKS):

1. **Remove** the AWS credentials volume mount from `docker-compose.yml`:
```yaml
# Comment out or remove this line
# - ~/.aws:/home/mcpuser/.aws:ro
```

2. **Attach an IAM role** to your EC2 instance/ECS task with required permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

3. The container will automatically use the IAM role credentials.

### Option 4: AWS Secrets Manager (Production)

For production environments, use AWS Secrets Manager:

```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - AWS_SECRETS_MANAGER_SECRET_ID=prod/mcp/credentials
```

Then modify your application to fetch credentials from Secrets Manager at startup.

## Dockerfile Details

### Multi-Stage Build

The Dockerfile uses a multi-stage build for optimal image size:

**Builder Stage:**
- Installs build dependencies
- Installs Python packages (including boto3)
- Creates wheel files

**Runtime Stage:**
- Minimal runtime dependencies
- Copies only necessary files
- Non-root user (`mcpuser`) for security
- Health checks enabled

### Security Features

1. **Non-root User**: Container runs as `mcpuser` (UID 1000)
2. **Read-only Credentials**: AWS credentials mounted as read-only
3. **Minimal Image**: Only runtime dependencies included
4. **No Cache**: `PYTHONDONTWRITEBYTECODE=1` prevents bytecode caching

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | - |
| `AWS_SESSION_TOKEN` | Temporary session token | - |
| `AWS_DEFAULT_REGION` | AWS region | `us-east-1` |
| `AWS_REGION` | AWS region (alternative) | `us-east-1` |
| `AWS_PROFILE` | AWS profile name | `default` |
| `AWS_SDK_LOAD_CONFIG` | Load AWS config file | `1` |
| `PYTHONUNBUFFERED` | Python output buffering | `1` |
| `PYTHONPATH` | Python module search path | `/app` |

## Docker Compose Configuration

### Services

#### Backend Service
```yaml
backend:
  build: .
  ports:
    - "8000:8000"
  environment:
    # AWS credentials from environment or .env file
  volumes:
    - backend-data:/app/data
    - ~/.aws:/home/mcpuser/.aws:ro  # Optional
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
```

#### Frontend Service
```yaml
frontend:
  build: packages/frontend
  ports:
    - "3000:80"
  depends_on:
    backend:
      condition: service_healthy  # Waits for backend health check
```

### Health Checks

Both services include health checks:

**Backend:**
- Endpoint: `http://localhost:8000/health`
- Interval: 30s
- Timeout: 10s
- Start period: 5s

**Frontend:**
- Endpoint: `http://localhost:80`
- Interval: 30s
- Timeout: 10s

## Common Docker Commands

### Build and Run
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Start with rebuild
docker-compose up -d --build

# View logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend
```

### Container Management
```bash
# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart backend
docker-compose restart backend

# Execute command in backend
docker-compose exec backend bash
```

### Debugging
```bash
# Check service status
docker-compose ps

# View backend environment
docker-compose exec backend env

# Test AWS credentials in container
docker-compose exec backend python -c "import boto3; print(boto3.Session().get_credentials())"

# Check AWS config
docker-compose exec backend cat /home/mcpuser/.aws/credentials
```

## Production Deployment

### Using Docker Compose

1. **Update environment variables** for production in `.env`:
```env
NODE_ENV=production
LOG_LEVEL=WARNING
AWS_PROFILE=production
```

2. **Remove development mounts**:
```yaml
# Comment out in docker-compose.yml
# - ~/.aws:/home/mcpuser/.aws:ro
```

3. **Use IAM roles** instead of mounted credentials

4. **Enable resource limits**:
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

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml mcp-stack

# Check services
docker stack services mcp-stack

# View logs
docker service logs mcp-stack_backend
```

### Using Kubernetes

Convert docker-compose to Kubernetes manifests:

```bash
# Install kompose
curl -L https://github.com/kubernetes/kompose/releases/download/v1.31.2/kompose-linux-amd64 -o kompose
chmod +x kompose
sudo mv kompose /usr/local/bin/

# Convert
kompose convert -f docker-compose.yml

# Deploy
kubectl apply -f backend-service.yaml
kubectl apply -f frontend-service.yaml
```

## AWS-Specific Docker Deployment

### Amazon ECS

1. **Create ECR repository**:
```bash
aws ecr create-repository --repository-name mcp-server
```

2. **Build and push**:
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build
docker build -t mcp-server .

# Tag
docker tag mcp-server:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/mcp-server:latest

# Push
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/mcp-server:latest
```

3. **Create task definition** with IAM role:
```json
{
  "family": "mcp-server",
  "taskRoleArn": "arn:aws:iam::123456789012:role/mcp-task-role",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/mcp-server:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "AWS_DEFAULT_REGION",
          "value": "us-east-1"
        }
      ]
    }
  ]
}
```

### Amazon EKS

1. **Create service account with IRSA**:
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: mcp-server
  annotations:
    eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/mcp-server-role
```

2. **Deploy with service account**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-server
spec:
  template:
    spec:
      serviceAccountName: mcp-server
      containers:
      - name: backend
        image: <account-id>.dkr.ecr.us-east-1.amazonaws.com/mcp-server:latest
        ports:
        - containerPort: 8000
```

## Troubleshooting

### Issue: Container can't access AWS credentials

**Check mounted credentials**:
```bash
docker-compose exec backend ls -la /home/mcpuser/.aws/
docker-compose exec backend cat /home/mcpuser/.aws/credentials
```

**Check environment variables**:
```bash
docker-compose exec backend env | grep AWS
```

**Verify permissions**:
```bash
# On host
ls -la ~/.aws/

# Should be readable
chmod 600 ~/.aws/credentials
```

### Issue: Permission denied reading credentials

**Cause**: Container runs as `mcpuser` (UID 1000), but your AWS files have different ownership.

**Solution 1**: Make AWS files readable by all:
```bash
chmod 644 ~/.aws/credentials
chmod 644 ~/.aws/config
```

**Solution 2**: Match UIDs:
```bash
# Check your UID
id -u

# If different from 1000, rebuild with your UID:
# Modify Dockerfile:
RUN useradd -m -u $(id -u) mcpuser
```

### Issue: AWS profile not found

**Check profile exists**:
```bash
docker-compose exec backend aws configure list-profiles
```

**Set correct profile**:
```env
# In .env
AWS_PROFILE=your-profile-name
```

### Issue: Health check failing

**Check backend logs**:
```bash
docker-compose logs backend
```

**Test health endpoint manually**:
```bash
docker-compose exec backend curl http://localhost:8000/health
```

**Increase start period**:
```yaml
healthcheck:
  start_period: 30s  # Increase if app takes longer to start
```

## Security Best Practices

1. **Never commit credentials**:
   - Add `.env` to `.gitignore`
   - Use `.env.example` for templates

2. **Use secrets management**:
   - AWS Secrets Manager for production
   - Docker secrets for swarm mode
   - Kubernetes secrets for K8s

3. **Limit IAM permissions**:
   - Use least privilege principle
   - Only grant `sts:GetCallerIdentity` for basic validation

4. **Rotate credentials regularly**:
   ```bash
   aws iam create-access-key --user-name mcp-server
   aws iam delete-access-key --access-key-id OLD_KEY --user-name mcp-server
   ```

5. **Monitor access**:
   - Enable CloudTrail
   - Set up CloudWatch alarms
   - Review access logs regularly

## Performance Optimization

### Image Size Optimization

Current image: ~200MB (multi-stage build)

Further optimize:
```dockerfile
# Use alpine base
FROM python:3.11-alpine

# Install only required packages
RUN pip install --no-cache-dir boto3 fastapi uvicorn
```

### Build Cache

Speed up builds with BuildKit:
```bash
export DOCKER_BUILDKIT=1
docker-compose build
```

### Layer Caching

Optimize Dockerfile layer ordering:
1. System dependencies (rarely change)
2. Python dependencies (change occasionally)
3. Application code (changes frequently)

## Monitoring

### Container Metrics

```bash
# View resource usage
docker stats

# Export metrics to Prometheus
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```

### Application Logs

```bash
# Follow all logs
docker-compose logs -f

# Search logs
docker-compose logs backend | grep ERROR

# Export logs to file
docker-compose logs > app.log
```

## Next Steps

- [AWS Tools Documentation](./mcp-aws-tools.md)
- [Quick Start Guide](./aws-quickstart.md)
- [MCP Integration Guide](./mcp_integration.md)
- [Security Best Practices](./mcp-aws-tools.md#security-considerations)

## Support

For issues related to:
- **Docker**: Check [Docker documentation](https://docs.docker.com/)
- **AWS**: Check [AWS documentation](https://docs.aws.amazon.com/)
- **MCP Tools**: Check [MCP AWS Tools docs](./mcp-aws-tools.md)