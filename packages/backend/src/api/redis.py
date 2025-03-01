import redis
import os
from typing import Optional
import structlog
from tenacity import retry, stop_after_attempt, wait_exponential

logger = structlog.get_logger()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Redis client with connection pooling
redis_client = redis.from_url(
    REDIS_URL,
    decode_responses=True,  # Automatically decode responses to strings
    socket_timeout=5,  # Socket timeout
    socket_connect_timeout=5,  # Connection timeout
    socket_keepalive=True,  # Keep connections alive
    health_check_interval=30,  # Periodic health checks
)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
def get_redis() -> redis.Redis:
    """Get Redis client with connection retry logic."""
    try:
        redis_client.ping()
        return redis_client
    except redis.RedisError as e:
        logger.error("Redis connection failed", error=str(e))
        raise

def get_cache(key: str) -> Optional[str]:
    """Get value from cache with error handling."""
    try:
        return redis_client.get(key)
    except redis.RedisError as e:
        logger.error("Failed to get cache", key=key, error=str(e))
        return None

def set_cache(key: str, value: str, expire: int = 3600) -> bool:
    """Set value in cache with error handling."""
    try:
        return redis_client.set(key, value, ex=expire)
    except redis.RedisError as e:
        logger.error("Failed to set cache", key=key, error=str(e))
        return False

def delete_cache(key: str) -> bool:
    """Delete value from cache with error handling."""
    try:
        return bool(redis_client.delete(key))
    except redis.RedisError as e:
        logger.error("Failed to delete cache", key=key, error=str(e))
        return False 