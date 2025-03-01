from typing import Dict, List, Optional, Type, Any
from abc import ABC, abstractmethod
from datetime import datetime
import asyncio
from pydantic import BaseModel, validator
import resource
import logging
from dataclasses import dataclass
import structlog
from prometheus_client import Counter, Histogram, Gauge

# Pydantic Models for Validation
class ResourceLimits(BaseModel):
    max_concurrent_workflows: int = 100
    max_memory_mb: float = 1024
    max_cpu_time_seconds: float = 300

    @validator("max_concurrent_workflows")
    def validate_concurrent_workflows(cls, v):
        if v < 1:
            raise ValueError("Must allow at least one concurrent workflow")
        return v

class WorkflowContext(BaseModel):
    monitoring_config: Dict[str, Any]
    enabled_services: List[str]
    
    @validator("enabled_services")
    def validate_services(cls, services):
        valid_services = {"screenshot", "network", "clipboard"}
        invalid_services = set(services) - valid_services
        if invalid_services:
            raise ValueError(f"Invalid services: {invalid_services}")
        return services

class WorkflowState(BaseModel):
    """State model for workflow execution."""
    workflow_id: str
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    results: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    resource_usage: Optional[Dict[str, float]] = None

# Metrics Collection
class WorkflowMetrics:
    def __init__(self):
        self.workflow_executions = Counter(
            "workflow_executions_total",
            "Total workflow executions",
            ["workflow_id", "status"]
        )
        self.execution_time = Histogram(
            "workflow_execution_seconds",
            "Workflow execution time in seconds",
            ["workflow_id"]
        )
        self.resource_usage = Gauge(
            "workflow_resource_usage",
            "Current resource usage per workflow",
            ["workflow_id", "resource_type"]
        )
        self.active_workflows = Gauge(
            "active_workflows",
            "Number of currently active workflows"
        )

