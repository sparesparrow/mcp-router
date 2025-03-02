from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from datetime import datetime
import structlog

from ..infrastructure.service_provider import get_service
from .specialized.ai_router import router as ai_router
from .specialized.audio_router import router as audio_router
from .specialized.websocket_router import router as websocket_router

logger = structlog.get_logger()

router = APIRouter()

# Include sub-routers
router.include_router(ai_router, prefix="/ai", tags=["ai"])
router.include_router(audio_router, prefix="/audio", tags=["audio"])
router.include_router(websocket_router, prefix="/ws", tags=["websocket"])

@router.get("/info")
async def get_mcp_info():
    """Get information about available MCP services."""
    try:
        # Simplified implementation that delegates to sub-routers
        response = {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "services": {
                "ai": {
                    "endpoints": [
                        "/api/mcp/ai/info",
                        "/api/mcp/ai/generate",
                        "/api/mcp/ai/tools"
                    ]
                },
                "audio": {
                    "endpoints": [
                        "/api/mcp/audio/info",
                        "/api/mcp/audio/synthesize",
                        "/api/mcp/audio/voices"
                    ]
                },
                "websocket": {
                    "endpoints": [
                        "/api/mcp/ws"
                    ]
                }
            }
        }
        
        return response
    except Exception as e:
        logger.error("Error getting MCP info", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) 