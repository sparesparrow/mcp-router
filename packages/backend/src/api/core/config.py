from typing import Optional, Dict, Any
from pydantic_settings import BaseSettings
import redis
import os
from pathlib import Path

class Settings(BaseSettings):
    """Application settings."""
    
    # Base
    PROJECT_NAME: str = "System Context Monitor"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: list = ["http://localhost:5173"]
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/systemcontext"
    )
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis_client: Optional[redis.Redis] = None
    
    # Rate Limiting
    RATE_LIMIT_DEFAULT: int = 100  # requests per minute
    RATE_LIMIT_BURST: int = 200
    
    # WebSocket
    WS_MESSAGE_QUEUE: str = "ws_messages"
    WS_HEARTBEAT_INTERVAL: int = 30  # seconds
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    
    class Config:
        case_sensitive = True

# Create settings instance
settings = Settings()

# Initialize Redis client
settings.redis_client = redis.from_url(
    settings.REDIS_URL,
    decode_responses=True,
    socket_timeout=5,
    socket_connect_timeout=5,
    socket_keepalive=True,
    health_check_interval=30
) 