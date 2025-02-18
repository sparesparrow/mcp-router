---
description: Standards for implementing Model Context Protocol (MCP) servers in Python
globs: ["backend/**/*.py"]
priority: 25
dependencies: []
---

# Python MCP Server Implementation Standards

## Core Principles

### Protocol Compliance
- Implement MCP specification correctly
- Handle all required message types
- Maintain proper state management
- Follow async/await patterns

### Architecture
- Use clean architecture principles
- Implement proper dependency injection
- Follow SOLID principles
- Maintain clear separation of concerns

### Code Style
- Follow PEP 8 guidelines
- Use type hints consistently
- Document with docstrings
- Maintain consistent naming conventions

## Implementation Standards

### Server Structure
```python
# Good: Proper MCP server structure
class MCPServer:
    def __init__(self, config: ServerConfig):
        self.clients: Dict[str, Client] = {}
        self.tools: Dict[str, Tool] = {}
        self.config = config
        self.logger = setup_logger(__name__)

    async def handle_message(self, message: Message, client: Client) -> None:
        try:
            handler = self.get_message_handler(message.method)
            await handler(message, client)
        except MCPError as e:
            await client.send_error(message.id, e)
        except Exception as e:
            self.logger.error(f"Internal error: {e}")
            await client.send_error(
                message.id, 
                MCPError("internal_error", str(e))
            )

# Bad: Poor structure
class BadServer:
    def handle(self, msg): # ❌ No type hints
        if msg.type == "tool":
            self.handle_tool(msg) # ❌ No error handling
```

### Message Handling
```python
# Good: Type-safe message handling
@dataclass
class Message:
    id: str
    method: str
    params: Dict[str, Any]
    
class MessageHandler:
    async def handle_tools_list(
        self, 
        message: Message, 
        client: Client
    ) -> None:
        tools = await self.tools_registry.list_tools()
        await client.send_response(message.id, tools)

    async def handle_tool_call(
        self, 
        message: Message, 
        client: Client
    ) -> None:
        tool = self.tools_registry.get_tool(message.params["tool_id"])
        result = await tool.execute(message.params["args"])
        await client.send_response(message.id, result)

# Bad: Unsafe handling
def bad_handle(msg, client): # ❌ Missing type hints
    if msg["type"] == "tool":
        result = run_tool(msg["args"]) # ❌ No error handling
        client.send(result)
```

### Client Management
```python
# Good: Proper client handling
class ClientManager:
    def __init__(self):
        self._clients: Dict[str, Client] = {}
        self._lock = asyncio.Lock()

    async def add_client(self, client: Client) -> None:
        async with self._lock:
            self._clients[client.id] = client
            
    async def remove_client(self, client_id: str) -> None:
        async with self._lock:
            if client_id in self._clients:
                await self._clients[client_id].close()
                del self._clients[client_id]

# Bad: Unsafe client management
class BadManager:
    def add(self, client): # ❌ No type safety
        self.clients[client.id] = client # ❌ No synchronization
```

## Testing Requirements

### Unit Tests
```python
# Good: Comprehensive test coverage
class TestMCPServer(unittest.TestCase):
    async def setUp(self):
        self.server = MCPServer(test_config)
        self.client = MockClient()
        
    async def test_tool_call(self):
        message = Message(
            id="test1",
            method="tools/call",
            params={"tool_id": "test_tool", "args": {}}
        )
        await self.server.handle_message(message, self.client)
        self.assertTrue(self.client.last_response.success)

# Bad: Insufficient testing
def test_server(): # ❌ No async support
    server = Server()
    assert server.running # ❌ Shallow testing
```

## Security Standards

### Authentication
```python
# Good: Proper authentication
class AuthenticatedClient(Client):
    def __init__(self, transport: Transport, auth_token: str):
        self.transport = transport
        self.auth_token = auth_token
        
    async def authenticate(self) -> bool:
        try:
            result = await self.auth_service.verify_token(self.auth_token)
            return result.is_valid
        except AuthError as e:
            self.logger.error(f"Authentication failed: {e}")
            return False

# Bad: Insecure implementation
class BadClient:
    def auth(self, token): # ❌ No async
        return token == "secret" # ❌ Hardcoded secret
```

