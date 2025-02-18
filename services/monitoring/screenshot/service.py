from typing import Dict, Any, Optional, List
import asyncio
import logging
from datetime import datetime, timedelta, UTC
import mss
import mss.tools
import os
import hashlib
from PIL import Image
import io
from pydantic import Field

from ..base import MonitoringService, MonitoringMetric, MonitoringConfig, MCPNotification

class ScreenshotConfig(MonitoringConfig):
    """Configuration for screenshot monitoring with MCP support."""
    def __init__(
        self,
        interval_seconds: float = 10.0,
        max_samples: int = 100,
        retention_hours: int = 24,
        resource_limits: Optional[Dict[str, float]] = None,
        output_dir: str = "screenshots",
        image_format: str = "PNG",
        max_dimension: int = 1920,
        compression_quality: int = 85,
        mcp_enabled: bool = True,
        mcp_notification_batch_size: int = 5,
        mcp_notification_interval: float = 2.0
    ):
        super().__init__(
            interval_seconds=interval_seconds,
            max_samples=max_samples,
            retention_hours=retention_hours,
            resource_limits=resource_limits or {
                "disk_usage_mb": 1000,  # 1GB
                "memory_mb": 500
            },
            mcp_enabled=mcp_enabled,
            mcp_notification_batch_size=mcp_notification_batch_size,
            mcp_notification_interval=mcp_notification_interval
        )
        self.output_dir = output_dir
        self.image_format = image_format
        self.max_dimension = max_dimension
        self.compression_quality = compression_quality

class ScreenshotMetric(MonitoringMetric):
    """Model for screenshot metrics with enhanced MCP support."""
    file_path: str
    image_hash: str
    dimensions: Dict[str, int]
    file_size: int
    client_capabilities: Optional[Dict[str, Any]] = Field(default=None)
    
    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }

