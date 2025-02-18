import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta
import json

from services.api.mcp.mcp import (
    MCPServer,
    ProtocolVersion,
    ProtocolDiagnostics
)
from services.api.mcp.errors import ProtocolError, ValidationError

@pytest.fixture
def mock_transport():
    transport = AsyncMock()
    transport.get_active_connections.return_value = ["conn1", "conn2"]
    transport.execute_method.return_value = {"result": "success"}
    return transport

@pytest.fixture
def mock_security():
    security = AsyncMock()
    return security

@pytest.fixture
def mock_metrics():
    metrics = AsyncMock()
    metrics.get_last_heartbeat.return_value = datetime.utcnow()
    return metrics

@pytest.fixture
def mock_monitoring():
    monitoring = AsyncMock()
    return monitoring

@pytest.fixture
def mcp_server(mock_transport, mock_security, mock_metrics, mock_monitoring):
    server = MCPServer(
        transport=mock_transport,
        security_manager=mock_security,
        metrics_collector=mock_metrics,
        monitoring_service=mock_monitoring
    )
    return server

@pytest.mark.asyncio
async def test_server_lifecycle(mcp_server):
    """Test server startup and shutdown."""
    # Test startup
    await mcp_server.start()
    assert mcp_server._cleanup_task is not None
    assert mcp_server._heartbeat_task is not None
    mcp_server.transport.start.assert_called_once()
    
    # Test shutdown
    await mcp_server.stop()
    assert mcp_server._cleanup_task.cancelled()
    assert mcp_server._heartbeat_task.cancelled()
    mcp_server.transport.stop.assert_called_once()

@pytest.mark.asyncio
async def test_handle_handshake(mcp_server):
    """Test handshake message handling."""
    message = {
        "type": "handshake",
        "version": "2.0",
        "capabilities": {
            "features": ["streaming", "compression"]
        }
    }
    
    response = await mcp_server.handle_message(message, "test-conn")
    
    assert response["type"] == "handshake_response"
    assert response["version"] == ProtocolVersion.V2_0
    assert "session_id" in response
    assert "server_capabilities" in response
    assert mcp_server.diagnostics.active_connections == 1
    assert mcp_server.diagnostics.total_connections == 1

@pytest.mark.asyncio
async def test_handle_request(mcp_server):
    """Test request message handling."""
    message = {
        "type": "request",
        "version": "2.0",
        "request_id": "req-1",
        "method": "test_method",
        "params": {"key": "value"}
    }
    
    response = await mcp_server.handle_message(message, "test-conn")
    
    assert response["type"] == "response"
    assert response["request_id"] == "req-1"
    assert response["result"] == {"result": "success"}
    
    # Verify security check
    mcp_server.security.check_rate_limit.assert_called_once_with(
        "test-conn",
        "test_method"
    )

@pytest.mark.asyncio
async def test_handle_event(mcp_server):
    """Test event message handling."""
    message = {
        "type": "event",
        "version": "2.0",
        "event_type": "test_event",
        "data": {"key": "value"}
    }
    
    await mcp_server.handle_message(message, "test-conn")
    
    # Verify event was recorded
    mcp_server.monitoring.record_event.assert_called_once_with(
        "test_event",
        {"key": "value"},
        "test-conn"
    )

@pytest.mark.asyncio
async def test_handle_diagnostic(mcp_server):
    """Test diagnostic message handling."""
    message = {
        "type": "diagnostic",
        "version": "2.0",
        "request_id": "diag-1"
    }
    
    response = await mcp_server.handle_message(message, "test-conn")
    
    assert response["type"] == "diagnostic_response"
    assert response["request_id"] == "diag-1"
    assert "diagnostics" in response
    assert "uptime_seconds" in response["diagnostics"]
    assert "message_stats" in response["diagnostics"]
    assert "error_stats" in response["diagnostics"]

@pytest.mark.asyncio
async def test_handle_heartbeat(mcp_server):
    """Test heartbeat message handling."""
    message = {
        "type": "heartbeat",
        "version": "2.0",
        "timestamp": datetime.utcnow().isoformat(),
        "metrics": {"cpu": 50, "memory": 80}
    }
    
    response = await mcp_server.handle_message(message, "test-conn")
    
    assert response["type"] == "heartbeat_response"
    assert "timestamp" in response
    assert response["received_timestamp"] == message["timestamp"]
    
    # Verify metrics update
    mcp_server.metrics.update_client_metrics.assert_called_once_with(
        "test-conn",
        {"cpu": 50, "memory": 80}
    )

