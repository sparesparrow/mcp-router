from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List, Optional
import base64
from datetime import datetime
import structlog

from ...interfaces.audio_service import AudioService
from ...infrastructure.service_provider import get_service

logger = structlog.get_logger()

router = APIRouter()

@router.get("/info")
async def get_audio_info(
    audio_service: AudioService = Depends(lambda: get_service(AudioService))
):
    """Get information about the audio service."""
    try:
        voices = await audio_service.get_available_voices()
        
        return {
            "voice_count": len(voices),
            "default_voice": voices[0] if voices else None
        }
    except Exception as e:
        logger.error("Error getting audio info", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/synthesize")
async def synthesize_speech(
    request: Dict[str, Any],
    audio_service: AudioService = Depends(lambda: get_service(AudioService))
):
    """Convert text to speech using ElevenLabs."""
    try:
        text = request.get("text")
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
            
        voice_id = request.get("voice_id")
        settings = request.get("settings", {})
        
        # For non-streaming responses
        if not request.get("stream", False):
            audio_bytes = await audio_service.text_to_speech(text, voice_id, settings)
            
            # Convert to base64 for JSON response
            audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
            
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "audio_data": audio_base64,
                "format": "audio/mp3"
            }
        else:
            # For streaming, this would be handled by the WebSocket endpoint
            raise HTTPException(
                status_code=400, 
                detail="Streaming is only supported via WebSocket"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error synthesizing speech", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/voices")
async def get_voices(
    audio_service: AudioService = Depends(lambda: get_service(AudioService))
):
    """Get available voices."""
    try:
        voices = await audio_service.get_available_voices()
        
        return {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "voices": voices
        }
            
    except Exception as e:
        logger.error("Error getting voices", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) 