from typing import Dict, Type, Any, Optional, TypeVar, Generic, cast
import logging
from functools import lru_cache
import importlib
import inspect

T = TypeVar('T')

logger = logging.getLogger(__name__)

class ServiceRegistry:
    """Registry for service type mappings."""
    
    def __init__(self):
        self._registrations: Dict[Type, Type] = {}
        logger.info("Initializing service registry")

    def register(self, 
        interface_type: Type[T], 
        implementation_type: Type[T]
    ) -> None:
        """Register an implementation type for an interface."""
        # Validate the implementation implements the interface
        if not issubclass(implementation_type, interface_type):
            raise ValueError(
                f"{implementation_type.__name__} is not a subclass of {interface_type.__name__}"
            )
        
        self._registrations[interface_type] = implementation_type
        logger.debug(f"Registered {implementation_type.__name__} for {interface_type.__name__}")
    
    def get_implementation_type(self, interface_type: Type[T]) -> Type[T]:
        """Get the implementation type for an interface."""
        if interface_type not in self._registrations:
            raise KeyError(f"No implementation registered for {interface_type.__name__}")
        
        return cast(Type[T], self._registrations[interface_type])
    
    def load_registrations(self, 
        configuration: Dict[str, str]
    ) -> None:
        """Load registrations from configuration."""
        for interface_path, implementation_path in configuration.items():
            try:
                # Load interface type
                interface_module_path, interface_class = interface_path.rsplit(".", 1)
                interface_module = importlib.import_module(interface_module_path)
                interface_type = getattr(interface_module, interface_class)
                
                # Load implementation type
                impl_module_path, impl_class = implementation_path.rsplit(".", 1)
                impl_module = importlib.import_module(impl_module_path)
                implementation_type = getattr(impl_module, impl_class)
                
                # Register the implementation
                self.register(interface_type, implementation_type)
                
            except (ImportError, ValueError, AttributeError) as e:
                logger.error(f"Failed to load registration {interface_path} -> {implementation_path}: {str(e)}")
                raise

@lru_cache()
def get_service_registry() -> ServiceRegistry:
    """Get the global service registry."""
    return ServiceRegistry() 