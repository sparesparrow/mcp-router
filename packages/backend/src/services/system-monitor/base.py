from typing import Dict, Any, Optional, List
from abc import ABC, abstractmethod
import asyncio
import logging
import resource
import psutil
from datetime import datetime, timedelta, UTC
from dataclasses import dataclass
from pydantic import BaseModel, Field

class ResourceExhaustion(Exception):
    """Exception raised when resource limits are exceeded."""
    pass

@dataclass
class MonitoringConfig:
    """Configuration for monitoring services with MCP compatibility."""
    interval_seconds: float = 5.0
    max_samples: int = 1000
    retention_hours: int = 24
    resource_limits: Dict[str, float] = None
    mcp_enabled: bool = True
    mcp_notification_batch_size: int = 10
    mcp_notification_interval: float = 1.0

class MonitoringMetric(BaseModel):
    """Base model for monitoring metrics with enhanced MCP support."""
    timestamp: datetime
    metric_type: str
    value: Any
    metadata: Optional[Dict[str, Any]] = Field(default=None)
    sequence_num: int = Field(default=0)
    client_id: Optional[str] = Field(default=None)

    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

class MCPNotification(BaseModel):
    """MCP notification model for metric updates."""
    jsonrpc: str = "2.0"
    method: str
    params: Dict[str, Any]

