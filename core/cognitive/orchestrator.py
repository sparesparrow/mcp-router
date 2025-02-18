from typing import Dict, List, Optional, Type, Any, Literal
from abc import ABC, abstractmethod
from datetime import datetime, UTC
import asyncio
from pydantic import BaseModel, validator, Field
import resource
import logging
import json
from dataclasses import dataclass
import structlog
from prometheus_client import Counter, Histogram, Gauge, REGISTRY

# MCP Protocol Models
class MCPRequest(BaseModel):
    """Base model for MCP requests."""
    jsonrpc: Literal["2.0"] = "2.0"
    id: str
    method: str
    params: Dict[str, Any]

class MCPResponse(BaseModel):
    """Base model for MCP responses."""
    jsonrpc: Literal["2.0"] = "2.0"
    id: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None

class MCPNotification(BaseModel):
    """Base model for MCP notifications."""
    jsonrpc: Literal["2.0"] = "2.0"
    method: str
    params: Dict[str, Any]

class MCPError(Exception):
    """MCP protocol error with standard error codes."""
    def __init__(self, code: int, message: str, data: Optional[Dict[str, Any]] = None):
        self.code = code
        self.message = message
        self.data = data
        super().__init__(message)

    @classmethod
    def method_not_found(cls, method: str) -> "MCPError":
        return cls(-32601, f"Method not found: {method}")

    @classmethod
    def invalid_request(cls, details: str) -> "MCPError":
        return cls(-32600, f"Invalid Request: {details}")

    @classmethod
    def resource_exhausted(cls, details: str) -> "MCPError":
        return cls(-32000, f"Resource exhausted: {details}")

# Pydantic Models for Validation
class ResourceLimits(BaseModel):
    """Resource limits configuration with MCP-compliant validation."""
    max_concurrent_workflows: int = Field(default=100, gt=0)
    max_memory_mb: float = Field(default=1024, gt=0)
    max_cpu_time_seconds: float = Field(default=300, gt=0)
    max_message_size_bytes: int = Field(default=1048576, gt=0)  # 1MB limit for MCP messages

class WorkflowContext(BaseModel):
    """Workflow context with enhanced validation and MCP compatibility."""
    monitoring_config: Dict[str, Any] = Field(...)
    enabled_services: List[str] = Field(...)
    client_capabilities: Optional[Dict[str, Any]] = Field(default=None)
    
    @validator("enabled_services")
    def validate_services(cls, services):
        valid_services = {"screenshot", "network", "clipboard"}
        invalid_services = set(services) - valid_services
        if invalid_services:
            raise ValueError(f"Invalid services: {invalid_services}")
        return services

class WorkflowState(BaseModel):
    """Enhanced state model with MCP-compliant fields."""
    workflow_id: str
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    results: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None
    resource_usage: Optional[Dict[str, float]] = None
    client_id: Optional[str] = None
    sequence_num: int = 0

