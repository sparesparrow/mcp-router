from abc import abstractmethod
from typing import Dict, Any, Optional, List
from .lifecycle import Service, Initializable, Cleanable

class WebSocketManager(Service, Initializable, Cleanable):
    """Interface for WebSocket connection management."""
    
    @abstractmethod
    async def register_connection(self,
        client_id: str,
        websocket: Any,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Register new WebSocket connection."""
        pass
    
    @abstractmethod
    async def unregister_connection(self, client_id: str) -> None:
        """Unregister WebSocket connection."""
        pass
    
    @abstractmethod
    async def send_message(self,
        client_id: str,
        message: Dict[str, Any]
    ) -> bool:
        """Send message to a specific client."""
        pass
    
    @abstractmethod
    async def broadcast_message(self,
        message: Dict[str, Any],
        client_ids: Optional[List[str]] = None
    ) -> Dict[str, bool]:
        """Broadcast message to connected clients."""
        pass
    
    @abstractmethod
    async def get_active_connections(self) -> List[Dict[str, Any]]:
        """Get list of active connections."""
        pass 