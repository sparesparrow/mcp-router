import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime
import json

from services.api.mcp.tools import (
    ToolRegistry,
    ToolError,
    ValidationError,
    ExecutionError
)
from services.api.core.container import ServiceContainer
from services.api.interfaces.service_interfaces import (
    WorkflowServiceInterface,
    AIServiceInterface,
    AudioServiceInterface
)

@pytest.fixture
def mock_container():
    container = Mock(spec=ServiceContainer)
    container.get = Mock()
    return container

@pytest.fixture
def tool_registry(mock_container):
    return ToolRegistry(mock_container)

@pytest.mark.asyncio
async def test_workflow_analysis(tool_registry, mock_container):
    # Mock workflow service
    mock_workflow_service = AsyncMock()
    mock_workflow_service.analyze_patterns.return_value = ["pattern1", "pattern2"]
    mock_workflow_service.get_metrics.return_value = {"metric1": 1, "metric2": 2}
    mock_workflow_service.identify_bottlenecks.return_value = ["bottleneck1"]
    mock_workflow_service.generate_recommendations.return_value = ["recommendation1"]
    
    mock_container.get.return_value = mock_workflow_service
    
    # Test workflow analysis
    result = await tool_registry.handle_workflow_analysis({
        "workflow_id": "test-workflow",
        "time_range": "1h",
        "include_metrics": True
    })
    
    assert result["workflow_id"] == "test-workflow"
    assert "analysis_time" in result
    assert result["patterns"] == ["pattern1", "pattern2"]
    assert result["metrics"] == {"metric1": 1, "metric2": 2}
    assert result["bottlenecks"] == ["bottleneck1"]
    assert result["recommendations"] == ["recommendation1"]
    
    # Verify service calls
    mock_workflow_service.analyze_patterns.assert_called_once_with(
        "test-workflow",
        "1h"
    )
    mock_workflow_service.get_metrics.assert_called_once_with(
        "test-workflow",
        "1h"
    )

@pytest.mark.asyncio
async def test_workflow_optimization(tool_registry, mock_container):
    # Mock workflow service
    mock_workflow_service = AsyncMock()
    mock_workflow_service.get_workflow_state.return_value = {"state": "current"}
    mock_workflow_service.generate_optimization_plan.return_value = ["step1", "step2"]
    mock_workflow_service.apply_optimizations.return_value = {
        "performance": {"improved": True},
        "resource_usage": {"reduced": True}
    }
    
    mock_container.get.return_value = mock_workflow_service
    
    # Test workflow optimization
    result = await tool_registry.handle_workflow_optimization({
        "workflow_id": "test-workflow",
        "optimization_targets": ["performance", "resource_usage"]
    })
    
    assert result["workflow_id"] == "test-workflow"
    assert "optimization_time" in result
    assert result["targets"] == ["performance", "resource_usage"]
    assert result["plan"] == ["step1", "step2"]
    assert result["improvements"]["performance"] == {"improved": True}
    assert result["improvements"]["resource_usage"] == {"reduced": True}

@pytest.mark.asyncio
async def test_code_analysis(tool_registry):
    test_content = "def test_function():\n    pass"
    
    with patch("aiofiles.open", create=True) as mock_open:
        mock_file = AsyncMock()
        mock_file.__aenter__.return_value.read.return_value = test_content
        mock_open.return_value = mock_file
        
        # Mock analysis methods
        with patch.object(
            tool_registry,
            '_analyze_solid_principles',
            new_callable=AsyncMock
        ) as mock_solid, patch.object(
            tool_registry,
            '_analyze_code_complexity',
            new_callable=AsyncMock
        ) as mock_complexity, patch.object(
            tool_registry,
            '_generate_code_recommendations',
            new_callable=AsyncMock
        ) as mock_recommendations:
            
            mock_solid.return_value = {
                "metrics": {"solid_score": 0.8},
                "issues": ["solid_issue1"]
            }
            mock_complexity.return_value = {
                "metrics": {"complexity": 5},
                "issues": ["complexity_issue1"]
            }
            mock_recommendations.return_value = ["recommendation1"]
            
            result = await tool_registry.handle_code_analysis({
                "file_path": "test.py",
                "analysis_type": ["solid", "complexity"]
            })
            
            assert result["file_path"] == "test.py"
            assert "analysis_time" in result
            assert result["metrics"]["solid"]["solid_score"] == 0.8
            assert result["metrics"]["complexity"]["complexity"] == 5
            assert "solid_issue1" in result["issues"]
            assert "complexity_issue1" in result["issues"]
            assert result["recommendations"] == ["recommendation1"]

@pytest.mark.asyncio
async def test_network_info(tool_registry):
    with patch("psutil.net_if_addrs") as mock_if_addrs, \
         patch("psutil.net_if_stats") as mock_if_stats, \
         patch("psutil.net_connections") as mock_connections, \
         patch("psutil.net_io_counters") as mock_io:
        
        # Mock network interface data
        mock_if_addrs.return_value = {
            "eth0": [Mock(address="192.168.1.1")]
        }
        mock_if_stats.return_value = {
            "eth0": Mock(isup=True, speed=1000)
        }
        
        # Mock connection data
        mock_conn = Mock()
        mock_conn.laddr = Mock(ip="127.0.0.1", port=8080)
        mock_conn.raddr = Mock(ip="192.168.1.2", port=80)
        mock_conn.status = "ESTABLISHED"
        mock_conn.pid = 1234
        mock_connections.return_value = [mock_conn]
        
        # Mock IO counters
        mock_io.return_value = Mock(
            bytes_sent=1000,
            bytes_recv=2000,
            packets_sent=10,
            packets_recv=20,
            errin=0,
            errout=0,
            dropin=0,
            dropout=0
        )
        
        result = await tool_registry.handle_network_info({
            "include_connections": True,
            "include_stats": True
        })
        
        assert "timestamp" in result
        assert len(result["interfaces"]) == 1
        assert result["interfaces"][0]["name"] == "eth0"
        assert result["interfaces"][0]["status"] == "up"
        
        assert len(result["connections"]) == 1
        assert result["connections"][0]["local_address"] == "127.0.0.1:8080"
        assert result["connections"][0]["remote_address"] == "192.168.1.2:80"
        
        assert result["stats"]["bytes_sent"] == 1000
        assert result["stats"]["bytes_recv"] == 2000

@pytest.mark.asyncio
async def test_error_handling(tool_registry, mock_container):
    # Test validation error
    with pytest.raises(ValidationError) as exc_info:
        await tool_registry.handle_workflow_analysis({})
    assert exc_info.value.code == "missing_argument"
    
    # Test execution error
    mock_workflow_service = AsyncMock()
    mock_workflow_service.analyze_patterns.side_effect = Exception("Service error")
    mock_container.get.return_value = mock_workflow_service
    
    with pytest.raises(ExecutionError) as exc_info:
        await tool_registry.handle_workflow_analysis({
            "workflow_id": "test-workflow"
        })
    assert exc_info.value.code == "analysis_failed" 