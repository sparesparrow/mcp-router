import pytest
from datetime import datetime
from services.api.mcp.metrics import MetricsCollector, ToolMetrics
from services.api.mcp.tools import Tool

@pytest.fixture
def metrics_collector():
    return MetricsCollector()

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

class TestMetricsCollector:
    async def test_record_registration(self, metrics_collector, test_tool):
        """Test recording tool registration."""
        await metrics_collector.record_registration(test_tool)
        assert test_tool.name in metrics_collector.metrics
        assert isinstance(metrics_collector.metrics[test_tool.name], ToolMetrics)

    async def test_record_execution(self, metrics_collector):
        """Test recording successful execution."""
        tool_name = "test_tool"
        duration = 0.5
        
        await metrics_collector.record_execution(tool_name, duration)
        metrics = metrics_collector.metrics[tool_name]
        
        assert metrics.total_calls == 1
        assert metrics.successful_calls == 1
        assert metrics.failed_calls == 0
        assert metrics.total_duration == duration
        assert len(metrics.durations) == 1
        assert metrics.durations[0] == duration
        assert isinstance(metrics.last_execution, datetime)

    async def test_record_execution_duration_limit(self, metrics_collector):
        """Test duration list is limited to 100 entries."""
        tool_name = "test_tool"
        
        # Record 110 executions
        for i in range(110):
            await metrics_collector.record_execution(tool_name, 0.1)
            
        metrics = metrics_collector.metrics[tool_name]
        assert len(metrics.durations) == 100
        assert metrics.total_calls == 110

    async def test_record_failure(self, metrics_collector):
        """Test recording execution failure."""
        tool_name = "test_tool"
        error = "Test error message"
        
        await metrics_collector.record_failure(tool_name, error)
        metrics = metrics_collector.metrics[tool_name]
        
        assert metrics.total_calls == 1
        assert metrics.successful_calls == 0
        assert metrics.failed_calls == 1
        assert metrics.last_error == error
        assert isinstance(metrics.last_execution, datetime)
        assert len(metrics.errors) == 1
        assert metrics.errors["other_error"] == 1

    async def test_record_multiple_error_types(self, metrics_collector):
        """Test recording different types of errors."""
        tool_name = "test_tool"
        
        await metrics_collector.record_failure(tool_name, "Validation failed")
        await metrics_collector.record_failure(tool_name, "Rate limit exceeded")
        await metrics_collector.record_failure(tool_name, "Operation timed out")
        await metrics_collector.record_failure(tool_name, "Permission denied")
        await metrics_collector.record_failure(tool_name, "Unknown error")
        
        metrics = metrics_collector.metrics[tool_name]
        assert metrics.errors["validation_error"] == 1
        assert metrics.errors["rate_limit_error"] == 1
        assert metrics.errors["timeout_error"] == 1
        assert metrics.errors["permission_error"] == 1
        assert metrics.errors["other_error"] == 1

    def test_get_tool_metrics(self, metrics_collector):
        """Test getting metrics for a specific tool."""
        tool_name = "test_tool"
        metrics = metrics_collector.get_tool_metrics(tool_name)
        
        assert isinstance(metrics, dict)
        assert "total_calls" in metrics
        assert "successful_calls" in metrics
        assert "failed_calls" in metrics
        assert "success_rate" in metrics
        assert "avg_duration" in metrics
        assert "last_execution" in metrics
        assert "last_error" in metrics
        assert "error_distribution" in metrics

    async def test_get_tool_metrics_with_data(self, metrics_collector):
        """Test getting metrics after recording data."""
        tool_name = "test_tool"
        
        # Record some executions
        await metrics_collector.record_execution(tool_name, 0.5)
        await metrics_collector.record_execution(tool_name, 1.5)
        await metrics_collector.record_failure(tool_name, "Test error")
        
        metrics = metrics_collector.get_tool_metrics(tool_name)
        
        assert metrics["total_calls"] == 3
        assert metrics["successful_calls"] == 2
        assert metrics["failed_calls"] == 1
        assert metrics["success_rate"] == 2/3
        assert metrics["avg_duration"] == 1.0
        assert metrics["error_distribution"]["other_error"] == 1

    def test_get_all_metrics(self, metrics_collector):
        """Test getting metrics for all tools."""
        tool1 = "tool1"
        tool2 = "tool2"
        
        metrics_collector.metrics[tool1] = ToolMetrics()
        metrics_collector.metrics[tool2] = ToolMetrics()
        
        all_metrics = metrics_collector.get_all_metrics()
        
        assert isinstance(all_metrics, dict)
        assert tool1 in all_metrics
        assert tool2 in all_metrics
        assert isinstance(all_metrics[tool1], dict)
        assert isinstance(all_metrics[tool2], dict) 