from typing import Dict, Any, Optional, List
from datetime import datetime
import structlog
from pydantic import BaseModel
from statistics import mean

logger = structlog.get_logger()

class ToolMetrics(BaseModel):
    """Metrics for a single tool."""
    total_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    total_duration: float = 0.0
    durations: List[float] = []
    errors: Dict[str, int] = {}
    last_execution: Optional[datetime] = None
    last_error: Optional[str] = None

class MetricsCollector:
    """Collects and manages metrics for MCP tools."""
    
    def __init__(self):
        self.metrics: Dict[str, ToolMetrics] = {}
        self.logger = logger.bind(component="metrics_collector")
        
    async def record_registration(self, tool: 'Tool') -> None:
        """Record initial metrics for a newly registered tool."""
        if tool.name not in self.metrics:
            self.metrics[tool.name] = ToolMetrics()
            self.logger.info("metrics_initialized", tool_name=tool.name)
    
    async def record_execution(self, tool_name: str, duration: float) -> None:
        """Record a successful tool execution."""
        try:
            metrics = self._get_or_create_metrics(tool_name)
            
            metrics.total_calls += 1
            metrics.successful_calls += 1
            metrics.total_duration += duration
            metrics.durations.append(duration)
            metrics.last_execution = datetime.utcnow()
            
            # Keep only last 100 durations for memory efficiency
            if len(metrics.durations) > 100:
                metrics.durations = metrics.durations[-100:]
                
            self.logger.info("execution_recorded",
                           tool_name=tool_name,
                           duration=duration)
                           
        except Exception as e:
            self.logger.error("failed_to_record_execution",
                            tool_name=tool_name,
                            error=str(e))
    
    async def record_failure(self, tool_name: str, error: str) -> None:
        """Record a failed tool execution."""
        try:
            metrics = self._get_or_create_metrics(tool_name)
            
            metrics.total_calls += 1
            metrics.failed_calls += 1
            metrics.last_execution = datetime.utcnow()
            metrics.last_error = error
            
            # Update error distribution
            error_type = self._categorize_error(error)
            metrics.errors[error_type] = metrics.errors.get(error_type, 0) + 1
            
            self.logger.warning("failure_recorded",
                              tool_name=tool_name,
                              error=error)
                              
        except Exception as e:
            self.logger.error("failed_to_record_failure",
                            tool_name=tool_name,
                            error=str(e))
    
    def get_tool_metrics(self, tool_name: str) -> Dict[str, Any]:
        """Get metrics for a specific tool."""
        metrics = self._get_or_create_metrics(tool_name)
        
        return {
            "total_calls": metrics.total_calls,
            "successful_calls": metrics.successful_calls,
            "failed_calls": metrics.failed_calls,
            "success_rate": self._calculate_success_rate(metrics),
            "avg_duration": self._calculate_avg_duration(metrics),
            "last_execution": metrics.last_execution,
            "last_error": metrics.last_error,
            "error_distribution": metrics.errors
        }
    
    def get_all_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Get metrics for all tools."""
        return {
            name: self.get_tool_metrics(name)
            for name in self.metrics
        }
    
    def _get_or_create_metrics(self, tool_name: str) -> ToolMetrics:
        """Get or create metrics for a tool."""
        if tool_name not in self.metrics:
            self.metrics[tool_name] = ToolMetrics()
        return self.metrics[tool_name]
    
    def _calculate_success_rate(self, metrics: ToolMetrics) -> float:
        """Calculate success rate for a tool."""
        if metrics.total_calls == 0:
            return 0.0
        return metrics.successful_calls / metrics.total_calls
    
    def _calculate_avg_duration(self, metrics: ToolMetrics) -> float:
        """Calculate average duration for a tool."""
        if not metrics.durations:
            return 0.0
        return mean(metrics.durations)
    
    def _categorize_error(self, error: str) -> str:
        """Categorize an error message into a type."""
        error_lower = error.lower()
        
        if "validation" in error_lower:
            return "validation_error"
        elif "timeout" in error_lower:
            return "timeout_error"
        elif "rate limit" in error_lower:
            return "rate_limit_error"
        elif "permission" in error_lower:
            return "permission_error"
        else:
            return "other_error" 