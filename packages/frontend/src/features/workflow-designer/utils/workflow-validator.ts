/**
 * workflow-validator.ts
 * Utility for validating workflow structures
 */

import { AgentNodeType } from '../types/agent-types';
import { 
  AgentNode, 
  LLMNode, 
  ToolNode, 
  ResourceNode, 
  RouterNode, 
  ParallelNode, 
  OrchestratorNode, 
  EvaluatorNode, 
  InputNode, 
  OutputNode, 
  ConditionNode,
  Edge,
  Workflow
} from '../types/agent-types';

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
 * Helper function to add a validation error 
 */
function addValidationError(
  errors: ValidationError[],
  message: string,
  severity: 'error' | 'warning',
  nodeId?: string,
  field?: string
): void {
  errors.push({
    nodeId,
    field,
    message,
    severity,
  });
}

/**
 * Validates a workflow to ensure it has proper structure and connections
 * @param workflow The workflow to validate
 * @returns Array of validation errors
 */
export function validateWorkflow(workflow: Workflow): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if workflow has nodes
  if (!workflow.nodes || workflow.nodes.length === 0) {
    addValidationError(
      errors,
      'Workflow must have at least one node',
      'error'
    );
    return errors;
  }

  // Validate each node based on its type
  workflow.nodes.forEach((node) => {
    // Check if node has a type
    if (!node.type) {
      addValidationError(
        errors,
        'Node must have a type',
        'error',
        node.id as string,
        'type'
      );
      return;
    }

    // Validate node based on its type
    if (isLLMNode(node)) {
      validateLLMNode(node, errors);
    } else if (isToolNode(node)) {
      validateToolNode(node, errors);
    } else if (isResourceNode(node)) {
      validateResourceNode(node, errors);
    } else if (isRouterNode(node)) {
      validateRouterNode(node, errors);
    } else if (isParallelNode(node)) {
      validateParallelNode(node, errors, workflow);
    } else if (isOrchestratorNode(node)) {
      validateOrchestratorNode(node, errors);
    } else if (isEvaluatorNode(node)) {
      validateEvaluatorNode(node, errors);
    } else if (isConditionNode(node)) {
      validateConditionNode(node, errors, workflow);
    }
  });

  // Validate workflow structure
  validateOrphanedNodes(workflow, errors);
  validateEntryExitPoints(workflow, errors);

  return errors;
}

/**
 * Validates an LLM node
 */
function validateLLMNode(node: LLMNode, errors: ValidationError[]): void {
  if (!node.data?.model) {
    addValidationError(
      errors,
      `LLM node ${node.id} is missing a model`,
      'warning',
      node.id,
      'model'
    );
  }
}

/**
 * Validates a Tool node
 */
function validateToolNode(node: ToolNode, errors: ValidationError[]): void {
  if (!node.data?.serverName) {
    addValidationError(
      errors,
      `Tool node ${node.id} is missing a server name`,
      'warning',
      node.id,
      'serverName'
    );
  }
  
  if (!node.data?.toolName) {
    addValidationError(
      errors,
      `Tool node ${node.id} is missing a tool name`,
      'warning',
      node.id,
      'toolName'
    );
  }
}

/**
 * Validates a Resource node
 */
function validateResourceNode(node: ResourceNode, errors: ValidationError[]): void {
  if (!node.data?.uri) {
    addValidationError(
      errors,
      `Resource node ${node.id} is missing a URI`,
      'warning',
      node.id,
      'uri'
    );
  }
}

/**
 * Validates a Router node
 */
function validateRouterNode(node: RouterNode, errors: ValidationError[]): void {
  if (!node.data?.routingField) {
    addValidationError(
      errors,
      `Router node ${node.id} is missing a routing field`,
      'warning',
      node.id,
      'routingField'
    );
  }
  
  if (!node.data?.routes || node.data.routes.length === 0) {
    addValidationError(
      errors,
      `Router node ${node.id} has no routes defined`,
      'warning',
      node.id,
      'routes'
    );
  }
}

/**
 * Validates a Parallel node
 */
function validateParallelNode(
  node: ParallelNode,
  errors: ValidationError[],
  workflow: Workflow
): void {
  if (!node.data?.targetNodeIds || node.data.targetNodeIds.length === 0) {
    addValidationError(
      errors,
      `Parallel node ${node.id} has no target nodes`,
      'warning',
      node.id,
      'targetNodeIds'
    );
  } else {
    // Check that all target nodes exist
    node.data.targetNodeIds.forEach((targetId: string) => {
      if (!workflow.nodes.some(n => n.id === targetId)) {
        addValidationError(
          errors,
          `Parallel node ${node.id} references non-existent node: ${targetId}`,
          'error',
          node.id,
          'targetNodeIds'
        );
      }
    });
  }
}

