from abc import ABC, abstractmethod

class Initializable(ABC):
    """Interface for services that require initialization."""
    
    @abstractmethod
    async def initialize(self) -> None:
        """Initialize the service."""
        pass

class Cleanable(ABC):
    """Interface for services that require cleanup."""
    
    @abstractmethod
    async def cleanup(self) -> None:
        """Clean up service resources."""
        pass

class Service(ABC):
    """Marker interface for all services."""
    pass 