### Input Validation
```python
# Good: Proper validation
class MessageValidator:
    def validate_message(self, message: Dict[str, Any]) -> Message:
        if not isinstance(message, dict):
            raise ValidationError("Message must be a dictionary")
            
        required_fields = {"id", "method", "params"}
        if not all(field in message for field in required_fields):
            raise ValidationError("Missing required fields")
            
        return Message(**message)

# Bad: No validation
def process_message(msg): # ❌ No validation
    return handle_method(msg["method"]) # ❌ Unsafe access
```

## Performance Guidelines

### Async Operations
```python
# Good: Efficient async handling
class AsyncToolExecutor:
    async def execute_tool(self, tool: Tool, args: Dict[str, Any]) -> Result:
        async with self.semaphore:
            try:
                return await tool.execute(args)
            except ToolError as e:
                self.logger.error(f"Tool execution failed: {e}")
                raise

# Bad: Blocking operations
def run_tool(tool, args): # ❌ Blocking
    return tool.execute(args) # ❌ No concurrency control
```

### Resource Management
```python
# Good: Proper resource handling
class ResourceManager:
    def __init__(self, max_connections: int = 100):
        self._semaphore = asyncio.Semaphore(max_connections)
        self._resources: Set[str] = set()
        
    async def acquire(self, resource_id: str) -> bool:
        async with self._semaphore:
            if resource_id in self._resources:
                return False
            self._resources.add(resource_id)
            return True
            
    async def release(self, resource_id: str) -> None:
        self._resources.remove(resource_id)

# Bad: Poor resource management
class BadManager:
    def use_resource(self): # ❌ No limits
        self.resources += 1 # ❌ No cleanup
```

## Documentation Requirements

### Code Documentation
```python
# Good: Proper documentation
class MCPServer:
    """Model Context Protocol server implementation.
    
    Handles client connections, message routing, and tool execution
    according to the MCP specification.
    
    Args:
        config: Server configuration parameters
        
    Attributes:
        clients: Dictionary of connected clients
        tools: Available tool implementations
    """
    
    async def handle_message(
        self, 
        message: Message,
        client: Client
    ) -> None:
        """Handle incoming MCP message.
        
        Args:
            message: Incoming MCP message
            client: Client that sent the message
            
        Raises:
            MCPError: If message handling fails
        """
        pass

# Bad: Poor documentation
class Server: # ❌ No docstring
    def handle(self, msg, client): # ❌ No documentation
        pass
```

## Logging Standards

### Structured Logging
```python
# Good: Proper logging
import structlog

logger = structlog.get_logger()

class MCPServer:
    def __init__(self):
        self.logger = structlog.get_logger()
        
    async def handle_message(self, message: Message, client: Client):
        self.logger.info(
            "handling_message",
            message_id=message.id,
            method=message.method,
            client_id=client.id
        )
        try:
            await self._handle_message(message, client)
        except Exception as e:
            self.logger.error(
                "message_handling_failed",
                error=str(e),
                message_id=message.id,
                exc_info=True
            )

# Bad: Poor logging
def handle(msg): # ❌ Unstructured logging
    print(f"Got message: {msg}") # ❌ Using print
```

## Configuration Management

### Environment Variables
```python
# Good: Proper config management
from pydantic import BaseSettings

class ServerConfig(BaseSettings):
    host: str = "localhost"
    port: int = 8080
    max_clients: int = 100
    log_level: str = "INFO"
    
    class Config:
        env_prefix = "MCP_"

# Bad: Hard-coded config
class BadConfig: # ❌ Hard-coded values
    HOST = "localhost"
    PORT = 8080
```

## Error Handling

### Custom Exceptions
```python
# Good: Proper error hierarchy
class MCPError(Exception):
    """Base class for MCP-related errors."""
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)

class ToolError(MCPError):
    """Raised when tool execution fails."""
    pass

class ValidationError(MCPError):
    """Raised when message validation fails."""
    pass

# Bad: Generic errors
def process(msg):
    if not msg:
        raise Exception("Invalid") # ❌ Generic exception
```

## Monitoring and Metrics

### Metrics Collection
```python
# Good: Proper metrics
from prometheus_client import Counter, Histogram

class MetricsCollector:
    def __init__(self):
        self.message_counter = Counter(
            "mcp_messages_total",
            "Total messages processed",
            ["method", "status"]
        )
        self.processing_time = Histogram(
            "mcp_processing_seconds",
            "Message processing time in seconds",
            ["method"]
        )

# Bad: No metrics
class Server: # ❌ No monitoring
    def handle(self, msg):
        process(msg) # ❌ No metrics
``` 