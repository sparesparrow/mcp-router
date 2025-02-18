from typing import Dict, Any
from datetime import datetime, timedelta
import structlog
from pydantic import BaseModel

from .errors import SecurityError, ValidationError

logger = structlog.get_logger()

class RateLimitState(BaseModel):
    """State for tracking rate limits."""
    last_execution: datetime
    count: int

class SecurityManager:
    """Manages security and validation for MCP tools."""
    
    def __init__(self):
        self.rate_limits: Dict[str, RateLimitState] = {}
        self.logger = logger.bind(component="security_manager")
        
    async def validate_tool(self, tool: 'Tool') -> bool:
        """Validate a tool's security properties."""
        try:
            # Validate required fields
            if not all([tool.name, tool.description, tool.version]):
                self.logger.warning("invalid_tool_definition",
                                  tool_name=tool.name,
                                  missing_fields=True)
                return False
            
            # Validate capabilities
            if not self._validate_capabilities(tool.capabilities):
                self.logger.warning("invalid_capabilities",
                                  tool_name=tool.name)
                return False
            
            # Validate rate limit if specified
            if tool.rate_limit and tool.rate_limit <= 0:
                self.logger.warning("invalid_rate_limit",
                                  tool_name=tool.name,
                                  rate_limit=tool.rate_limit)
                return False
            
            # Validate timeout if specified
            if tool.timeout and tool.timeout <= 0:
                self.logger.warning("invalid_timeout",
                                  tool_name=tool.name,
                                  timeout=tool.timeout)
                return False
            
            return True
            
        except Exception as e:
            self.logger.error("tool_validation_failed",
                            tool_name=tool.name,
                            error=str(e))
            return False
    
    async def validate_params(self, tool: 'Tool', params: Dict[str, Any]) -> bool:
        """Validate parameters for tool execution."""
        try:
            # Validate required parameters
            required_params = tool.capabilities.get("required_params", [])
            if not all(param in params for param in required_params):
                self.logger.warning("missing_required_params",
                                  tool_name=tool.name)
                return False
            
            # Validate parameter types
            param_types = tool.capabilities.get("param_types", {})
            for param, value in params.items():
                if param in param_types:
                    if not isinstance(value, eval(param_types[param])):
                        self.logger.warning("invalid_param_type",
                                          tool_name=tool.name,
                                          param=param)
                        return False
            
            return True
            
        except Exception as e:
            self.logger.error("parameter_validation_failed",
                            tool_name=tool.name,
                            error=str(e))
            return False
    
    async def check_rate_limit(self, tool: 'Tool') -> None:
        """Check and enforce rate limits for tool execution."""
        if not tool.rate_limit:
            return
            
        now = datetime.utcnow()
        state = self.rate_limits.get(tool.name)
        
        if not state:
            # Initialize rate limit state
            self.rate_limits[tool.name] = RateLimitState(
                last_execution=now,
                count=1
            )
            return
            
        # Check if we're in a new time window
        if (now - state.last_execution) > timedelta(seconds=60):
            state.count = 1
            state.last_execution = now
            return
            
        # Check rate limit
        if state.count >= tool.rate_limit:
            raise SecurityError(
                f"Rate limit exceeded for tool {tool.name}. "
                f"Limit is {tool.rate_limit} calls per minute."
            )
            
        # Update state
        state.count += 1
        state.last_execution = now
    
    def _validate_capabilities(self, capabilities: Dict[str, Any]) -> bool:
        """Validate tool capabilities."""
        required_fields = ["required_params", "param_types"]
        return all(field in capabilities for field in required_fields) 