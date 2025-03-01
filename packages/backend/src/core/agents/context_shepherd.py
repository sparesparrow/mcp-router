from typing import Any, Dict, List, Optional
from datetime import datetime
import asyncio
from pydantic import BaseModel

class ContextData(BaseModel):
    content: Any
    importance: float
    timestamp: datetime
    source: str
    metadata: Optional[Dict[str, Any]] = None

class ContextShepherd:
    """
    Core agent responsible for managing and orchestrating system context.
    Implements the composer agent pattern with reflection capabilities.
    """
    def __init__(self):
        self._context: Dict[str, ContextData] = {}
        self._lock = asyncio.Lock()
        self._subscribers: List[callable] = []

    async def add_context(self, source: str, content: Any, importance: float = 1.0, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Add new context data with proper validation and security checks."""
        async with self._lock:
            context_data = ContextData(
                content=content,
                importance=importance,
                timestamp=datetime.utcnow(),
                source=source,
                metadata=metadata or {}
            )
            
            # Validate and sanitize input following security standards
            self._validate_context_data(context_data)
            
            self._context[source] = context_data
            await self._notify_subscribers(source, context_data)

    def _validate_context_data(self, data: ContextData) -> None:
        """Validate context data following security standards."""
        if not isinstance(data.importance, (int, float)) or not 0 <= data.importance <= 1:
            raise ValueError("Importance must be a number between 0 and 1")
        
        if not data.source:
            raise ValueError("Source must not be empty")
        
        # Add additional validation based on content type
        self._validate_content_type(data.content)

    def _validate_content_type(self, content: Any) -> None:
        """Validate content based on its type following security standards."""
        if isinstance(content, (str, bytes)):
            if len(content) > 1_000_000:  # 1MB limit
                raise ValueError("Content size exceeds limit")
        elif isinstance(content, dict):
            if len(str(content)) > 1_000_000:
                raise ValueError("Content size exceeds limit")

    async def get_current_context(self, source: Optional[str] = None) -> Dict[str, ContextData]:
        """Retrieve current context with optional source filtering."""
        async with self._lock:
            if source:
                return {source: self._context[source]} if source in self._context else {}
            return self._context.copy()

    async def subscribe(self, callback: callable) -> None:
        """Subscribe to context updates."""
        if callback not in self._subscribers:
            self._subscribers.append(callback)

    async def unsubscribe(self, callback: callable) -> None:
        """Unsubscribe from context updates."""
        if callback in self._subscribers:
            self._subscribers.remove(callback)

    async def _notify_subscribers(self, source: str, data: ContextData) -> None:
        """Notify subscribers of context updates."""
        for subscriber in self._subscribers:
            try:
                await subscriber(source, data)
            except Exception as e:
                # Log error but continue with other subscribers
                print(f"Error notifying subscriber: {e}")

    async def reflect(self) -> Dict[str, Any]:
        """
        Implement reflection capability to analyze current state and performance.
        Following the composer agent pattern for self-improvement.
        """
        async with self._lock:
            return {
                "total_sources": len(self._context),
                "sources": list(self._context.keys()),
                "latest_update": max(data.timestamp for data in self._context.values()) if self._context else None,
                "subscriber_count": len(self._subscribers)
            }

    async def cleanup_old_context(self, max_age_hours: int = 24) -> None:
        """Clean up old context data to manage resource usage."""
        async with self._lock:
            current_time = datetime.utcnow()
            to_remove = [
                source for source, data in self._context.items()
                if (current_time - data.timestamp).total_seconds() > max_age_hours * 3600
            ]
            for source in to_remove:
                del self._context[source] 