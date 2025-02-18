import pytest
from fastapi.testclient import TestClient
import json
from datetime import datetime
from uuid import uuid4

from services.api.mcp.server import MCPServer
from services.api.mcp.tools import Tool
from services.api.models.messages import (
    ProtocolVersion,
    MessageType,
    ProtocolError
)

@pytest.fixture
def server():
    return MCPServer(
        validate_keys=True,
        rate_limit=True,
        max_requests=100
    )

@pytest.fixture
def client(server):
    return TestClient(server.get_app())

@pytest.fixture
def valid_api_key():
    return "mcp_test_key"

@pytest.fixture
def test_tool():
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

class TestMCPServer:
    async def test_tool_execution(self, server, client, test_tool, valid_request, valid_api_key):
        """Test tool execution through REST API."""
        # Register tool
        await server.tool_registry.register_tool(test_tool)
        
        response = client.post(
            "/api/tools/execute",
            json=valid_request,
            headers={"X-API-Key": valid_api_key}
        )
        
        assert response.status_code == 200
        assert response.json()["message_type"] == MessageType.RESPONSE
        assert response.json()["request_id"] == valid_request["message_id"]
        assert "result" in response.json()

    async def test_list_tools(self, server, client, test_tool, valid_api_key):
        """Test listing available tools."""
        # Register tool
        await server.tool_registry.register_tool(test_tool)
        
        response = client.get(
            "/api/tools/list",
            headers={"X-API-Key": valid_api_key}
        )
        
        assert response.status_code == 200
        assert response.json()["message_type"] == MessageType.RESPONSE
        assert len(response.json()["result"]["tools"]) == 1
        assert response.json()["result"]["tools"][0]["name"] == test_tool.name

    async def test_websocket_communication(self, server, test_tool, valid_api_key):
        """Test WebSocket communication."""
        # Register tool
        await server.tool_registry.register_tool(test_tool)
        
        with TestClient(server.get_app()) as client:
            with client.websocket_connect("/ws") as websocket:
                # Send request
                await websocket.send_json({
                    "protocol_version": ProtocolVersion.V2_0,
                    "message_type": MessageType.REQUEST,
                    "message_id": str(uuid4()),
                    "timestamp": datetime.utcnow().isoformat(),
                    "method": "test_tool",
                    "params": {
                        "param1": "test_value"
                    }
                })
                
                # Receive response
                response = await websocket.receive_json()
                assert response["message_type"] == MessageType.RESPONSE
                assert "result" in response

    async def test_websocket_protocol_error(self, server):
        """Test WebSocket protocol validation."""
        with TestClient(server.get_app()) as client:
            with client.websocket_connect("/ws") as websocket:
                # Send invalid request
                await websocket.send_json({
                    "message_type": MessageType.REQUEST,
                    "method": "test"
                })
                
                # Receive error response
                response = await websocket.receive_json()
                assert response["message_type"] == MessageType.ERROR
                assert response["error_code"] == "MISSING_REQUIRED_FIELDS"

    async def test_websocket_execution_error(self, server, test_tool):
        """Test WebSocket error handling during execution."""
        # Register tool that raises an error
        test_tool.execute = lambda params: raise_error()
        await server.tool_registry.register_tool(test_tool)
        
        with TestClient(server.get_app()) as client:
            with client.websocket_connect("/ws") as websocket:
                # Send request
                await websocket.send_json({
                    "protocol_version": ProtocolVersion.V2_0,
                    "message_type": MessageType.REQUEST,
                    "message_id": str(uuid4()),
                    "timestamp": datetime.utcnow().isoformat(),
                    "method": "test_tool",
                    "params": {
                        "param1": "test_value"
                    }
                })
                
                # Receive error response
                response = await websocket.receive_json()
                assert response["message_type"] == MessageType.ERROR
                assert response["error_code"] == "EXECUTION_FAILED"

    def test_cors_configuration(self, client):
        """Test CORS configuration."""
        response = client.options(
            "/api/tools/list",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET"
            }
        )
        
        assert response.status_code == 200
        assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
        assert "GET" in response.headers["access-control-allow-methods"]

    def test_security_headers(self, client, valid_api_key):
        """Test security headers are set."""
        response = client.get(
            "/api/tools/list",
            headers={"X-API-Key": valid_api_key}
        )
        
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert response.headers["X-Frame-Options"] == "DENY"
        assert response.headers["X-XSS-Protection"] == "1; mode=block"
        assert "max-age=31536000" in response.headers["Strict-Transport-Security"]

def raise_error():
    """Helper function to simulate execution error."""
    raise Exception("Test execution error") 