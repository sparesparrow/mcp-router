/**
 * workflow-validator.ts
 * Utility for validating workflow structures
 */

import { AgentNodeType } from '@mcp-router/shared/dist/types/mcp';
import { Workflow, AgentNode, LLMNode, ToolNode, ResourceNode, RouterNode, ParallelNode, OrchestratorNode, EvaluatorNode, InputNode, OutputNode, ConditionNode } from '../types/agent-types';

export interface ValidationError {
  nodeId?: string;
  edgeId?: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Type guards for node types
 */
function isLLMNode(node: AgentNode): node is LLMNode {
  return node.type === AgentNodeType.LLM;
}

function isToolNode(node: AgentNode): node is ToolNode {
  return node.type === AgentNodeType.TOOL;
}

function isResourceNode(node: AgentNode): node is ResourceNode {
  return node.type === AgentNodeType.RESOURCE;
}

function isRouterNode(node: AgentNode): node is RouterNode {
  return node.type === AgentNodeType.ROUTER;
}

function isParallelNode(node: AgentNode): node is ParallelNode {
  return node.type === AgentNodeType.PARALLEL;
}

function isOrchestratorNode(node: AgentNode): node is OrchestratorNode {
  return node.type === AgentNodeType.ORCHESTRATOR;
}

function isEvaluatorNode(node: AgentNode): node is EvaluatorNode {
  return node.type === AgentNodeType.EVALUATOR;
}

function isInputNode(node: AgentNode): node is InputNode {
  return node.type === AgentNodeType.INPUT;
}

function isOutputNode(node: AgentNode): node is OutputNode {
  return node.type === AgentNodeType.OUTPUT;
}

function isConditionNode(node: AgentNode): node is ConditionNode {
  return node.type === AgentNodeType.CONDITION;
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
  
  // Validate each node
  for (const node of workflow.nodes) {
    // Skip validation for nodes without an ID
    if (!node?.id) {
      validationErrors.push({
        message: 'Node is missing an ID',
        severity: 'error',
      });
      continue;
    }
    
    const nodeId = node.id;
    
    if (!node.type) {
      validationErrors.push({
        nodeId,
        message: `Node ${nodeId} is missing a type`,
        severity: 'error',
      });
    }
    
    if (!node.label) {
      validationErrors.push({
        nodeId,
        message: `Node ${nodeId} is missing a label`,
        severity: 'warning',
      });
    }
    
    // Validate node fields based on type
    if (isLLMNode(node)) {
      if (!node.data?.model) {
        validationErrors.push({
          nodeId,
          field: 'model',
          message: `LLM node ${nodeId} is missing a model`,
          severity: 'warning',
        });
      }
    } 
    else if (isToolNode(node)) {
      if (!node.data?.serverName) {
        validationErrors.push({
          nodeId,
          field: 'serverName',
          message: `Tool node ${nodeId} is missing a server name`,
          severity: 'warning',
        });
      }
      
      if (!node.data?.toolName) {
        validationErrors.push({
          nodeId,
          field: 'toolName',
          message: `Tool node ${nodeId} is missing a tool name`,
          severity: 'warning',
        });
      }
    }
    else if (isResourceNode(node)) {
      if (!node.data?.uri) {
        validationErrors.push({
          nodeId,
          field: 'uri',
          message: `Resource node ${nodeId} is missing a URI`,
          severity: 'warning',
        });
      }
    }
    else if (isRouterNode(node)) {
      if (!node.data?.routingField) {
        validationErrors.push({
          nodeId,
          field: 'routingField',
          message: `Router node ${nodeId} is missing a routing field`,
          severity: 'warning',
        });
      }
      
      if (!node.data?.routes || node.data.routes.length === 0) {
        validationErrors.push({
          nodeId,
          field: 'routes',
          message: `Router node ${nodeId} has no routes defined`,
          severity: 'warning',
        });
      }
    }
    else if (isParallelNode(node)) {
      if (!node.data?.targetNodeIds || node.data.targetNodeIds.length === 0) {
        validationErrors.push({
          nodeId,
          field: 'targetNodeIds',
          message: `Parallel node ${nodeId} has no target nodes`,
          severity: 'warning',
        });
      } else {
        // Check that all target nodes exist
        node.data.targetNodeIds.forEach((targetId: string) => {
          if (!workflow.nodes.some(n => n.id === targetId)) {
            validationErrors.push({
              nodeId,
              field: 'targetNodeIds',
              message: `Parallel node ${nodeId} references non-existent node: ${targetId}`,
              severity: 'error',
            });
          }
        });
      }
    }
    else if (isOrchestratorNode(node)) {
      if (typeof node.data?.maxWorkers !== 'number' || node.data.maxWorkers < 1) {
        validationErrors.push({
          nodeId,
          field: 'maxWorkers',
          message: `Orchestrator node ${nodeId} has an invalid number of max workers`,
          severity: 'warning',
        });
      }
      
      if (!node.data?.workerTemplate) {
        validationErrors.push({
          nodeId,
          field: 'workerTemplate',
          message: `Orchestrator node ${nodeId} is missing a worker template`,
          severity: 'error',
        });
      }
    }
    else if (isEvaluatorNode(node)) {
      if (typeof node.data?.maxIterations !== 'number' || node.data.maxIterations < 1) {
        validationErrors.push({
          nodeId,
          field: 'maxIterations',
          message: `Evaluator node ${nodeId} has an invalid number of max iterations`,
          severity: 'warning',
        });
      }
      
      if (!node.data?.evaluationCriteria || node.data.evaluationCriteria.length === 0) {
        validationErrors.push({
          nodeId,
          field: 'evaluationCriteria',
          message: `Evaluator node ${nodeId} has no evaluation criteria defined`,
          severity: 'warning',
        });
      }
    }
    else if (isConditionNode(node)) {
      if (!node.data?.condition) {
        validationErrors.push({
          nodeId,
          field: 'condition',
          message: `Condition node ${nodeId} is missing a condition`,
          severity: 'error',
        });
      }
      
      if (!node.data?.trueTargetNodeId) {
        validationErrors.push({
          nodeId,
          field: 'trueTargetNodeId',
          message: `Condition node ${nodeId} is missing a true target node`,
          severity: 'error',
        });
      } else if (!workflow.nodes.some(n => n.id === node.data.trueTargetNodeId)) {
        validationErrors.push({
          nodeId,
          field: 'trueTargetNodeId',
          message: `Condition node ${nodeId} references non-existent true target node: ${node.data.trueTargetNodeId}`,
          severity: 'error',
        });
      }
      
      if (!node.data?.falseTargetNodeId) {
        validationErrors.push({
          nodeId,
          field: 'falseTargetNodeId',
          message: `Condition node ${nodeId} is missing a false target node`,
          severity: 'error',
        });
      } else if (!workflow.nodes.some(n => n.id === node.data.falseTargetNodeId)) {
        validationErrors.push({
          nodeId,
          field: 'falseTargetNodeId',
          message: `Condition node ${nodeId} references non-existent false target node: ${node.data.falseTargetNodeId}`,
          severity: 'error',
        });
      }
    }
  }
  
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