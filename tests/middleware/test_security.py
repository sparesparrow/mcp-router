import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
import json
from datetime import datetime, timedelta

from services.api.middleware.security import SecurityMiddleware, RateLimiter
from services.api.core.config import settings

@pytest.fixture
def app():
    app = FastAPI()
    app.add_middleware(
        SecurityMiddleware,
        validate_keys=True,
        rate_limit=True,
        max_requests=2
    )
    
    @app.get("/api/test")
    async def test_endpoint():
        return {"status": "ok"}
        
    @app.get("/public/test")
    async def public_endpoint():
        return {"status": "ok"}
    
    return app

@pytest.fixture
def client(app):
    return TestClient(app)

@pytest.fixture
def valid_api_key():
    return "mcp_test_key"

class TestSecurityMiddleware:
    def test_public_endpoint_no_key(self, client):
        """Test public endpoint access without API key."""
        response = client.get("/public/test")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_api_endpoint_no_key(self, client):
        """Test API endpoint access without API key."""
        response = client.get("/api/test")
        assert response.status_code == 401
        assert response.json()["code"] == "INVALID_API_KEY"

    def test_api_endpoint_valid_key(self, client, valid_api_key):
        """Test API endpoint access with valid API key."""
        response = client.get(
            "/api/test",
            headers={"X-API-Key": valid_api_key}
        )
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_api_endpoint_invalid_key(self, client):
        """Test API endpoint access with invalid API key."""
        response = client.get(
            "/api/test",
            headers={"X-API-Key": "invalid_key"}
        )
        assert response.status_code == 401
        assert response.json()["code"] == "INVALID_API_KEY"

    def test_rate_limit_exceeded(self, client, valid_api_key):
        """Test rate limiting."""
        # First request
        response = client.get(
            "/api/test",
            headers={"X-API-Key": valid_api_key}
        )
        assert response.status_code == 200

        # Second request
        response = client.get(
            "/api/test",
            headers={"X-API-Key": valid_api_key}
        )
        assert response.status_code == 200

        # Third request (should be rate limited)
        response = client.get(
            "/api/test",
            headers={"X-API-Key": valid_api_key}
        )
        assert response.status_code == 429
        assert response.json()["code"] == "RATE_LIMIT_EXCEEDED"

    def test_rate_limit_reset(self, client, valid_api_key):
        """Test rate limit reset after window."""
        # First request
        response = client.get(
            "/api/test",
            headers={"X-API-Key": valid_api_key}
        )
        assert response.status_code == 200

        # Second request
        response = client.get(
            "/api/test",
            headers={"X-API-Key": valid_api_key}
        )
        assert response.status_code == 200

        # Wait for rate limit window to reset
        settings.redis_client.flushall()

        # Third request (should succeed after reset)
        response = client.get(
            "/api/test",
            headers={"X-API-Key": valid_api_key}
        )
        assert response.status_code == 200

    def test_security_headers(self, client, valid_api_key):
        """Test security headers in response."""
        response = client.get(
            "/api/test",
            headers={"X-API-Key": valid_api_key}
        )
        assert response.status_code == 200
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert response.headers["X-Frame-Options"] == "DENY"
        assert response.headers["X-XSS-Protection"] == "1; mode=block"
        assert "max-age=31536000" in response.headers["Strict-Transport-Security"]

    def test_middleware_error_handling(self, client):
        """Test middleware error handling."""
        # Simulate Redis failure
        settings.redis_client.close()
        
        response = client.get(
            "/api/test",
            headers={"X-API-Key": "mcp_test_key"}
        )
        assert response.status_code == 500
        assert response.json()["code"] == "SECURITY_CHECK_FAILED"
        
        # Restore Redis connection
        settings.redis_client = redis.from_url(settings.REDIS_URL)

class TestRateLimiter:
    @pytest.fixture
    def rate_limiter(self):
        return RateLimiter(settings.redis_client)

    async def test_check_rate_limit_within_limit(self, rate_limiter):
        """Test rate limit check within limit."""
        key = "test_key"
        max_requests = 3
        
        # Make requests within limit
        for _ in range(max_requests):
            assert await rate_limiter.check_rate_limit(key, max_requests) is True

    async def test_check_rate_limit_exceeded(self, rate_limiter):
        """Test rate limit check when exceeded."""
        key = "test_key"
        max_requests = 2
        
        # Make requests up to limit
        for _ in range(max_requests):
            assert await rate_limiter.check_rate_limit(key, max_requests) is True
            
        # Exceed limit
        assert await rate_limiter.check_rate_limit(key, max_requests) is False

    async def test_rate_limit_window_reset(self, rate_limiter):
        """Test rate limit reset after window."""
        key = "test_key"
        max_requests = 2
        
        # Make requests up to limit
        for _ in range(max_requests):
            assert await rate_limiter.check_rate_limit(key, max_requests) is True
            
        # Clear Redis to simulate window reset
        settings.redis_client.flushall()
        
        # Should succeed after reset
        assert await rate_limiter.check_rate_limit(key, max_requests) is True

    async def test_redis_failure_handling(self, rate_limiter):
        """Test handling of Redis failures."""
        key = "test_key"
        max_requests = 2
        
        # Close Redis connection to simulate failure
        settings.redis_client.close()
        
        # Should fail open
        assert await rate_limiter.check_rate_limit(key, max_requests) is True
        
        # Restore Redis connection
        settings.redis_client = redis.from_url(settings.REDIS_URL) 