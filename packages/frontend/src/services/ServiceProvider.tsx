/**
 * Service Provider
 * Sets up all services and provides context providers.
 */
import React from 'react';
import { ConnectionProvider } from '../contexts/services/ConnectionContext';
import { NodeTypeProvider } from '../contexts/services/NodeTypeContext';
import { NotificationProvider } from '../contexts/services/NotificationContext';
import { WorkflowProvider } from '../contexts/services/WorkflowContext';

// Service implementations
import { HttpService } from './implementations/HttpService';
import { WebSocketService } from './implementations/WebSocketService';
import { ConnectionService } from './implementations/ConnectionService';
import { WorkflowService } from './implementations/WorkflowService';
import { NotificationService } from './implementations/NotificationService';
import { NodeTypeRegistry } from './implementations/NodeTypeRegistry';

// Shared package adapter
import { createMCPServer, createMCPClient } from './adapters/SharedPackageAdapter';

// Default node components
import LLMNodeComponent from '../features/workflow-designer/components/Nodes/LLMNode';
import ToolNodeComponent from '../features/workflow-designer/components/Nodes/ToolNode';
import ResourceNodeComponent from '../features/workflow-designer/components/Nodes/ResourceNode';
import RouterNodeComponent from '../features/workflow-designer/components/Nodes/RouterNode';
import ParallelNodeComponent from '../features/workflow-designer/components/Nodes/ParallelNode';
import OrchestratorNodeComponent from '../features/workflow-designer/components/Nodes/OrchestratorNode';
import EvaluatorNodeComponent from '../features/workflow-designer/components/Nodes/EvaluatorNode';
import { InputNodeComponent, OutputNodeComponent } from '../features/workflow-designer/components/Nodes/InputOutputNodes';
import ConditionNodeComponent from '../features/workflow-designer/components/Nodes/ConditionNode';
import { AgentNodeType } from '../features/workflow-designer/types/agent-types';

// Environment variables for configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Initialize MCP core services from shared package
const mcpServer = createMCPServer();
const mcpClient = createMCPClient({
  name: "MCPWorkflowDesigner",
  version: "1.0.0",
  capabilities: ["handshake", "tools/list", "workflow"]
});

// Create service instances
const httpService = new HttpService(API_BASE_URL);
const webSocketService = new WebSocketService(API_BASE_URL);
const connectionService = new ConnectionService(webSocketService);
const workflowService = new WorkflowService(httpService, webSocketService);
const notificationService = new NotificationService();
const nodeTypeRegistry = new NodeTypeRegistry();

// Register default node components
nodeTypeRegistry.registerNodeType(AgentNodeType.LLM, LLMNodeComponent);
nodeTypeRegistry.registerNodeType(AgentNodeType.TOOL, ToolNodeComponent);
nodeTypeRegistry.registerNodeType(AgentNodeType.RESOURCE, ResourceNodeComponent);
nodeTypeRegistry.registerNodeType(AgentNodeType.ROUTER, RouterNodeComponent);
nodeTypeRegistry.registerNodeType(AgentNodeType.PARALLEL, ParallelNodeComponent);
nodeTypeRegistry.registerNodeType(AgentNodeType.ORCHESTRATOR, OrchestratorNodeComponent);
nodeTypeRegistry.registerNodeType(AgentNodeType.EVALUATOR, EvaluatorNodeComponent);
nodeTypeRegistry.registerNodeType(AgentNodeType.INPUT, InputNodeComponent);
nodeTypeRegistry.registerNodeType(AgentNodeType.OUTPUT, OutputNodeComponent);
nodeTypeRegistry.registerNodeType(AgentNodeType.CONDITION, ConditionNodeComponent);

interface ServiceProviderProps {
  children: React.ReactNode;
}

/**
 * The ServiceProvider component sets up all services and context providers.
 * It should be used at the root of the application.
 */
export const ServiceProvider: React.FC<ServiceProviderProps> = ({ children }) => {
  return (
    <ConnectionProvider connectionService={connectionService}>
      <WorkflowProvider workflowService={workflowService}>
        <NodeTypeProvider nodeTypeRegistry={nodeTypeRegistry}>
          <NotificationProvider notificationService={notificationService}>
            {children}
          </NotificationProvider>
        </NodeTypeProvider>
      </WorkflowProvider>
    </ConnectionProvider>
  );
};

// Export service instances for direct use (when context is not available)
export { 
  httpService,
  webSocketService,
  connectionService,
  workflowService,
  notificationService,
  nodeTypeRegistry,
  mcpServer,
  mcpClient
};
