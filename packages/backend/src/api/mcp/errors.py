class MCPError(Exception):
    """Base class for MCP errors."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(self.message)

class SecurityError(MCPError):
    """Raised when a security validation fails."""
    pass

class ValidationError(MCPError):
    """Raised when input validation fails."""
    pass

class RateLimitError(SecurityError):
    """Raised when rate limit is exceeded."""
    pass

class TimeoutError(MCPError):
    """Raised when tool execution times out."""
    pass

class ExecutionError(MCPError):
    """Raised when tool execution fails."""
    pass

class ConfigurationError(MCPError):
    """Raised when tool configuration is invalid."""
    pass 