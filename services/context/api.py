from typing import Dict, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
from datetime import datetime

from core.agents.context_shepherd import ContextShepherd, ContextData
from core.cognitive.orchestrator import CognitiveOrchestrator, WorkflowState
from services.monitoring.screenshot.screenshot_service import ScreenshotService, ScreenshotConfig
from services.monitoring.clipboard.clipboard_service import ClipboardService, ClipboardConfig
from services.monitoring.network.network_service import NetworkService, NetworkConfig

app = FastAPI(title="System Context Monitor API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
context_shepherd = ContextShepherd()
cognitive_orchestrator = CognitiveOrchestrator()

# Screenshot service
screenshot_service = ScreenshotService(
    config=ScreenshotConfig(
        interval=5,  # 5 seconds between captures
        max_size=(1920, 1080),
        quality=85
    )
)

# Clipboard service
clipboard_service = ClipboardService(
    config=ClipboardConfig(
        interval=0.5,  # 0.5 seconds between checks
        max_content_length=1_000_000,
        store_history=True,
        max_history_items=100
    )
)

# Network service
network_service = NetworkService(
    config=NetworkConfig(
        interval=1.0,  # 1 second between captures
        capture_connections=True,
        capture_io_counters=True,
        max_connections=1000,
        include_processes=True
    )
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except WebSocketDisconnect:
                self.disconnect(connection)
            except Exception as e:
                print(f"Error broadcasting to client: {e}")

manager = ConnectionManager()

# API Models
class ContextUpdate(BaseModel):
    source: str
    content: Dict
    importance: float = 1.0

class WorkflowExecution(BaseModel):
    workflow_id: str
    context: Dict

# Routes
@app.get("/api/context")
async def get_context():
    """Get the current system context."""
    try:
        context = await context_shepherd.get_current_context()
        workflows = await cognitive_orchestrator.list_active_workflows()
        
        # Get latest monitoring data
        screenshot = await screenshot_service.get_last_screenshot()
        clipboard_history = await clipboard_service.get_history(limit=10)
        network = await network_service.get_last_capture()
        
        return {
            "context": context,
            "workflows": workflows,
            "monitoring": {
                "screenshot": screenshot.dict() if screenshot else None,
                "clipboard": [item.dict() for item in clipboard_history],
                "network": network.dict() if network else None
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/context")
async def update_context(update: ContextUpdate):
    """Update the system context."""
    try:
        await context_shepherd.add_context(
            source=update.source,
            content=update.content,
            importance=update.importance
        )
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/workflows")
async def execute_workflow(execution: WorkflowExecution):
    """Execute a cognitive workflow."""
    try:
        execution_id = await cognitive_orchestrator.execute_workflow(
            workflow_id=execution.workflow_id,
            context=execution.context
        )
        return {"execution_id": execution_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/workflows/{execution_id}")
async def get_workflow_state(execution_id: str):
    """Get the state of a workflow execution."""
    state = await cognitive_orchestrator.get_workflow_state(execution_id)
    if not state:
        raise HTTPException(status_code=404, detail="Workflow execution not found")
    return state

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await manager.connect(websocket)
    try:
        # Subscribe to context updates
        async def context_update_handler(source: str, data: ContextData):
            await manager.broadcast({
                "type": "context_update",
                "source": source,
                "data": data.dict()
            })

        # Subscribe to screenshot updates
        async def screenshot_handler(data):
            await manager.broadcast({
                "type": "screenshot_update",
                "data": data.dict()
            })

        # Subscribe to clipboard updates
        async def clipboard_handler(data):
            await manager.broadcast({
                "type": "clipboard_update",
                "data": data.dict()
            })

        # Subscribe to network updates
        async def network_handler(data):
            await manager.broadcast({
                "type": "network_update",
                "data": data.dict()
            })

        # Register all subscribers
        await context_shepherd.subscribe(context_update_handler)
        await screenshot_service.subscribe(screenshot_handler)
        await clipboard_service.subscribe(clipboard_handler)
        await network_service.subscribe(network_handler)

        # Handle incoming messages
        while True:
            try:
                data = await websocket.receive_json()
                # Process incoming messages if needed
                print(f"Received WebSocket message: {data}")
            except WebSocketDisconnect:
                break
            except Exception as e:
                print(f"Error processing WebSocket message: {e}")
                break

    finally:
        # Unsubscribe from all services
        await context_shepherd.unsubscribe(context_update_handler)
        await screenshot_service.unsubscribe(screenshot_handler)
        await clipboard_service.unsubscribe(clipboard_handler)
        await network_service.unsubscribe(network_handler)
        manager.disconnect(websocket)

# Background tasks
@app.on_event("startup")
async def startup_event():
    """Start background tasks on application startup."""
    # Start all monitoring services
    asyncio.create_task(screenshot_service.start_capture())
    asyncio.create_task(clipboard_service.start_monitoring())
    asyncio.create_task(network_service.start_monitoring())

    # Subscribe monitoring services to context shepherd
    async def handle_screenshot(screenshot_data):
        await context_shepherd.add_context(
            source="screenshot",
            content=screenshot_data.dict(),
            importance=0.8
        )

    async def handle_clipboard(clipboard_data):
        await context_shepherd.add_context(
            source="clipboard",
            content=clipboard_data.dict(),
            importance=0.6
        )

    async def handle_network(network_data):
        await context_shepherd.add_context(
            source="network",
            content=network_data.dict(),
            importance=0.7
        )

    await screenshot_service.subscribe(handle_screenshot)
    await clipboard_service.subscribe(handle_clipboard)
    await network_service.subscribe(handle_network)

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on application shutdown."""
    await screenshot_service.stop_capture()
    await clipboard_service.stop_monitoring()
    await network_service.stop_monitoring()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 