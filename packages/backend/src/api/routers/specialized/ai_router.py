from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List, Optional
from datetime import datetime
import structlog

from ...interfaces.ai_service import AIService, ToolsEnabledAIService
from ...infrastructure.service_provider import get_service

logger = structlog.get_logger()

router = APIRouter()

@router.get("/info")
async def get_ai_info(
    ai_service: AIService = Depends(lambda: get_service(AIService))
):
    """Get information about the AI service."""
    try:
        model_info = await ai_service.get_model_info()
        
        return {
            "model": model_info["model"],
            "capabilities": model_info["capabilities"]
        }
    except Exception as e:
        logger.error("Error getting AI info", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate")
async def generate_response(
    request: Dict[str, Any],
    ai_service: AIService = Depends(lambda: get_service(AIService))
):
    """Generate AI response using Claude."""
    try:
        prompt = request.get("prompt")
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")
            
        context = request.get("context", {})
        tools = request.get("tools")
        
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
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tools")
async def process_with_tools(
    request: Dict[str, Any],
    ai_service: ToolsEnabledAIService = Depends(lambda: get_service(ToolsEnabledAIService))
):
    """Process a prompt with tools."""
    try:
        prompt = request.get("prompt")
        if not prompt:
            raise HTTPException(status_code=400, detail="Prompt is required")
            
        tools = request.get("tools")
        if not tools:
            raise HTTPException(status_code=400, detail="Tools are required")
            
        context = request.get("context", {})
        
        response = await ai_service.process_with_tools(prompt, tools, context)
        
        return {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "response": response
        }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error processing with tools", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) 