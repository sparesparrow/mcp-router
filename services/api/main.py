from typing import Dict, Any, Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import socketio
import asyncio
import logging
import json
from datetime import datetime, UTC
from pydantic import BaseModel
import redis
import sqlalchemy
from sqlalchemy import text
import structlog

from core.cognitive.orchestrator import CognitiveOrchestrator, WorkflowContext
from core.cognitive.workflows import SystemMonitoringWorkflow
from services.transport.factory import TransportFactory, TransportType

# Initialize FastAPI app
app = FastAPI(title="System Context Monitor")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:80", "http://localhost"],  # Add port 80
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Socket.IO
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=["http://localhost:5173", "http://localhost:80", "http://localhost"]  # Add port 80
)
socket_app = socketio.ASGIApp(sio)
app.mount("/ws", socket_app)

# Initialize components
orchestrator = CognitiveOrchestrator()
transport = TransportFactory.create_transport(TransportType.HTTP)
logger = structlog.get_logger()

# Pydantic models for API
class ContextUpdate(BaseModel):
    """Model for context updates."""
    screenshots: Optional[List[Dict[str, Any]]] = None
    clipboard: Optional[List[Dict[str, Any]]] = None
    network: Optional[List[Dict[str, Any]]] = None
    workflows: Optional[List[Dict[str, Any]]] = None

class WorkflowExecution(BaseModel):
    """Model for workflow execution requests."""
    workflow_id: str
    context: Dict[str, Any]

# Store active client sessions
active_sessions: Dict[str, Dict[str, Any]] = {}

@app.on_event("startup")
async def startup_event():
    """Initialize components on startup."""
    # Register workflows
    await orchestrator.register_workflow("system_monitoring", SystemMonitoringWorkflow)
    
    # Connect transport
    await transport.connect()
    
    # Register transport message handlers
    transport.register_handler("context_update", handle_context_update)
    
    logger.info("System initialized successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    await transport.disconnect()
    logger.info("System shut down successfully")

@sio.event
async def connect(sid, environ):
    """Handle client connection."""
    logger.info(f"Client connected: {sid}")
    active_sessions[sid] = {
        "connected_at": datetime.now(UTC),
        "last_update": datetime.now(UTC)
    }
    
    # Send initial context
    try:
        context = await get_current_context()
        await sio.emit("context_update", context, room=sid)
    except Exception as e:
        logger.error(f"Error sending initial context: {str(e)}", exc_info=True)

@sio.event
async def disconnect(sid):
    """Handle client disconnection."""
    active_sessions.pop(sid, None)
    logger.info(f"Client disconnected: {sid}")

async def handle_context_update(data: Dict[str, Any]) -> None:
    """Handle context updates from monitoring services."""
    try:
        update = ContextUpdate(**data)
        
        # Broadcast update to all connected clients
        await sio.emit("context_update", update.dict(exclude_none=True))
        
        logger.debug("Context update broadcast to clients", update=update)
        
    except Exception as e:
        logger.error(f"Error handling context update: {str(e)}", exc_info=True)

@app.get("/api/context")
async def get_current_context() -> Dict[str, Any]:
    """Get current system context."""
    try:
        # Get workflow states
        workflows = await orchestrator.list_active_workflows()
        
        # Get monitoring metrics
        metrics = await transport.send_request("get_metrics", {})
        
        return {
            "screenshots": metrics.get("screenshots", []),
            "clipboard": metrics.get("clipboard", []),
            "network": metrics.get("network", []),
            "workflows": [w.dict() for w in workflows]
        }
        
    except Exception as e:
        logger.error(f"Error getting context: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/workflows/execute")
async def execute_workflow(execution: WorkflowExecution) -> Dict[str, Any]:
    """Execute a workflow."""
    try:
        # Validate context
        context = WorkflowContext(**execution.context)
        
        # Execute workflow
        execution_id = await orchestrator.execute_workflow(
            execution.workflow_id,
            context.dict()
        )
        
        return {
            "execution_id": execution_id,
            "status": "started"
        }
        
    except Exception as e:
        logger.error(f"Error executing workflow: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/workflows/{execution_id}/status")
async def get_workflow_status(execution_id: str) -> Dict[str, Any]:
    """Get workflow execution status."""
    try:
        state = await orchestrator.get_workflow_state(execution_id)
        if not state:
            raise HTTPException(status_code=404, detail="Workflow execution not found")
            
        return state.dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting workflow status: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/workflows")
async def list_workflows() -> Dict[str, Any]:
    """List available and active workflows."""
    try:
        active_workflows = await orchestrator.list_active_workflows()
        
        return {
            "available_workflows": ["system_monitoring"],  # Add more as they're implemented
            "active_workflows": [w.dict() for w in active_workflows]
        }
        
    except Exception as e:
        logger.error(f"Error listing workflows: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint for container orchestration."""
    try:
        # Check database connection
        from services.api.database import engine
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        # Check Redis connection
        from services.api.redis import redis_client
        redis_client.ping()

        return {
            "status": "healthy",
            "database": "connected",
            "redis": "connected"
        }
    except sqlalchemy.exc.SQLAlchemyError as e:
        logger.error("Database health check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Database connection failed")
    except redis.RedisError as e:
        logger.error("Redis health check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Redis connection failed")
    except Exception as e:
        logger.error("Health check failed", error=str(e))
        raise HTTPException(status_code=503, detail="Service unhealthy")

# Import and include routers
from services.api.routers import tools, monitoring

app.include_router(tools.router, prefix="/api/tools", tags=["tools"])
app.include_router(monitoring.router, prefix="/api/monitoring", tags=["monitoring"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 