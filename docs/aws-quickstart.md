# AWS MCP Tools - Quick Start Guide

Get started with AWS environment variables and credential management in the MCP server in under 5 minutes.

## Prerequisites

- MCP Server running (see main [README.md](../README.md))
- Python 3.8+ installed
- (Optional) AWS CLI configured

## Installation

### Step 1: Install Dependencies

```bash
cd packages/backend
pip install -r requirements.txt
```

This installs boto3 and botocore for full AWS functionality.

### Step 2: Start the MCP Server

```bash
# From workspace root
npm run dev

# Or directly start backend
cd packages/backend
uvicorn src.api.main:app --reload
```

The AWS tools are automatically registered on server startup.

## Basic Usage

### Option 1: Using Environment Variables

Set your AWS credentials as environment variables:

```bash
export AWS_ACCESS_KEY_ID=your_access_key_id
export AWS_SECRET_ACCESS_KEY=your_secret_access_key
export AWS_DEFAULT_REGION=us-east-1
```

Then retrieve them via MCP:

```bash
curl http://localhost:8000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "message_id": "test-1",
    "message_type": "REQUEST",
    "protocol_version": "2.0",
    "params": {
      "tool": "aws/get-credentials",
      "params": {}
    }
  }'
```

### Option 2: Using AWS Profiles

If you have AWS CLI configured with profiles:

```bash
# List available profiles
curl http://localhost:8000/api/tools/list

# Get credentials for a specific profile
curl http://localhost:8000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "message_id": "test-2",
    "message_type": "REQUEST",
    "protocol_version": "2.0",
    "params": {
      "tool": "aws/get-credentials",
      "params": {
        "profile": "production"
      }
    }
  }'
```

### Option 3: Set Credentials Programmatically

```bash
curl http://localhost:8000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "message_id": "test-3",
    "message_type": "REQUEST",
    "protocol_version": "2.0",
    "params": {
      "tool": "aws/set-environment",
      "params": {
        "access_key_id": "AKIAIOSFODNN7EXAMPLE",
        "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "region": "us-west-2"
      }
    }
  }'
```

## Verify Your Setup

### 1. List Available AWS Tools

```bash
curl http://localhost:8000/api/tools/list | jq '.result.tools[] | select(.name | startswith("aws/"))'
```

You should see 5 AWS tools:
- `aws/get-credentials`
- `aws/set-environment`
- `aws/list-profiles`
- `aws/get-account-info`
- `aws/validate-credentials`

### 2. Validate Your Credentials

```bash
curl http://localhost:8000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "message_id": "test-4",
    "message_type": "REQUEST",
    "protocol_version": "2.0",
    "params": {
      "tool": "aws/validate-credentials",
      "params": {}
    }
  }' | jq
```

Expected response if credentials are valid:
```json
{
  "message_type": "RESPONSE",
  "protocol_version": "2.0",
  "request_id": "test-4",
  "result": {
    "valid": true,
    "account_id": "123456789012",
    "arn": "arn:aws:iam::123456789012:user/youruser",
    "region": "us-east-1"
  }
}
```

### 3. Get Account Information

```bash
curl http://localhost:8000/api/tools/execute \
  -H "Content-Type: application/json" \
  -d '{
    "message_id": "test-5",
    "message_type": "REQUEST",
    "protocol_version": "2.0",
    "params": {
      "tool": "aws/get-account-info",
      "params": {}
    }
  }' | jq
```

## Common Use Cases

### Use Case 1: Switch Between AWS Accounts

```python
import httpx

async def switch_aws_account(profile: str):
    async with httpx.AsyncClient() as client:
        # Validate credentials for profile
        response = await client.post(
            "http://localhost:8000/api/tools/execute",
            json={
                "message_id": "switch-1",
                "message_type": "REQUEST",
                "protocol_version": "2.0",
                "params": {
                    "tool": "aws/validate-credentials",
                    "params": {"profile": profile}
                }
            }
        )
        result = response.json()
        
        if result["result"]["valid"]:
            print(f"✓ Switched to AWS account: {result['result']['account_id']}")
            return True
        else:
            print(f"✗ Invalid credentials for profile: {profile}")
            return False

# Usage
await switch_aws_account("production")
```

### Use Case 2: Temporary Credential Setup

