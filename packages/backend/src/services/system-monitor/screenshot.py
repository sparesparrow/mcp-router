import asyncio
import base64
import logging
import os
import uuid
from typing import Dict, Any, Optional, List, Callable, Awaitable
from datetime import datetime
import io
from PIL import Image, ImageGrab
import structlog
from pydantic import BaseModel

from ..api.interfaces.service_interfaces import MonitoringServiceInterface

logger = structlog.get_logger(__name__)

class ScreenshotConfig(BaseModel):
    """Configuration for screenshot monitoring."""
    interval: float = 5.0  # seconds
    max_width: int = 1920
    max_height: int = 1080
    quality: int = 85
    format: str = "JPEG"
    save_dir: Optional[str] = None
    enabled: bool = True

class ScreenshotData(BaseModel):
    """Screenshot data model."""
    id: str
    timestamp: datetime
    width: int
    height: int
    format: str
    image_data: str  # Base64 encoded image
    file_path: Optional[str] = None
    metadata: Dict[str, Any] = {}

class ScreenshotService(MonitoringServiceInterface):
    """Service for capturing and managing screenshots."""
    
    def __init__(self, config: Optional[ScreenshotConfig] = None):
        self.config = config or ScreenshotConfig()
        self._stop_event = asyncio.Event()
        self._task: Optional[asyncio.Task] = None
        self._subscribers: Dict[str, Callable[[ScreenshotData], Awaitable[None]]] = {}
        self._last_screenshot: Optional[ScreenshotData] = None
        self._capture_count = 0
        self._logger = logger.bind(component="screenshot_service")
        
    async def initialize(self) -> None:
        """Initialize the screenshot service."""
        if self.config.save_dir and not os.path.exists(self.config.save_dir):
            os.makedirs(self.config.save_dir)
        self._logger.info("Screenshot service initialized", enabled=self.config.enabled)
        
    async def cleanup(self) -> None:
        """Clean up resources."""
        await self.stop_monitoring()
        self._subscribers.clear()
        self._logger.info("Screenshot service cleaned up")
        
    async def start_monitoring(self) -> None:
        """Start the screenshot monitoring loop."""
        if self._task is not None:
            self._logger.warning("Screenshot monitoring already started")
            return
            
        if not self.config.enabled:
            self._logger.info("Screenshot monitoring is disabled")
            return
            
        self._stop_event.clear()
        self._task = asyncio.create_task(self._monitoring_loop())
        self._logger.info("Screenshot monitoring started", interval=self.config.interval)
        
    async def stop_monitoring(self) -> None:
        """Stop the screenshot monitoring loop."""
        if self._task is None:
            return
            
        self._stop_event.set()
        try:
            await self._task
        except asyncio.CancelledError:
            pass
        self._task = None
        self._logger.info("Screenshot monitoring stopped")
        
    async def get_latest_data(self) -> Dict[str, Any]:
        """Get the latest screenshot data."""
        if self._last_screenshot:
            return self._last_screenshot.dict(exclude={"image_data"})
        return {}
        
    async def subscribe(self, callback: Callable[[ScreenshotData], Awaitable[None]]) -> str:
        """Subscribe to screenshot events."""
        subscription_id = str(uuid.uuid4())
        self._subscribers[subscription_id] = callback
        self._logger.debug("New screenshot subscriber", subscription_id=subscription_id)
        return subscription_id
        
    async def unsubscribe(self, subscription_id: str) -> None:
        """Unsubscribe from screenshot events."""
        if subscription_id in self._subscribers:
            del self._subscribers[subscription_id]
            self._logger.debug("Removed screenshot subscriber", subscription_id=subscription_id)
            
    async def _monitoring_loop(self) -> None:
        """Main monitoring loop for capturing screenshots."""
        self._logger.info("Screenshot monitoring loop started")
        
        while not self._stop_event.is_set():
            try:
                # Capture and process screenshot
                screenshot = await self._capture_screenshot()
                if screenshot:
                    self._last_screenshot = screenshot
                    
                    # Notify subscribers
                    for sub_id, callback in self._subscribers.items():
                        try:
                            await callback(screenshot)
                        except Exception as e:
                            self._logger.error("Error in screenshot subscriber callback", 
                                             subscription_id=sub_id, error=str(e))
                
                # Wait for next interval or stop event
                try:
                    await asyncio.wait_for(self._stop_event.wait(), self.config.interval)
                except asyncio.TimeoutError:
                    pass
                    
            except Exception as e:
                self._logger.error("Error in screenshot monitoring loop", error=str(e))
                await asyncio.sleep(self.config.interval)
                
        self._logger.info("Screenshot monitoring loop ended")
                
    async def _capture_screenshot(self) -> Optional[ScreenshotData]:
        """Capture a screenshot."""
        try:
            # Capture screenshot in a thread to avoid blocking the event loop
            loop = asyncio.get_running_loop()
            screenshot = await loop.run_in_executor(None, ImageGrab.grab)
            
            # Resize if needed
            original_width, original_height = screenshot.size
            if (original_width > self.config.max_width or 
                original_height > self.config.max_height):
                screenshot.thumbnail(
                    (self.config.max_width, self.config.max_height),
                    Image.LANCZOS
                )
            
            # Save to buffer
            buffer = io.BytesIO()
            screenshot.save(
                buffer, 
                format=self.config.format, 
                quality=self.config.quality
            )
            image_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            # Save to file if configured
            file_path = None
            if self.config.save_dir:
                timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
                file_name = f"screenshot_{timestamp}_{self._capture_count}.{self.config.format.lower()}"
                file_path = os.path.join(self.config.save_dir, file_name)
                screenshot.save(file_path, format=self.config.format, quality=self.config.quality)
            
            self._capture_count += 1
            width, height = screenshot.size
            
            return ScreenshotData(
                id=str(uuid.uuid4()),
                timestamp=datetime.utcnow(),
                width=width,
                height=height,
                format=self.config.format,
                image_data=image_data,
                file_path=file_path,
                metadata={
                    "capture_count": self._capture_count,
                    "original_size": f"{original_width}x{original_height}"
                }
            )
            
        except Exception as e:
            self._logger.error("Error capturing screenshot", error=str(e))
            return None
            
    async def get_screenshot_by_id(self, screenshot_id: str) -> Optional[ScreenshotData]:
        """Get a specific screenshot by ID."""
        if self._last_screenshot and self._last_screenshot.id == screenshot_id:
            return self._last_screenshot
        return None
        
    # Additional methods for advanced features
    
    async def capture_and_analyze(self) -> Dict[str, Any]:
        """Capture a screenshot and perform analysis."""
        screenshot = await self._capture_screenshot()
        if not screenshot:
            return {"error": "Failed to capture screenshot"}
            
        # Example analysis (would be more complex in a real implementation)
        analysis = {
            "resolution": f"{screenshot.width}x{screenshot.height}",
            "format": screenshot.format,
            "timestamp": screenshot.timestamp.isoformat(),
            "file_size": len(base64.b64decode(screenshot.image_data)),
        }
        
        return {
            "screenshot_id": screenshot.id,
            "analysis": analysis
        }
        
    async def get_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get screenshot history (simplified implementation)."""
        if self._last_screenshot:
            return [self._last_screenshot.dict(exclude={"image_data"})]
        return [] 