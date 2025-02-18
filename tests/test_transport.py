import pytest
from datetime import datetime, timedelta
from typing import Dict, Any
import asyncio
from unittest.mock import Mock, AsyncMock

from services.api.mcp.transport import (
    MCPTransport,
    TransportError,
    ConnectionError,
    MessageError
)
from services.api.models.messages import (
    MessageType,
    ProtocolVersion
)

@pytest.fixture
def mock_server():
    return Mock(transport_manager=AsyncMock())

@pytest.fixture
def mock_metrics():
    return Mock(
        increment_counter=AsyncMock(),
        record_latency=AsyncMock(),
        get_metrics=Mock(return_value={})
    )

@pytest.fixture
def mock_websocket():
    return Mock(
        accept=AsyncMock(),
        send_json=AsyncMock(),
        receive_json=AsyncMock(),
        close=AsyncMock()
    )

@pytest.fixture
def transport(mock_server, mock_metrics):
    return MCPTransport(mock_server, mock_metrics)

class TestMCPTransport:
    async def test_initialization(self, transport):
        assert transport.server is not None
        assert transport.metrics is not None
        assert transport._active_connections == {}
        assert transport._connection_metadata == {}
        assert transport._heartbeat_interval == 30

    async def test_connection_handling(self, transport, mock_websocket):
        # Test successful connection
        await transport.handle_connection(mock_websocket)
        
        # Verify connection acceptance
        mock_websocket.accept.assert_called_once()
        
        # Verify welcome message
        welcome_call = mock_websocket.send_json.call_args_list[0]
        welcome_message = welcome_call[0][0]
        assert welcome_message["type"] == "welcome"
        assert welcome_message["protocol_version"] == "2.0"
        assert "streaming" in welcome_message["features"]
        assert "heartbeat" in welcome_message["features"]
        assert "diagnostics" in welcome_message["features"]

        # Verify connection tracking
        assert len(transport._active_connections) == 1
        assert len(transport._connection_metadata) == 1

    async def test_rate_limiting(self, transport, mock_websocket):
        # Setup test data
        client_id = "test-client"
        current_time = datetime.utcnow()
        
        # Test within rate limit
        assert await transport._validate_message_rate(client_id) is True
        
        # Simulate message flood
        metadata = transport._connection_metadata.get(client_id, {})
        metadata["message_timestamps"] = [
            current_time - timedelta(seconds=i)
            for i in range(100)  # 100 messages in last minute
        ]
        transport._connection_metadata[client_id] = metadata
        
        # Test rate limit exceeded
        assert await transport._validate_message_rate(client_id) is False
        
        # Verify violation recording
        assert len(transport._protocol_diagnostics["protocol_violations"]) > 0
        violation = transport._protocol_diagnostics["protocol_violations"][-1]
        assert violation["type"] == "rate_limit_exceeded"
        assert violation["details"]["client_id"] == client_id

    async def test_protocol_diagnostics(self, transport, mock_websocket):
        # Record some test violations
        await transport._record_protocol_violation(
            "test_violation",
            {"test": "data"}
        )
        
        # Get diagnostics report
        report = transport.get_diagnostics_report()
        
        # Verify report structure
        assert "message_counts" in report
        assert "protocol_violations" in report
        assert "active_connections" in report
        assert "performance_metrics" in report
        assert "error_summary" in report
        
        # Verify violation recording
        violations = report["protocol_violations"]
        assert len(violations) > 0
        assert violations[-1]["type"] == "test_violation"
        assert violations[-1]["details"]["test"] == "data"

    async def test_heartbeat_monitoring(self, transport, mock_websocket):
        # Start heartbeat monitoring
        transport._heartbeat_task = asyncio.create_task(
            transport._heartbeat_monitor()
        )
        
        # Add test connection
        client_id = "test-client"
        transport._active_connections[client_id] = mock_websocket
        transport._connection_metadata[client_id] = {
            "connected_at": datetime.utcnow(),
            "last_heartbeat": datetime.utcnow()
        }
        
        # Wait for one heartbeat interval
        await asyncio.sleep(0.1)  # Short sleep for testing
        
        # Verify heartbeat message
        assert mock_websocket.send_json.called
        heartbeat_call = mock_websocket.send_json.call_args_list[0]
        heartbeat_message = heartbeat_call[0][0]
        assert heartbeat_message["type"] == "heartbeat"
        assert "server_time" in heartbeat_message

        # Cleanup
        transport._heartbeat_task.cancel()
        try:
            await transport._heartbeat_task
        except asyncio.CancelledError:
            pass

    async def test_error_handling(self, transport, mock_websocket):
        # Test connection error
        mock_websocket.accept.side_effect = Exception("Connection failed")
        
        with pytest.raises(Exception):
            await transport.handle_connection(mock_websocket)
        
        # Test message error
        mock_websocket.send_json.side_effect = Exception("Send failed")
        
        await transport._send_error(
            mock_websocket,
            "TEST_ERROR",
            "Test error message"
        )
        
        # Verify error recording
        assert transport._protocol_diagnostics["message_counts"]["sent"] == 0
        assert len(transport._protocol_diagnostics["errors"]) > 0

    async def test_cleanup(self, transport, mock_websocket):
        # Add test connection
        client_id = "test-client"
        transport._active_connections[client_id] = mock_websocket
        transport._connection_metadata[client_id] = {
            "connected_at": datetime.utcnow(),
            "last_heartbeat": datetime.utcnow()
        }
        
        # Start heartbeat task
        transport._heartbeat_task = asyncio.create_task(
            transport._heartbeat_monitor()
        )
        
        # Perform cleanup
        await transport.cleanup()
        
        # Verify connections closed
        assert len(transport._active_connections) == 0
        assert len(transport._connection_metadata) == 0
        
        # Verify heartbeat task cancelled
        assert transport._heartbeat_task is None 