# AWS Tools for MCP Server

This module provides AWS credential and environment management capabilities for the Model Context Protocol (MCP) server.

## Quick Start

### Installation

```bash
pip install -r requirements.txt
```

The boto3 package is included in requirements.txt for full AWS functionality.

### Basic Usage

```python
from api.mcp.aws_tools import AWSEnvironmentTool

# Initialize the tool
aws_tool = AWSEnvironmentTool()

# Get current AWS credentials
credentials = await aws_tool.get_aws_credentials()
print(f"Region: {credentials['credentials']['region']}")

# Validate credentials
validation = await aws_tool.validate_aws_credentials()
if validation['valid']:
    print(f"Connected to AWS Account: {validation['account_id']}")
```

### Available Tools

1. **aws/get-credentials** - Retrieve AWS credentials and environment variables
2. **aws/set-environment** - Set AWS environment variables
3. **aws/list-profiles** - List available AWS profiles
4. **aws/get-account-info** - Get AWS account information via STS
5. **aws/validate-credentials** - Validate AWS credentials

## Files

- `aws_tools.py` - Main AWS tools implementation
- `tools.py` - Tool registry integration (AWS tool handlers)
- `server.py` - MCP server implementation

## Documentation

See [/docs/mcp-aws-tools.md](../../../../docs/mcp-aws-tools.md) for complete documentation including:

- Detailed API reference
- Usage examples
- Security considerations
- Troubleshooting guide
- Configuration options

## Features

- ✅ Secure credential retrieval from multiple sources
- ✅ Automatic credential masking in responses
- ✅ AWS profile management
- ✅ Credential validation with STS
- ✅ Environment variable configuration
- ✅ Support for temporary session tokens
- ✅ Structured logging and error handling
- ✅ Integration with MCP metrics collection

## Security

- Credentials are automatically masked in all responses
- Session tokens are only included when explicitly requested
- No credentials are persisted to disk via `aws/set-environment`
- All operations are logged for audit purposes
- Rate limiting and validation middleware protect against abuse

## Testing

Run tests from the backend directory:

```bash
pytest tests/test_aws_tools.py -v
```

## Requirements

- Python 3.8+
- boto3 (optional, but recommended for full functionality)
- botocore (optional)
- fastapi
- structlog

## Contributing

When adding new AWS tools:

1. Add methods to `AWSEnvironmentTool` class
2. Register tools in `_register_aws_tools()` method
3. Add handler methods in `ToolRegistry` class
4. Update documentation
5. Add tests

## License

Part of the MCP Server project.