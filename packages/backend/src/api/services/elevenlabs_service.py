import os
import logging
from typing import AsyncGenerator, Dict, Any, Optional, List
import httpx

from ..interfaces.audio_service import AudioService

logger = logging.getLogger(__name__)

class ElevenLabsAudioService(AudioService):
    """Audio service implementation using ElevenLabs API."""
    
    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None
        self._api_key: Optional[str] = None
        self._base_url = "https://api.elevenlabs.io/v1"
        self._chunk_size = 1024
        self._default_voice = "21m00Tcm4TlvDq8ikWAM"  # Default voice ID
        logger.info("Initializing ElevenLabs audio service")

    async def initialize(self) -> None:
        """Initialize the ElevenLabs client."""
        self._api_key = os.getenv("ELEVENLABS_API_KEY")
        if not self._api_key:
            raise ValueError("ELEVENLABS_API_KEY environment variable not set")
        
        try:
            self._client = httpx.AsyncClient(
                base_url=self._base_url,
                headers={
                    "xi-api-key": self._api_key,
                    "Content-Type": "application/json"
                }
            )
            # Test connection
            await self._client.get("/voices")
            logger.info("ElevenLabs client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize ElevenLabs client: {str(e)}")
            raise

    async def cleanup(self) -> None:
        """Clean up resources."""
        if self._client:
            await self._client.aclose()
            self._client = None
            logger.info("ElevenLabs client cleaned up")

    async def stream_audio(self,
        text: str,
        voice_id: str,
        settings: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[bytes, None]:
        """Stream audio from ElevenLabs API."""
        if not self._client:
            raise RuntimeError("ElevenLabs client not initialized")

        if not await self.validate_text(text):
            raise ValueError("Invalid text")

        try:
            voice_id = voice_id or self._default_voice
            
            # Default settings
            voice_settings = {
                "stability": 0.5,
                "similarity_boost": 0.75,
                **(settings or {})
            }

            response = await self._client.post(
                f"/text-to-speech/{voice_id}/stream",
                json={
                    "text": text,
                    "model_id": "eleven_monolingual_v1",
                    "voice_settings": voice_settings
                },
                stream=True
            )
            response.raise_for_status()

            async for chunk in response.aiter_bytes(chunk_size=self._chunk_size):
                yield chunk

        except httpx.HTTPError as e:
            logger.error(f"ElevenLabs API error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in stream_audio: {str(e)}")
            raise

    async def validate_text(self, text: str) -> bool:
        """Validate text before processing."""
        if not text or not isinstance(text, str):
            return False
            
        # Add additional validation logic here
        # For example, check length limits, content filtering, etc.
        
        return True

    async def get_available_voices(self) -> List[Dict[str, Any]]:
        """Get list of available voices."""
        if not self._client:
            raise RuntimeError("ElevenLabs client not initialized")

        try:
            response = await self._client.get("/voices")
            response.raise_for_status()
            voices_data = response.json()

            return [{
                "voice_id": voice["voice_id"],
                "name": voice["name"],
                "category": voice.get("category", "unknown"),
                "labels": voice.get("labels", {}),
                "preview_url": voice.get("preview_url")
            } for voice in voices_data["voices"]]

        except httpx.HTTPError as e:
            logger.error(f"Failed to fetch voices: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in get_available_voices: {str(e)}")
            raise
            
    async def text_to_speech(self,
        text: str,
        voice_id: Optional[str] = None,
        settings: Optional[Dict[str, Any]] = None
    ) -> bytes:
        """Convert text to speech and return the full audio bytes."""
        if not self._client:
            raise RuntimeError("ElevenLabs client not initialized")

        if not await self.validate_text(text):
            raise ValueError("Invalid text")

        try:
            voice_id = voice_id or self._default_voice
            
            # Default settings
            voice_settings = {
                "stability": 0.5,
                "similarity_boost": 0.75,
                **(settings or {})
            }

            response = await self._client.post(
                f"/text-to-speech/{voice_id}",
                json={
                    "text": text,
                    "model_id": "eleven_monolingual_v1",
                    "voice_settings": voice_settings
                }
            )
            response.raise_for_status()
            
            return response.content

        except httpx.HTTPError as e:
            logger.error(f"ElevenLabs API error in text_to_speech: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in text_to_speech: {str(e)}")
            raise 