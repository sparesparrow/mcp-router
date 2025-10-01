# MCP Server Documentation Index

## 🚀 Quick Start Guides

### Get Started in 5 Minutes
1. **[AWS Quick Start](./aws-quickstart.md)** - Get AWS tools running immediately
2. **[Docker Quick Reference](../DOCKER_README.md)** - Docker commands and setup
3. **[Main README](../README.md)** - Project overview and setup

### Step-by-Step Guides
- **[Docker AWS Setup](./docker-aws-setup.md)** - Complete Docker deployment guide
- **[MCP Integration](./mcp_integration.md)** - MCP workflow designer integration

## 📚 Core Documentation

### AWS MCP Tools
- **[AWS Tools Documentation](./mcp-aws-tools.md)** - Complete AWS tools reference
  - 5 AWS tools (credentials, validation, profiles)
  - Security considerations
  - API reference
  - Usage examples
  - Troubleshooting

### MCP Server
- **[MCP Architecture](./mcp_architecture.md)** - System architecture
- **[MCP Integration](./mcp_integration.md)** - Integration guide
- **[System Integration](./system_integration.md)** - System-level integration

### Development
- **[Developer Guide](./developer-guide.md)** - Development guidelines
- **[Architecture](./ARCHITECTURE.md)** - System architecture
- **[Refactoring Guide](./refactoring-guide.md)** - Code refactoring guide
- **[Testing Strategy](./testing-strategy.md)** - Testing approach

## 🐳 Docker & Deployment

### Docker Resources
- **[Dockerfile](../Dockerfile)** - Multi-stage production build
- **[docker-compose.yml](../docker-compose.yml)** - Production deployment
- **[Docker Implementation Summary](../DOCKER_IMPLEMENTATION_SUMMARY.md)** - Complete Docker implementation details
- **[.env.example](../.env.example)** - Environment configuration template
- **[Makefile](../Makefile)** - 50+ convenience commands

### Deployment Guides
- **[Docker AWS Setup](./docker-aws-setup.md)** - Comprehensive deployment guide
  - Local development
  - Production deployment
  - AWS ECS/EKS deployment
  - Security best practices

## 🔐 Security

