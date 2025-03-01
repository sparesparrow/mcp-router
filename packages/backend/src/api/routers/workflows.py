from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import Dict, Any, List, Optional
import uuid
import json
import structlog
from datetime import datetime
from pydantic import BaseModel, Field

logger = structlog.get_logger()

router = APIRouter()

# In-memory storage for workflows (would be replaced with database in production)
workflows = {}
workflow_executions = {}

# Models
class WorkflowNode(BaseModel):
    id: str
    type: str
    label: str
    position: Dict[str, float]
    data: Optional[Dict[str, Any]] = None

class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    label: Optional[str] = None
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None

class Workflow(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]
    variables: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class WorkflowSummary(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    createdAt: str
    updatedAt: str

class WorkflowExecutionRequest(BaseModel):
    workflowId: str
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)

class WorkflowExecutionResponse(BaseModel):
    executionId: str
    status: str

class WorkflowStatus(BaseModel):
    id: str
    status: str
    result: Optional[Any] = None
    error: Optional[str] = None

class WorkflowListResponse(BaseModel):
    workflows: List[WorkflowSummary]

class WorkflowValidationResponse(BaseModel):
    valid: bool
    errors: Optional[List[str]] = None

# Routes
@router.get("/", response_model=WorkflowListResponse)
async def list_workflows():
    """List all available workflows"""
    workflow_list = []
    for wf_id, wf in workflows.items():
        workflow_list.append(WorkflowSummary(
            id=wf_id,
            name=wf.get("name", "Unnamed Workflow"),
            description=wf.get("description"),
            createdAt=wf.get("metadata", {}).get("createdAt", datetime.utcnow().isoformat()),
            updatedAt=wf.get("metadata", {}).get("updatedAt", datetime.utcnow().isoformat())
        ))
    
    return {"workflows": workflow_list}

@router.get("/{workflow_id}", response_model=Workflow)
async def get_workflow(workflow_id: str):
    """Get a specific workflow by ID"""
    if workflow_id not in workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    return workflows[workflow_id]

@router.post("/", response_model=Workflow)
async def create_workflow(workflow: Workflow):
    """Create a new workflow"""
    if not workflow.id:
        workflow.id = f"workflow-{uuid.uuid4()}"
    
    # Add metadata
    if not workflow.metadata:
        workflow.metadata = {}
    
    now = datetime.utcnow().isoformat()
    workflow.metadata["createdAt"] = now
    workflow.metadata["updatedAt"] = now
    
    workflows[workflow.id] = workflow.dict()
    return workflow

@router.put("/{workflow_id}", response_model=Workflow)
async def update_workflow(workflow_id: str, workflow: Workflow):
    """Update an existing workflow"""
    if workflow_id not in workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Update metadata
    if not workflow.metadata:
        workflow.metadata = {}
    
    workflow.metadata["updatedAt"] = datetime.utcnow().isoformat()
    
    # Preserve creation date
    if "createdAt" in workflows[workflow_id].get("metadata", {}):
        workflow.metadata["createdAt"] = workflows[workflow_id]["metadata"]["createdAt"]
    
    workflows[workflow_id] = workflow.dict()
    return workflow

@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str):
    """Delete a workflow"""
    if workflow_id not in workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    del workflows[workflow_id]
    return {"success": True}

@router.post("/execute", response_model=WorkflowExecutionResponse)
async def execute_workflow(request: WorkflowExecutionRequest, background_tasks: BackgroundTasks):
    """Execute a workflow"""
    if request.workflowId not in workflows:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    execution_id = f"exec-{uuid.uuid4()}"
    
    # Store initial execution status
    workflow_executions[execution_id] = {
        "id": execution_id,
        "workflowId": request.workflowId,
        "status": "pending",
        "context": request.context,
        "startTime": datetime.utcnow().isoformat(),
        "result": None,
        "error": None
    }
    
    # Execute workflow in background
    background_tasks.add_task(process_workflow, execution_id, request.workflowId, request.context)
    
    return WorkflowExecutionResponse(
        executionId=execution_id,
        status="pending"
    )

@router.get("/executions/{execution_id}", response_model=WorkflowStatus)
async def get_execution_status(execution_id: str):
    """Get the status of a workflow execution"""
    if execution_id not in workflow_executions:
        raise HTTPException(status_code=404, detail="Workflow execution not found")
    
    execution = workflow_executions[execution_id]
    
    return WorkflowStatus(
        id=execution_id,
        status=execution["status"],
        result=execution.get("result"),
        error=execution.get("error")
    )

@router.post("/validate", response_model=WorkflowValidationResponse)
async def validate_workflow(workflow: Workflow):
    """Validate a workflow"""
    errors = []
    
    # Check for empty workflow
    if not workflow.nodes:
        errors.append("Workflow must have at least one node")
    
    # Check for disconnected nodes
    connected_nodes = set()
    for edge in workflow.edges:
        connected_nodes.add(edge.source)
        connected_nodes.add(edge.target)
    
    for node in workflow.nodes:
        if node.id not in connected_nodes and len(workflow.nodes) > 1:
            errors.append(f"Node '{node.label}' ({node.id}) is disconnected")
    
    # Check for cycles (simplified check)
    # A more thorough cycle detection would use a graph algorithm
    
    return WorkflowValidationResponse(
        valid=len(errors) == 0,
        errors=errors if errors else None
    )

# Background task for workflow execution
async def process_workflow(execution_id: str, workflow_id: str, context: Dict[str, Any]):
    """Process a workflow in the background"""
    try:
        # Update status to running
        workflow_executions[execution_id]["status"] = "running"
        
        # Get the workflow
        workflow = workflows[workflow_id]
        
        # TODO: Implement actual workflow execution logic
        # This would involve traversing the workflow graph and executing each node
        
        # For now, just simulate processing
        import asyncio
        await asyncio.sleep(2)
        
        # Update with success result
        workflow_executions[execution_id]["status"] = "completed"
        workflow_executions[execution_id]["result"] = {
            "message": "Workflow executed successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
        workflow_executions[execution_id]["endTime"] = datetime.utcnow().isoformat()
        
    except Exception as e:
        logger.error("Error executing workflow", 
                    error=str(e), 
                    execution_id=execution_id,
                    workflow_id=workflow_id)
        
        # Update with error
        workflow_executions[execution_id]["status"] = "failed"
        workflow_executions[execution_id]["error"] = str(e)
        workflow_executions[execution_id]["endTime"] = datetime.utcnow().isoformat() 