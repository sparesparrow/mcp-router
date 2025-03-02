from abc import abstractmethod
from typing import AsyncGenerator, Dict, Any, Optional, List
from .lifecycle import Service, Initializable, Cleanable

class AudioService(Service, Initializable, Cleanable):
    """Interface for audio service operations."""
    
    @abstractmethod
    async def stream_audio(self, 
        text: str,
        voice_id: str,
        settings: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[bytes, None]:
        """Stream audio for text."""
        pass
    
    @abstractmethod
    async def validate_text(self, text: str) -> bool:
        """Validate text before processing."""
        pass
    
    @abstractmethod
    async def get_available_voices(self) -> List[Dict[str, Any]]:
        """Get list of available voices."""
        pass
    
    @abstractmethod
    async def text_to_speech(self,
        text: str,
        voice_id: Optional[str] = None,
        settings: Optional[Dict[str, Any]] = None
    ) -> bytes:
        """Convert text to speech and return the full audio bytes."""
        pass 