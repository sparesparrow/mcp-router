import logging
from typing import Dict, Any, Optional, List, Set
from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import json
from uuid import uuid4
from datetime import datetime

from ..interfaces.websocket_manager import WebSocketManager

logger = logging.getLogger(__name__)

class DefaultWebSocketManager(WebSocketManager):
    """Default implementation of WebSocket connection management."""
    
    def __init__(self):
        self._connections: Dict[str, WebSocket] = {}
        self._metadata: Dict[str, Dict[str, Any]] = {}
        self._active_tasks: Set[asyncio.Task] = set()
        logger.info("Initializing WebSocket manager")

    async def initialize(self) -> None:
        """Initialize the WebSocket manager."""
        # No specific initialization needed
        pass

    async def cleanup(self) -> None:
        """Clean up resources."""
        # Cancel all pending tasks
        for task in self._active_tasks:
            if not task.done():
                task.cancel()
        
        # Close all connections
        for client_id, websocket in list(self._connections.items()):
            try:
                await websocket.close()
            except Exception as e:
                logger.error(f"Error closing websocket for {client_id}: {str(e)}")
        
        self._connections.clear()
        self._metadata.clear()
        logger.info("WebSocket manager cleaned up")

    async def register_connection(self,
        client_id: str,
        websocket: WebSocket,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Register new WebSocket connection."""
        if client_id in self._connections:
            # If client already has a connection, close it
            try:
                old_websocket = self._connections[client_id]
                await old_websocket.close()
            except Exception as e:
                logger.warning(f"Error closing existing websocket for {client_id}: {str(e)}")
        
        self._connections[client_id] = websocket
        self._metadata[client_id] = metadata or {
            "connected_at": datetime.utcnow().isoformat()
        }
        
        # Start a background task to handle disconnections
        task = asyncio.create_task(self._handle_disconnection(client_id, websocket))
        self._active_tasks.add(task)
        task.add_done_callback(self._active_tasks.discard)
        
        logger.info(f"Registered WebSocket connection for client {client_id}")

    async def unregister_connection(self, client_id: str) -> None:
        """Unregister WebSocket connection."""
        if client_id in self._connections:
            try:
                websocket = self._connections[client_id]
                await websocket.close()
            except Exception as e:
                logger.warning(f"Error closing websocket for {client_id}: {str(e)}")
            
            del self._connections[client_id]
            
            if client_id in self._metadata:
                del self._metadata[client_id]
            
            logger.info(f"Unregistered WebSocket connection for client {client_id}")

    async def send_message(self,
        client_id: str,
        message: Dict[str, Any]
    ) -> bool:
        """Send message to a specific client."""
        if client_id not in self._connections:
            logger.warning(f"Cannot send message: client {client_id} not connected")
            return False
        
        websocket = self._connections[client_id]
        try:
            await websocket.send_json(message)
            return True
        except Exception as e:
            logger.error(f"Error sending message to {client_id}: {str(e)}")
            # If send fails, the connection might be broken
            await self.unregister_connection(client_id)
            return False

    async def broadcast_message(self,
        message: Dict[str, Any],
        client_ids: Optional[List[str]] = None
    ) -> Dict[str, bool]:
        """Broadcast message to connected clients."""
        targets = client_ids or list(self._connections.keys())
        results = {}
        
        for client_id in targets:
            results[client_id] = await self.send_message(client_id, message)
        
        return results

    async def get_active_connections(self) -> List[Dict[str, Any]]:
        """Get list of active connections."""
        return [
            {
                "client_id": client_id,
                "metadata": self._metadata.get(client_id, {})
            }
            for client_id in self._connections.keys()
        ]
    
    async def _handle_disconnection(self, client_id: str, websocket: WebSocket) -> None:
        """Handle client disconnection."""
        try:
            # This will raise WebSocketDisconnect when the client disconnects
            while True:
                # Just try to receive messages to detect disconnection
                await websocket.receive_text()
        except WebSocketDisconnect:
            logger.info(f"Client {client_id} disconnected")
            if client_id in self._connections:
                del self._connections[client_id]
            if client_id in self._metadata:
                del self._metadata[client_id]
        except Exception as e:
            logger.error(f"Error in WebSocket connection for {client_id}: {str(e)}")
            # Also clean up on error
            if client_id in self._connections:
                del self._connections[client_id]
            if client_id in self._metadata:
                del self._metadata[client_id] 