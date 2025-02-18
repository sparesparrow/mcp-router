"""
Shared test fixtures for the System Context Monitor.
"""

import pytest
import asyncio
import os
from typing import Dict, Any
from datetime import datetime
from uuid import uuid4
import redis
from fastapi import FastAPI
from fastapi.testclient import TestClient

from services.api.core.config import settings
from services.api.mcp.tools import Tool
from services.api.models.messages import (
    ProtocolVersion,
    MessageType
)

@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
def base_monitoring_config() -> Dict[str, Any]:
    """Provide base monitoring configuration for testing."""
    return {
        "screenshot": {
            "interval_seconds": 0.1,  # Fast intervals for testing
            "max_samples": 5,
            "retention_hours": 1,
            "output_dir": "test_screenshots",
            "max_dimension": 800,
            "compression_quality": 85
        },
        "network": {
            "interval_seconds": 0.1,
            "max_samples": 5,
            "retention_hours": 1,
            "capture_connections": True,
            "capture_io_counters": True,
            "excluded_ports": [0]
        },
        "clipboard": {
            "interval_seconds": 0.1,
            "max_samples": 5,
            "retention_hours": 1,
            "max_content_length": 1000,
            "hash_content": True
        }
    }

@pytest.fixture
def test_context() -> Dict[str, Any]:
    """Create a test context with valid configuration."""
    return {
        "monitoring_config": {
            "screenshot": {
                "interval_seconds": 60,
                "max_samples": 5,
                "retention_hours": 1,
                "output_dir": "test_screenshots",
                "max_dimension": 800,
                "compression_quality": 85,
                "resource_limits": {
                    "memory_mb": 100,
                    "cpu_percent": 10
                }
            },
            "network": {
                "interval_seconds": 5,
                "max_samples": 5,
                "retention_hours": 1,
                "capture_connections": True,
                "capture_io_counters": True,
                "excluded_ports": [0],
                "resource_limits": {
                    "memory_mb": 300,
                    "cpu_percent": 15
                }
            },
            "clipboard": {
                "interval_seconds": 5,
                "max_samples": 5,
                "retention_hours": 1,
                "max_content_length": 1000,
                "hash_content": True,
                "resource_limits": {
                    "memory_mb": 200,
                    "cpu_percent": 10
                }
            }
        },
        "enabled_services": ["screenshot", "network", "clipboard"]
    }

@pytest.fixture(autouse=True)
async def cleanup_test_files():
    """Clean up test files after each test."""
    yield
    # Clean up test directories
    test_dirs = ["test_screenshots"]
    for dir_path in test_dirs:
        if os.path.exists(dir_path):
            for file_name in os.listdir(dir_path):
                file_path = os.path.join(dir_path, file_name)
                try:
                    os.remove(file_path)
                except Exception:
                    pass
            try:
                os.rmdir(dir_path)
            except Exception:
                pass

@pytest.fixture
def mock_metrics(mocker):
    """Mock Prometheus metrics for testing."""
    return {
        "counter": mocker.Mock(),
        "histogram": mocker.Mock(),
        "gauge": mocker.Mock()
    }

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Set up test environment."""
    # Use test database
    settings.DATABASE_URL = settings.DATABASE_URL.replace(
        "systemcontext",
        "systemcontext_test"
    )
    
    # Use test Redis database
    settings.REDIS_URL = settings.REDIS_URL.replace(
        "redis://localhost:6379/0",
        "redis://localhost:6379/1"
    )
    
    # Reconnect Redis client
    settings.redis_client = redis.from_url(
        settings.REDIS_URL,
        decode_responses=True
    )
    
    yield
    
    # Clean up
    settings.redis_client.flushdb()

@pytest.fixture
def test_app():
    """Create test FastAPI application."""
    app = FastAPI()
    return app

@pytest.fixture
def test_client(test_app):
    """Create test client."""
    return TestClient(test_app)

@pytest.fixture
def valid_api_key():
    """Get valid API key for testing."""
    return "mcp_test_key"

@pytest.fixture
def test_tool():
    """Create test tool."""
    return Tool(
        name="test_tool",
        description="A test tool",
        version="1.0.0",
        capabilities={
            "required_params": ["param1"],
            "param_types": {"param1": "str"}
        }
    )

@pytest.fixture
def valid_request():
    """Create valid request message."""
    return {
        "protocol_version": ProtocolVersion.V2_0,
        "message_type": MessageType.REQUEST,
        "message_id": str(uuid4()),
        "timestamp": datetime.utcnow().isoformat(),
        "method": "test_tool",
        "params": {
            "tool": "test_tool",
            "params": {"param1": "test_value"}
        }
    }

@pytest.fixture
def valid_response():
    """Create valid response message."""
    return {
        "protocol_version": ProtocolVersion.V2_0,
        "message_type": MessageType.RESPONSE,
        "message_id": str(uuid4()),
        "timestamp": datetime.utcnow().isoformat(),
        "request_id": str(uuid4()),
        "result": {"status": "success"}
    }

@pytest.fixture
def valid_event():
    """Create valid event message."""
    return {
        "protocol_version": ProtocolVersion.V2_0,
        "message_type": MessageType.EVENT,
        "message_id": str(uuid4()),
        "timestamp": datetime.utcnow().isoformat(),
        "event_type": "test_event",
        "data": {"event": "data"}
    } 