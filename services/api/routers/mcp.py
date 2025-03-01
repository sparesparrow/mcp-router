from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from typing import Dict, Any, List, Optional
import asyncio
import uuid
import json
import structlog
from datetime import datetime

from ..core.container import get_ai_service, get_audio_service
from ..interfaces.service_interfaces import AIServiceInterface, AudioServiceInterface

logger = structlog.get_logger()

router = APIRouter()

# WebSocket connections
active_connections: Dict[str, WebSocket] = {}

@router.get("/info")
async def get_mcp_info():
    """Get information about available MCP services."""
    try:
        # Get AI service info
        ai_service = await get_ai_service()
        ai_info = await ai_service.get_model_info()
        
        # Get audio service info
        audio_service = await get_audio_service()
        voices = await audio_service.get_available_voices()
        
        return {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "services": {
                "ai": {
                    "model": ai_info["model"],
                    "capabilities": ai_info["capabilities"]
                },
                "audio": {
                    "voice_count": len(voices),
                    "default_voice": voices[0] if voices else None
                }
            }
        }
    except Exception as e:
        logger.error("Error getting MCP info", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/ai/generate")
async def generate_ai_response(request: Dict[str, Any]):
    """Generate AI response using Claude."""
    try:
        prompt = request.get("prompt")
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")
            
        context = request.get("context", {})
        tools = request.get("tools")
        
        ai_service = await get_ai_service()
        
        # For non-streaming responses
        if not request.get("stream", False):
            response_text = ""
            async for chunk in ai_service.stream_response(prompt, context, tools):
                response_text += chunk
                
            return {
                "status": "success",
                "timestamp": datetime.utcnow().isoformat(),
                "response": response_text
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
        logger.error("Error generating AI response", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/audio/synthesize")
async def synthesize_speech(request: Dict[str, Any]):
    """Convert text to speech using ElevenLabs."""
    try:
        text = request.get("text")
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
            
        voice_id = request.get("voice_id")
        settings = request.get("settings", {})
        
        audio_service = await get_audio_service()
        
        # For non-streaming responses
        if not request.get("stream", False):
            audio_bytes = await audio_service.text_to_speech(text, voice_id, settings)
            
            # Convert to base64 for JSON response
            import base64
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
        raise HTTPException(status_code=500, detail="Internal server error")

@router.websocket("/ws")
async def mcp_websocket(websocket: WebSocket):
    """WebSocket endpoint for MCP communication."""
    client_id = str(uuid.uuid4())
    
    try:
        await websocket.accept()
        active_connections[client_id] = websocket
        
        # Send welcome message
        await websocket.send_json({
            "type": "welcome",
            "client_id": client_id,
            "timestamp": datetime.utcnow().isoformat(),
            "services": ["ai", "audio"]
        })
        
        # Handle client messages
        while True:
            try:
                message = await websocket.receive_json()
                
                if message.get("type") == "ai_request":
                    await handle_ai_request(client_id, websocket, message)
                    
                elif message.get("type") == "audio_request":
                    await handle_audio_request(client_id, websocket, message)
                    
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Unknown message type: {message.get('type')}"
                    })
                    
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON"
                })
                
    except WebSocketDisconnect:
        # Clean up on disconnect
        if client_id in active_connections:
            del active_connections[client_id]
        
    except Exception as e:
        logger.error("Error in MCP WebSocket", client_id=client_id, error=str(e))
        if client_id in active_connections:
            del active_connections[client_id]
        if websocket.client_state.connected:
            await websocket.close()

async def handle_ai_request(client_id: str, websocket: WebSocket, message: Dict[str, Any]):
    """Handle AI generation request via WebSocket."""
    try:
        prompt = message.get("prompt")
        if not prompt:
            await websocket.send_json({
                "type": "error",
                "message": "Prompt is required"
            })
            return
            
        context = message.get("context", {})
        tools = message.get("tools")
        request_id = message.get("request_id", str(uuid.uuid4()))
        
        ai_service = await get_ai_service()
        
        # Start streaming response
        await websocket.send_json({
            "type": "ai_response_start",
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Stream response chunks
        async for chunk in ai_service.stream_response(prompt, context, tools):
            await websocket.send_json({
                "type": "ai_response_chunk",
                "request_id": request_id,
                "chunk": chunk
            })
            
        # End streaming
        await websocket.send_json({
            "type": "ai_response_end",
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error("Error handling AI request", 
                   client_id=client_id, error=str(e))
        await websocket.send_json({
            "type": "error",
            "request_id": message.get("request_id"),
            "message": f"Error processing AI request: {str(e)}"
        })

async def handle_audio_request(client_id: str, websocket: WebSocket, message: Dict[str, Any]):
    """Handle audio synthesis request via WebSocket."""
    try:
        text = message.get("text")
        if not text:
            await websocket.send_json({
                "type": "error",
                "message": "Text is required"
            })
            return
            
        voice_id = message.get("voice_id")
        settings = message.get("settings", {})
        request_id = message.get("request_id", str(uuid.uuid4()))
        
        audio_service = await get_audio_service()
        
        # Start streaming response
        await websocket.send_json({
            "type": "audio_response_start",
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Stream audio chunks
        import base64
        async for chunk in audio_service.stream_audio(text, voice_id, settings):
            # Convert binary chunk to base64 for WebSocket
            chunk_base64 = base64.b64encode(chunk).decode("utf-8")
            
            await websocket.send_json({
                "type": "audio_response_chunk",
                "request_id": request_id,
                "chunk": chunk_base64
            })
            
        # End streaming
        await websocket.send_json({
            "type": "audio_response_end",
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error("Error handling audio request", 
                   client_id=client_id, error=str(e))
        await websocket.send_json({
            "type": "error",
            "request_id": message.get("request_id"),
            "message": f"Error processing audio request: {str(e)}"
        }) 