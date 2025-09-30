# MCP AWS Tools Documentation

## Overview

The AWS Tools for Model Context Protocol (MCP) provide secure access to AWS credentials and environment variables through the MCP server. These tools enable AI assistants to interact with AWS services by managing credentials, validating access, and retrieving account information.

## Features

- **Credential Management**: Retrieve AWS credentials from environment variables or AWS config files
- **Environment Configuration**: Set AWS environment variables programmatically
- **Profile Management**: List and select from available AWS profiles
- **Account Information**: Retrieve AWS account details using STS (Security Token Service)
- **Credential Validation**: Validate AWS credentials with real API calls
- **Security**: Automatic masking of sensitive credential data in responses

## Installation

### Prerequisites

```bash
# Install boto3 for AWS SDK support
pip install boto3 botocore
```

The AWS tools are automatically registered when the MCP server starts. If boto3 is not installed, the tools will still be available but with limited functionality (environment variables only).

## Available Tools

### 1. aws/get-credentials

Retrieves AWS credentials and environment variables from the system.

**Input Schema:**
```json
{
  "profile": "string (optional)",
  "include_session_token": "boolean (optional, default: false)"
}
```

**Example Request:**
```json
{
  "method": "aws/get-credentials",
  "params": {
    "profile": "production",
    "include_session_token": false
  }
}
```

**Example Response:**
```json
{
  "timestamp": "2025-09-30T12:00:00.000Z",
  "credentials": {
    "access_key_id": "AKIAIOSFOD...",
    "secret_access_key": "***",
    "region": "us-east-1",
    "profile": "production",
    "has_session_token": true
  },
  "environment_variables": {
    "AWS_DEFAULT_REGION": "us-east-1",
    "AWS_REGION": "us-east-1",
    "AWS_ACCESS_KEY_ID": "AKIAIOSFOD...",
    "AWS_SECRET_ACCESS_KEY": "***"
  },
  "metadata": {
    "boto3_available": true,
    "credentials_source": "aws_config_profile:production"
  }
}
```

**Credentials Sources:**
1. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
2. AWS config file (`~/.aws/credentials`) with specified profile
3. Default AWS credentials chain (if boto3 is available)

### 2. aws/set-environment

Sets AWS environment variables in the current process.

**Input Schema:**
```json
{
  "access_key_id": "string (optional)",
  "secret_access_key": "string (optional)",
  "session_token": "string (optional)",
  "region": "string (optional)"
}
```

**Example Request:**
```json
{
  "method": "aws/set-environment",
  "params": {
    "access_key_id": "AKIAIOSFODNN7EXAMPLE",
    "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "region": "us-west-2"
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "timestamp": "2025-09-30T12:00:00.000Z",
  "updated_variables": [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_DEFAULT_REGION",
    "AWS_REGION"
  ],
  "message": "Successfully set 4 AWS environment variable(s)"
}
```

**Security Note:** This tool sets environment variables only for the current process. These credentials are not persisted to disk.

### 3. aws/list-profiles

Lists all available AWS profiles from the AWS configuration.

**Input Schema:**
```json
{}
```

**Example Request:**
```json
{
  "method": "aws/list-profiles",
  "params": {}
}
```

**Example Response:**
```json
{
  "timestamp": "2025-09-30T12:00:00.000Z",
  "profiles": ["default", "production", "staging", "development"],
  "count": 4,
  "boto3_available": true
}
```

### 4. aws/get-account-info

Retrieves AWS account information using the STS GetCallerIdentity API.

**Input Schema:**
```json
{
  "profile": "string (optional)"
}
```

**Example Request:**
```json
{
  "method": "aws/get-account-info",
  "params": {
    "profile": "production"
  }
}
```

**Example Response:**
```json
{
  "timestamp": "2025-09-30T12:00:00.000Z",
  "account_id": "123456789012",
  "arn": "arn:aws:iam::123456789012:user/admin",
  "user_id": "AIDACKCEVSQ6C2EXAMPLE",
  "region": "us-east-1",
  "profile": "production"
}
```

**Error Response (No Credentials):**
```json
{
  "error": "no_credentials",
  "message": "AWS credentials not found"
}
```

**Note:** Requires boto3 to be installed and valid AWS credentials configured.

### 5. aws/validate-credentials