@pytest.mark.asyncio
async def test_protocol_error_handling(mcp_server):
    """Test protocol error handling."""
    # Test invalid version
    message = {
        "type": "request",
        "version": "invalid",
        "method": "test"
    }
    
    with pytest.raises(ProtocolError):
        await mcp_server.handle_message(message, "test-conn")
    
    assert "protocol_error" in mcp_server.diagnostics.error_counts
    assert len(mcp_server.diagnostics.protocol_violations) == 1

@pytest.mark.asyncio
async def test_validation_error_handling(mcp_server):
    """Test validation error handling."""
    mcp_server.security.validate_message.side_effect = ValidationError("Invalid message")
    
    message = {
        "type": "request",
        "version": "2.0",
        "method": "test"
    }
    
    with pytest.raises(ValidationError):
        await mcp_server.handle_message(message, "test-conn")
    
    assert "validation_error" in mcp_server.diagnostics.error_counts

@pytest.mark.asyncio
async def test_heartbeat_monitor(mcp_server):
    """Test heartbeat monitoring."""
    # Mock a dead connection
    mcp_server.metrics.get_last_heartbeat.return_value = (
        datetime.utcnow() - timedelta(minutes=10)
    )
    
    # Run one iteration of heartbeat monitor
    await mcp_server._heartbeat_monitor.__wrapped__(mcp_server)
    
    # Verify dead connection was closed
    mcp_server.transport.close_connection.assert_called_with("conn1")
    assert mcp_server.diagnostics.active_connections == -1  # Would be 0 in real scenario

@pytest.mark.asyncio
async def test_periodic_cleanup(mcp_server):
    """Test periodic cleanup."""
    # Run one iteration of cleanup
    await mcp_server._periodic_cleanup.__wrapped__(mcp_server)
    
    # Verify cleanup calls
    mcp_server.security.cleanup_expired_sessions.assert_called_once()
    mcp_server.metrics.cleanup_old_metrics.assert_called_once()
    
    # Verify violations list is trimmed
    mcp_server.diagnostics.protocol_violations = ["violation"] * 200
    await mcp_server._periodic_cleanup.__wrapped__(mcp_server)
    assert len(mcp_server.diagnostics.protocol_violations) == 100

@pytest.mark.asyncio
async def test_performance_metrics(mcp_server):
    """Test performance metrics recording."""
    message = {
        "type": "request",
        "version": "2.0",
        "method": "test_method"
    }
    
    await mcp_server.handle_message(message, "test-conn")
    
    # Verify processing time was recorded
    metrics = mcp_server.diagnostics.performance_metrics
    assert any(key.startswith("processing_time_request") for key in metrics)

def test_protocol_diagnostics():
    """Test ProtocolDiagnostics class."""
    diagnostics = ProtocolDiagnostics()
    
    # Test message counting
    diagnostics.record_message("request")
    diagnostics.record_message("request")
    diagnostics.record_message("event")
    assert diagnostics.message_counts["request"] == 2
    assert diagnostics.message_counts["event"] == 1
    
    # Test error counting
    diagnostics.record_error("validation_error")
    diagnostics.record_error("validation_error")
    assert diagnostics.error_counts["validation_error"] == 2
    
    # Test violation recording
    diagnostics.record_violation({"type": "test", "message": "test"})
    assert len(diagnostics.protocol_violations) == 1
    assert "timestamp" in diagnostics.protocol_violations[0]
    
    # Test metrics
    diagnostics.update_metrics("test_metric", 1.5)
    assert diagnostics.performance_metrics["test_metric"] == 1.5
    
    # Test report generation
    report = diagnostics.get_report()
    assert "uptime_seconds" in report
    assert report["message_stats"] == diagnostics.message_counts
    assert report["error_stats"] == diagnostics.error_counts
    assert report["violations"] == diagnostics.protocol_violations
    assert report["performance"] == diagnostics.performance_metrics 