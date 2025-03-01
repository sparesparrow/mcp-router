from typing import Dict, Any, Optional, List, Union
from datetime import datetime, timedelta
import asyncio
import logging
from enum import Enum

from .errors import ProtocolError, ValidationError
from .transport import WebSocketTransport
from .security import SecurityManager
from .metrics import MetricsCollector
from .monitoring import MonitoringService

logger = logging.getLogger(__name__)

class ProtocolVersion(str, Enum):
    V1_0 = "1.0"
    V2_0 = "2.0"  # Latest version with enhanced diagnostics

class ProtocolDiagnostics:
    def __init__(self):
        self.start_time = datetime.utcnow()
        self.message_counts: Dict[str, int] = {}
        self.error_counts: Dict[str, int] = {}
        self.protocol_violations: List[Dict[str, Any]] = []
        self.performance_metrics: Dict[str, float] = {}
        self.active_connections = 0
        self.total_connections = 0
        
    def record_message(self, message_type: str):
        self.message_counts[message_type] = self.message_counts.get(message_type, 0) + 1
        
    def record_error(self, error_type: str):
        self.error_counts[error_type] = self.error_counts.get(error_type, 0) + 1
        
    def record_violation(self, violation: Dict[str, Any]):
        self.protocol_violations.append({
            **violation,
            "timestamp": datetime.utcnow().isoformat()
        })
        
    def update_metrics(self, metric_name: str, value: float):
        self.performance_metrics[metric_name] = value
        
    def get_report(self) -> Dict[str, Any]:
        uptime = datetime.utcnow() - self.start_time
        return {
            "uptime_seconds": uptime.total_seconds(),
            "message_stats": self.message_counts,
            "error_stats": self.error_counts,
            "violations": self.protocol_violations[-100:],  # Last 100 violations
            "performance": self.performance_metrics,
            "connections": {
                "active": self.active_connections,
                "total": self.total_connections
            }
        }