Validates AWS credentials by making a test STS API call.

**Input Schema:**
```json
{
  "profile": "string (optional)"
}
```

**Example Request:**
```json
{
  "method": "aws/validate-credentials",
  "params": {
    "profile": "production"
  }
}
```

**Example Response (Valid):**
```json
{
  "valid": true,
  "timestamp": "2025-09-30T12:00:00.000Z",
  "account_id": "123456789012",
  "arn": "arn:aws:iam::123456789012:user/admin",
  "region": "us-east-1",
  "profile": "production"
}
```

**Example Response (Invalid):**
```json
{
  "valid": false,
  "error": "invalid_credentials",
  "error_code": "InvalidClientTokenId",
  "message": "The security token included in the request is invalid."
}
```

## Usage Examples

### Example 1: Check Current AWS Configuration

```python
# Using the MCP client
response = await mcp_client.call_tool(
    "aws/get-credentials",
    {}
)

print(f"Current AWS Region: {response['credentials']['region']}")
print(f"Credentials Source: {response['metadata']['credentials_source']}")
```

### Example 2: Switch AWS Profiles

```python
# List available profiles
profiles_response = await mcp_client.call_tool("aws/list-profiles", {})
print(f"Available profiles: {profiles_response['profiles']}")

# Get credentials for a specific profile
prod_creds = await mcp_client.call_tool(
    "aws/get-credentials",
    {"profile": "production"}
)

# Validate the credentials
validation = await mcp_client.call_tool(
    "aws/validate-credentials",
    {"profile": "production"}
)

if validation["valid"]:
    print(f"Connected to AWS Account: {validation['account_id']}")
```

### Example 3: Configure AWS for Testing

```python
# Set temporary AWS credentials
response = await mcp_client.call_tool(
    "aws/set-environment",
    {
        "access_key_id": "AKIAIOSFODNN7EXAMPLE",
        "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "region": "us-west-2"
    }
)

# Verify the configuration
account_info = await mcp_client.call_tool("aws/get-account-info", {})
print(f"AWS Account ID: {account_info['account_id']}")
```

### Example 4: WebSocket Integration

```javascript
// Connect to MCP server via WebSocket
const ws = new WebSocket('ws://localhost:8000/ws');

ws.on('open', () => {
  // Request AWS credentials
  ws.send(JSON.stringify({
    message_type: 'REQUEST',
    protocol_version: '2.0',
    message_id: 'req-1',
    method: 'aws/get-credentials',
    params: {
      profile: 'default'
    }
  }));
});

ws.on('message', (data) => {
  const response = JSON.parse(data);
  console.log('AWS Credentials:', response.result);
});
```

## Security Considerations

### Credential Masking

All sensitive credential values are automatically masked in responses:
- Access Key IDs: Shown as first 10 characters + "..."
- Secret Access Keys: Shown as "***"
- Session Tokens: Shown as first 20 characters + "..." (only if explicitly requested)

### Best Practices

1. **Use IAM Roles**: When running on AWS infrastructure (EC2, ECS, Lambda), use IAM roles instead of explicit credentials
2. **Least Privilege**: Ensure credentials have only the minimum required permissions
3. **Temporary Credentials**: Use temporary session tokens when possible
4. **Environment Isolation**: Use separate AWS profiles for different environments (dev, staging, prod)
5. **Audit Logging**: Monitor AWS CloudTrail for credential usage and API calls

### Security Features

- **No Disk Persistence**: Credentials set via `aws/set-environment` are only stored in process memory
- **Rate Limiting**: MCP server implements rate limiting to prevent credential stuffing attacks
- **Validation Middleware**: All requests are validated before processing
- **Structured Logging**: All credential operations are logged with structured logging

## Configuration

### Environment Variables

The following AWS environment variables are recognized:

- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `AWS_SESSION_TOKEN`: Temporary session token
- `AWS_DEFAULT_REGION`: Default AWS region
- `AWS_REGION`: AWS region (alternative to AWS_DEFAULT_REGION)
- `AWS_PROFILE`: Default AWS profile name

### AWS Configuration Files

Standard AWS configuration files are supported:

- **Credentials**: `~/.aws/credentials`
- **Config**: `~/.aws/config`

