import asyncio
import logging
import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import structlog

# Import service interfaces
from services.api.interfaces.service_interfaces import (
    AIServiceInterface,
    AudioServiceInterface,
    MonitoringServiceInterface
)

# Import service implementations
from services.api.adapters.claude_adapter import ClaudeAdapter
from services.api.adapters.elevenlabs_adapter import ElevenLabsAdapter
from services.monitoring.screenshot import ScreenshotService, ScreenshotConfig
from services.api.core.container import get_container, service_scope

# Configure logging
structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer()
    ]
)
logger = structlog.get_logger()

# Create FastAPI app
app = FastAPI(
    title="System Context Monitor",
    description="Integrated monitoring and AI services",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("Starting application")
    
    # Get service container
    container = get_container()
    
    # Register service implementations
    container.register(AIServiceInterface, ClaudeAdapter)
    container.register(AudioServiceInterface, ElevenLabsAdapter)
    
    # Configure and register monitoring services
    screenshot_service = ScreenshotService(
        config=ScreenshotConfig(
            interval=5.0,
            save_dir=os.path.join(os.getcwd(), "screenshots"),
            enabled=True
        )
    )
    
    # Create a registry of monitoring services
    monitoring_services = {
        "screenshot": screenshot_service
    }
    
    # Register the monitoring services registry
    container._services["monitoring_services"] = lambda: monitoring_services
    container._instances["monitoring_services"] = monitoring_services
    
    # Start monitoring services
    for name, service in monitoring_services.items():
        await service.initialize()
        await service.start_monitoring()
        logger.info(f"Started monitoring service: {name}")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    logger.info("Shutting down application")
    
    async with service_scope() as container:
        # Get monitoring services
        monitoring_services = container._instances.get("monitoring_services", {})
        
        # Stop monitoring services
        for name, service in monitoring_services.items():
            await service.stop_monitoring()
            await service.cleanup()
            logger.info(f"Stopped monitoring service: {name}")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

# Import and include routers
from services.api.routers import monitoring, mcp, tools

app.include_router(monitoring.router, prefix="/api/monitoring", tags=["monitoring"])
app.include_router(mcp.router, prefix="/api/mcp", tags=["mcp"])
app.include_router(tools.router, prefix="/api/tools", tags=["tools"])

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 