### AWS Security
- **[AWS Tools Security](./mcp-aws-tools.md#security-considerations)**
  - Credential masking
  - Best practices
  - IAM recommendations

### General Security
- **[Security Rules](../rules/04-security.rules)** - Universal security standards
- **[Security Middleware](./mcp-aws-tools.md#security-features)** - MCP security features

## 📖 API Reference

### AWS Tools API
All available in [AWS Tools Documentation](./mcp-aws-tools.md):
- `aws/get-credentials` - Retrieve credentials
- `aws/set-environment` - Set environment variables
- `aws/list-profiles` - List AWS profiles
- `aws/get-account-info` - Get account information
- `aws/validate-credentials` - Validate credentials

### MCP Server API
- **[MCP Integration](./mcp_integration.md)** - MCP API reference
- **[System Monitoring](./mcp-aws-tools.md#monitoring-and-metrics)** - Monitoring API

## 🧪 Testing

### Test Documentation
- **[Testing Strategy](./testing-strategy.md)** - Overall testing approach
- **[Performance Testing](./performance-testing-guide.md)** - Performance testing guide
- **[AWS Tools Tests](../packages/backend/tests/test_aws_tools.py)** - Unit tests

### Running Tests
```bash
# All tests
make test

# AWS tools only
make test-aws

# Integration tests
npm run test:integration
```

## 🛠️ Development Tools

### Make Commands
Run `make help` to see all available commands:
- Build & Run: `make quick-start`, `make up`, `make down`
- AWS Testing: `make aws-validate`, `make aws-list-profiles`
- Development: `make dev`, `make shell-backend`
- Monitoring: `make health`, `make logs`, `make stats`
- Cleanup: `make clean`, `make clean-all`

### Project Structure
```
mcp-router/
├── packages/
│   ├── backend/          # FastAPI server with MCP & AWS tools
│   │   ├── src/api/mcp/
│   │   │   ├── aws_tools.py      # AWS tool implementation
│   │   │   ├── tools.py          # Tool registry
│   │   │   └── server.py         # MCP server
│   │   └── tests/
│   │       └── test_aws_tools.py # AWS tests
│   ├── frontend/         # React UI
│   └── shared/           # Shared utilities
├── docs/                 # Documentation
│   ├── mcp-aws-tools.md         # AWS tools docs
│   ├── docker-aws-setup.md      # Docker guide
│   ├── aws-quickstart.md        # Quick start
│   └── INDEX.md                 # This file
├── Dockerfile            # Production Docker build
├── docker-compose.yml    # Docker Compose config
├── Makefile             # Convenience commands
└── README.md            # Main README
```

## 🎓 Learning Path

### For New Users
1. Read [Main README](../README.md)
2. Try [AWS Quick Start](./aws-quickstart.md)
3. Run `make quick-start`
4. Explore [Docker Quick Reference](../DOCKER_README.md)

### For Developers
1. Review [Developer Guide](./developer-guide.md)
2. Study [Architecture](./ARCHITECTURE.md)
3. Check [Python MCP Server Rules](../rules/python-mcp-server.rules)
4. Read [AWS Tools Implementation](../packages/backend/src/api/mcp/README_AWS.md)

### For DevOps
1. Study [Docker AWS Setup](./docker-aws-setup.md)
2. Review [Docker Implementation Summary](../DOCKER_IMPLEMENTATION_SUMMARY.md)
3. Configure [Environment Variables](../.env.example)
4. Deploy using [Makefile](../Makefile)

### For Security Teams
1. Review [Security Considerations](./mcp-aws-tools.md#security-considerations)
2. Check [Security Rules](../rules/04-security.rules)
3. Audit [Dockerfile](../Dockerfile) security
4. Review [IAM Best Practices](./docker-aws-setup.md#security-best-practices)

## 🔍 Find What You Need

### By Topic

#### AWS
- [AWS Tools Documentation](./mcp-aws-tools.md)
- [AWS Quick Start](./aws-quickstart.md)
- [AWS in Docker](./docker-aws-setup.md#aws-credentials-configuration)

#### Docker
- [Docker Quick Reference](../DOCKER_README.md)
- [Docker AWS Setup](./docker-aws-setup.md)
- [Docker Implementation](../DOCKER_IMPLEMENTATION_SUMMARY.md)
- [Dockerfile](../Dockerfile)

#### Development
- [Developer Guide](./developer-guide.md)
- [Testing Strategy](./testing-strategy.md)
- [Refactoring Guide](./refactoring-guide.md)

#### Deployment
- [Docker Deployment](./docker-aws-setup.md)
- [Production Checklist](./docker-aws-setup.md#production-deployment)
- [Makefile Commands](../Makefile)

#### Troubleshooting
- [AWS Tools Troubleshooting](./mcp-aws-tools.md#troubleshooting)
- [Docker Troubleshooting](./docker-aws-setup.md#troubleshooting)
- [Common Issues](../DOCKER_README.md#troubleshooting)

### By Role

#### Application Developers
1. [Developer Guide](./developer-guide.md)
2. [MCP Integration](./mcp_integration.md)
3. [AWS Tools API](./mcp-aws-tools.md#api-reference)
4. [Testing Strategy](./testing-strategy.md)

#### DevOps Engineers
1. [Docker Setup](./docker-aws-setup.md)
2. [Deployment Guide](./docker-aws-setup.md#production-deployment)
3. [Makefile](../Makefile)
4. [Monitoring](./mcp-aws-tools.md#monitoring-and-metrics)

#### Security Engineers
1. [Security Considerations](./mcp-aws-tools.md#security-considerations)
2. [Best Practices](./docker-aws-setup.md#security-best-practices)
3. [Security Rules](../rules/04-security.rules)
4. [Dockerfile Security](../Dockerfile)

#### System Administrators
1. [Installation Guide](../README.md#installation)
2. [Docker Quick Reference](../DOCKER_README.md)
3. [Monitoring](./mcp-aws-tools.md#monitoring-and-metrics)
4. [Backup Procedures](./docker-aws-setup.md#backup--recovery)

## 📊 Metrics & Monitoring

### Available Metrics
- [MCP Metrics](./mcp-aws-tools.md#monitoring-and-metrics)
- [Docker Stats](../DOCKER_README.md#monitoring)
- [Performance Testing](./performance-testing-guide.md)

### Monitoring Tools
- Health checks: `make health`
- Resource usage: `make stats`
- Service logs: `make logs`
- API metrics: `GET /api/metrics`

## 🔄 Updates & Changelogs

### Recent Changes
- [AWS MCP Implementation](../CHANGELOG_AWS_MCP.md)
- [Docker Implementation](../DOCKER_IMPLEMENTATION_SUMMARY.md)
- [CI/CD Workflow Fixes](../CI_WORKFLOW_FIXES.md)

### Quick Summary
- [Workflow Fixes Summary](../WORKFLOW_FIXES_SUMMARY.md) - Quick overview of CI/CD fixes

### Version History
- See [Git History](../.git) for detailed changes
- See individual documentation for feature updates

## 🆘 Support & Resources

### Getting Help
1. Check relevant documentation (use this index)
2. Review troubleshooting sections
3. Run `make help` for available commands
4. Check application logs: `make logs`
5. Open GitHub issue

### External Resources
- [Model Context Protocol](https://modelcontextprotocol.io)
- [AWS SDK for Python (Boto3)](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)
- [Docker Documentation](https://docs.docker.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

### Community
- GitHub Repository: [Link to repo]
- Issue Tracker: [Link to issues]
- Discussions: [Link to discussions]

## 🎯 Quick Reference Cards

### Docker Commands Cheat Sheet
```bash
make quick-start        # Complete setup
make up                 # Start services
make down               # Stop services
make logs               # View logs
make health             # Check health
make aws-validate       # Validate AWS
make clean              # Clean up
```

### AWS Tools Cheat Sheet
```bash
# Get credentials
curl POST /api/tools/execute -d '{"params":{"tool":"aws/get-credentials"}}'

# Validate
curl POST /api/tools/execute -d '{"params":{"tool":"aws/validate-credentials"}}'

# List profiles
curl POST /api/tools/execute -d '{"params":{"tool":"aws/list-profiles"}}'
```

### Testing Cheat Sheet
```bash
make test               # All tests
make test-aws           # AWS tests
make health             # Health check
make aws-test           # AWS environment
```

## 📝 Contributing

### Adding Documentation
1. Place documentation in `/docs/`
2. Update this index
3. Link from relevant sections
4. Follow existing formatting

### Updating Documentation
1. Maintain consistency with existing docs
2. Update related documents
3. Keep index up to date
4. Test all commands/examples

---

**Last Updated**: September 30, 2025
**Version**: 1.0.0 (AWS MCP Tools Release)

For questions or issues, please refer to the relevant documentation section or open a GitHub issue.