class ScreenshotService(MonitoringService):
    """Service for capturing and managing screenshots with MCP protocol support."""
    
    def __init__(self, config: Optional[ScreenshotConfig] = None):
        super().__init__(config or ScreenshotConfig())
        self._config: ScreenshotConfig = self.config  # Type hint for specific config
        self._screenshot = mss.mss()
        self._ensure_output_dir()
        self._logger = logging.getLogger(__name__)
        self._client_capabilities: Dict[str, Dict[str, Any]] = {}
        self._cleanup_task: Optional[asyncio.Task] = None
    
    def _ensure_output_dir(self) -> None:
        """Ensure the output directory exists."""
        os.makedirs(self._config.output_dir, exist_ok=True)
    
    async def start(self) -> None:
        """Start the service with automatic cleanup."""
        await super().start()
        if not self._cleanup_task:
            self._cleanup_task = asyncio.create_task(self._auto_cleanup_loop())
    
    async def stop(self) -> None:
        """Stop the service and clean up resources."""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
            self._cleanup_task = None
        
        await super().stop()
        self._screenshot.close()
    
    async def collect_metric(self) -> ScreenshotMetric:
        """Capture and process a screenshot with enhanced error handling."""
        try:
            # Capture screenshot
            screenshot = self._screenshot.grab(self._screenshot.monitors[0])
            
            # Convert to PIL Image for processing
            image = Image.frombytes("RGB", screenshot.size, screenshot.rgb)
            
            # Resize if needed
            if max(image.size) > self._config.max_dimension:
                ratio = self._config.max_dimension / max(image.size)
                new_size = tuple(int(dim * ratio) for dim in image.size)
                try:
                    image = image.resize(new_size, Image.Resampling.LANCZOS)
                except AttributeError:
                    image = image.resize(new_size, Image.LANCZOS)
            
            # Generate filename with UTC timestamp
            timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
            filename = f"screenshot_{timestamp}.{self._config.image_format.lower()}"
            file_path = os.path.join(self._config.output_dir, filename)
            
            # Save with compression
            image_bytes = io.BytesIO()
            image.save(
                image_bytes,
                format=self._config.image_format,
                quality=self._config.compression_quality,
                optimize=True
            )
            image_bytes.seek(0)
            
            # Calculate hash
            image_hash = hashlib.sha256(image_bytes.getvalue()).hexdigest()
            
            # Check disk space before saving
            await self._check_disk_space(len(image_bytes.getvalue()))
            
            # Save to disk
            with open(file_path, "wb") as f:
                f.write(image_bytes.getvalue())
            
            # Create metric with client capabilities
            metric = ScreenshotMetric(
                timestamp=datetime.now(UTC),
                metric_type="screenshot",
                value=file_path,
                file_path=file_path,
                image_hash=image_hash,
                dimensions={"width": image.size[0], "height": image.size[1]},
                file_size=os.path.getsize(file_path),
                metadata={
                    "format": self._config.image_format,
                    "quality": self._config.compression_quality,
                    "monitor_index": 0
                },
                client_capabilities=self._get_client_capabilities()
            )
            
            self._logger.debug(
                "screenshot_captured",
                file_path=file_path,
                dimensions=metric.dimensions,
                file_size=metric.file_size
            )
            return metric
            
        except Exception as e:
            self._logger.error(
                "screenshot_capture_error",
                error=str(e),
                exc_info=True
            )
            raise
    
    async def _check_disk_space(self, new_file_size: int) -> None:
        """Check if there's enough disk space for a new screenshot."""
        usage = await self._get_resource_usage()
        new_usage_mb = usage["disk_usage_mb"] + (new_file_size / (1024 * 1024))
        
        if new_usage_mb > self._config.resource_limits["disk_usage_mb"]:
            # Try to free up space by removing old files
            await self.cleanup_old_screenshots()
            
            # Check again after cleanup
            usage = await self._get_resource_usage()
            new_usage_mb = usage["disk_usage_mb"] + (new_file_size / (1024 * 1024))
            
            if new_usage_mb > self._config.resource_limits["disk_usage_mb"]:
                raise ResourceExhaustion(
                    f"Disk usage would exceed limit: {new_usage_mb}MB > "
                    f"{self._config.resource_limits['disk_usage_mb']}MB"
                )
    
    async def _auto_cleanup_loop(self) -> None:
        """Automatically clean up old screenshots periodically."""
        while True:
            try:
                await asyncio.sleep(3600)  # Check every hour
                await self.cleanup_old_screenshots()
            except asyncio.CancelledError:
                break
            except Exception as e:
                self._logger.error(
                    "auto_cleanup_error",
                    error=str(e),
                    exc_info=True
                )
                await asyncio.sleep(60)  # Wait before retrying
    
    def register_client(self, client_id: str, capabilities: Dict[str, Any]) -> None:
        """Register a client with its capabilities."""
        self._client_capabilities[client_id] = capabilities
        self._logger.info(
            "client_registered",
            client_id=client_id,
            capabilities=capabilities
        )
    
    def unregister_client(self, client_id: str) -> None:
        """Unregister a client."""
        if client_id in self._client_capabilities:
            del self._client_capabilities[client_id]
            self._logger.info(
                "client_unregistered",
                client_id=client_id
            )
    
    def _get_client_capabilities(self) -> Optional[Dict[str, Any]]:
        """Get combined client capabilities."""
        if not self._client_capabilities:
            return None
        
        # Combine capabilities from all clients
        combined = {}
        for capabilities in self._client_capabilities.values():
            combined.update(capabilities)
        return combined
    
    async def get_metrics(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        metric_type: Optional[str] = None,
        client_id: Optional[str] = None,
        min_dimension: Optional[int] = None
    ) -> List[ScreenshotMetric]:
        """Get metrics with enhanced filtering options."""
        metrics = await super().get_metrics(start_time, end_time, metric_type, client_id)
        
        # Additional screenshot-specific filtering
        if min_dimension is not None:
            metrics = [
                m for m in metrics
                if isinstance(m, ScreenshotMetric) and
                min(m.dimensions["width"], m.dimensions["height"]) >= min_dimension
            ]
        
        return metrics
    
    async def _get_resource_usage(self) -> Dict[str, float]:
        """Get current resource usage including disk space."""
        usage = await super()._get_resource_usage()
        
        # Add disk usage
        total_size = sum(
            os.path.getsize(os.path.join(self._config.output_dir, f))
            for f in os.listdir(self._config.output_dir)
            if os.path.isfile(os.path.join(self._config.output_dir, f))
        )
        usage["disk_usage_mb"] = total_size / (1024 * 1024)
        
        return usage
    
    async def cleanup_old_screenshots(self) -> None:
        """Remove old screenshot files."""
        current_time = datetime.now()
        retention_delta = timedelta(hours=self._config.retention_hours)
        
        for metric in self._metrics:
            if isinstance(metric, ScreenshotMetric):
                file_age = current_time - metric.timestamp
                if file_age > retention_delta and os.path.exists(metric.file_path):
                    try:
                        os.remove(metric.file_path)
                        self._logger.debug(f"Removed old screenshot: {metric.file_path}")
                    except Exception as e:
                        self._logger.error(
                            f"Error removing screenshot {metric.file_path}: {str(e)}",
                            exc_info=True
                        )
    
    def __del__(self):
        """Ensure screenshot resources are cleaned up."""
        self._screenshot.close() 