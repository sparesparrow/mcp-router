import logging
from typing import Dict, Any, Optional, List, Type, AsyncGenerator
import asyncio
from datetime import datetime
import psutil
import json
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field
import sys
sys.path.append("/home/sparrow/projects/hard-coder/Projects/system-context")

from ..core.container import ServiceContainer, get_container
from ..interfaces.service_interfaces import (
    AIServiceInterface,
    AudioServiceInterface,
    WorkflowServiceInterface,
    MetricsCollectorInterface,
    StateManagerInterface
)

from .tools import (
    ToolRegistry, 
    ToolError,
    ValidationError,
    ExecutionError
)

from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import structlog

from ..middleware.security import SecurityMiddleware
from ..middleware.protocol import ProtocolValidationMiddleware
from .models.messages import (
    ProtocolVersion,
    MessageType,
    MessageFactory,
    ProtocolError
)

logger = structlog.get_logger()

class MCPError(Exception):
    """Base class for MCP-related errors."""
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)

class TransportManager:
    """Manages MCP transport connections."""
    
    def __init__(self, server: 'MCPServer'):
        self.server = server
        self.active_connections: Dict[str, Dict[str, Any]] = {}
        
    async def add_connection(self, connection_id: str, metadata: Dict[str, Any]) -> None:
        """Add a new connection with metadata."""
        self.active_connections[connection_id] = {
            "id": connection_id,
            "connected_at": datetime.utcnow(),
            "metadata": metadata,
            "messages_processed": 0,
            "errors": 0
        }
        logger.info(f"New connection: {connection_id}")
        
    async def remove_connection(self, connection_id: str) -> None:
        """Remove a connection."""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
            logger.info(f"Connection closed: {connection_id}")
            
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get statistics about active connections."""
        return {
            "active_connections": len(self.active_connections),
            "connections": [
                {
                    "id": conn["id"],
                    "connected_at": conn["connected_at"].isoformat(),
                    "messages_processed": conn["messages_processed"],
                    "errors": conn["errors"]
                }
                for conn in self.active_connections.values()
            ]
        }

class MCPServer:
    """MCP Server with enhanced security and protocol validation."""
    
    def __init__(
        self,
        validate_keys: bool = True,
        rate_limit: bool = True,
        max_requests: int = 100,
        allowed_origins: Optional[list] = None
    ):
        self.app = FastAPI(title="MCP Server")
        self.tool_registry = ToolRegistry()
        self.logger = logger.bind(component="mcp_server")
        
        # Add middleware
        self._setup_middleware(
            validate_keys=validate_keys,
            rate_limit=rate_limit,
            max_requests=max_requests,
            allowed_origins=allowed_origins or ["http://localhost:5173"]
        )
        
        # Add routes
        self._setup_routes()
    
    def _setup_middleware(
        self,
        validate_keys: bool,
        rate_limit: bool,
        max_requests: int,
        allowed_origins: list
    ) -> None:
        """Set up middleware stack."""
        # Add CORS middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=allowed_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"]
        )
        
        # Add security middleware
        self.app.add_middleware(
            SecurityMiddleware,
            validate_keys=validate_keys,
            rate_limit=rate_limit,
            max_requests=max_requests
        )
        
        # Add protocol validation middleware
        self.app.add_middleware(ProtocolValidationMiddleware)
    
    def _setup_routes(self) -> None:
        """Set up API routes."""
        @self.app.post("/api/tools/execute")
        async def execute_tool(message: Dict[str, Any] = Depends(self._validate_request)):
            try:
                tool_name = message["params"]["tool"]
                tool_params = message["params"].get("params", {})
                
                result = await self.tool_registry.execute_tool(tool_name, tool_params)
                
                return {
                    "message_type": MessageType.RESPONSE,
                    "protocol_version": ProtocolVersion.V2_0,
                    "request_id": message["message_id"],
                    "result": result
                }
                
            except Exception as e:
                self.logger.error("tool_execution_failed",
                                tool=tool_name,
                                error=str(e))
                raise
        
        @self.app.get("/api/tools/list")
        async def list_tools():
            try:
                tools = await self.tool_registry.list_tools()
                
                return {
                    "message_type": MessageType.RESPONSE,
                    "protocol_version": ProtocolVersion.V2_0,
                    "result": {
                        "tools": [
                            {
                                "name": name,
                                "description": tool.description,
                                "version": tool.version,
                                "capabilities": tool.capabilities
                            }
                            for name, tool in tools.items()
                        ]
                    }
                }
                
            except Exception as e:
                self.logger.error("tool_list_failed", error=str(e))
                raise
        
        @self.app.websocket("/ws")
        async def websocket_endpoint(websocket: WebSocket):
            await websocket.accept()
            
            try:
                while True:
                    # Receive message
                    data = await websocket.receive_text()
                    message = json.loads(data)
                    
                    # Validate protocol
                    try:
                        validated_message = MessageFactory.create_message(message)
                    except ProtocolError as e:
                        await websocket.send_json({
                            "message_type": MessageType.ERROR,
                            "protocol_version": ProtocolVersion.V2_0,
                            "error_code": e.code,
                            "error_message": e.message
                        })
                        continue
                    
                    # Process message
                    if validated_message.message_type == MessageType.REQUEST:
                        try:
                            # Execute tool
                            result = await self.tool_registry.execute_tool(
                                validated_message.method,
                                validated_message.params
                            )
                            
                            # Send response
                            await websocket.send_json({
                                "message_type": MessageType.RESPONSE,
                                "protocol_version": ProtocolVersion.V2_0,
                                "request_id": validated_message.message_id,
                                "result": result
                            })
                            
                        except Exception as e:
                            await websocket.send_json({
                                "message_type": MessageType.ERROR,
                                "protocol_version": ProtocolVersion.V2_0,
                                "request_id": validated_message.message_id,
                                "error_code": "EXECUTION_FAILED",
                                "error_message": str(e)
                            })
                    
            except WebSocketDisconnect:
                self.logger.info("websocket_disconnected")
            except Exception as e:
                self.logger.error("websocket_error", error=str(e))
                try:
                    await websocket.close()
                except:
                    pass
    
    async def _validate_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Validate incoming request."""
        try:
            # Request should already be validated by middleware
            return request.state.validated_message
        except Exception as e:
            self.logger.error("request_validation_failed", error=str(e))
            raise ProtocolError("Invalid request", "INVALID_REQUEST")
    
    def get_app(self) -> FastAPI:
        """Get the FastAPI application instance."""
        return self.app

@asynccontextmanager
async def get_mcp_server():
    """Get MCP server instance."""
    container = get_container()
    server = MCPServer(container)
    try:
        yield server
    finally:
        # Cleanup if needed
        pass 