import React from 'react';
import { Workflow } from '../types/agent-types';

interface WorkflowCanvasProps {
  initialWorkflow: Workflow;
  onWorkflowChange: (workflow: Workflow) => void;
}

declare const WorkflowCanvas: React.FC<WorkflowCanvasProps>;

export default WorkflowCanvas; 