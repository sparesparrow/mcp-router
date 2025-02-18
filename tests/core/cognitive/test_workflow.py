import pytest
import asyncio
from datetime import datetime
from typing import Dict, Any
import structlog
from prometheus_client import REGISTRY

from core.cognitive.workflows import SystemMonitoringWorkflow
from core.cognitive.orchestrator import (
    CognitiveOrchestrator,
    ResourceLimits,
    WorkflowContext,
    ResourceExhaustion,
    ValidationError
)

@pytest.fixture
async def workflow():
    """Create a workflow instance for testing."""
    return SystemMonitoringWorkflow()

@pytest.mark.asyncio
async def test_workflow_requirements(workflow: SystemMonitoringWorkflow):
    """Test workflow requirements are correctly defined."""
    requirements = workflow.get_requirements()
    assert "monitoring_config" in requirements
    assert "enabled_services" in requirements

@pytest.mark.asyncio
async def test_workflow_validation(workflow: SystemMonitoringWorkflow, test_context: Dict[str, Any]):
    """Test workflow context validation."""
    # Test valid context
    assert await workflow.validate(test_context)

    # Test invalid context - wrong type for monitoring_config
    invalid_context = test_context.copy()
    invalid_context["monitoring_config"] = "invalid"
    assert not await workflow.validate(invalid_context)

    # Test invalid context - wrong type for enabled_services
    invalid_context = test_context.copy()
    invalid_context["enabled_services"] = "invalid"
    assert not await workflow.validate(invalid_context)

    # Test invalid context - missing service config
    invalid_context = test_context.copy()
    invalid_context["monitoring_config"] = {}
    assert not await workflow.validate(invalid_context)

@pytest.mark.asyncio
async def test_workflow_execution(workflow: SystemMonitoringWorkflow, test_context: Dict[str, Any]):
    """Test workflow execution and service initialization."""
    try:
        # Execute workflow
        result = await workflow.execute(test_context)

        # Verify result structure
        assert "status" in result
        assert result["status"] == "monitoring_started"
        assert "active_services" in result
        assert "start_time" in result

        # Verify active services
        assert set(result["active_services"]) == set(test_context["enabled_services"])

        # Verify services are running
        assert workflow._running
        assert len(workflow._services) == len(test_context["enabled_services"])

        # Wait briefly to collect some metrics
        await asyncio.sleep(0.2)

        # Verify metrics are being collected
        for service in workflow._services.values():
            metrics = await service.get_metrics()
            assert len(metrics) > 0

    finally:
        # Clean up
        await workflow.stop()

@pytest.mark.asyncio
async def test_workflow_cleanup(workflow: SystemMonitoringWorkflow, test_context: Dict[str, Any]):
    """Test workflow cleanup and resource management."""
    # Start workflow
    await workflow.execute(test_context)
    assert workflow._running
    assert len(workflow._services) > 0

    # Stop workflow
    await workflow.stop()
    assert not workflow._running
    assert len(workflow._services) == 0

@pytest.mark.asyncio
async def test_workflow_error_handling(workflow: SystemMonitoringWorkflow, test_context: Dict[str, Any]):
    """Test workflow error handling during execution."""
    # Test with invalid service name
    invalid_context = test_context.copy()
    invalid_context["enabled_services"].append("invalid_service")

    with pytest.raises(ValueError) as exc_info:
        await workflow.execute(invalid_context)
    assert "Unknown service: invalid_service" in str(exc_info.value)

    # Verify cleanup occurred after error
    assert not workflow._running
    assert len(workflow._services) == 0

