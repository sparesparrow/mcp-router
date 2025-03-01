from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List, Optional
import structlog
from datetime import datetime

logger = structlog.get_logger()

router = APIRouter()

@router.get("/")
async def list_tools():
    """List all available tools."""
    try:
        # In a real implementation, this would fetch from a tool registry
        tools = [
            {
                "name": "screenshot",
                "description": "Capture and analyze screenshots",
                "capabilities": ["capture", "analyze", "history"]
            },
            {
                "name": "ai",
                "description": "AI text generation with Claude",
                "capabilities": ["generate", "stream", "tools"]
            },
            {
                "name": "audio",
                "description": "Text-to-speech with ElevenLabs",
                "capabilities": ["synthesize", "stream", "voices"]
            }
        ]
        
        return {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "tools": tools
        }
    except Exception as e:
        logger.error("Error listing tools", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/screenshot")
async def get_screenshot_tool_info():
    """Get information about the screenshot tool."""
    try:
        return {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "tool": {
                "name": "screenshot",
                "description": "Capture and analyze screenshots",
                "endpoints": [
                    {
                        "path": "/api/monitoring/screenshot",
                        "method": "GET",
                        "description": "Get the latest screenshot data"
                    },
                    {
                        "path": "/api/monitoring/screenshot/analyze",
                        "method": "GET",
                        "description": "Capture and analyze a screenshot"
                    },
                    {
                        "path": "/api/monitoring/screenshot/history",
                        "method": "GET",
                        "description": "Get screenshot history"
                    }
                ],
                "websocket": {
                    "path": "/api/monitoring/ws",
                    "subscription_type": "screenshot"
                }
            }
        }
    except Exception as e:
        logger.error("Error getting screenshot tool info", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/ai")
async def get_ai_tool_info():
    """Get information about the AI tool."""
    try:
        return {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "tool": {
                "name": "ai",
                "description": "AI text generation with Claude",
                "endpoints": [
                    {
                        "path": "/api/mcp/ai/generate",
                        "method": "POST",
                        "description": "Generate AI response"
                    },
                    {
                        "path": "/api/mcp/info",
                        "method": "GET",
                        "description": "Get AI model information"
                    }
                ],
                "websocket": {
                    "path": "/api/mcp/ws",
                    "message_type": "ai_request"
                }
            }
        }
    except Exception as e:
        logger.error("Error getting AI tool info", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/audio")
async def get_audio_tool_info():
    """Get information about the audio tool."""
    try:
        return {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "tool": {
                "name": "audio",
                "description": "Text-to-speech with ElevenLabs",
                "endpoints": [
                    {
                        "path": "/api/mcp/audio/synthesize",
                        "method": "POST",
                        "description": "Convert text to speech"
                    },
                    {
                        "path": "/api/mcp/info",
                        "method": "GET",
                        "description": "Get available voices"
                    }
                ],
                "websocket": {
                    "path": "/api/mcp/ws",
                    "message_type": "audio_request"
                }
            }
        }
    except Exception as e:
        logger.error("Error getting audio tool info", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error") 