class Workflow(ABC):
    """Base class for all workflows following the composer agent pattern."""
    
    @abstractmethod
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the workflow with given context."""
        pass

    @abstractmethod
    async def validate(self, context: Dict[str, Any]) -> bool:
        """Validate the workflow inputs."""
        pass

    @abstractmethod
    def get_requirements(self) -> List[str]:
        """Get the list of required context keys."""
        pass

class CognitiveOrchestrator:
    """
    Orchestrates cognitive workflows following composer agent patterns
    and security standards.
    """
    
    def __init__(self, resource_limits: Optional[ResourceLimits] = None):
        self._workflows: Dict[str, Type[Workflow]] = {}
        self._active_workflows: Dict[str, WorkflowState] = {}
        self._lock = asyncio.Lock()
        self._resource_limits = resource_limits or ResourceLimits()
        self._metrics = WorkflowMetrics()
        self._logger = structlog.get_logger()

    async def register_workflow(self, workflow_id: str, workflow_class: Type[Workflow]) -> None:
        """Register a new workflow type with validation."""
        if not issubclass(workflow_class, Workflow):
            raise ValueError("Workflow class must inherit from Workflow base class")
        
        self._logger.info(
            "registering_workflow",
            workflow_id=workflow_id,
            workflow_class=workflow_class.__name__
        )
        
        async with self._lock:
            if workflow_id in self._workflows:
                raise ValueError(f"Workflow {workflow_id} already registered")
            self._workflows[workflow_id] = workflow_class

    async def execute_workflow(self, workflow_id: str, context: Dict[str, Any]) -> str:
        """Execute a workflow with proper security and resource management."""
        # Validate workflow existence
        if workflow_id not in self._workflows:
            self._logger.error("workflow_not_found", workflow_id=workflow_id)
            raise ValueError(f"Workflow {workflow_id} not found")

        # Validate context using Pydantic
        try:
            validated_context = WorkflowContext(**context)
        except ValueError as e:
            self._logger.error(
                "context_validation_failed",
                workflow_id=workflow_id,
                error=str(e)
            )
            raise

        # Create workflow instance
        workflow_class = self._workflows[workflow_id]
        workflow = workflow_class()

        # Create execution state
        execution_id = f"{workflow_id}_{datetime.utcnow().isoformat()}"
        state = WorkflowState(
            workflow_id=workflow_id,
            status="running",
            start_time=datetime.utcnow()
        )

        self._logger.info(
            "workflow_execution_started",
            execution_id=execution_id,
            workflow_id=workflow_id
        )

        async with self._lock:
            self._active_workflows[execution_id] = state
            self._metrics.active_workflows.inc()

        try:
            with self._metrics.execution_time.labels(workflow_id).time():
                results = await self._execute_with_resource_management(workflow, validated_context.dict())
            
            # Update state with success
            state.status = "completed"
            state.end_time = datetime.utcnow()
            state.results = results
            
            self._metrics.workflow_executions.labels(
                workflow_id=workflow_id,
                status="success"
            ).inc()

        except Exception as e:
            # Update state with error
            state.status = "failed"
            state.end_time = datetime.utcnow()
            state.error = str(e)
            
            self._metrics.workflow_executions.labels(
                workflow_id=workflow_id,
                status="failed"
            ).inc()
            
            self._logger.error(
                "workflow_execution_failed",
                execution_id=execution_id,
                workflow_id=workflow_id,
                error=str(e),
                exc_info=True
            )
            raise

        finally:
            # Ensure state is updated and metrics are decremented
            async with self._lock:
                self._active_workflows[execution_id] = state
                self._metrics.active_workflows.dec()

        self._logger.info(
            "workflow_execution_completed",
            execution_id=execution_id,
            workflow_id=workflow_id,
            duration=state.end_time - state.start_time
        )

        return execution_id

    async def _check_resource_limits(self) -> None:
        """Verify resource usage is within limits."""
        async with self._lock:
            active_count = len(self._active_workflows)
            if active_count >= self._resource_limits.max_concurrent_workflows:
                self._logger.warning(
                    "max_concurrent_workflows_exceeded",
                    current_count=active_count,
                    limit=self._resource_limits.max_concurrent_workflows
                )
                raise ResourceExhaustion("Maximum concurrent workflows exceeded")

        # Check memory usage
        memory_usage = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024  # KB to MB
        if memory_usage > self._resource_limits.max_memory_mb:
            self._logger.warning(
                "memory_limit_exceeded",
                current_usage=memory_usage,
                limit=self._resource_limits.max_memory_mb
            )
            raise ResourceExhaustion(f"Memory limit exceeded: {memory_usage}MB used")

    async def _execute_with_resource_management(self, workflow: Workflow, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute workflow with resource limits and monitoring."""
        await self._check_resource_limits()
        
        start_resources = resource.getrusage(resource.RUSAGE_SELF)
        try:
            results = await workflow.execute(context)
            
            # Calculate resource usage
            end_resources = resource.getrusage(resource.RUSAGE_SELF)
            cpu_time = (end_resources.ru_utime - start_resources.ru_utime) + \
                      (end_resources.ru_stime - start_resources.ru_stime)
                      
            if cpu_time > self._resource_limits.max_cpu_time_seconds:
                self._logger.warning(
                    "cpu_time_limit_exceeded",
                    cpu_time=cpu_time,
                    limit=self._resource_limits.max_cpu_time_seconds
                )
                raise ResourceExhaustion(f"CPU time limit exceeded: {cpu_time}s used")
            
            # Update resource metrics
            self._metrics.resource_usage.labels(
                workflow_id=workflow.__class__.__name__,
                resource_type="cpu_time"
            ).set(cpu_time)
            
            self._metrics.resource_usage.labels(
                workflow_id=workflow.__class__.__name__,
                resource_type="memory_mb"
            ).set((end_resources.ru_maxrss - start_resources.ru_maxrss) / 1024)
                
            return {
                **results,
                "resource_usage": {
                    "cpu_time": cpu_time,
                    "memory_mb": (end_resources.ru_maxrss - start_resources.ru_maxrss) / 1024
                }
            }
            
        except Exception as e:
            self._logger.error(
                "workflow_execution_error",
                error=str(e),
                exc_info=True
            )
            raise

    async def get_workflow_state(self, execution_id: str) -> Optional[WorkflowState]:
        """Get the current state of a workflow execution."""
        async with self._lock:
            return self._active_workflows.get(execution_id)

    async def list_active_workflows(self) -> List[WorkflowState]:
        """List all active workflow executions."""
        async with self._lock:
            return list(self._active_workflows.values())

    async def cleanup_completed_workflows(self, max_age_hours: int = 24) -> None:
        """Clean up old workflow states to manage resource usage."""
        current_time = datetime.utcnow()
        async with self._lock:
            to_remove = [
                execution_id for execution_id, state in self._active_workflows.items()
                if state.end_time and (current_time - state.end_time).total_seconds() > max_age_hours * 3600
            ]
            
            self._logger.info(
                "cleaning_up_workflows",
                workflows_to_remove=len(to_remove),
                max_age_hours=max_age_hours
            )
            
            for execution_id in to_remove:
                del self._active_workflows[execution_id]

# Custom Exceptions
class ResourceExhaustion(Exception):
    """Raised when resource limits are exceeded."""
    pass

class SecurityViolation(Exception):
    """Raised when security checks fail."""
    pass

class ValidationError(Exception):
    """Raised when input validation fails."""
    pass

# Example workflow implementation
class MonitoringWorkflow(Workflow):
    """Example workflow for system monitoring."""
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        # Implementation would include monitoring logic
        return {"status": "monitoring_complete", "data": context}

    async def validate(self, context: Dict[str, Any]) -> bool:
        required_keys = self.get_requirements()
        return all(key in context for key in required_keys)

    def get_requirements(self) -> List[str]:
        return ["system_metrics", "monitoring_config"] 