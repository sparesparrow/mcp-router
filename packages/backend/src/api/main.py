from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
import structlog
from contextlib import asynccontextmanager

from .routers import mcp_router, tools_router, workflows_router
from .infrastructure.service_registry import ServiceRegistry, get_service_registry
from .infrastructure.service_provider import service_scope
from .interfaces.ai_service import AIService, ToolsEnabledAIService
from .interfaces.audio_service import AudioService
from .interfaces.websocket_manager import WebSocketManager
from .services.claude_service import ClaudeAIService
from .services.elevenlabs_service import ElevenLabsAudioService
from .services.websocket_manager import DefaultWebSocketManager

# Set up logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

# Register services
def register_services():
    """Register service implementations."""
    registry = get_service_registry()
    
    # Register AI service
    registry.register(AIService, ClaudeAIService)
    registry.register(ToolsEnabledAIService, ClaudeAIService)
    
    # Register Audio service
    registry.register(AudioService, ElevenLabsAudioService)
    
    # Register WebSocket manager
    registry.register(WebSocketManager, DefaultWebSocketManager)
    
    logger.info("Services registered")

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI."""
    # Register services
    register_services()
    
    # Create service provider scope
    async with service_scope() as provider:
        # Set provider on app state
        app.state.service_provider = provider
        
        logger.info("Application startup complete")
        yield
        logger.info("Application shutdown")

# Create FastAPI app
app = FastAPI(
    title="MCP Router Backend",
    description="Backend services for MCP Router",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add service provider middleware
@app.middleware("http")
async def service_provider_middleware(request: Request, call_next):
    """Middleware to add service provider to request state."""
    # Get service provider from app state
    request.state.service_provider = app.state.service_provider
    
    # Continue processing
    response = await call_next(request)
    return response

# Include routers
app.include_router(mcp_router.router, prefix="/api/mcp", tags=["mcp"])
app.include_router(tools_router.router, prefix="/api/tools", tags=["tools"])
app.include_router(workflows_router.router, prefix="/api/workflows", tags=["workflows"])

@app.get("/")
async def root():
    return {"message": "MCP Router Backend API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("api.main:app", host="0.0.0.0", port=port, reload=True) 