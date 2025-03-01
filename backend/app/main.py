from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="MCP Router Backend",
    description="Backend services for MCP Router",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routes
try:
    from app.services.ai_integration import create_ai_router
    # Include routers
    app.include_router(create_ai_router())
except ImportError as e:
    logger.error(f"Failed to import AI router: {e}")

@app.get("/")
async def root():
    return {"message": "MCP Router Backend API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True) 