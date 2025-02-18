# Model Context Protocol (MCP) Integration

## Overview

The Model Context Protocol (MCP) integration provides a standardized way for clients to interact with AI models, audio services, and system monitoring capabilities through WebSocket connections. This implementation follows best practices for security, performance, and reliability.

## Protocol Version 2.0 Updates

### New Features
- Enhanced protocol diagnostics
- Real-time performance monitoring
- Improved security measures
- Rate limiting protection
- Extended message validation
- New message types for diagnostics and heartbeat

## Message Types

The protocol supports the following message types:

1. Request Messages
```json
{
  "protocol_version": "2.0",
  "message_type": "request",
  "message_id": "req-123",
  "method": "tools/call",
  "params": {},
  "context": {}
}
```

2. Response Messages
```json
{
  "protocol_version": "2.0",
  "message_type": "response",
  "message_id": "resp-123",
  "request_id": "req-123",
  "result": {},
  "metrics": {}
}
```

3. Event Messages
```json
{
  "protocol_version": "2.0",
  "message_type": "event",
  "message_id": "evt-123",
  "event_type": "status_update",
  "data": {},
  "source": "system"
}
```

4. Error Messages
```json
{
  "protocol_version": "2.0",
  "message_type": "error",
  "message_id": "err-123",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "error_message": "Too many requests",
  "details": {},
  "request_id": "req-123"
}
```

5. Diagnostic Messages (New)
```json
{
  "protocol_version": "2.0",
  "message_type": "diagnostic",
  "message_id": "diag-123",
  "level": "warning",
  "component": "transport",
  "message": "High latency detected",
  "details": {},
  "metrics": {}
}
```

6. Heartbeat Messages (New)
```json
{
  "protocol_version": "2.0",
  "message_type": "heartbeat",
  "message_id": "hb-123",
  "client_id": "client-456",
  "uptime": 3600.5,
  "metrics": {}
}
```

## Security Enhancements

### Rate Limiting
- 100 messages per minute per client
- Automatic violation recording
- Progressive penalty system

### Message Validation
- Strict schema validation
- Size limits on fields
- Protocol version enforcement
- Message ID format validation

### Connection Security
- Enhanced handshake process
- Client metadata tracking
- Security violation monitoring
- Automatic connection termination on repeated violations

## Protocol Diagnostics

### Real-time Monitoring
- Message throughput
- Error rates
- Protocol violations
- Performance metrics

### Diagnostic Reports
```json
{
  "message_counts": {
    "sent": 1000,
    "received": 950
  },
  "protocol_violations": [
    {
      "timestamp": "2024-02-17T23:10:15Z",
      "type": "rate_limit_exceeded",
      "details": {}
    }
  ],
  "active_connections": 5,
  "performance_metrics": {},
  "error_summary": {
    "total_violations": 10,
    "violation_types": {
      "rate_limit_exceeded": 5,
      "invalid_message": 3,
      "protocol_version_mismatch": 2
    }
  }
}
```

## Client Library Updates

### Python Client
```python
from mcp_client import MCPClient

async def connect_mcp():
    client = MCPClient(
        uri="ws://localhost:8000/api/mcp/ws",
        api_key="your-api-key",
        protocol_version="2.0"
    )
    
    # Enable diagnostics
    client.enable_diagnostics()
    
    # Connect with automatic reconnection
    await client.connect()
    
    # Subscribe to diagnostic events
    @client.on_diagnostic
    async def handle_diagnostic(message):
        print(f"Diagnostic: {message.level} - {message.message}")
    
    # Call system diagnostics tool
    response = await client.call_tool(
        "system/diagnostics",
        {
            "components": ["all"],
            "level": "basic"
        }
    )
    
    # Get client diagnostics
    diagnostics = client.get_diagnostics()
    print(diagnostics)

asyncio.run(connect_mcp())
```

### JavaScript Client
```javascript
import { MCPClient } from '@mcp/client';

const client = new MCPClient({
  url: 'ws://localhost:8000/api/mcp/ws',
  apiKey: 'your-api-key',
  protocolVersion: '2.0',
  diagnostics: true
});

// Connect with automatic reconnection
await client.connect();

// Subscribe to diagnostic events
client.onDiagnostic((message) => {
  console.log(`Diagnostic: ${message.level} - ${message.message}`);
});

// Call performance metrics tool
const response = await client.callTool('system/performance', {
  metrics: ['cpu', 'memory'],
  interval: 1
});

// Get client diagnostics
const diagnostics = client.getDiagnostics();
console.log(diagnostics);
```

## Error Handling

### Error Types
1. Protocol Errors
   - INVALID_MESSAGE_FORMAT
   - INVALID_PROTOCOL_VERSION
   - INVALID_MESSAGE_ID
   - MESSAGE_TOO_LARGE