class MonitoringService(ABC):
    """Base class for monitoring services with MCP protocol support."""
    
    def __init__(self, config: Optional[MonitoringConfig] = None):
        self._config = config or MonitoringConfig()
        self._metrics: List[MonitoringMetric] = []
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._notification_task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock()
        self._logger = logging.getLogger(__name__)
        self._sequence_counter = 0
        self._notification_queue: asyncio.Queue = asyncio.Queue()
        self._notification_handlers: List[callable] = []
    
    @abstractmethod
    async def collect_metric(self) -> MonitoringMetric:
        """Collect a single metric. Must be implemented by subclasses."""
        pass
    
    async def start(self) -> None:
        """Start the monitoring service with MCP support."""
        if self._running:
            return
            
        self._running = True
        self._task = asyncio.create_task(self._monitoring_loop())
        
        if self._config.mcp_enabled:
            self._notification_task = asyncio.create_task(self._notification_loop())
            
        self._logger.info(f"Started monitoring service: {self.__class__.__name__}")
    
    async def stop(self) -> None:
        """Stop the monitoring service and clean up resources."""
        self._running = False
        
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
            
        if self._notification_task:
            self._notification_task.cancel()
            try:
                await self._notification_task
            except asyncio.CancelledError:
                pass
            self._notification_task = None
            
        self._logger.info(f"Stopped monitoring service: {self.__class__.__name__}")
    
    async def _monitoring_loop(self) -> None:
        """Main monitoring loop with enhanced error handling and MCP support."""
        consecutive_errors = 0
        max_consecutive_errors = 3
        
        while self._running:
            try:
                # Check resource limits
                await self._check_resource_usage()
                
                # Collect metric
                metric = await self.collect_metric()
                metric.sequence_num = self._get_next_sequence()
                
                # Store metric with lock
                async with self._lock:
                    self._metrics.append(metric)
                    
                    # Enforce max samples limit
                    if len(self._metrics) > self._config.max_samples:
                        self._metrics = self._metrics[-self._config.max_samples:]
                
                # Clean up old metrics
                await self._cleanup_old_metrics()
                
                # Send metric notification if MCP enabled
                if self._config.mcp_enabled:
                    await self._queue_metric_notification(metric)
                
                # Reset error counter on success
                consecutive_errors = 0
                
            except ResourceExhaustion as e:
                self._logger.error(f"Resource limit exceeded: {str(e)}", exc_info=True)
                consecutive_errors += 1
                
            except Exception as e:
                self._logger.error(f"Error in monitoring loop: {str(e)}", exc_info=True)
                consecutive_errors += 1
                
            # Stop service if too many consecutive errors
            if consecutive_errors >= max_consecutive_errors:
                self._logger.error(f"Too many consecutive errors ({consecutive_errors}), stopping service")
                await self.stop()
                break
                
            # Wait for next collection
            await asyncio.sleep(self._config.interval_seconds)
    
    async def _notification_loop(self) -> None:
        """Process and send MCP notifications for metrics."""
        batch: List[MonitoringMetric] = []
        last_notification = datetime.now(UTC)
        
        while self._running:
            try:
                # Get metric from queue with timeout
                try:
                    metric = await asyncio.wait_for(
                        self._notification_queue.get(),
                        timeout=self._config.mcp_notification_interval
                    )
                    batch.append(metric)
                except asyncio.TimeoutError:
                    pass
                
                # Send batch if full or interval elapsed
                current_time = datetime.now(UTC)
                if (len(batch) >= self._config.mcp_notification_batch_size or
                    (batch and (current_time - last_notification).total_seconds() >= 
                     self._config.mcp_notification_interval)):
                    
                    if batch:
                        notification = MCPNotification(
                            method="monitoring/metrics",
                            params={
                                "service": self.__class__.__name__,
                                "metrics": [metric.dict() for metric in batch]
                            }
                        )
                        
                        # Send to all registered handlers
                        for handler in self._notification_handlers:
                            try:
                                await handler(notification.dict())
                            except Exception as e:
                                self._logger.error(
                                    f"Error in notification handler: {str(e)}",
                                    exc_info=True
                                )
                        
                        batch = []
                        last_notification = current_time
                
            except Exception as e:
                self._logger.error(f"Error in notification loop: {str(e)}", exc_info=True)
                await asyncio.sleep(1)  # Prevent tight error loop
    
    async def _queue_metric_notification(self, metric: MonitoringMetric) -> None:
        """Queue a metric for MCP notification."""
        try:
            await self._notification_queue.put(metric)
        except Exception as e:
            self._logger.error(f"Error queueing metric notification: {str(e)}", exc_info=True)
    
    def register_notification_handler(self, handler: callable) -> None:
        """Register a handler for MCP metric notifications."""
        self._notification_handlers.append(handler)
    
    def _get_next_sequence(self) -> int:
        """Get next sequence number for metrics."""
        self._sequence_counter += 1
        return self._sequence_counter
    
    async def _check_resource_usage(self) -> None:
        """Check if resource usage is within limits."""
        if not self._config.resource_limits:
            return
            
        current_usage = await self._get_resource_usage()
        for resource, limit in self._config.resource_limits.items():
            if current_usage.get(resource, 0) > limit:
                raise ResourceExhaustion(
                    f"Resource limit exceeded for {resource}: "
                    f"{current_usage[resource]} > {limit}"
                )
    
    async def _get_resource_usage(self) -> Dict[str, float]:
        """Get current resource usage with enhanced metrics."""
        process = psutil.Process()
        memory_info = process.memory_info()
        
        return {
            "memory_mb": memory_info.rss / (1024 * 1024),
            "cpu_percent": process.cpu_percent(),
            "thread_count": process.num_threads(),
            "open_files": len(process.open_files()),
            "connections": len(process.connections())
        }
    
    async def _cleanup_old_metrics(self) -> None:
        """Remove metrics older than retention period."""
        if not self._metrics:
            return
            
        current_time = datetime.now(UTC)
        retention_delta = timedelta(hours=self._config.retention_hours)
        
        async with self._lock:
            self._metrics = [
                metric for metric in self._metrics
                if current_time - metric.timestamp <= retention_delta
            ]
    
    async def get_metrics(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        metric_type: Optional[str] = None,
        client_id: Optional[str] = None
    ) -> List[MonitoringMetric]:
        """Get metrics with enhanced filtering options."""
        async with self._lock:
            metrics = self._metrics.copy()
        
        # Apply filters
        if start_time:
            metrics = [m for m in metrics if m.timestamp >= start_time]
        if end_time:
            metrics = [m for m in metrics if m.timestamp <= end_time]
        if metric_type:
            metrics = [m for m in metrics if m.metric_type == metric_type]
        if client_id:
            metrics = [m for m in metrics if m.client_id == client_id]
            
        return metrics
    
    @property
    def is_running(self) -> bool:
        """Check if the monitoring service is running."""
        return self._running
    
    @property
    def config(self) -> MonitoringConfig:
        """Get the current configuration."""
        return self._config 