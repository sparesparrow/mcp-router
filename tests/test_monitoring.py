import pytest
from datetime import datetime, timedelta
import asyncio
from typing import Dict, Any

from services.api.mcp.monitoring import (
    ProtocolMetrics,
    ProtocolMonitor,
    ProtocolMonitoringService
)

@pytest.fixture
def monitor():
    return ProtocolMonitor(metrics_window=3600)

@pytest.fixture
def monitoring_service():
    return ProtocolMonitoringService(rotation_interval=1)

class TestProtocolMetrics:
    def test_metrics_initialization(self):
        metrics = ProtocolMetrics()
        assert metrics.message_counts == {}
        assert metrics.version_counts == {}
        assert metrics.latency_samples == []
        assert metrics.error_counts == {}
        assert metrics.violation_counts == {}
        assert metrics.active_connections == 0
        assert isinstance(metrics.last_reset, datetime)

class TestProtocolMonitor:
    async def test_message_recording(self, monitor):
        # Record test messages
        await monitor.record_message("request", "2.0", 100.0)
        await monitor.record_message("response", "2.0", 150.0)
        await monitor.record_message("request", "1.1", 120.0)
        
        # Get current metrics
        metrics = monitor.get_current_metrics()
        
        # Verify message counts
        assert metrics["message_counts"]["request"] == 2
        assert metrics["message_counts"]["response"] == 1
        
        # Verify version counts
        assert metrics["version_counts"]["2.0"] == 2
        assert metrics["version_counts"]["1.1"] == 1
        
        # Verify latency stats
        latency_stats = metrics["latency_stats"]
        assert latency_stats["min"] == 100.0
        assert latency_stats["max"] == 150.0
        assert 100.0 <= latency_stats["avg"] <= 150.0

    async def test_error_recording(self, monitor):
        # Record test errors
        await monitor.record_error("connection_failed")
        await monitor.record_error("invalid_message")
        await monitor.record_error("connection_failed")
        
        # Get current metrics
        metrics = monitor.get_current_metrics()
        
        # Verify error counts
        assert metrics["error_counts"]["connection_failed"] == 2
        assert metrics["error_counts"]["invalid_message"] == 1

    async def test_violation_recording(self, monitor):
        # Record test violations
        await monitor.record_violation("rate_limit")
        await monitor.record_violation("invalid_version")
        await monitor.record_violation("rate_limit")
        
        # Get current metrics
        metrics = monitor.get_current_metrics()
        
        # Verify violation counts
        assert metrics["violation_counts"]["rate_limit"] == 2
        assert metrics["violation_counts"]["invalid_version"] == 1

    async def test_connection_count(self, monitor):
        # Update connection count
        await monitor.update_connection_count(5)
        
        # Get current metrics
        metrics = monitor.get_current_metrics()
        
        # Verify connection count
        assert metrics["active_connections"] == 5

    async def test_metrics_rotation(self, monitor):
        # Record initial metrics
        await monitor.record_message("request", "2.0", 100.0)
        await monitor.record_error("test_error")
        
        # Rotate metrics
        await monitor.rotate_metrics()
        
        # Record new metrics
        await monitor.record_message("response", "2.0", 150.0)
        
        # Get historical metrics
        historical = monitor.get_historical_metrics()
        
        # Verify historical metrics
        assert len(historical) == 1
        assert historical[0]["message_counts"]["request"] == 1
        assert historical[0]["error_counts"]["test_error"] == 1
        
        # Verify current metrics
        current = monitor.get_current_metrics()
        assert current["message_counts"]["response"] == 1
        assert "test_error" not in current["error_counts"]

    async def test_aggregated_metrics(self, monitor):
        # Record metrics across multiple periods
        await monitor.record_message("request", "2.0", 100.0)
        await monitor.record_error("error1")
        await monitor.rotate_metrics()
        
        await monitor.record_message("response", "2.0", 150.0)
        await monitor.record_error("error2")
        
        # Get aggregated metrics
        aggregated = monitor.get_aggregated_metrics()
        
        # Verify aggregated counts
        assert aggregated["total_messages"] == 2
        assert aggregated["total_errors"] == 2
        assert aggregated["version_counts"]["2.0"] == 2
        
        # Verify latency stats
        latency_stats = aggregated["latency_stats"]
        assert latency_stats["min"] == 100.0
        assert latency_stats["max"] == 150.0
        assert 100.0 <= latency_stats["avg"] <= 150.0

class TestProtocolMonitoringService:
    async def test_service_lifecycle(self, monitoring_service):
        # Start service
        await monitoring_service.start()
        assert monitoring_service._rotation_task is not None
        
        # Record some metrics
        await monitoring_service.monitor.record_message("request", "2.0", 100.0)
        
        # Wait for rotation
        await asyncio.sleep(1.1)
        
        # Verify metrics rotation
        historical = monitoring_service.monitor.get_historical_metrics()
        assert len(historical) > 0
        
        # Stop service
        await monitoring_service.stop()
        assert monitoring_service._rotation_task is None

    async def test_monitoring_report(self, monitoring_service):
        # Record test data
        await monitoring_service.monitor.record_message("request", "2.0", 100.0)
        await monitoring_service.monitor.record_error("test_error")
        
        # Get monitoring report
        report = monitoring_service.get_monitoring_report()
        
        # Verify report structure
        assert "current" in report
        assert "historical" in report
        assert "aggregated" in report
        
        # Verify current metrics
        current = report["current"]
        assert current["message_counts"]["request"] == 1
        assert current["error_counts"]["test_error"] == 1
        
        # Verify aggregated metrics
        aggregated = report["aggregated"]
        assert aggregated["total_messages"] == 1
        assert aggregated["total_errors"] == 1 