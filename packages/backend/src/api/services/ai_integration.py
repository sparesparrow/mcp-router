from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
import httpx
import asyncio
import json
import os
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Models for API requests
class TextToSpeechRequest(BaseModel):
    text: str
    voice_id: str = "pNInz6obpgDQGcFmaJgB"  # Default to Adam voice
    model_id: str = "eleven_monolingual_v1"
    
class StreamLLMRequest(BaseModel):
    prompt: str
    model: str = "claude-3-opus-20240229"
    max_tokens: int = 2048
    temperature: float = 0.7

class SoundEffectRequest(BaseModel):
    description: str
    duration: float = 5.0
    
class ToolCallRequest(BaseModel):
    name: str
    arguments: Dict[str, Any]

# AI Service class to handle LLM and audio generation
class AIIntegrationService:
    def __init__(self):
        self.claude_api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY", "")
        self.claude_client = httpx.AsyncClient()
        self.elevenlabs_client = httpx.AsyncClient()
        
    async def stream_claude(self, request: StreamLLMRequest):
        """Stream a response from Claude"""
        if not self.claude_api_key:
            logger.error("ANTHROPIC_API_KEY not set")
            yield json.dumps({"error": "API key not configured"})
            return
            
        try:
            async with self.claude_client.stream(
                "POST",
                "https://api.anthropic.com/v1/messages",
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": self.claude_api_key,
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": request.model,
                    "max_tokens": request.max_tokens,
                    "temperature": request.temperature,
                    "messages": [{"role": "user", "content": request.prompt}],
                    "stream": True
                },
                timeout=60.0
            ) as response:
                if response.status_code != 200:
                    error_detail = await response.text()
                    yield json.dumps({"error": f"API request failed: {response.status_code}", "detail": error_detail})
                    return
                    
                async for chunk in response.aiter_text():
                    if chunk.startswith("data: "):
                        chunk = chunk[6:]  # Remove the "data: " prefix
                        if chunk.strip() == "[DONE]":
                            yield "data: [DONE]\n\n"
                            break
                            
                        try:
                            data = json.loads(chunk)
                            if data.get("type") == "content_block_delta":
                                text = data.get("delta", {}).get("text", "")
                                if text:
                                    yield f"data: {json.dumps({'text': text})}\n\n"
                        except json.JSONDecodeError:
                            # Skip invalid JSON chunks
                            continue
                            
        except Exception as e:
            logger.exception("Error streaming from Claude")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            
    async def text_to_speech(self, request: TextToSpeechRequest):
        """Convert text to speech using ElevenLabs"""
        if not self.elevenlabs_api_key:
            logger.error("ELEVENLABS_API_KEY not set")
            return {"error": "API key not configured"}
            
        try:
            response = await self.elevenlabs_client.post(
                "https://api.elevenlabs.io/v1/text-to-speech",
                headers={
                    "xi-api-key": self.elevenlabs_api_key,
                    "Content-Type": "application/json"
                },
                json={
                    "text": request.text,
                    "voice_id": request.voice_id,
                    "model_id": request.model_id,
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75,
                        "style": 0.0,
                        "use_speaker_boost": True
                    }
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                error_detail = await response.text()
                logger.error(f"ElevenLabs API error: {error_detail}")
                return {"error": f"Text-to-speech failed: {response.status_code}", "detail": error_detail}
                
            return response.content
            
        except Exception as e:
            logger.exception("Error in text-to-speech conversion")
            return {"error": str(e)}
            
    async def generate_sound_effect(self, request: SoundEffectRequest):
        """Generate a sound effect using ElevenLabs"""
        if not self.elevenlabs_api_key:
            logger.error("ELEVENLABS_API_KEY not set")
            return {"error": "API key not configured"}
            
        try:
            response = await self.elevenlabs_client.post(
                "https://api.elevenlabs.io/v1/sound-effects/generate",
                headers={
                    "xi-api-key": self.elevenlabs_api_key,
                    "Content-Type": "application/json"
                },
                json={
                    "text": request.description,
                    "duration_seconds": request.duration
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                error_detail = await response.text()
                logger.error(f"ElevenLabs API error: {error_detail}")
                return {"error": f"Sound effect generation failed: {response.status_code}", "detail": error_detail}
                
            return response.content
            
        except Exception as e:
            logger.exception("Error in sound effect generation")
            return {"error": str(e)}
            
# Create API router
def create_ai_router():
    from fastapi import APIRouter
    
    ai_service = AIIntegrationService()
    router = APIRouter(prefix="/api/ai", tags=["AI Integration"])
    
    @router.post("/stream-llm")
    async def stream_llm(request: StreamLLMRequest):
        """Stream a response from the LLM"""
        return StreamingResponse(
            ai_service.stream_claude(request),
            media_type="text/event-stream"
        )
        
    @router.post("/text-to-speech")
    async def text_to_speech(request: TextToSpeechRequest):
        """Convert text to speech"""
        result = await ai_service.text_to_speech(request)
        if isinstance(result, dict) and "error" in result:
            return result
        return StreamingResponse(
            content=iter([result]),
            media_type="audio/mpeg"
        )
        
    @router.post("/sound-effects")
    async def sound_effects(request: SoundEffectRequest):
        """Generate a sound effect"""
        result = await ai_service.generate_sound_effect(request)
        if isinstance(result, dict) and "error" in result:
            return result
        return StreamingResponse(
            content=iter([result]),
            media_type="audio/mpeg"
        )
        
    return router
    
# Standalone app for direct use
app = FastAPI(title="AI Integration Service")
app.include_router(create_ai_router())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 