from typing import Dict, Type, Any, Optional, TypeVar, Generic, cast
import logging
from contextlib import asynccontextmanager

from .service_registry import ServiceRegistry, get_service_registry
from ..interfaces.lifecycle import Initializable, Cleanable

T = TypeVar('T')

logger = logging.getLogger(__name__)

class ServiceProvider:
    """Provider for service instances."""
    
    def __init__(self, registry: ServiceRegistry):
        self._registry = registry
        self._instances: Dict[Type, Any] = {}
        logger.info("Initializing service provider")

    async def get_service(self, service_type: Type[T]) -> T:
        """Get or create a service instance."""
        if service_type in self._instances:
            return cast(T, self._instances[service_type])
        
        # Get the implementation type
        implementation_type = self._registry.get_implementation_type(service_type)
        
        # Create instance
        try:
            instance = implementation_type()
            
            # Initialize if required
            if isinstance(instance, Initializable):
                await instance.initialize()
            
            # Store the instance
            self._instances[service_type] = instance
            logger.debug(f"Created instance of {implementation_type.__name__}")
            
            return cast(T, instance)
            
        except Exception as e:
            logger.error(f"Failed to create instance of {implementation_type.__name__}: {str(e)}")
            raise

    def get_service_sync(self, service_type: Type[T]) -> T:
        """Get an existing service instance without async initialization."""
        if service_type in self._instances:
            return cast(T, self._instances[service_type])
        
        # Get the implementation type
        implementation_type = self._registry.get_implementation_type(service_type)
        
        # Create instance without initialization
        instance = implementation_type()
        self._instances[service_type] = instance
        logger.debug(f"Created non-initialized instance of {implementation_type.__name__}")
        
        return cast(T, instance)

    async def cleanup(self) -> None:
        """Clean up all service instances."""
        for service_type, instance in list(self._instances.items()):
            try:
                if isinstance(instance, Cleanable):
                    await instance.cleanup()
                logger.debug(f"Cleaned up {service_type.__name__} instance")
            except Exception as e:
                logger.error(f"Error cleaning up {service_type.__name__}: {str(e)}")
        
        self._instances.clear()

@asynccontextmanager
async def service_scope():
    """Context manager for service lifecycle management."""
    registry = get_service_registry()
    provider = ServiceProvider(registry)
    try:
        yield provider
    finally:
        await provider.cleanup()

def get_service_provider() -> ServiceProvider:
    """FastAPI dependency for getting the service provider."""
    # In a real implementation, this would use request state
    # to get the provider instance from the current request context
    registry = get_service_registry()
    return ServiceProvider(registry)

async def get_service(service_type: Type[T]) -> T:
    """FastAPI dependency for getting a service instance."""
    # In a real implementation, this would use request state
    registry = get_service_registry()
    provider = ServiceProvider(registry)
    return await provider.get_service(service_type) 