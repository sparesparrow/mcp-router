from typing import Dict, Any, Optional, AsyncIterator, List
import asyncio
import json
import logging
import sys
from datetime import datetime, UTC
import uuid

from .base import MCPTransport, MCPTransportConfig, MCPMessage

class StdioTransportConfig(MCPTransportConfig):
    """Configuration for stdio transport."""
    input_buffer_size: int = 65536
    output_buffer_size: int = 65536
    input_encoding: str = "utf-8"
    output_encoding: str = "utf-8"
    newline: str = "\n"

class StdioTransport(MCPTransport):
    """Stdio transport implementation for MCP protocol."""
    
    def __init__(self, config: Optional[StdioTransportConfig] = None):
        super().__init__(config or StdioTransportConfig())
        self._config: StdioTransportConfig = self.config  # Type hint for specific config
        self._reader: Optional[asyncio.StreamReader] = None
        self._writer: Optional[asyncio.StreamWriter] = None
        self._read_task: Optional[asyncio.Task] = None
        self._pending_requests: Dict[str, asyncio.Future] = {}
        self._logger = logging.getLogger(__name__)
        self._message_queue: asyncio.Queue[MCPMessage] = asyncio.Queue()
    
    async def connect(self) -> None:
        """Set up stdio transport."""
        if self._connected:
            return
            
        try:
            # Set up stdin reader
            loop = asyncio.get_event_loop()
            reader = asyncio.StreamReader(
                limit=self._config.input_buffer_size,
                loop=loop
            )
            protocol = asyncio.StreamReaderProtocol(reader, loop=loop)
            await loop.connect_read_pipe(lambda: protocol, sys.stdin)
            self._reader = reader
            
            # Set up stdout writer
            transport, protocol = await loop.connect_write_pipe(
                asyncio.streams.FlowControlMixin,
                sys.stdout.buffer
            )
            writer = asyncio.StreamWriter(
                transport,
                protocol,
                reader,
                loop
            )
            self._writer = writer
            
            # Start read loop
            self._read_task = asyncio.create_task(self._read_loop())
            
            self._connected = True
            self._stats.connected_since = datetime.now(UTC)
            
            self._logger.info("stdio_transport_connected")
            
        except Exception as e:
            self._logger.error(
                "stdio_transport_connection_error",
                error=str(e),
                exc_info=True
            )
            await self.disconnect()
            raise
    
    async def disconnect(self) -> None:
        """Clean up stdio transport."""
        if self._read_task:
            self._read_task.cancel()
            try:
                await self._read_task
            except asyncio.CancelledError:
                pass
            self._read_task = None
        
        if self._writer:
            self._writer.close()
            await self._writer.wait_closed()
            self._writer = None
            
        self._reader = None
        self._connected = False
        
        # Clear pending requests
        for future in self._pending_requests.values():
            if not future.done():
                future.cancel()
        self._pending_requests.clear()
        
        self._logger.info("stdio_transport_disconnected")
    
    async def send_request(self, method: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Send a request message via stdio and wait for response."""
        if not self._connected or not self._writer:
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
            # Send message
            data_bytes = (data + self._config.newline).encode(self._config.output_encoding)
            self._writer.write(data_bytes)
            await self._writer.drain()
            
            # Update stats
            self._stats.messages_sent += 1
            self._stats.bytes_sent += len(data_bytes)
            
            # Wait for response
            return await response_future
            
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
        """Send a notification message via stdio."""
        if not self._connected or not self._writer:
            raise RuntimeError("Transport not connected")
        
        message = MCPMessage(
            method=method,
            params=params
        )
        
        # Validate message size
        data = message.json()
        self._validate_message_size(data)
        
        try:
            # Send message
            data_bytes = (data + self._config.newline).encode(self._config.output_encoding)
            self._writer.write(data_bytes)
            await self._writer.drain()
            
            # Update stats
            self._stats.messages_sent += 1
            self._stats.bytes_sent += len(data_bytes)
            
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
    
    async def _read_loop(self) -> None:
        """Read and process messages from stdin."""
        while True:
            try:
                if not self._reader:
                    raise RuntimeError("Reader not initialized")
                
                # Read line from stdin
                line = await self._reader.readline()
                if not line:  # EOF
                    break
                    
                data = line.decode(self._config.input_encoding).strip()
                if not data:
                    continue
                    
                # Process message
                await self._process_message(data)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                self._stats.errors += 1
                self._logger.error(
                    "read_loop_error",
                    error=str(e),
                    exc_info=True
                )
    
    async def _process_message(self, data: str) -> None:
        """Process an incoming message."""
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
                "message_processing_error",
                data=data,
                error=str(e),
                exc_info=True
            )
    
    def __del__(self):
        """Ensure resources are cleaned up."""
        if self._connected:
            asyncio.create_task(self.disconnect()) 