# Metrics Collection with MCP Integration
class WorkflowMetrics:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(WorkflowMetrics, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            # Clear any existing metrics with our names to prevent duplicates
            collectors_to_remove = []
            for collector in REGISTRY._collector_to_names.keys():
                names = REGISTRY._collector_to_names[collector]
                if any(name in {
                    "workflow_executions_total",
                    "workflow_execution_seconds",
                    "workflow_resource_usage",
                    "active_workflows"
                } for name in names):
                    collectors_to_remove.append(collector)
            
            for collector in collectors_to_remove:
                REGISTRY.unregister(collector)

            # Initialize metrics
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
            self._initialized = True

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
    Orchestrates cognitive workflows following MCP protocol and Building Effective Agents patterns.
    Implements a modular, transparent, and robust workflow management system.
    """
    
    def __init__(self, resource_limits: Optional[ResourceLimits] = None):
        self._workflows: Dict[str, Type[Workflow]] = {}
        self._active_workflows: Dict[str, WorkflowState] = {}
        self._lock = asyncio.Lock()
        self._resource_limits = resource_limits or ResourceLimits()
        self._metrics = WorkflowMetrics()
        self._request_handlers: Dict[str, callable] = {}
        self._notification_handlers: Dict[str, callable] = {}
        self._client_sessions: Dict[str, Dict[str, Any]] = {}
        
        # Configure structured logging with MCP context
        self._logger = structlog.get_logger(__name__)
        structlog.configure(
            processors=[
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.JSONRenderer()
            ],
            wrapper_class=structlog.BoundLogger,
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(),
        )
        
        # Register MCP protocol handlers
        self._register_handlers()

    def _register_handlers(self) -> None:
        """Register MCP protocol request and notification handlers."""
        self._request_handlers.update({
            "workflow/register": self._handle_workflow_register,
            "workflow/execute": self._handle_workflow_execute,
            "workflow/status": self._handle_workflow_status,
            "workflow/list": self._handle_workflow_list,
            "initialize": self._handle_initialize,
        })
        
        self._notification_handlers.update({
            "workflow/cleanup": self._handle_workflow_cleanup,
            "initialized": self._handle_initialized,
        })

    async def handle_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incoming MCP requests with proper validation and error handling."""
        try:
            # Validate request format
            request = MCPRequest(**request_data)
            
            # Check message size
            if len(json.dumps(request_data)) > self._resource_limits.max_message_size_bytes:
                raise MCPError.invalid_request("Message size exceeds limit")
            
            # Get handler for method
            handler = self._request_handlers.get(request.method)
            if not handler:
                raise MCPError.method_not_found(request.method)
            
            # Execute handler with params
            result = await handler(request.params)
            
            # Return success response
            return MCPResponse(
                id=request.id,
                result=result
            ).dict()
            
        except MCPError as e:
            # Return error response for MCP protocol errors
            return MCPResponse(
                id=request_data.get("id", ""),
                error={"code": e.code, "message": e.message, "data": e.data}
            ).dict()
        except Exception as e:
            # Convert other exceptions to MCP errors
            return MCPResponse(
                id=request_data.get("id", ""),
                error={"code": -32603, "message": f"Internal error: {str(e)}"}
            ).dict()

    async def handle_notification(self, notification_data: Dict[str, Any]) -> None:
        """Handle incoming MCP notifications."""
        try:
            notification = MCPNotification(**notification_data)
            handler = self._notification_handlers.get(notification.method)
            if handler:
                await handler(notification.params)
        except Exception as e:
            self._logger.error(
                "notification_handler_error",
                method=notification_data.get("method"),
                error=str(e),
                exc_info=True
            )

    async def _handle_initialize(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle MCP initialize request."""
        client_id = params.get("client_id", str(datetime.now(UTC).timestamp()))
        capabilities = params.get("capabilities", {})
        
        self._client_sessions[client_id] = {
            "capabilities": capabilities,
            "initialized": False,
            "start_time": datetime.now(UTC)
        }
        
        return {
            "server_info": {
                "name": "CognitiveOrchestrator",
                "version": "1.0.0",
                "capabilities": {
                    "workflows": list(self._workflows.keys()),
                    "concurrent_workflows": self._resource_limits.max_concurrent_workflows,
                    "protocols": ["mcp/1.0"]
                }
            }
        }

    async def _handle_initialized(self, params: Dict[str, Any]) -> None:
        """Handle MCP initialized notification."""
        client_id = params.get("client_id")
        if client_id in self._client_sessions:
            self._client_sessions[client_id]["initialized"] = True

    async def _handle_workflow_register(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle workflow registration request."""
        workflow_id = params["workflow_id"]
        workflow_class = params["workflow_class"]
        
        if not issubclass(workflow_class, Workflow):
            raise MCPError.invalid_request("Workflow class must inherit from Workflow base class")
        
        self._logger.info(
            "registering_workflow",
            workflow_id=workflow_id,
            workflow_class=workflow_class.__name__
        )
        
        async with self._lock:
            if workflow_id in self._workflows:
                raise MCPError.invalid_request(f"Workflow {workflow_id} already registered")
            self._workflows[workflow_id] = workflow_class
        
        return {"status": "registered"}

    async def _handle_workflow_execute(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle workflow execution request with MCP protocol."""
        workflow_id = params["workflow_id"]
        context = params["context"]
        client_id = params.get("client_id")
        
        if workflow_id not in self._workflows:
            raise MCPError.method_not_found(f"Workflow {workflow_id} not found")
        
        # Validate context using Pydantic
        try:
            validated_context = WorkflowContext(**context)
        except ValueError as e:
            raise MCPError.invalid_request(f"Invalid context: {str(e)}")
        
        # Create workflow instance
        workflow_class = self._workflows[workflow_id]
        workflow = workflow_class()
        
        # Create execution state
        execution_id = f"{workflow_id}_{datetime.now(UTC).isoformat()}"
        state = WorkflowState(
            workflow_id=workflow_id,
            status="running",
            start_time=datetime.now(UTC),
            client_id=client_id
        )
        
        self._logger.info(
            "workflow_execution_started",
            execution_id=execution_id,
            workflow_id=workflow_id,
            client_id=client_id
        )
        
        async with self._lock:
            self._active_workflows[execution_id] = state
            self._metrics.active_workflows.inc()
        
        try:
            with self._metrics.execution_time.labels(workflow_id).time():
                results = await self._execute_with_resource_management(
                    workflow, 
                    validated_context.dict()
                )
            
            # Update state with success
            state.status = "completed"
            state.end_time = datetime.now(UTC)
            state.results = results
            
            self._metrics.workflow_executions.labels(
                workflow_id=workflow_id,
                status="success"
            ).inc()
            
            return {
                "execution_id": execution_id,
                "status": "completed",
                "results": results
            }
            
        except Exception as e:
            # Update state with error
            state.status = "failed"
            state.end_time = datetime.now(UTC)
            state.error = {
                "code": getattr(e, "code", -32603),
                "message": str(e),
                "data": getattr(e, "data", None)
            }
            
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
            
            if isinstance(e, MCPError):
                raise e
            raise MCPError(-32603, f"Workflow execution failed: {str(e)}")
            
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

    async def _handle_workflow_status(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle workflow status request."""
        execution_id = params["execution_id"]
        state = await self.get_workflow_state(execution_id)
        if not state:
            raise MCPError.invalid_request(f"Workflow execution {execution_id} not found")
        return state.dict()

    async def _handle_workflow_list(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Handle workflow listing request."""
        states = await self.list_active_workflows()
        return {
            "workflows": [state.dict() for state in states]
        }

    async def _handle_workflow_cleanup(self, params: Dict[str, Any]) -> None:
        """Handle workflow cleanup notification."""
        max_age_hours = params.get("max_age_hours", 24)
        await self.cleanup_completed_workflows(max_age_hours)

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
        execution_id = f"{workflow_id}_{datetime.now(UTC).isoformat()}"
        state = WorkflowState(
            workflow_id=workflow_id,
            status="running",
            start_time=datetime.now(UTC)
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
            state.end_time = datetime.now(UTC)
            state.results = results
            
            self._metrics.workflow_executions.labels(
                workflow_id=workflow_id,
                status="success"
            ).inc()

        except Exception as e:
            # Update state with error
            state.status = "failed"
            state.end_time = datetime.now(UTC)
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
        current_time = datetime.now(UTC)
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