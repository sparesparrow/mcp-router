from typing import Dict, Any, Optional, AsyncIterator, List
import asyncio
import aiohttp
import json
import logging
from datetime import datetime, UTC
from urllib.parse import urljoin
import uuid

from .base import MCPTransport, MCPTransportConfig, MCPMessage

class HTTPTransportConfig(MCPTransportConfig):
    """Configuration for HTTP/SSE transport."""
    base_url: str = "http://localhost:8000"
    api_key: Optional[str] = None
    sse_retry_timeout: float = 3.0
    max_request_retries: int = 3
    request_retry_delay: float = 1.0
    verify_ssl: bool = True
    headers: Optional[Dict[str, str]] = None

class HTTPTransport(MCPTransport):
    """HTTP/SSE transport implementation for MCP protocol."""
    
    def __init__(self, config: Optional[HTTPTransportConfig] = None):
        super().__init__(config or HTTPTransportConfig())
        self._config: HTTPTransportConfig = self.config  # Type hint for specific config
        self._session: Optional[aiohttp.ClientSession] = None
        self._sse_task: Optional[asyncio.Task] = None
        self._pending_requests: Dict[str, asyncio.Future] = {}
        self._logger = logging.getLogger(__name__)
        self._message_queue: asyncio.Queue[MCPMessage] = asyncio.Queue()
    
    async def connect(self) -> None:
        """Establish HTTP transport connection and start SSE listener."""
        if self._connected:
            return
            
        try:
            # Create session with default headers
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            if self._config.api_key:
                headers["Authorization"] = f"Bearer {self._config.api_key}"
                
            if self._config.headers:
                headers.update(self._config.headers)
            
            self._session = aiohttp.ClientSession(
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=self._config.request_timeout)
            )
            
            # Start SSE listener
            self._sse_task = asyncio.create_task(self._listen_sse())
            
            self._connected = True
            self._stats.connected_since = datetime.now(UTC)
            
            self._logger.info(
                "http_transport_connected",
                base_url=self._config.base_url
            )
            
        except Exception as e:
            self._logger.error(
                "http_transport_connection_error",
                error=str(e),
                exc_info=True
            )
            await self.disconnect()
            raise
    
    async def disconnect(self) -> None:
        """Close HTTP transport connection."""
        if self._sse_task:
            self._sse_task.cancel()
            try:
                await self._sse_task
            except asyncio.CancelledError:
                pass
            self._sse_task = None
        
        if self._session:
            await self._session.close()
            self._session = None
        
        self._connected = False
        
        # Clear pending requests
        for future in self._pending_requests.values():
            if not future.done():
                future.cancel()
        self._pending_requests.clear()
        
        self._logger.info("http_transport_disconnected")
    
    async def send_request(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Send an HTTP request and wait for response."""
        if not self._connected or not self._session:
            raise RuntimeError("Transport not connected")
        
        message = MCPMessage(
            id=str(uuid.uuid4()),
            method=method,
            params=params
        )
        
        # Validate message size
        data = message.json()
        self._validate_message_size(data)
        
        # Create future for response
        response_future = asyncio.Future()
        self._pending_requests[message.id] = response_future
        
        try:
            # Send request with retries
            for attempt in range(self._config.max_request_retries):
                try:
                    async with self._session.post(
                        urljoin(self._config.base_url, "/api/mcp"),
                        json=message.dict(),
                        verify_ssl=self._config.verify_ssl
                    ) as response:
                        response.raise_for_status()
                        result = await response.json()
                        
                        # Update stats
                        self._stats.messages_sent += 1
                        self._stats.bytes_sent += len(data.encode())
                        
                        return result.get("result", {})
                        
                except aiohttp.ClientError as e:
                    if attempt == self._config.max_request_retries - 1:
                        raise
                    self._logger.warning(
                        "request_retry",
                        method=method,
                        attempt=attempt + 1,
                        error=str(e)
                    )
                    await asyncio.sleep(self._config.request_retry_delay)
                    
        except Exception as e:
            self._stats.errors += 1
            self._logger.error(
                "request_error",
                method=method,
                error=str(e),
                exc_info=True
            )
            raise
            
        finally:
            # Clean up pending request
            self._pending_requests.pop(message.id, None)
    
    async def send_notification(self, method: str, params: Dict[str, Any]) -> None:
        """Send an HTTP notification."""
        if not self._connected or not self._session:
            raise RuntimeError("Transport not connected")
        
        message = MCPMessage(
            method=method,
            params=params
        )
        
        # Validate message size
        data = message.json()
        self._validate_message_size(data)
        
        try:
            async with self._session.post(
                urljoin(self._config.base_url, "/api/mcp/notify"),
                json=message.dict(),
                verify_ssl=self._config.verify_ssl
            ) as response:
                response.raise_for_status()
                
                # Update stats
                self._stats.messages_sent += 1
                self._stats.bytes_sent += len(data.encode())
                
        except Exception as e:
            self._stats.errors += 1
            self._logger.error(
                "notification_error",
                method=method,
                error=str(e),
                exc_info=True
            )
            raise
    
    async def listen(self) -> AsyncIterator[MCPMessage]:
        """Listen for incoming messages from the message queue."""
        while True:
            try:
                message = await self._message_queue.get()
                yield message
            except asyncio.CancelledError:
                break
    
    async def _listen_sse(self) -> None:
        """Listen for SSE events."""
        while True:
            try:
                if not self._session:
                    raise RuntimeError("Session not initialized")
                
                async with self._session.get(
                    urljoin(self._config.base_url, "/api/mcp/events"),
                    headers={"Accept": "text/event-stream"},
                    verify_ssl=self._config.verify_ssl
                ) as response:
                    response.raise_for_status()
                    
                    # Process SSE stream
                    buffer = ""
                    async for line in response.content:
                        line = line.decode().strip()
                        
                        if not line:
                            # Empty line indicates end of event
                            if buffer:
                                await self._process_sse_event(buffer)
                                buffer = ""
                        elif line.startswith("data: "):
                            buffer += line[6:]
                            
            except asyncio.CancelledError:
                break
            except Exception as e:
                self._stats.errors += 1
                self._logger.error(
                    "sse_listener_error",
                    error=str(e),
                    exc_info=True
                )
                await asyncio.sleep(self._config.sse_retry_timeout)
    
    async def _process_sse_event(self, data: str) -> None:
        """Process an SSE event."""
        try:
            # Parse message
            message_data = json.loads(data)
            message = MCPMessage(**message_data)
            
            # Update stats
            self._stats.messages_received += 1
            self._stats.bytes_received += len(data.encode())
            
            # Handle message
            if message.id in self._pending_requests:
                # This is a response to a pending request
                future = self._pending_requests.pop(message.id)
                if message.error:
                    future.set_exception(Exception(message.error.get("message", "Unknown error")))
                else:
                    future.set_result(message.result or {})
            else:
                # This is an incoming message/notification
                response = await self._handle_message(message)
                if response:
                    # Send response if needed
                    await self.send_notification("response", response.dict())
            
        except Exception as e:
            self._stats.errors += 1
            self._logger.error(
                "sse_event_processing_error",
                data=data,
                error=str(e),
                exc_info=True
            )
    
    def __del__(self):
        """Ensure resources are cleaned up."""
        if self._connected:
            asyncio.create_task(self.disconnect()) 