Example `~/.aws/credentials`:
```ini
[default]
aws_access_key_id = AKIAIOSFODNN7EXAMPLE
aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

[production]
aws_access_key_id = AKIAI44QH8DHBEXAMPLE
aws_secret_access_key = je7MtGbClwBF/2Zp9Utk/h3yCo8nvbEXAMPLEKEY
```

Example `~/.aws/config`:
```ini
[default]
region = us-east-1
output = json

[profile production]
region = us-west-2
output = json
```

## Error Handling

### Common Errors

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `boto3_not_available` | boto3 library not installed | Install boto3: `pip install boto3` |
| `no_credentials` | AWS credentials not found | Configure credentials via AWS CLI or environment variables |
| `invalid_credentials` | Credentials are invalid or expired | Check credentials and regenerate if needed |
| `client_error` | AWS API error occurred | Check AWS service status and permissions |
| `validation_error` | Input validation failed | Verify request parameters |
| `execution_error` | Tool execution failed | Check logs for detailed error information |

### Error Response Format

```json
{
  "message_type": "ERROR",
  "protocol_version": "2.0",
  "request_id": "req-123",
  "error_code": "EXECUTION_FAILED",
  "error_message": "AWS credentials not found"
}
```

## Testing

### Unit Tests

```python
import pytest
from api.mcp.aws_tools import AWSEnvironmentTool

@pytest.mark.asyncio
async def test_get_aws_credentials():
    tool = AWSEnvironmentTool()
    result = await tool.get_aws_credentials()
    
    assert "credentials" in result
    assert "environment_variables" in result
    assert "metadata" in result

@pytest.mark.asyncio
async def test_validate_credentials():
    tool = AWSEnvironmentTool()
    result = await tool.validate_aws_credentials()
    
    assert "valid" in result
```

### Integration Testing

See the MCP server testing guide for integration test examples.

## Monitoring and Metrics

The AWS tools integrate with the MCP server's metrics collection system:

- **Tool Execution Count**: Number of times each AWS tool is called
- **Success/Failure Rate**: Success and failure counts for each tool
- **Execution Duration**: Average execution time for AWS API calls
- **Error Types**: Breakdown of error types and frequencies

Metrics are available via the `/api/metrics` endpoint.

## Troubleshooting

### Issue: "boto3 not available" warning

**Cause**: boto3 is not installed in the Python environment

**Solution**:
```bash
pip install boto3 botocore
```

### Issue: "AWS credentials not found"

**Cause**: No AWS credentials configured

**Solution**:
1. Configure via AWS CLI: `aws configure`
2. Set environment variables: `export AWS_ACCESS_KEY_ID=...`
3. Use IAM roles (if running on AWS infrastructure)

### Issue: Credentials are valid but API calls fail

**Cause**: Insufficient IAM permissions

**Solution**:
1. Check IAM policy for required permissions
2. Ensure `sts:GetCallerIdentity` permission is granted
3. Review AWS CloudTrail logs for denied requests

## API Reference

### AWSEnvironmentTool Class

```python
class AWSEnvironmentTool:
    async def get_aws_credentials(
        self,
        profile: Optional[str] = None,
        include_session_token: bool = False
    ) -> Dict[str, Any]
    
    async def set_aws_environment(
        self,
        access_key_id: Optional[str] = None,
        secret_access_key: Optional[str] = None,
        session_token: Optional[str] = None,
        region: Optional[str] = None
    ) -> Dict[str, Any]
    
    async def list_aws_profiles(self) -> Dict[str, Any]
    
    async def get_aws_account_info(
        self,
        profile: Optional[str] = None
    ) -> Dict[str, Any]
    
    async def validate_aws_credentials(
        self,
        profile: Optional[str] = None
    ) -> Dict[str, Any]
```

## Contributing

To add new AWS-related tools:

1. Add methods to `AWSEnvironmentTool` class in `aws_tools.py`
2. Register tools in `_register_aws_tools()` method in `tools.py`
3. Add handler methods in `ToolRegistry` class
4. Update this documentation
5. Add unit tests

## Related Documentation

- [MCP Server Documentation](./mcp_integration.md)
- [MCP Architecture](./mcp_architecture.md)
- [Security Standards](../rules/04-security.rules)
- [Python MCP Server Rules](../rules/python-mcp-server.rules)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

## License

This implementation follows the MCP specification and is part of the larger MCP server project.