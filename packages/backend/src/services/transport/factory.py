from typing import Dict, Any, Optional, Type
from pydantic import BaseModel

from .base import MCPTransport, MCPTransportConfig
from .http import HTTPTransport, HTTPTransportConfig
from .stdio import StdioTransport, StdioTransportConfig

class TransportType:
    """Available transport types."""
    HTTP = "http"
    STDIO = "stdio"

class TransportFactory:
    """Factory for creating MCP transport instances."""
    
    _transport_types: Dict[str, Type[MCPTransport]] = {
        TransportType.HTTP: HTTPTransport,
        TransportType.STDIO: StdioTransport
    }
    
    _config_types: Dict[str, Type[MCPTransportConfig]] = {
        TransportType.HTTP: HTTPTransportConfig,
        TransportType.STDIO: StdioTransportConfig
    }
    
    @classmethod
    def create_transport(
        cls,
        transport_type: str,
        config: Optional[Dict[str, Any]] = None
    ) -> MCPTransport:
        """Create a transport instance of the specified type.
        
        Args:
            transport_type: Type of transport to create (http or stdio)
            config: Optional transport configuration
            
        Returns:
            An instance of the requested transport type
            
        Raises:
            ValueError: If transport_type is not supported
        """
        if transport_type not in cls._transport_types:
            raise ValueError(
                f"Unsupported transport type: {transport_type}. "
                f"Supported types: {list(cls._transport_types.keys())}"
            )
        
        # Get transport and config classes
        transport_class = cls._transport_types[transport_type]
        config_class = cls._config_types[transport_type]
        
        # Create config instance
        transport_config = config_class(**(config or {}))
        
        # Create and return transport instance
        return transport_class(transport_config) 