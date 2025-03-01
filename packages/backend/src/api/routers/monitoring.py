from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from typing import Dict, Any, List, Optional
import asyncio
import uuid
import json
import structlog
from datetime import datetime

from ..core.container import get_monitoring_service
from ..interfaces.service_interfaces import MonitoringServiceInterface

logger = structlog.get_logger()

router = APIRouter()

# WebSocket connections
active_connections: Dict[str, WebSocket] = {}
subscription_map: Dict[str, Dict[str, str]] = {}  # client_id -> {service_name: subscription_id}

@router.get("/")
async def list_monitoring_services():
    """List all available monitoring services."""
    try:
        # Get monitoring services from container
        monitoring_service = await get_monitoring_service("screenshot")
        
        return {
            "status": "success",
            "services": ["screenshot"]  # Add more as they're implemented
        }
    except Exception as e:
        logger.error("Error listing monitoring services", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/screenshot")
async def get_screenshot_data():
    """Get the latest screenshot data."""
    try:
        screenshot_service = await get_monitoring_service("screenshot")
        data = await screenshot_service.get_latest_data()
        
        return {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "data": data
        }
    except Exception as e:
        logger.error("Error getting screenshot data", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/screenshot/analyze")
async def analyze_screenshot():
    """Capture and analyze a screenshot."""
    try:
        screenshot_service = await get_monitoring_service("screenshot")
        analysis = await screenshot_service.capture_and_analyze()
        
        return {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "analysis": analysis
        }
    except Exception as e:
        logger.error("Error analyzing screenshot", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/screenshot/history")
async def get_screenshot_history(limit: int = 10):
    """Get screenshot history."""
    try:
        screenshot_service = await get_monitoring_service("screenshot")
        history = await screenshot_service.get_history(limit=limit)
        
        return {
            "status": "success",
            "timestamp": datetime.utcnow().isoformat(),
            "history": history
        }
    except Exception as e:
        logger.error("Error getting screenshot history", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.websocket("/ws")
async def monitoring_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time monitoring updates."""
    client_id = str(uuid.uuid4())
    
    try:
        await websocket.accept()
        active_connections[client_id] = websocket
        subscription_map[client_id] = {}
        
        # Send welcome message
        await websocket.send_json({
            "type": "welcome",
            "client_id": client_id,
            "timestamp": datetime.utcnow().isoformat(),
            "available_services": ["screenshot"]  # Add more as they're implemented
        })
        
        # Handle client messages
        while True:
            try:
                message = await websocket.receive_json()
                
                if message.get("type") == "subscribe":
                    service_name = message.get("service")
                    if service_name == "screenshot":
                        await handle_screenshot_subscription(client_id, websocket)
                    else:
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Unknown service: {service_name}"
                        })
                        
                elif message.get("type") == "unsubscribe":
                    service_name = message.get("service")
                    await handle_unsubscription(client_id, service_name)
                    
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
        await cleanup_client(client_id)
        
    except Exception as e:
        logger.error("Error in monitoring WebSocket", client_id=client_id, error=str(e))
        await cleanup_client(client_id)
        if websocket.client_state.connected:
            await websocket.close()

async def handle_screenshot_subscription(client_id: str, websocket: WebSocket):
    """Handle subscription to screenshot service."""
    try:
        screenshot_service = await get_monitoring_service("screenshot")
        
        # Define callback for screenshot updates
        async def screenshot_callback(data):
            if client_id in active_connections:
                client_ws = active_connections[client_id]
                try:
                    # Send minimal data without the image content
                    minimal_data = {
                        "id": data.id,
                        "timestamp": data.timestamp.isoformat(),
                        "width": data.width,
                        "height": data.height,
                        "format": data.format
                    }
                    
                    await client_ws.send_json({
                        "type": "screenshot_update",
                        "data": minimal_data
                    })
                except Exception as e:
                    logger.error("Error sending screenshot update", 
                               client_id=client_id, error=str(e))
        
        # Subscribe to screenshot service
        subscription_id = await screenshot_service.subscribe(screenshot_callback)
        
        # Store subscription
        subscription_map[client_id]["screenshot"] = subscription_id
        
        # Confirm subscription
        await websocket.send_json({
            "type": "subscription_confirmed",
            "service": "screenshot",
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error("Error subscribing to screenshot service", 
                   client_id=client_id, error=str(e))
        await websocket.send_json({
            "type": "error",
            "message": f"Failed to subscribe to screenshot service: {str(e)}"
        })

async def handle_unsubscription(client_id: str, service_name: str):
    """Handle unsubscription from a service."""
    try:
        if client_id in subscription_map and service_name in subscription_map[client_id]:
            subscription_id = subscription_map[client_id][service_name]
            
            if service_name == "screenshot":
                screenshot_service = await get_monitoring_service("screenshot")
                await screenshot_service.unsubscribe(subscription_id)
            
            # Remove subscription
            del subscription_map[client_id][service_name]
            
            # Confirm unsubscription
            if client_id in active_connections:
                await active_connections[client_id].send_json({
                    "type": "unsubscription_confirmed",
                    "service": service_name,
                    "timestamp": datetime.utcnow().isoformat()
                })
                
    except Exception as e:
        logger.error("Error unsubscribing from service", 
                   client_id=client_id, service=service_name, error=str(e))

async def cleanup_client(client_id: str):
    """Clean up client resources on disconnect."""
    try:
        # Unsubscribe from all services
        if client_id in subscription_map:
            for service_name, subscription_id in subscription_map[client_id].items():
                if service_name == "screenshot":
                    screenshot_service = await get_monitoring_service("screenshot")
                    await screenshot_service.unsubscribe(subscription_id)
            
            # Remove subscriptions
            del subscription_map[client_id]
        
        # Remove connection
        if client_id in active_connections:
            del active_connections[client_id]
            
        logger.info("Cleaned up client resources", client_id=client_id)
        
    except Exception as e:
        logger.error("Error cleaning up client resources", 
                   client_id=client_id, error=str(e)) 