from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, Optional, List
from datetime import datetime

class ServiceInterface(ABC):
    """Base interface for all services."""
    
    @abstractmethod
    async def initialize(self) -> None:
        """Initialize the service."""
        pass
    
    @abstractmethod
    async def cleanup(self) -> None:
        """Clean up service resources."""
        pass

class AIServiceInterface(ServiceInterface):
    """Interface for AI service operations."""
    
    @abstractmethod
    async def stream_response(self, 
        prompt: str, 
        context: Dict[str, Any],
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> AsyncGenerator[str, None]:
        """Stream AI responses."""
        pass
    
    @abstractmethod
    async def validate_prompt(self, prompt: str) -> bool:
        """Validate prompt before processing."""
        pass
    
    @abstractmethod
    async def get_model_info(self) -> Dict[str, Any]:
        """Get information about the AI model."""
        pass

class AudioServiceInterface(ServiceInterface):
    """Interface for audio service operations."""
    
    @abstractmethod
    async def stream_audio(self, 
        text: str,
        voice_id: str,
        settings: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[bytes, None]:
        """Stream audio for text."""
        pass
    
    @abstractmethod
    async def validate_text(self, text: str) -> bool:
        """Validate text before processing."""
        pass
    
    @abstractmethod
    async def get_available_voices(self) -> List[Dict[str, Any]]:
        """Get list of available voices."""
        pass

class WorkflowServiceInterface(ServiceInterface):
    """Interface for workflow service operations."""
    
    @abstractmethod
    async def create_workflow(self, definition: Dict[str, Any]) -> str:
        """Create a new workflow."""
        pass
    
    @abstractmethod
    async def execute_workflow(self, 
        workflow_id: str,
        input_data: Dict[str, Any]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Execute a workflow and stream results."""
        pass
    
    @abstractmethod
    async def get_workflow_status(self, workflow_id: str) -> Dict[str, Any]:
        """Get current status of a workflow."""
        pass

class MetricsCollectorInterface(ServiceInterface):
    """Interface for metrics collection."""
    
    @abstractmethod
    async def record_latency(self, 
        operation: str,
        duration_ms: float,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Record operation latency."""
        pass
    
    @abstractmethod
    async def record_error(self,
        operation: str,
        error: Exception,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Record operation error."""
        pass
    
    @abstractmethod
    async def get_metrics(self,
        start_time: datetime,
        end_time: datetime
    ) -> Dict[str, Any]:
        """Get metrics for time period."""
        pass

class WebSocketManagerInterface(ServiceInterface):
    """Interface for WebSocket connection management."""
    
    @abstractmethod
    async def register_connection(self,
        client_id: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """Register new WebSocket connection."""
        pass
    
    @abstractmethod
    async def broadcast_message(self,
        message: Dict[str, Any],
        client_ids: Optional[List[str]] = None
    ) -> None:
        """Broadcast message to connected clients."""
        pass
    
    @abstractmethod
    async def get_active_connections(self) -> List[Dict[str, Any]]:
        """Get list of active connections."""
        pass

class StateManagerInterface(ServiceInterface):
    """Interface for application state management."""
    
    @abstractmethod
    async def set_state(self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> None:
        """Set state value with optional TTL."""
        pass
    
    @abstractmethod
    async def get_state(self, key: str) -> Optional[Any]:
        """Get state value."""
        pass
    
    @abstractmethod
    async def delete_state(self, key: str) -> None:
        """Delete state value."""
        pass

class MonitoringServiceInterface(ServiceInterface):
    """Interface for system monitoring services."""
    
    @abstractmethod
    async def start_monitoring(self) -> None:
        """Start the monitoring service."""
        pass
    
    @abstractmethod
    async def stop_monitoring(self) -> None:
        """Stop the monitoring service."""
        pass
    
    @abstractmethod
    async def get_latest_data(self) -> Dict[str, Any]:
        """Get the latest monitoring data."""
        pass
    
    @abstractmethod
    async def subscribe(self, callback) -> str:
        """Subscribe to monitoring events."""
        pass
    
    @abstractmethod
    async def unsubscribe(self, subscription_id: str) -> None:
        """Unsubscribe from monitoring events."""
        pass 