@pytest.mark.asyncio
async def test_workflow_resource_limits(workflow: SystemMonitoringWorkflow, test_context: Dict[str, Any]):
    """Test workflow resource limit enforcement."""
    # Modify config to set very low resource limits
    test_context["monitoring_config"]["screenshot"]["resource_limits"] = {
        "memory_mb": 1,  # Unrealistically low limit
        "cpu_percent": 1
    }

    try:
        await workflow.execute(test_context)
        await asyncio.sleep(0.5)  # Wait for potential resource limit violations

        # Check if services are still running
        assert workflow._running
        
        # Get resource usage
        for service in workflow._services.values():
            usage = await service._get_resource_usage()
            assert "memory_mb" in usage
            assert "cpu_percent" in usage

    finally:
        await workflow.stop()

@pytest.mark.asyncio
async def test_concurrent_workflow_execution(workflow: SystemMonitoringWorkflow, test_context: Dict[str, Any]):
    """Test concurrent workflow execution."""
    workflows = [SystemMonitoringWorkflow() for _ in range(2)]  # Use 2 workflows instead of 3
    
    try:
        # Start workflows concurrently
        tasks = [w.execute(test_context) for w in workflows]
        results = await asyncio.gather(*tasks)

        # Verify all workflows started successfully
        for result in results:
            assert "status" in result
            assert result["status"] == "monitoring_started"
            assert set(result["active_services"]) == set(test_context["enabled_services"])

        # Wait briefly for metrics collection
        await asyncio.sleep(0.2)

        # Verify all workflows are collecting metrics
        for w in workflows:
            assert w._running
            for service in w._services.values():
                metrics = await service.get_metrics()
                assert len(metrics) > 0

    finally:
        # Clean up all workflows
        cleanup_tasks = [w.stop() for w in workflows]
        await asyncio.gather(*cleanup_tasks)

@pytest.fixture
def resource_limits():
    """Create test resource limits."""
    return ResourceLimits(
        max_concurrent_workflows=2,
        max_memory_mb=100,
        max_cpu_time_seconds=10
    )

@pytest.fixture
def valid_context():
    """Create valid test context."""
    return {
        "monitoring_config": {
            "screenshot": {"interval_seconds": 60},
            "network": {
                "interval_seconds": 5,
                "max_samples": 5,
                "retention_hours": 1,
                "capture_connections": True,
                "capture_io_counters": True,
                "excluded_ports": [0]
            },
            "clipboard": {"interval_seconds": 5}
        },
        "enabled_services": ["screenshot", "network"]
    }

@pytest.fixture
async def orchestrator(resource_limits):
    """Create a test orchestrator instance."""
    orchestrator = CognitiveOrchestrator(resource_limits)
    await orchestrator.register_workflow("test", SystemMonitoringWorkflow)
    return orchestrator

@pytest.mark.asyncio
async def test_workflow_registration(orchestrator):
    """Test workflow registration."""
    # Verify workflow was registered
    assert "test" in orchestrator._workflows
    
    # Try registering duplicate
    with pytest.raises(ValueError, match="already registered"):
        await orchestrator.register_workflow("test", SystemMonitoringWorkflow)

@pytest.mark.asyncio
async def test_workflow_execution(orchestrator, valid_context):
    """Test successful workflow execution."""
    # Execute workflow
    execution_id = await orchestrator.execute_workflow("test", valid_context)
    assert execution_id is not None
    
    # Verify state
    state = await orchestrator.get_workflow_state(execution_id)
    assert state is not None
    assert state.status in ["running", "completed"]
    assert state.start_time is not None
    
    # Verify metrics
    executions = REGISTRY.get_sample_value(
        "workflow_executions_total",
        {"workflow_id": "test", "status": "success"}
    )
    assert executions >= 1

@pytest.mark.asyncio
async def test_invalid_context(orchestrator):
    """Test workflow execution with invalid context."""
    invalid_context = {
        "monitoring_config": {},
        "enabled_services": ["invalid_service"]
    }
    
    with pytest.raises(ValueError, match="Invalid services"):
        await orchestrator.execute_workflow("test", invalid_context)