2. Security Errors
   - RATE_LIMIT_EXCEEDED
   - INVALID_API_KEY
   - UNAUTHORIZED_ACCESS
   - SECURITY_VIOLATION

3. Connection Errors
   - CONNECTION_FAILED
   - CONNECTION_LOST
   - RECONNECTION_FAILED
   - HEARTBEAT_TIMEOUT

### Error Recovery
- Automatic reconnection with exponential backoff
- Message retry for transient failures
- State recovery after reconnection
- Diagnostic event emission

## Performance Optimization

### Connection Management
- Heartbeat monitoring (30s interval)
- Automatic reconnection
- Connection pooling
- Resource cleanup

### Message Processing
- Asynchronous message handling
- Message batching support
- Streaming response optimization
- Resource usage monitoring

## Monitoring and Metrics

### System Metrics
- CPU and memory usage
- Network I/O
- Message throughput
- Error rates

### Client Metrics
- Connection status
- Message latency
- Error counts
- Reconnection attempts

### Tool Metrics
- Execution time
- Success rate
- Resource usage
- Error distribution

## Best Practices

1. Connection Management
   - Always enable heartbeat monitoring
   - Implement reconnection logic
   - Handle connection state changes
   - Clean up resources properly

2. Error Handling
   - Implement proper error recovery
   - Log diagnostic messages
   - Monitor error rates
   - Handle reconnection gracefully

3. Security
   - Secure API key storage
   - Monitor rate limits
   - Handle security violations
   - Validate all messages

4. Performance
   - Enable message batching
   - Monitor resource usage
   - Optimize message size
   - Use streaming when appropriate

## Architecture

The MCP integration consists of several key components:

### 1. MCP Server (`services/api/mcp/server.py`)
- Core message handling and routing
- Tool registration and management
- Service integration
- Error handling
- Streaming response support

### 2. MCP Transport (`services/api/mcp/transport.py`)
- WebSocket transport layer
- Connection management
- Message validation
- Error recovery
- Metrics collection
- Connection metadata tracking

### 3. Tool Registry (`services/api/mcp/tools.py`)
- Dynamic tool registration
- Built-in system tools
- Performance metrics
- Workflow analysis
- Audio analysis
- System diagnostics

### 4. FastAPI Integration (`services/api/routers/mcp.py`)
- WebSocket endpoint
- Connection status endpoint
- API key authentication
- Error handling

## Available Tools

### System Performance (`system/performance`)
```json
{
  "name": "system/performance",
  "description": "Get detailed system performance metrics with historical data",
  "input_schema": {
    "metrics": ["cpu", "memory", "disk", "network"],
    "interval": 1,
    "history_minutes": 5
  }
}
```

### Workflow Analysis (`workflow/analyze`)
```json
{
  "name": "workflow/analyze",
  "description": "Analyze workflow execution patterns and performance",
  "input_schema": {
    "workflow_id": "string",
    "time_range": "1h",
    "include_metrics": true
  }
}
```

### Audio Analysis (`audio/analyze`)
```json
{
  "name": "audio/analyze",
  "description": "Analyze audio stream quality and performance",
  "input_schema": {
    "stream_id": "string",
    "metrics": ["quality", "latency", "errors"]
  }
}
```

### System Diagnostics (`system/diagnostics`)
```json
{
  "name": "system/diagnostics",
  "description": "Run system diagnostics and health checks",
  "input_schema": {
    "components": ["all", "system", "network", "services"],
    "level": "basic"
  }
}
```

## WebSocket Protocol

### Connection

1. Connect to `/api/mcp/ws` with API key in header
2. Receive welcome message with client ID
3. Begin sending/receiving messages

### Message Format

```json
{
  "id": "unique-message-id",
  "method": "tools/call",
  "params": {
    "name": "tool-name",
    "arguments": {}
  }
}
```

### Response Format

```json
{
  "id": "unique-message-id",
  "result": {}
}
```

### Error Format

```json
{
  "id": "unique-message-id",
  "error": {
    "code": "error-code",
    "message": "Error description"
  }
}
```

## Performance Considerations

1. Connection Management
   - Heartbeat monitoring
   - Automatic reconnection
   - Resource cleanup

2. Message Processing
   - Async/await throughout
   - Proper error handling
   - Resource pooling

3. Metrics Collection
   - Latency tracking
   - Error rate monitoring
   - Resource usage tracking

## Troubleshooting

Common issues and solutions:

1. Connection Failed
   - Verify API key is valid
   - Check network connectivity
   - Ensure server is running

2. Message Errors
   - Validate message format
   - Check tool name and parameters
   - Review error message details

3. Performance Issues
   - Monitor system resources
   - Check network latency
   - Review message patterns 