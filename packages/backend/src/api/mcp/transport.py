import logging
from typing import Dict, Any, Optional, List, AsyncGenerator, Protocol
import asyncio
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
import json
from fastapi import WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import uuid

from .server import MCPServer, Message, MCPError
from ..managers.metrics_collector import MetricsCollector
from ..services.protocol_monitoring import ProtocolMonitoringService

logger = logging.getLogger(__name__)

class TransportError(Exception):
    """Base class for transport-related errors."""
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)

class ConnectionError(TransportError):
    """Raised when connection fails."""
    pass

class MessageError(TransportError):
    """Raised when message handling fails."""
    pass

class Transport(Protocol):
    """Protocol for transport implementations."""
    
    @abstractmethod
    async def start(self) -> None:
        """Start the transport."""
        pass
    
    @abstractmethod
    async def stop(self) -> None:
        """Stop the transport."""
        pass
    
    @abstractmethod
    async def send_message(self, connection_id: str, message: Dict[str, Any]) -> None:
        """Send a message to a specific connection."""
        pass
    
    @abstractmethod
    async def broadcast_message(self, message: Dict[str, Any]) -> None:
        """Broadcast a message to all connections."""
        pass

class WebSocketConnection(BaseModel):
    """WebSocket connection model."""
    id: str
    websocket: WebSocket
    connected_at: datetime
    client_info: Dict[str, Any]
    messages_sent: int = 0
    messages_received: int = 0
    errors: int = 0