```python
async def setup_temp_credentials():
    # Set temporary credentials
    response = await client.post(
        "http://localhost:8000/api/tools/execute",
        json={
            "message_id": "temp-1",
            "message_type": "REQUEST",
            "protocol_version": "2.0",
            "params": {
                "tool": "aws/set-environment",
                "params": {
                    "access_key_id": "AKIAIOSFODNN7EXAMPLE",
                    "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
                    "session_token": "FwoGZXIvYXdzEJ...",
                    "region": "us-west-2"
                }
            }
        }
    )
    
    # Verify setup
    verify_response = await client.post(
        "http://localhost:8000/api/tools/execute",
        json={
            "message_id": "temp-2",
            "message_type": "REQUEST",
            "protocol_version": "2.0",
            "params": {
                "tool": "aws/validate-credentials",
                "params": {}
            }
        }
    )
    
    return verify_response.json()
```

### Use Case 3: Multi-Account Operations

```python
async def check_all_accounts():
    # List all profiles
    profiles_response = await client.post(
        "http://localhost:8000/api/tools/execute",
        json={
            "message_id": "multi-1",
            "message_type": "REQUEST",
            "protocol_version": "2.0",
            "params": {
                "tool": "aws/list-profiles",
                "params": {}
            }
        }
    )
    
    profiles = profiles_response.json()["result"]["profiles"]
    
    # Check each profile
    for profile in profiles:
        account_info = await client.post(
            "http://localhost:8000/api/tools/execute",
            json={
                "message_id": f"multi-{profile}",
                "message_type": "REQUEST",
                "protocol_version": "2.0",
                "params": {
                    "tool": "aws/get-account-info",
                    "params": {"profile": profile}
                }
            }
        )
        
        result = account_info.json()["result"]
        print(f"Profile: {profile} -> Account: {result.get('account_id', 'N/A')}")
```

## Troubleshooting

### Problem: "boto3 not available"

**Solution**:
```bash
pip install boto3 botocore
```

### Problem: "AWS credentials not found"

**Solutions**:

1. Set environment variables:
```bash
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
```

2. Configure AWS CLI:
```bash
aws configure
```

3. Use IAM roles (if on AWS infrastructure)

### Problem: "Invalid credentials"

**Check**:
1. Credentials are not expired
2. Credentials have correct format
3. IAM user/role has required permissions (at minimum: `sts:GetCallerIdentity`)

### Problem: Server returns 500 error

**Check**:
1. Server logs: `tail -f logs/mcp-server.log`
2. Ensure all dependencies installed
3. Verify server is running: `curl http://localhost:8000/health`

## Next Steps

- Read the [Full AWS Tools Documentation](./mcp-aws-tools.md)
- Learn about [MCP Integration](./mcp_integration.md)
- Explore [Security Best Practices](./mcp-aws-tools.md#security-considerations)
- Check out [Advanced Usage Examples](./mcp-aws-tools.md#usage-examples)

## WebSocket Example

For real-time applications, use WebSocket:

```javascript
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8000/ws');

ws.on('open', () => {
  console.log('Connected to MCP server');
  
  // Get AWS credentials
  ws.send(JSON.stringify({
    message_type: 'REQUEST',
    protocol_version: '2.0',
    message_id: 'ws-1',
    method: 'aws/get-credentials',
    params: {}
  }));
});

ws.on('message', (data) => {
  const response = JSON.parse(data);
  console.log('Received:', JSON.stringify(response, null, 2));
  
  if (response.result?.credentials) {
    console.log('✓ AWS Region:', response.result.credentials.region);
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

## Getting Help

- **Documentation**: [mcp-aws-tools.md](./mcp-aws-tools.md)
- **API Reference**: [mcp-aws-tools.md#api-reference](./mcp-aws-tools.md#api-reference)
- **Examples**: [mcp-aws-tools.md#usage-examples](./mcp-aws-tools.md#usage-examples)
- **Troubleshooting**: [mcp-aws-tools.md#troubleshooting](./mcp-aws-tools.md#troubleshooting)

## Quick Reference

| Tool | Purpose | Required Params |
|------|---------|-----------------|
| `aws/get-credentials` | Get current credentials | None |
| `aws/set-environment` | Set credentials | `access_key_id`, `secret_access_key`, `region` |
| `aws/list-profiles` | List AWS profiles | None |
| `aws/get-account-info` | Get account details | None (optional: `profile`) |
| `aws/validate-credentials` | Validate credentials | None (optional: `profile`) |

---

**Ready to use AWS tools with MCP!** 🚀