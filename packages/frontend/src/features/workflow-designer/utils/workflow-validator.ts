/**
 * workflow-validator.ts
 * Utility for validating workflow structures
 */

import { AgentNodeType } from '@mcp-router/shared/dist/types/mcp';
import { Workflow, AgentNode } from '../types/agent-types';

export interface ValidationError {
  nodeId?: string;
  edgeId?: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validates a workflow to ensure it has proper structure and connections
 * @param workflow The workflow to validate
 * @returns Array of validation errors
 */
export function validateWorkflow(workflow: Workflow): ValidationError[] {
  const validationErrors: ValidationError[] = [];
  
  // Check if workflow has basic structure
  if (!workflow.id) {
    validationErrors.push({
      message: 'Workflow is missing an ID',
      severity: 'error',
    });
  }
  
  if (!workflow.name) {
    validationErrors.push({
      message: 'Workflow is missing a name',
      severity: 'warning',
    });
  }
  
  if (!workflow.nodes || workflow.nodes.length === 0) {
    validationErrors.push({
      message: 'Workflow has no nodes',
      severity: 'error',
    });
    
    // Early return since most other validations depend on nodes
    return validationErrors;
  }
  
  // Validate that nodes have proper structure
  workflow.nodes.forEach((node: AgentNode) => {
    if (!node.id) {
      validationErrors.push({
        message: 'Node is missing an ID',
        severity: 'error',
      });
      return; // Skip further validation for this node
    }
    
    if (!node.type) {
      validationErrors.push({
        nodeId: node.id,
        message: `Node ${node.id} is missing a type`,
        severity: 'error',
      });
    }
    
    if (!node.label) {
      validationErrors.push({
        nodeId: node.id,
        message: `Node ${node.id} is missing a label`,
        severity: 'warning',
      });
    }
    
    // Validate node fields based on type
    switch (node.type) {
      case AgentNodeType.LLM:
        if (!node.data?.model) {
          validationErrors.push({
            nodeId: node.id,
            field: 'model',
            message: `LLM node ${node.id} is missing a model`,
            severity: 'warning',
          });
        }
        break;
        
      case AgentNodeType.TOOL:
        if (!node.data?.serverName) {
          validationErrors.push({
            nodeId: node.id,
            field: 'serverName',
            message: `Tool node ${node.id} is missing a server name`,
            severity: 'warning',
          });
        }
        
        if (!node.data?.toolName) {
          validationErrors.push({
            nodeId: node.id,
            field: 'toolName',
            message: `Tool node ${node.id} is missing a tool name`,
            severity: 'warning',
          });
        }
        break;
        
      case AgentNodeType.RESOURCE:
        if (!node.data?.uri) {
          validationErrors.push({
            nodeId: node.id,
            field: 'uri',
            message: `Resource node ${node.id} is missing a URI`,
            severity: 'warning',
          });
        }
        break;
        
      case AgentNodeType.ROUTER:
        if (!node.data?.routingField) {
          validationErrors.push({
            nodeId: node.id,
            field: 'routingField',
            message: `Router node ${node.id} is missing a routing field`,
            severity: 'warning',
          });
        }
        
        if (!node.data?.routes || node.data.routes.length === 0) {
          validationErrors.push({
            nodeId: node.id,
            field: 'routes',
            message: `Router node ${node.id} has no routes defined`,
            severity: 'warning',
          });
        }
        break;
        
      case AgentNodeType.PARALLEL:
        if (!node.data?.targetNodeIds || node.data.targetNodeIds.length === 0) {
          validationErrors.push({
            nodeId: node.id,
            field: 'targetNodeIds',
            message: `Parallel node ${node.id} has no target nodes`,
            severity: 'warning',
          });
        } else {
          // Check that all target nodes exist
          node.data.targetNodeIds.forEach(targetId => {
            if (!workflow.nodes.some(n => n.id === targetId)) {
              validationErrors.push({
                nodeId: node.id,
                field: 'targetNodeIds',
                message: `Parallel node ${node.id} references non-existent node: ${targetId}`,
                severity: 'error',
              });
            }
          });
        }
        break;
        
      case AgentNodeType.ORCHESTRATOR:
        if (typeof node.data?.maxWorkers !== 'number' || node.data.maxWorkers < 1) {
          validationErrors.push({
            nodeId: node.id,
            field: 'maxWorkers',
            message: `Orchestrator node ${node.id} has an invalid number of max workers`,
            severity: 'warning',
          });
        }
        
        if (!node.data?.workerTemplate) {
          validationErrors.push({
            nodeId: node.id,
            field: 'workerTemplate',
            message: `Orchestrator node ${node.id} is missing a worker template`,
            severity: 'error',
          });
        }
        break;
        
      case AgentNodeType.EVALUATOR:
        if (typeof node.data?.maxIterations !== 'number' || node.data.maxIterations < 1) {
          validationErrors.push({
            nodeId: node.id,
            field: 'maxIterations',
            message: `Evaluator node ${node.id} has an invalid number of max iterations`,
            severity: 'warning',
          });
        }
        
        if (!node.data?.evaluationCriteria || node.data.evaluationCriteria.length === 0) {
          validationErrors.push({
            nodeId: node.id,
            field: 'evaluationCriteria',
            message: `Evaluator node ${node.id} has no evaluation criteria defined`,
            severity: 'warning',
          });
        }
        break;
        
      case AgentNodeType.INPUT:
        // No specific validations for INPUT nodes
        break;
        
      case AgentNodeType.OUTPUT:
        // No specific validations for OUTPUT nodes
        break;
        
      case AgentNodeType.CONDITION:
        if (!node.data?.condition) {
          validationErrors.push({
            nodeId: node.id,
            field: 'condition',
            message: `Condition node ${node.id} is missing a condition`,
            severity: 'error',
          });
        }
        
        if (!node.data?.trueTargetNodeId) {
          validationErrors.push({
            nodeId: node.id,
            field: 'trueTargetNodeId',
            message: `Condition node ${node.id} is missing a true target node`,
            severity: 'error',
          });
        } else if (!workflow.nodes.some(n => n.id === node.data.trueTargetNodeId)) {
          validationErrors.push({
            nodeId: node.id,
            field: 'trueTargetNodeId',
            message: `Condition node ${node.id} references non-existent true target node: ${node.data.trueTargetNodeId}`,
            severity: 'error',
          });
        }
        
        if (!node.data?.falseTargetNodeId) {
          validationErrors.push({
            nodeId: node.id,
            field: 'falseTargetNodeId',
            message: `Condition node ${node.id} is missing a false target node`,
            severity: 'error',
          });
        } else if (!workflow.nodes.some(n => n.id === node.data.falseTargetNodeId)) {
          validationErrors.push({
            nodeId: node.id,
            field: 'falseTargetNodeId',
            message: `Condition node ${node.id} references non-existent false target node: ${node.data.falseTargetNodeId}`,
            severity: 'error',
          });
        }
        break;
    }
  });
  
  // Check for orphaned nodes (no incoming or outgoing edges)
  if (workflow.edges && workflow.edges.length > 0) {
    workflow.nodes.forEach(node => {
      // Skip INPUT nodes as they don't need incoming edges
      if (node.type === AgentNodeType.INPUT) {
        return;
      }
      
      const hasIncomingEdge = workflow.edges.some(edge => edge.target === node.id);
      const hasOutgoingEdge = workflow.edges.some(edge => edge.source === node.id);
      
      if (!hasIncomingEdge && !hasOutgoingEdge) {
        validationErrors.push({
          nodeId: node.id,
          message: `Node ${node.id} (${node.label || 'Unnamed'}) is orphaned (no connections)`,
          severity: 'warning',
        });
      }
      
      // OUTPUT nodes should have incoming but not necessarily outgoing edges
      if (node.type === AgentNodeType.OUTPUT && !hasIncomingEdge) {
        validationErrors.push({
          nodeId: node.id,
          message: `Output node ${node.id} has no incoming connections`,
          severity: 'error',
        });
      }
    });
  }
  
  // Check for missing entry point (INPUT node)
  const hasInputNode = workflow.nodes.some(node => node.type === AgentNodeType.INPUT);
  if (!hasInputNode) {
    validationErrors.push({
      message: 'Workflow is missing an Input node',
      severity: 'error',
    });
  }
  
  // Check for missing exit point (OUTPUT node)
  const hasOutputNode = workflow.nodes.some(node => node.type === AgentNodeType.OUTPUT);
  if (!hasOutputNode) {
    validationErrors.push({
      message: 'Workflow is missing an Output node',
      severity: 'warning',
    });
  }
  
  return validationErrors;
}

/**
 * Checks if a workflow has any validation errors
 * @param workflow The workflow to check
 * @returns True if the workflow has validation errors
 */
export function hasValidationErrors(workflow: Workflow): boolean {
  const errors = validateWorkflow(workflow);
  return errors.some(error => error.severity === 'error');
}

/**
 * Checks if a workflow has any validation warnings
 * @param workflow The workflow to check
 * @returns True if the workflow has validation warnings
 */
export function hasValidationWarnings(workflow: Workflow): boolean {
  const errors = validateWorkflow(workflow);
  return errors.some(error => error.severity === 'warning');
}

/**
 * Gets all validation errors for a specific node
 * @param workflow The workflow containing the node
 * @param nodeId The ID of the node to check
 * @returns Array of validation errors for the node
 */
export function getNodeValidationErrors(workflow: Workflow, nodeId: string): ValidationError[] {
  const errors = validateWorkflow(workflow);
  return errors.filter(error => error.nodeId === nodeId);
}

/**
 * Gets all validation errors for a specific edge
 * @param workflow The workflow containing the edge
 * @param edgeId The ID of the edge to check
 * @returns Array of validation errors for the edge
 */
export function getEdgeValidationErrors(workflow: Workflow, edgeId: string): ValidationError[] {
  const errors = validateWorkflow(workflow);
  return errors.filter(error => error.edgeId === edgeId);
} 