from typing import Optional, Dict, Any
import asyncio
from datetime import datetime
import base64
from io import BytesIO
import PIL.ImageGrab
from pydantic import BaseModel

class ScreenshotConfig(BaseModel):
    """Configuration for screenshot capture."""
    interval: int  # Seconds between captures
    max_size: Optional[tuple[int, int]] = None  # Max dimensions (width, height)
    quality: int = 85  # JPEG quality (1-100)
    region: Optional[tuple[int, int, int, int]] = None  # Capture region (left, top, right, bottom)

class ScreenshotData(BaseModel):
    """Model for screenshot data."""
    timestamp: datetime
    image_data: str  # Base64 encoded image
    dimensions: tuple[int, int]
    format: str = "JPEG"
    metadata: Optional[Dict[str, Any]] = None

class ScreenshotService:
    """
    Service for capturing and managing screenshots with security measures
    and resource management.
    """

    def __init__(self, config: ScreenshotConfig):
        self._config = config
        self._running = False
        self._last_capture: Optional[ScreenshotData] = None
        self._lock = asyncio.Lock()
        self._subscribers: list[callable] = []

    async def start_capture(self) -> None:
        """Start periodic screenshot capture."""
        async with self._lock:
            if self._running:
                return
            self._running = True

        while self._running:
            try:
                screenshot = await self.capture_screenshot()
                await self._notify_subscribers(screenshot)
            except Exception as e:
                print(f"Error capturing screenshot: {e}")
            
            await asyncio.sleep(self._config.interval)

    async def stop_capture(self) -> None:
        """Stop periodic screenshot capture."""
        async with self._lock:
            self._running = False

    async def capture_screenshot(self) -> ScreenshotData:
        """
        Capture a single screenshot with security measures.
        Returns base64 encoded image data.
        """
        # Capture screenshot
        image = PIL.ImageGrab.grab(bbox=self._config.region)

        # Resize if needed
        if self._config.max_size:
            image.thumbnail(self._config.max_size, PIL.Image.Resampling.LANCZOS)

        # Convert to JPEG
        buffer = BytesIO()
        image.save(buffer, format="JPEG", quality=self._config.quality)
        image_data = base64.b64encode(buffer.getvalue()).decode()

        # Create screenshot data
        screenshot = ScreenshotData(
            timestamp=datetime.utcnow(),
            image_data=image_data,
            dimensions=image.size,
            metadata={
                "quality": self._config.quality,
                "region": self._config.region
            }
        )

        async with self._lock:
            self._last_capture = screenshot

        return screenshot

    async def get_last_screenshot(self) -> Optional[ScreenshotData]:
        """Get the most recent screenshot."""
        async with self._lock:
            return self._last_capture

    async def subscribe(self, callback: callable) -> None:
        """Subscribe to screenshot updates."""
        if callback not in self._subscribers:
            self._subscribers.append(callback)

    async def unsubscribe(self, callback: callable) -> None:
        """Unsubscribe from screenshot updates."""
        if callback in self._subscribers:
            self._subscribers.remove(callback)

    async def _notify_subscribers(self, screenshot: ScreenshotData) -> None:
        """Notify subscribers of new screenshots."""
        for subscriber in self._subscribers:
            try:
                await subscriber(screenshot)
            except Exception as e:
                print(f"Error notifying subscriber: {e}")

    @property
    def is_running(self) -> bool:
        """Check if the service is currently running."""
        return self._running

    def update_config(self, config: ScreenshotConfig) -> None:
        """Update service configuration."""
        self._config = config 