@pytest.mark.asyncio
async def test_resource_limits(orchestrator, valid_context):
    """Test resource limit enforcement."""
    # Start maximum allowed workflows
    executions = []
    for _ in range(orchestrator._resource_limits.max_concurrent_workflows):
        execution_id = await orchestrator.execute_workflow("test", valid_context)
        executions.append(execution_id)
    
    # Verify active workflows metric
    active = REGISTRY.get_sample_value("active_workflows")
    assert active == len(executions)
    
    # Try exceeding limit
    with pytest.raises(ResourceExhaustion, match="Maximum concurrent workflows exceeded"):
        await orchestrator.execute_workflow("test", valid_context)

@pytest.mark.asyncio
async def test_workflow_cleanup(orchestrator, valid_context):
    """Test cleanup of completed workflows."""
    # Execute a workflow
    execution_id = await orchestrator.execute_workflow("test", valid_context)
    
    # Verify it exists
    state = await orchestrator.get_workflow_state(execution_id)
    assert state is not None
    
    # Run cleanup
    await orchestrator.cleanup_completed_workflows(max_age_hours=0)
    
    # Verify state was cleaned up if workflow completed
    if state.status == "completed":
        state = await orchestrator.get_workflow_state(execution_id)
        assert state is None

@pytest.mark.asyncio
async def test_metrics_collection(orchestrator, valid_context):
    """Test comprehensive metrics collection."""
    # Initial metric values
    initial_executions = REGISTRY.get_sample_value(
        "workflow_executions_total",
        {"workflow_id": "test", "status": "success"}
    ) or 0
    
    # Execute workflow
    execution_id = await orchestrator.execute_workflow("test", valid_context)
    
    # Verify execution metrics
    final_executions = REGISTRY.get_sample_value(
        "workflow_executions_total",
        {"workflow_id": "test", "status": "success"}
    )
    assert final_executions == initial_executions + 1
    
    # Verify resource metrics
    cpu_time = REGISTRY.get_sample_value(
        "workflow_resource_usage",
        {"workflow_id": "SystemMonitoringWorkflow", "resource_type": "cpu_time"}
    )
    assert cpu_time is not None
    
    memory_usage = REGISTRY.get_sample_value(
        "workflow_resource_usage",
        {"workflow_id": "SystemMonitoringWorkflow", "resource_type": "memory_mb"}
    )
    assert memory_usage is not None

@pytest.mark.asyncio
async def test_structured_logging(orchestrator, valid_context, caplog):
    """Test structured logging output."""
    import json
    
    # Configure structured logging for test
    structlog.configure(
        processors=[structlog.processors.JSONRenderer()],
        logger_factory=structlog.PrintLoggerFactory(),
    )
    
    # Execute workflow
    execution_id = await orchestrator.execute_workflow("test", valid_context)
    
    # Verify log messages
    assert any(
        json.loads(record.message).get("event") == "workflow_execution_started"
        for record in caplog.records
        if hasattr(record, "message") and record.message.startswith("{")
    )
    
    assert any(
        json.loads(record.message).get("event") == "workflow_execution_completed"
        for record in caplog.records
        if hasattr(record, "message") and record.message.startswith("{")
    )

@pytest.mark.asyncio
async def test_concurrent_execution(orchestrator, valid_context):
    """Test concurrent workflow execution."""
    # Create multiple workflow executions
    execution_tasks = [
        orchestrator.execute_workflow("test", valid_context)
        for _ in range(orchestrator._resource_limits.max_concurrent_workflows)
    ]
    
    # Run concurrently
    execution_ids = await asyncio.gather(*execution_tasks)
    
    # Verify all executed successfully
    assert len(execution_ids) == len(execution_tasks)
    
    # Verify states
    states = await asyncio.gather(*[
        orchestrator.get_workflow_state(execution_id)
        for execution_id in execution_ids
    ])
    
    assert all(state is not None for state in states)
    assert all(state.status in ["running", "completed"] for state in states) 