class MCPServer:
    def __init__(self, 
                 transport: WebSocketTransport,
                 security_manager: SecurityManager,
                 metrics_collector: MetricsCollector,
                 monitoring_service: MonitoringService):
        self.transport = transport
        self.security = security_manager
        self.metrics = metrics_collector
        self.monitoring = monitoring_service
        self.diagnostics = ProtocolDiagnostics()
        self._cleanup_task: Optional[asyncio.Task] = None
        self._heartbeat_task: Optional[asyncio.Task] = None
        
    async def start(self):
        """Start the MCP server and initialize background tasks."""
        logger.info("Starting MCP server...")
        self._cleanup_task = asyncio.create_task(self._periodic_cleanup())
        self._heartbeat_task = asyncio.create_task(self._heartbeat_monitor())
        await self.transport.start()
        
    async def stop(self):
        """Stop the MCP server and cleanup resources."""
        logger.info("Stopping MCP server...")
        if self._cleanup_task:
            self._cleanup_task.cancel()
        if self._heartbeat_task:
            self._heartbeat_task.cancel()
        await self.transport.stop()
        
    async def handle_message(self, message: Dict[str, Any], connection_id: str) -> Dict[str, Any]:
        """Handle incoming MCP messages with protocol validation and diagnostics."""
        start_time = datetime.utcnow()
        
        try:
            # Validate protocol version
            version = message.get("version", ProtocolVersion.V1_0)
            if version not in ProtocolVersion.__members__.values():
                raise ProtocolError(f"Unsupported protocol version: {version}")
            
            # Security checks
            await self.security.validate_message(message, connection_id)
            
            # Record message for diagnostics
            self.diagnostics.record_message(message.get("type", "unknown"))
            
            # Process message based on type
            response = await self._process_message(message, connection_id)
            
            # Update performance metrics
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            self.diagnostics.update_metrics(f"processing_time_{message.get('type')}", processing_time)
            
            return response
            
        except ProtocolError as e:
            self.diagnostics.record_error("protocol_error")
            self.diagnostics.record_violation({
                "type": "protocol_error",
                "message": str(e),
                "connection_id": connection_id
            })
            raise
        except ValidationError as e:
            self.diagnostics.record_error("validation_error")
            raise
        except Exception as e:
            self.diagnostics.record_error("internal_error")
            logger.exception("Error processing message")
            raise
            
    async def _process_message(self, message: Dict[str, Any], connection_id: str) -> Dict[str, Any]:
        """Process different types of MCP messages."""
        message_type = message.get("type")
        
        if message_type == "handshake":
            return await self._handle_handshake(message, connection_id)
        elif message_type == "request":
            return await self._handle_request(message, connection_id)
        elif message_type == "event":
            return await self._handle_event(message, connection_id)
        elif message_type == "diagnostic":
            return await self._handle_diagnostic(message, connection_id)
        elif message_type == "heartbeat":
            return await self._handle_heartbeat(message, connection_id)
        else:
            raise ProtocolError(f"Unknown message type: {message_type}")
            
    async def _handle_handshake(self, message: Dict[str, Any], connection_id: str) -> Dict[str, Any]:
        """Handle client handshake messages."""
        self.diagnostics.total_connections += 1
        self.diagnostics.active_connections += 1
        
        capabilities = message.get("capabilities", {})
        client_version = message.get("version")
        
        return {
            "type": "handshake_response",
            "version": ProtocolVersion.V2_0,
            "session_id": connection_id,
            "server_capabilities": {
                "protocol_versions": list(ProtocolVersion.__members__.values()),
                "features": [
                    "diagnostics",
                    "heartbeat",
                    "streaming",
                    "compression"
                ]
            }
        }
        
    async def _handle_request(self, message: Dict[str, Any], connection_id: str) -> Dict[str, Any]:
        """Handle client request messages."""
        method = message.get("method")
        params = message.get("params", {})
        
        # Validate rate limits
        await self.security.check_rate_limit(connection_id, method)
        
        # Process request
        result = await self._execute_method(method, params, connection_id)
        
        return {
            "type": "response",
            "request_id": message.get("request_id"),
            "result": result
        }
        
    async def _handle_event(self, message: Dict[str, Any], connection_id: str) -> None:
        """Handle client event messages."""
        event_type = message.get("event_type")
        event_data = message.get("data", {})
        
        # Process event
        await self.monitoring.record_event(event_type, event_data, connection_id)
        
    async def _handle_diagnostic(self, message: Dict[str, Any], connection_id: str) -> Dict[str, Any]:
        """Handle diagnostic request messages."""
        return {
            "type": "diagnostic_response",
            "request_id": message.get("request_id"),
            "diagnostics": self.diagnostics.get_report()
        }
        
    async def _handle_heartbeat(self, message: Dict[str, Any], connection_id: str) -> Dict[str, Any]:
        """Handle client heartbeat messages."""
        client_timestamp = message.get("timestamp")
        client_metrics = message.get("metrics", {})
        
        # Update client metrics
        await self.metrics.update_client_metrics(connection_id, client_metrics)
        
        return {
            "type": "heartbeat_response",
            "timestamp": datetime.utcnow().isoformat(),
            "received_timestamp": client_timestamp
        }
        
    async def _execute_method(self, method: str, params: Dict[str, Any], connection_id: str) -> Any:
        """Execute a requested method with monitoring and metrics."""
        start_time = datetime.utcnow()
        
        try:
            # Execute method implementation
            result = await self.transport.execute_method(method, params, connection_id)
            
            # Record metrics
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            await self.metrics.record_method_execution(method, execution_time, True)
            
            return result
            
        except Exception as e:
            # Record error metrics
            execution_time = (datetime.utcnow() - start_time).total_seconds()
            await self.metrics.record_method_execution(method, execution_time, False)
            raise
            
    async def _periodic_cleanup(self):
        """Periodic cleanup of expired sessions and stale data."""
        while True:
            try:
                await asyncio.sleep(300)  # Run every 5 minutes
                await self.security.cleanup_expired_sessions()
                await self.metrics.cleanup_old_metrics()
                self.diagnostics.protocol_violations = self.diagnostics.protocol_violations[-100:]
            except asyncio.CancelledError:
                break
            except Exception:
                logger.exception("Error in periodic cleanup")
                
    async def _heartbeat_monitor(self):
        """Monitor client heartbeats and cleanup dead connections."""
        while True:
            try:
                await asyncio.sleep(60)  # Run every minute
                current_time = datetime.utcnow()
                
                # Check all connections
                for connection_id in self.transport.get_active_connections():
                    last_heartbeat = await self.metrics.get_last_heartbeat(connection_id)
                    if last_heartbeat and (current_time - last_heartbeat) > timedelta(minutes=5):
                        # Connection considered dead
                        logger.warning(f"Connection {connection_id} considered dead, closing")
                        await self.transport.close_connection(connection_id)
                        self.diagnostics.active_connections -= 1
                        
            except asyncio.CancelledError:
                break
            except Exception:
                logger.exception("Error in heartbeat monitor") 