/**
 * Validates an Orchestrator node
 */
function validateOrchestratorNode(
  node: OrchestratorNode,
  errors: ValidationError[]
): void {
  if (typeof node.data?.maxWorkers !== 'number' || node.data.maxWorkers < 1) {
    addValidationError(
      errors,
      `Orchestrator node ${node.id} has an invalid number of max workers`,
      'warning',
      node.id,
      'maxWorkers'
    );
  }
  
  if (!node.data?.workerTemplate) {
    addValidationError(
      errors,
      `Orchestrator node ${node.id} is missing a worker template`,
      'error',
      node.id,
      'workerTemplate'
    );
  }
}

/**
 * Validates an Evaluator node
 */
function validateEvaluatorNode(
  node: EvaluatorNode,
  errors: ValidationError[]
): void {
  if (typeof node.data?.maxIterations !== 'number' || node.data.maxIterations < 1) {
    addValidationError(
      errors,
      `Evaluator node ${node.id} has an invalid number of max iterations`,
      'warning',
      node.id,
      'maxIterations'
    );
  }
  
  if (!node.data?.evaluationCriteria || node.data.evaluationCriteria.length === 0) {
    addValidationError(
      errors,
      `Evaluator node ${node.id} has no evaluation criteria defined`,
      'warning',
      node.id,
      'evaluationCriteria'
    );
  }
}

/**
 * Validates a Condition node
 */
function validateConditionNode(
  node: ConditionNode,
  errors: ValidationError[],
  workflow: Workflow
): void {
  if (!node.data?.condition) {
    addValidationError(
      errors,
      `Condition node ${node.id} is missing a condition`,
      'error',
      node.id,
      'condition'
    );
  }
  
  if (!node.data?.trueTargetNodeId) {
    addValidationError(
      errors,
      `Condition node ${node.id} is missing a true target node`,
      'error',
      node.id,
      'trueTargetNodeId'
    );
  } else if (!workflow.nodes.some(n => n.id === node.data.trueTargetNodeId)) {
    addValidationError(
      errors,
      `Condition node ${node.id} references non-existent true target node: ${node.data.trueTargetNodeId}`,
      'error',
      node.id,
      'trueTargetNodeId'
    );
  }
  
  if (!node.data?.falseTargetNodeId) {
    addValidationError(
      errors,
      `Condition node ${node.id} is missing a false target node`,
      'error',
      node.id,
      'falseTargetNodeId'
    );
  } else if (!workflow.nodes.some(n => n.id === node.data.falseTargetNodeId)) {
    addValidationError(
      errors,
      `Condition node ${node.id} references non-existent false target node: ${node.data.falseTargetNodeId}`,
      'error',
      node.id,
      'falseTargetNodeId'
    );
  }
}

/**
 * Validates for orphaned nodes
 */
function validateOrphanedNodes(
  workflow: Workflow,
  errors: ValidationError[]
): void {
  if (workflow.edges && workflow.edges.length > 0) {
    workflow.nodes.forEach(node => {
      // Skip INPUT nodes as they don't need incoming edges
      if (node.type === AgentNodeType.INPUT) {
        return;
      }
      
      const hasIncomingEdge = workflow.edges.some(edge => edge.target === node.id);
      const hasOutgoingEdge = workflow.edges.some(edge => edge.source === node.id);
      
      if (!hasIncomingEdge && !hasOutgoingEdge) {
        addValidationError(
          errors,
          `Node ${node.id} (${node.label || 'Unnamed'}) is orphaned (no connections)`,
          'warning',
          node.id
        );
      }
      
      // OUTPUT nodes should have incoming but not necessarily outgoing edges
      if (node.type === AgentNodeType.OUTPUT && !hasIncomingEdge) {
        addValidationError(
          errors,
          `Output node ${node.id} has no incoming connections`,
          'error',
          node.id
        );
      }
    });
  }
}

/**
 * Validates for entry and exit points
 */
function validateEntryExitPoints(
  workflow: Workflow,
  errors: ValidationError[]
): void {
  // Check for missing entry point (INPUT node)
  const hasInputNode = workflow.nodes.some(node => node.type === AgentNodeType.INPUT);
  if (!hasInputNode) {
    addValidationError(
      errors,
      'Workflow is missing an Input node',
      'error'
    );
  }
  
  // Check for missing exit point (OUTPUT node)
  const hasOutputNode = workflow.nodes.some(node => node.type === AgentNodeType.OUTPUT);
  if (!hasOutputNode) {
    addValidationError(
      errors,
      'Workflow is missing an Output node',
      'warning'
    );
  }
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