class WebSocketTransport:
    """WebSocket transport implementation."""
    
    def __init__(self, server: MCPServer):
        self.server = server
        self.active_connections: Dict[str, WebSocketConnection] = {}
        
    async def connect(self, websocket: WebSocket, client_info: Dict[str, Any]) -> str:
        """Handle new WebSocket connection."""
        try:
            await websocket.accept()
            
            connection_id = f"ws_{datetime.utcnow().timestamp()}"
            connection = WebSocketConnection(
                id=connection_id,
                websocket=websocket,
                connected_at=datetime.utcnow(),
                client_info=client_info
            )
            
            self.active_connections[connection_id] = connection
            await self.server.transport_manager.add_connection(
                connection_id,
                {
                    "type": "websocket",
                    "client_info": client_info,
                    "connected_at": connection.connected_at
                }
            )
            
            logger.info(f"New WebSocket connection: {connection_id}")
            return connection_id
            
        except Exception as e:
            logger.error(f"WebSocket connection failed: {str(e)}")
            raise ConnectionError("connection_failed", str(e))
            
    async def disconnect(self, connection_id: str) -> None:
        """Handle WebSocket disconnection."""
        if connection_id in self.active_connections:
            connection = self.active_connections[connection_id]
            try:
                await connection.websocket.close()
            except Exception:
                pass
            
            del self.active_connections[connection_id]
            await self.server.transport_manager.remove_connection(connection_id)
            logger.info(f"WebSocket connection closed: {connection_id}")
            
    async def handle_message(self, connection_id: str, data: str) -> None:
        """Handle incoming WebSocket message."""
        if connection_id not in self.active_connections:
            raise ConnectionError("invalid_connection", "Connection not found")
            
        connection = self.active_connections[connection_id]
        connection.messages_received += 1
        
        try:
            message_data = json.loads(data)
            message = Message(**message_data)
            
            response = await self.server.handle_message(message, connection_id)
            
            if isinstance(response.get("result"), AsyncGenerator):
                # Handle streaming response
                async for chunk in response["result"]:
                    await self.send_message(connection_id, {
                        "id": message.id,
                        "type": "chunk",
                        "content": chunk
                    })
                await self.send_message(connection_id, {
                    "id": message.id,
                    "type": "complete"
                })
            else:
                # Handle regular response
                await self.send_message(connection_id, {
                    "id": message.id,
                    **response
                })
                
        except json.JSONDecodeError:
            connection.errors += 1
            await self.send_message(connection_id, {
                "error": {
                    "code": "invalid_json",
                    "message": "Invalid JSON message"
                }
            })
        except Exception as e:
            connection.errors += 1
            logger.error(f"Error handling message: {str(e)}")
            await self.send_message(connection_id, {
                "error": {
                    "code": "message_error",
                    "message": str(e)
                }
            })
            
    async def send_message(self, connection_id: str, message: Dict[str, Any]) -> None:
        """Send message to specific WebSocket connection."""
        if connection_id not in self.active_connections:
            raise ConnectionError("invalid_connection", "Connection not found")
            
        connection = self.active_connections[connection_id]
        try:
            await connection.websocket.send_json(message)
            connection.messages_sent += 1
        except Exception as e:
            connection.errors += 1
            logger.error(f"Error sending message: {str(e)}")
            raise MessageError("send_failed", str(e))
            
    async def broadcast_message(self, message: Dict[str, Any]) -> None:
        """Broadcast message to all WebSocket connections."""
        for connection_id in list(self.active_connections.keys()):
            try:
                await self.send_message(connection_id, message)
            except Exception as e:
                logger.error(f"Error broadcasting to {connection_id}: {str(e)}")
                
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get statistics about WebSocket connections."""
        return {
            "active_connections": len(self.active_connections),
            "connections": [
                {
                    "id": conn.id,
                    "connected_at": conn.connected_at.isoformat(),
                    "messages_sent": conn.messages_sent,
                    "messages_received": conn.messages_received,
                    "errors": conn.errors,
                    "client_info": conn.client_info
                }
                for conn in self.active_connections.values()
            ]
        }

class MCPTransport:
    """WebSocket transport for MCP communication."""
    
    def __init__(self, server: MCPServer, metrics: MetricsCollector):
        self.server = server
        self.metrics = metrics
        self._active_connections: Dict[str, WebSocket] = {}
        self._connection_metadata: Dict[str, Any] = {}
        self._heartbeat_task: Optional[asyncio.Task] = None
        self._heartbeat_interval = 30  # seconds
        self._protocol_diagnostics: Dict[str, Any] = {
            "message_counts": {"sent": 0, "received": 0},
            "errors": [],
            "protocol_violations": [],
            "performance_metrics": {}
        }
        self._monitoring_service = ProtocolMonitoringService()
        logger.info("Initialized MCP transport")

    async def initialize(self) -> None:
        """Initialize the transport."""
        try:
            self._heartbeat_task = asyncio.create_task(self._heartbeat_monitor())
            await self._monitoring_service.start()
            logger.info("MCP transport initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize MCP transport: {str(e)}")
            raise

    async def cleanup(self) -> None:
        """Clean up resources."""
        try:
            if self._heartbeat_task:
                self._heartbeat_task.cancel()
                try:
                    await self._heartbeat_task
                except asyncio.CancelledError:
                    pass
                self._heartbeat_task = None

            await self._monitoring_service.stop()

            # Close all active connections
            for client_id, websocket in self._active_connections.items():
                try:
                    await websocket.close()
                except Exception as e:
                    logger.error(f"Error closing connection {client_id}: {str(e)}")

            self._active_connections.clear()
            self._connection_metadata.clear()
            logger.info("MCP transport cleaned up")
        except Exception as e:
            logger.error(f"Error during MCP transport cleanup: {str(e)}")
            raise

    async def _record_protocol_violation(self, violation_type: str, details: Dict[str, Any]) -> None:
        """Record protocol violation for diagnostics."""
        violation = {
            "timestamp": datetime.utcnow().isoformat(),
            "type": violation_type,
            "details": details
        }
        self._protocol_diagnostics["protocol_violations"].append(violation)
        await self.metrics.increment_counter("protocol_violations", {"type": violation_type})
        await self._monitoring_service.monitor.record_violation(violation_type)
        logger.warning(f"Protocol violation: {violation_type}", extra=details)

    async def _validate_message_rate(self, client_id: str) -> bool:
        """Validate message rate for DoS protection."""
        metadata = self._connection_metadata.get(client_id, {})
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(seconds=60)
        
        # Clean up old message timestamps
        message_timestamps = metadata.get("message_timestamps", [])
        message_timestamps = [ts for ts in message_timestamps if ts > window_start]
        
        # Check rate limit (100 messages per minute)
        if len(message_timestamps) >= 100:
            await self._record_protocol_violation("rate_limit_exceeded", {
                "client_id": client_id,
                "message_count": len(message_timestamps),
                "window_seconds": 60
            })
            return False
            
        # Update timestamps
        message_timestamps.append(current_time)
        metadata["message_timestamps"] = message_timestamps
        self._connection_metadata[client_id] = metadata
        return True

    async def handle_connection(self, websocket: WebSocket) -> None:
        """Handle new WebSocket connection with enhanced security."""
        try:
            client_id = str(uuid.uuid4())
            await websocket.accept()
            
            # Initialize connection metadata
            self._connection_metadata[client_id] = {
                "connected_at": datetime.utcnow(),
                "message_timestamps": [],
                "last_heartbeat": datetime.utcnow(),
                "security_violations": 0
            }
            
            self._active_connections[client_id] = websocket
            
            # Update connection count in monitoring
            await self._monitoring_service.monitor.update_connection_count(
                len(self._active_connections)
            )
            
            # Send welcome message with protocol version and features
            await self._send_message(websocket, {
                "type": "welcome",
                "client_id": client_id,
                "protocol_version": "2.0",
                "features": ["streaming", "heartbeat", "diagnostics"]
            })
            
            while True:
                try:
                    message = await websocket.receive_json()
                    start_time = datetime.utcnow()
                    
                    # Validate message rate
                    if not await self._validate_message_rate(client_id):
                        await self._send_error(
                            websocket,
                            "RATE_LIMIT_EXCEEDED",
                            "Too many messages in short time period"
                        )
                        continue
                    
                    # Process message
                    await self._process_message(client_id, websocket, message)
                    
                    # Record message metrics
                    end_time = datetime.utcnow()
                    latency_ms = (end_time - start_time).total_seconds() * 1000
                    await self._monitoring_service.monitor.record_message(
                        message.get("message_type", "unknown"),
                        message.get("protocol_version", "unknown"),
                        latency_ms
                    )
                    
                except WebSocketDisconnect:
                    break
                except json.JSONDecodeError:
                    await self._record_protocol_violation("invalid_json", {
                        "client_id": client_id
                    })
                    await self._monitoring_service.monitor.record_error("invalid_json")
                    await self._send_error(
                        websocket,
                        "INVALID_JSON",
                        "Invalid JSON message format"
                    )
                except Exception as e:
                    logger.error(f"Error processing message: {str(e)}")
                    await self._monitoring_service.monitor.record_error("processing_error")
                    await self._send_error(
                        websocket,
                        "INTERNAL_ERROR",
                        "Internal server error"
                    )
                    
        finally:
            if client_id in self._active_connections:
                del self._active_connections[client_id]
            if client_id in self._connection_metadata:
                del self._connection_metadata[client_id]
            await self._monitoring_service.monitor.update_connection_count(
                len(self._active_connections)
            )

    def get_monitoring_report(self) -> Dict[str, Any]:
        """Get comprehensive monitoring report."""
        return self._monitoring_service.get_monitoring_report()

    def get_diagnostics_report(self) -> Dict[str, Any]:
        """Get comprehensive protocol diagnostics report."""
        return {
            "message_counts": self._protocol_diagnostics["message_counts"],
            "protocol_violations": self._protocol_diagnostics["protocol_violations"][-100:],  # Last 100 violations
            "active_connections": len(self._active_connections),
            "performance_metrics": self.metrics.get_metrics(),
            "error_summary": self._get_error_summary()
        }

    def _get_error_summary(self) -> Dict[str, Any]:
        """Generate error summary from protocol diagnostics."""
        error_counts: Dict[str, int] = {}
        for violation in self._protocol_diagnostics["protocol_violations"]:
            error_type = violation["type"]
            error_counts[error_type] = error_counts.get(error_type, 0) + 1
        return {
            "total_violations": len(self._protocol_diagnostics["protocol_violations"]),
            "violation_types": error_counts
        }

    async def _send_message(self, websocket: WebSocket, message: Dict[str, Any]) -> None:
        """Send message to client."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending message: {str(e)}")
            raise

    async def _send_error(self,
        websocket: WebSocket,
        code: str,
        message: str,
        message_id: Optional[str] = None
    ) -> None:
        """Send error message to client."""
        error_message = {
            "error": {
                "code": code,
                "message": message
            }
        }
        if message_id:
            error_message["id"] = message_id
            
        await self._send_message(websocket, error_message)

    async def _heartbeat_monitor(self) -> None:
        """Monitor connection heartbeats."""
        while True:
            try:
                await asyncio.sleep(self._heartbeat_interval)
                current_time = datetime.utcnow()
                
                # Check all connections
                for client_id, websocket in list(self._active_connections.items()):
                    try:
                        # Send heartbeat
                        await self._send_message(websocket, {
                            "type": "heartbeat",
                            "server_time": current_time.isoformat()
                        })
                        
                        # Update metadata
                        if client_id in self._connection_metadata:
                            self._connection_metadata[client_id]["last_heartbeat"] = current_time.isoformat()
                            
                    except Exception as e:
                        logger.error(f"Heartbeat failed for {client_id}: {str(e)}")
                        # Remove failed connection
                        self._active_connections.pop(client_id, None)
                        self._connection_metadata.pop(client_id, None)
                        
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in heartbeat monitor: {str(e)}")

    def get_connection_info(self) -> Dict[str, Any]:
        """Get information about active connections."""
        return {
            "active_connections": len(self._active_connections),
            "connections": [
                {
                    "client_id": client_id,
                    **metadata
                }
                for client_id, metadata in self._connection_metadata.items()
            ]
        } 