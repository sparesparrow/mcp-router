from typing import Dict, Type, Any, Optional, Union
from functools import lru_cache
import logging
from contextlib import asynccontextmanager

from ..interfaces.service_interfaces import (
    AIServiceInterface,
    AudioServiceInterface,
    WorkflowServiceInterface,
    MetricsCollectorInterface,
    WebSocketManagerInterface,
    StateManagerInterface,
    MonitoringServiceInterface
)

logger = logging.getLogger(__name__)

class ServiceContainer:
    """Dependency injection container for managing service instances."""
    
    def __init__(self):
        self._services: Dict[Type, Type] = {}
        self._instances: Dict[Type, Any] = {}
        logger.info("Initializing service container")

    def register(self, interface: Type, implementation: Type) -> None:
        """Register a service implementation for an interface."""
        if not issubclass(implementation, interface):
            raise ValueError(f"{implementation.__name__} does not implement {interface.__name__}")
        self._services[interface] = implementation
        logger.debug(f"Registered {implementation.__name__} for {interface.__name__}")

    async def get(self, interface: Type) -> Any:
        """Get or create a service instance."""
        if interface not in self._instances:
            if interface not in self._services:
                raise KeyError(f"No implementation registered for {interface.__name__}")
            
            implementation = self._services[interface]
            try:
                instance = implementation()
                if hasattr(instance, 'initialize'):
                    await instance.initialize()
                self._instances[interface] = instance
                logger.debug(f"Created new instance of {implementation.__name__}")
            except Exception as e:
                logger.error(f"Failed to create instance of {implementation.__name__}: {str(e)}")
                raise
        
        return self._instances[interface]
        
    def get_sync(self, interface: Type) -> Any:
        """Get an existing service instance without async initialization."""
        if interface in self._instances:
            return self._instances[interface]
            
        if interface not in self._services:
            raise KeyError(f"No implementation registered for {interface.__name__}")
        
        # Create instance without initialization
        implementation = self._services[interface]
        instance = implementation()
        self._instances[interface] = instance
        return instance

    async def cleanup(self) -> None:
        """Clean up all service instances."""
        for interface, instance in self._instances.items():
            try:
                if hasattr(instance, 'cleanup'):
                    await instance.cleanup()
                logger.debug(f"Cleaned up {interface.__name__} instance")
            except Exception as e:
                logger.error(f"Error cleaning up {interface.__name__}: {str(e)}")
        self._instances.clear()

@lru_cache()
def get_container() -> ServiceContainer:
    """Get the global service container instance."""
    return ServiceContainer()

@asynccontextmanager
async def service_scope():
    """Context manager for service lifecycle management."""
    container = get_container()
    try:
        yield container
    finally:
        await container.cleanup()

class ServiceProvider:
    """Base class for components that need service access."""
    
    def __init__(self, container: Optional[ServiceContainer] = None):
        self._container = container or get_container()

    async def get_service(self, interface: Type) -> Any:
        """Get a service instance from the container."""
        return await self._container.get(interface)
        
    def get_service_sync(self, interface: Type) -> Any:
        """Get a service instance synchronously."""
        return self._container.get_sync(interface)

# FastAPI dependency functions
async def get_ai_service() -> AIServiceInterface:
    """Dependency for getting the AI service instance."""
    container = get_container()
    return await container.get(AIServiceInterface)

async def get_audio_service() -> AudioServiceInterface:
    """Dependency for getting the audio service instance."""
    container = get_container()
    return await container.get(AudioServiceInterface)

async def get_workflow_service() -> WorkflowServiceInterface:
    """Dependency for getting the workflow service instance."""
    container = get_container()
    return await container.get(WorkflowServiceInterface)

async def get_metrics_collector() -> MetricsCollectorInterface:
    """Dependency for getting the metrics collector instance."""
    container = get_container()
    return await container.get(MetricsCollectorInterface)

async def get_websocket_manager() -> WebSocketManagerInterface:
    """Dependency for getting the WebSocket manager instance."""
    container = get_container()
    return await container.get(WebSocketManagerInterface)

async def get_state_manager() -> StateManagerInterface:
    """Dependency for getting the state manager instance."""
    container = get_container()
    return await container.get(StateManagerInterface)

async def get_monitoring_service(service_name: str) -> MonitoringServiceInterface:
    """Dependency for getting a specific monitoring service instance."""
    container = get_container()
    # Here we retrieve a specific monitoring service by name from a registry
    monitoring_services = await container.get("monitoring_services")
    return monitoring_services.get(service_name) 