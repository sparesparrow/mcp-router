from typing import Dict, Any, Optional, AsyncIterator, Protocol, Callable, List
import asyncio
import json
from abc import ABC, abstractmethod
from datetime import datetime, UTC
from pydantic import BaseModel, Field

class MCPMessage(BaseModel):
    """Base model for MCP protocol messages."""
    jsonrpc: str = "2.0"
    id: Optional[str] = None
    method: str
    params: Optional[Dict[str, Any]] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None
    
    class Config:
        extra = "allow"

class MCPError(BaseModel):
    """Error information for MCP messages."""
    code: int
    message: str
    data: Optional[Dict[str, Any]] = None

class MCPTransportStats(BaseModel):
    """Statistics for MCP transport layer."""
    messages_sent: int = 0
    messages_received: int = 0
    bytes_sent: int = 0
    bytes_received: int = 0
    errors: int = 0
    connected_since: Optional[datetime] = None

class MCPTransportConfig(BaseModel):
    """Configuration for MCP transport layer."""
    max_message_size: int = 1024 * 1024  # 1MB
    compression_enabled: bool = True
    keep_alive_interval: float = 30.0
    request_timeout: float = 30.0
    max_retries: int = 3
    retry_delay: float = 1.0
    
    class Config:
        extra = "allow"

class MCPTransport(ABC):
    """Base class for MCP transport implementations."""
    
    def __init__(self, config: MCPTransportConfig):
        self.config = config
        self._connected = False
        self._stats = MCPTransportStats()
        self._message_handlers: Dict[str, Callable] = {}
        self._pending_requests: Dict[str, asyncio.Future] = {}
        self._keep_alive_task: Optional[asyncio.Task] = None
    
    @property
    def connected(self) -> bool:
        """Return connection status."""
        return self._connected
    
    @property
    def stats(self) -> MCPTransportStats:
        """Return transport statistics."""
        return self._stats
    
    def register_handler(self, method: str, handler: Callable) -> None:
        """Register a handler for a specific message method."""
        self._message_handlers[method] = handler
    
    def unregister_handler(self, method: str) -> None:
        """Unregister a message handler."""
        self._message_handlers.pop(method, None)
    
    def _validate_message_size(self, data: str) -> None:
        """Validate message size against configured limit."""
        if len(data.encode()) > self.config.max_message_size:
            raise ValueError(f"Message size exceeds limit of {self.config.max_message_size} bytes")
    
    async def _handle_message(self, message: MCPMessage) -> Optional[MCPMessage]:
        """Handle an incoming message.
        
        Dispatches the message to the appropriate handler if registered.
        Returns a response message if needed, or None if no response is required.
        """
        try:
            if message.method in self._message_handlers:
                handler = self._message_handlers[message.method]
                result = await handler(message.params or {})
                if message.id is not None:  # Request needs response
                    return MCPMessage(
                        id=message.id,
                        result=result
                    )
            return None
            
        except Exception as e:
            if message.id is not None:  # Send error response for requests
                return MCPMessage(
                    id=message.id,
                    error=MCPError(
                        code=-32000,
                        message=str(e),
                        data={"type": type(e).__name__}
                    )
                )
            return None
    
    async def _keep_alive_loop(self) -> None:
        """Send periodic keep-alive messages."""
        while True:
            try:
                await asyncio.sleep(self.config.keep_alive_interval)
                if self._connected:
                    await self.send_notification("ping", {})
            except asyncio.CancelledError:
                break
            except Exception:
                # Keep-alive errors shouldn't crash the transport
                pass
    
    @abstractmethod
    async def connect(self) -> None:
        """Establish transport connection."""
        raise NotImplementedError
    
    @abstractmethod
    async def disconnect(self) -> None:
        """Close transport connection."""
        raise NotImplementedError
    
    @abstractmethod
    async def send_request(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Send a request message and wait for response."""
        raise NotImplementedError
    
    @abstractmethod
    async def send_notification(self, method: str, params: Dict[str, Any]) -> None:
        """Send a notification message."""
        raise NotImplementedError
    
    @abstractmethod
    async def listen(self) -> AsyncIterator[MCPMessage]:
        """Listen for incoming messages."""
        raise NotImplementedError 