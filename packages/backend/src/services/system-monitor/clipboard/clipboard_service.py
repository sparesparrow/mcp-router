from typing import Optional, Dict, Any, List
import asyncio
from datetime import datetime
import pyperclip
from pydantic import BaseModel

class ClipboardConfig(BaseModel):
    """Configuration for clipboard monitoring."""
    interval: float = 0.5  # Seconds between checks
    max_content_length: int = 1_000_000  # Maximum content length to store
    store_history: bool = True  # Whether to keep history
    max_history_items: int = 100  # Maximum number of history items to keep

class ClipboardData(BaseModel):
    """Model for clipboard data."""
    timestamp: datetime
    content: str
    content_type: str = "text"  # Future: support for different content types
    metadata: Optional[Dict[str, Any]] = None

class ClipboardService:
    """
    Service for monitoring clipboard content with security measures
    and resource management.
    """

    def __init__(self, config: ClipboardConfig):
        self._config = config
        self._running = False
        self._last_content: Optional[str] = None
        self._history: List[ClipboardData] = []
        self._lock = asyncio.Lock()
        self._subscribers: List[callable] = []

    async def start_monitoring(self) -> None:
        """Start clipboard monitoring."""
        async with self._lock:
            if self._running:
                return
            self._running = True
            self._last_content = pyperclip.paste()

        while self._running:
            try:
                current_content = pyperclip.paste()
                
                if current_content != self._last_content:
                    await self._handle_clipboard_change(current_content)
                    self._last_content = current_content
                    
            except Exception as e:
                print(f"Error monitoring clipboard: {e}")
            
            await asyncio.sleep(self._config.interval)

    async def stop_monitoring(self) -> None:
        """Stop clipboard monitoring."""
        async with self._lock:
            self._running = False

    async def _handle_clipboard_change(self, content: str) -> None:
        """Handle clipboard content changes."""
        if len(content) > self._config.max_content_length:
            content = content[:self._config.max_content_length] + "... (truncated)"

        clipboard_data = ClipboardData(
            timestamp=datetime.utcnow(),
            content=content,
            metadata={
                "length": len(content),
                "truncated": len(content) > self._config.max_content_length
            }
        )

        async with self._lock:
            if self._config.store_history:
                self._history.append(clipboard_data)
                if len(self._history) > self._config.max_history_items:
                    self._history.pop(0)

            await self._notify_subscribers(clipboard_data)

    async def get_history(self, limit: Optional[int] = None) -> List[ClipboardData]:
        """Get clipboard history."""
        async with self._lock:
            if limit is None or limit >= len(self._history):
                return self._history.copy()
            return self._history[-limit:]

    async def clear_history(self) -> None:
        """Clear clipboard history."""
        async with self._lock:
            self._history.clear()

    async def subscribe(self, callback: callable) -> None:
        """Subscribe to clipboard updates."""
        if callback not in self._subscribers:
            self._subscribers.append(callback)

    async def unsubscribe(self, callback: callable) -> None:
        """Unsubscribe from clipboard updates."""
        if callback in self._subscribers:
            self._subscribers.remove(callback)

    async def _notify_subscribers(self, data: ClipboardData) -> None:
        """Notify subscribers of clipboard updates."""
        for subscriber in self._subscribers:
            try:
                await subscriber(data)
            except Exception as e:
                print(f"Error notifying subscriber: {e}")

    @property
    def is_running(self) -> bool:
        """Check if the service is currently running."""
        return self._running

    def update_config(self, config: ClipboardConfig) -> None:
        """Update service configuration."""
        self._config = config 