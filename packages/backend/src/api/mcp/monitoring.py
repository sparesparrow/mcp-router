from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import asyncio
from collections import defaultdict
import logging
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

@dataclass
class ProtocolMetrics:
    """Metrics for protocol monitoring."""
    message_counts: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    version_counts: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    latency_samples: List[float] = field(default_factory=list)
    error_counts: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    violation_counts: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    active_connections: int = 0
    last_reset: datetime = field(default_factory=datetime.utcnow)

class ProtocolMonitor:
    """Monitor for MCP protocol metrics and diagnostics."""
    
    def __init__(self, metrics_window: int = 3600):
        self._metrics_window = metrics_window  # seconds
        self._current_metrics = ProtocolMetrics()
        self._historical_metrics: List[ProtocolMetrics] = []
        self._lock = asyncio.Lock()
        
    async def record_message(self, message_type: str, protocol_version: str, latency_ms: Optional[float] = None) -> None:
        """Record a message event."""
        async with self._lock:
            self._current_metrics.message_counts[message_type] += 1
            self._current_metrics.version_counts[protocol_version] += 1
            if latency_ms is not None:
                self._current_metrics.latency_samples.append(latency_ms)
    
    async def record_error(self, error_type: str) -> None:
        """Record an error event."""
        async with self._lock:
            self._current_metrics.error_counts[error_type] += 1
    
    async def record_violation(self, violation_type: str) -> None:
        """Record a protocol violation."""
        async with self._lock:
            self._current_metrics.violation_counts[violation_type] += 1
    
    async def update_connection_count(self, count: int) -> None:
        """Update the active connection count."""
        async with self._lock:
            self._current_metrics.active_connections = count
    
    async def rotate_metrics(self) -> None:
        """Rotate current metrics to historical and reset."""
        async with self._lock:
            if self._current_metrics.message_counts:  # Only rotate if there's data
                self._historical_metrics.append(self._current_metrics)
                self._current_metrics = ProtocolMetrics()
                
                # Trim historical metrics based on window
                cutoff_time = datetime.utcnow() - timedelta(seconds=self._metrics_window)
                self._historical_metrics = [
                    m for m in self._historical_metrics
                    if m.last_reset > cutoff_time
                ]
    
    def get_current_metrics(self) -> Dict[str, Any]:
        """Get current metrics snapshot."""
        metrics = self._current_metrics
        return {
            "message_counts": dict(metrics.message_counts),
            "version_counts": dict(metrics.version_counts),
            "error_counts": dict(metrics.error_counts),
            "violation_counts": dict(metrics.violation_counts),
            "active_connections": metrics.active_connections,
            "latency_stats": self._calculate_latency_stats(metrics.latency_samples),
            "since": metrics.last_reset.isoformat()
        }
    
    def get_historical_metrics(self) -> List[Dict[str, Any]]:
        """Get historical metrics."""
        return [
            {
                "message_counts": dict(m.message_counts),
                "version_counts": dict(m.version_counts),
                "error_counts": dict(m.error_counts),
                "violation_counts": dict(m.violation_counts),
                "active_connections": m.active_connections,
                "latency_stats": self._calculate_latency_stats(m.latency_samples),
                "timestamp": m.last_reset.isoformat()
            }
            for m in self._historical_metrics
        ]
    
    def get_aggregated_metrics(self) -> Dict[str, Any]:
        """Get aggregated metrics over the entire window."""
        agg_metrics = ProtocolMetrics()
        
        # Combine current and historical metrics
        all_metrics = [self._current_metrics] + self._historical_metrics
        
        for metrics in all_metrics:
            # Aggregate message counts
            for msg_type, count in metrics.message_counts.items():
                agg_metrics.message_counts[msg_type] += count
            
            # Aggregate version counts
            for version, count in metrics.version_counts.items():
                agg_metrics.version_counts[version] += count
            
            # Aggregate error counts
            for error_type, count in metrics.error_counts.items():
                agg_metrics.error_counts[error_type] += count
            
            # Aggregate violation counts
            for violation_type, count in metrics.violation_counts.items():
                agg_metrics.violation_counts[violation_type] += count
            
            # Combine latency samples
            agg_metrics.latency_samples.extend(metrics.latency_samples)
        
        return {
            "message_counts": dict(agg_metrics.message_counts),
            "version_counts": dict(agg_metrics.version_counts),
            "error_counts": dict(agg_metrics.error_counts),
            "violation_counts": dict(agg_metrics.violation_counts),
            "latency_stats": self._calculate_latency_stats(agg_metrics.latency_samples),
            "window_seconds": self._metrics_window,
            "total_messages": sum(agg_metrics.message_counts.values()),
            "total_errors": sum(agg_metrics.error_counts.values()),
            "total_violations": sum(agg_metrics.violation_counts.values())
        }
    
    def _calculate_latency_stats(self, samples: List[float]) -> Dict[str, float]:
        """Calculate latency statistics from samples."""
        if not samples:
            return {
                "min": 0.0,
                "max": 0.0,
                "avg": 0.0,
                "p95": 0.0,
                "p99": 0.0
            }
        
        sorted_samples = sorted(samples)
        return {
            "min": sorted_samples[0],
            "max": sorted_samples[-1],
            "avg": sum(sorted_samples) / len(sorted_samples),
            "p95": sorted_samples[int(len(sorted_samples) * 0.95)],
            "p99": sorted_samples[int(len(sorted_samples) * 0.99)]
        }

class ProtocolMonitoringService:
    """Service for protocol monitoring and metrics collection."""
    
    def __init__(self, rotation_interval: int = 60):
        self.monitor = ProtocolMonitor()
        self._rotation_interval = rotation_interval
        self._rotation_task: Optional[asyncio.Task] = None
    
    async def start(self) -> None:
        """Start the monitoring service."""
        self._rotation_task = asyncio.create_task(self._metrics_rotation_loop())
        logger.info("Protocol monitoring service started")
    
    async def stop(self) -> None:
        """Stop the monitoring service."""
        if self._rotation_task:
            self._rotation_task.cancel()
            try:
                await self._rotation_task
            except asyncio.CancelledError:
                pass
            self._rotation_task = None
        logger.info("Protocol monitoring service stopped")
    
    async def _metrics_rotation_loop(self) -> None:
        """Background task for rotating metrics."""
        while True:
            try:
                await asyncio.sleep(self._rotation_interval)
                await self.monitor.rotate_metrics()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in metrics rotation: {str(e)}")
    
    def get_monitoring_report(self) -> Dict[str, Any]:
        """Get comprehensive monitoring report."""
        return {
            "current": self.monitor.get_current_metrics(),
            "historical": self.monitor.get_historical_metrics(),
            "aggregated": self.monitor.get_aggregated_metrics()
        } 