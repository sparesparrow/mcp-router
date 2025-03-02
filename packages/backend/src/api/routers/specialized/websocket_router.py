from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, Any, List, Optional
import uuid
import json
import asyncio
import base64
from datetime import datetime
import structlog

from ...interfaces.websocket_manager import WebSocketManager
from ...interfaces.ai_service import AIService
from ...interfaces.audio_service import AudioService
from ...infrastructure.service_provider import get_service

logger = structlog.get_logger()

router = APIRouter()

@router.websocket("/")
async def websocket_endpoint(
    websocket: WebSocket,
    ws_manager: WebSocketManager = Depends(lambda: get_service(WebSocketManager))
):
    """WebSocket endpoint for MCP communication."""
    client_id = str(uuid.uuid4())
    
    try:
        await websocket.accept()
        await ws_manager.register_connection(client_id, websocket)
        
        # Send welcome message
        await ws_manager.send_message(client_id, {
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
                    await handle_ai_request(client_id, message, ws_manager)
                    
                elif message.get("type") == "audio_request":
                    await handle_audio_request(client_id, message, ws_manager)
                    
                else:
                    await ws_manager.send_message(client_id, {
                        "type": "error",
                        "message": f"Unknown message type: {message.get('type')}"
                    })
                    
            except json.JSONDecodeError:
                await ws_manager.send_message(client_id, {
                    "type": "error",
                    "message": "Invalid JSON"
                })
                
    except WebSocketDisconnect:
        # Clean up on disconnect
        await ws_manager.unregister_connection(client_id)
        
    except Exception as e:
        logger.error("Error in WebSocket endpoint", client_id=client_id, error=str(e))
        await ws_manager.unregister_connection(client_id)

async def handle_ai_request(
    client_id: str, 
    message: Dict[str, Any],
    ws_manager: WebSocketManager
):
    """Handle AI generation request via WebSocket."""
    try:
        prompt = message.get("prompt")
        if not prompt:
            await ws_manager.send_message(client_id, {
                "type": "error",
                "message": "Prompt is required"
            })
            return
            
        context = message.get("context", {})
        tools = message.get("tools")
        request_id = message.get("request_id", str(uuid.uuid4()))
        
        # Get AI service
        ai_service = await get_service(AIService)
        
        # Start streaming response
        await ws_manager.send_message(client_id, {
            "type": "ai_response_start",
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Stream response chunks
        async for chunk in ai_service.stream_response(prompt, context, tools):
            await ws_manager.send_message(client_id, {
                "type": "ai_response_chunk",
                "request_id": request_id,
                "chunk": chunk
            })
            
        # End streaming
        await ws_manager.send_message(client_id, {
            "type": "ai_response_end",
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error("Error handling AI request", 
                   client_id=client_id, error=str(e))
        await ws_manager.send_message(client_id, {
            "type": "error",
            "request_id": message.get("request_id"),
            "message": f"Error processing AI request: {str(e)}"
        })

async def handle_audio_request(
    client_id: str, 
    message: Dict[str, Any],
    ws_manager: WebSocketManager
):
    """Handle audio synthesis request via WebSocket."""
    try:
        text = message.get("text")
        if not text:
            await ws_manager.send_message(client_id, {
                "type": "error",
                "message": "Text is required"
            })
            return
            
        voice_id = message.get("voice_id")
        settings = message.get("settings", {})
        request_id = message.get("request_id", str(uuid.uuid4()))
        
        # Get audio service
        audio_service = await get_service(AudioService)
        
        # Start streaming response
        await ws_manager.send_message(client_id, {
            "type": "audio_response_start",
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Stream audio chunks
        async for chunk in audio_service.stream_audio(text, voice_id, settings):
            # Convert binary chunk to base64 for WebSocket
            chunk_base64 = base64.b64encode(chunk).decode("utf-8")
            
            await ws_manager.send_message(client_id, {
                "type": "audio_response_chunk",
                "request_id": request_id,
                "chunk": chunk_base64
            })
            
        # End streaming
        await ws_manager.send_message(client_id, {
            "type": "audio_response_end",
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error("Error handling audio request", 
                   client_id=client_id, error=str(e))
        await ws_manager.send_message(client_id, {
            "type": "error",
            "request_id": message.get("request_id"),
            "message": f"Error processing audio request: {str(e)}"
        }) 