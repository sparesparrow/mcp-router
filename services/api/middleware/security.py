from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import json
import structlog
from redis import Redis
from ..core.config import settings

logger = structlog.get_logger()

class RateLimiter:
    """Rate limiter using Redis."""
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.window = 60  # 1 minute window
        
    async def check_rate_limit(self, key: str, max_requests: int) -> bool:
        """Check if request is within rate limit."""
        current = int(datetime.utcnow().timestamp())
        window_key = f"ratelimit:{key}:{current // self.window}"
        
        try:
            count = self.redis.incr(window_key)
            if count == 1:
                self.redis.expire(window_key, self.window)
            return count <= max_requests
        except Exception as e:
            logger.error("rate_limit_check_failed", error=str(e))
            return True  # Fail open if Redis is unavailable

class SecurityMiddleware(BaseHTTPMiddleware):
    """Security middleware for request validation and rate limiting."""
    
    def __init__(
        self,
        app,
        validate_keys: bool = True,
        rate_limit: bool = True,
        max_requests: int = 100
    ):
        super().__init__(app)
        self.validate_keys = validate_keys
        self.rate_limit = rate_limit
        self.max_requests = max_requests
        self.rate_limiter = RateLimiter(settings.redis_client)
        self.logger = logger.bind(component="security_middleware")
        
    async def dispatch(self, request: Request, call_next) -> Response:
        """Process the request through security checks."""
        try:
            # Skip middleware for non-API routes
            if not request.url.path.startswith("/api/"):
                return await call_next(request)
            
            # Validate API key
            if self.validate_keys:
                api_key = request.headers.get("X-API-Key")
                if not await self._validate_api_key(api_key):
                    return Response(
                        content=json.dumps({
                            "error": "Invalid API key",
                            "code": "INVALID_API_KEY"
                        }),
                        status_code=401,
                        media_type="application/json"
                    )
            
            # Check rate limit
            if self.rate_limit:
                client_id = self._get_client_id(request)
                if not await self.rate_limiter.check_rate_limit(client_id, self.max_requests):
                    return Response(
                        content=json.dumps({
                            "error": "Rate limit exceeded",
                            "code": "RATE_LIMIT_EXCEEDED"
                        }),
                        status_code=429,
                        media_type="application/json"
                    )
            
            # Process request
            response = await call_next(request)
            
            # Add security headers
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
            
            return response
            
        except Exception as e:
            self.logger.error("security_check_failed",
                            error=str(e),
                            path=request.url.path)
            return Response(
                content=json.dumps({
                    "error": "Security check failed",
                    "code": "SECURITY_CHECK_FAILED"
                }),
                status_code=500,
                media_type="application/json"
            )
    
    async def _validate_api_key(self, api_key: Optional[str]) -> bool:
        """Validate API key."""
        if not api_key:
            return False
            
        try:
            # Check against Redis cache first
            cache_key = f"apikey:{api_key}"
            if settings.redis_client.exists(cache_key):
                return True
                
            # Check against database
            # This is a placeholder - implement your actual validation logic
            is_valid = api_key.startswith("mcp_")
            
            # Cache result
            if is_valid:
                settings.redis_client.setex(cache_key, 3600, "1")
                
            return is_valid
            
        except Exception as e:
            self.logger.error("api_key_validation_failed", error=str(e))
            return False
    
    def _get_client_id(self, request: Request) -> str:
        """Get client identifier for rate limiting."""
        # Use API key if available
        api_key = request.headers.get("X-API-Key")
        if api_key:
            return f"apikey:{api_key}"
            
        # Fall back to IP address
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return f"ip:{forwarded_for.split(',')[0].strip()}"
            
        return f"ip:{request.client.host}" 