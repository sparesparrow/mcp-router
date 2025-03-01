/**
 * Feature Flags Configuration
 * 
 * This file defines feature flags for the MCP Router application.
 * These flags allow for incremental development and controlled feature rollout.
 */

export interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  defaultValue: boolean;
}

// Feature flags for the application
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Workflow Designer Features
  REACT_FLOW_INTEGRATION: {
    name: 'React Flow Integration',
    description: 'Enable the integration with ReactFlow for the workflow designer',
    enabled: true,
    defaultValue: true,
  },
  ADVANCED_NODE_TYPES: {
    name: 'Advanced Node Types',
    description: 'Enable advanced node types in the workflow designer',
    enabled: false,
    defaultValue: false,
  },
  WORKFLOW_VALIDATION: {
    name: 'Workflow Validation',
    description: 'Enable validation of workflows before execution',
    enabled: true,
    defaultValue: true,
  },
  
  // Backend Features
  ROUTER_SERVICES: {
    name: 'Router Services',
    description: 'Enable the router services for MCP communication',
    enabled: true,
    defaultValue: true,
  },
  SYSTEM_MONITORING: {
    name: 'System Monitoring',
    description: 'Enable system monitoring and metrics collection',
    enabled: false,
    defaultValue: false,
  },
  
  // UI Features
  MERMAID_INTEGRATION: {
    name: 'Mermaid Integration',
    description: 'Enable Mermaid diagram generation from workflows',
    enabled: true,
    defaultValue: true,
  },
  DARK_MODE: {
    name: 'Dark Mode',
    description: 'Enable dark mode for the UI',
    enabled: false,
    defaultValue: false,
  },
  
  // Experimental Features
  PARALLEL_EXECUTION: {
    name: 'Parallel Execution',
    description: 'Enable parallel execution of workflow nodes',
    enabled: false,
    defaultValue: false,
  },
  AI_SUGGESTIONS: {
    name: 'AI Suggestions',
    description: 'Enable AI-powered suggestions for workflow design',
    enabled: false,
    defaultValue: false,
  },
};

/**
 * Check if a feature is enabled
 * @param featureKey The key of the feature to check
 * @returns True if the feature is enabled, false otherwise
 */
export function isFeatureEnabled(featureKey: string): boolean {
  const feature = FEATURE_FLAGS[featureKey];
  if (!feature) {
    console.warn(`Feature flag "${featureKey}" not found`);
    return false;
  }
  return feature.enabled;
}

/**
 * Get all feature flags
 * @returns All feature flags
 */
export function getAllFeatureFlags(): Record<string, FeatureFlag> {
  return FEATURE_FLAGS;
}

/**
 * Update a feature flag
 * @param featureKey The key of the feature to update
 * @param enabled Whether the feature should be enabled
 * @returns True if the update was successful, false otherwise
 */
export function updateFeatureFlag(featureKey: string, enabled: boolean): boolean {
  const feature = FEATURE_FLAGS[featureKey];
  if (!feature) {
    console.warn(`Feature flag "${featureKey}" not found`);
    return false;
  }
  feature.enabled = enabled;
  return true;
}

/**
 * Reset a feature flag to its default value
 * @param featureKey The key of the feature to reset
 * @returns True if the reset was successful, false otherwise
 */
export function resetFeatureFlag(featureKey: string): boolean {
  const feature = FEATURE_FLAGS[featureKey];
  if (!feature) {
    console.warn(`Feature flag "${featureKey}" not found`);
    return false;
  }
  feature.enabled = feature.defaultValue;
  return true;
}

/**
 * Reset all feature flags to their default values
 */
export function resetAllFeatureFlags(): void {
  Object.values(FEATURE_FLAGS).forEach(feature => {
    feature.enabled = feature.defaultValue;
  });
}

export default {
  isFeatureEnabled,
  getAllFeatureFlags,
  updateFeatureFlag,
  resetFeatureFlag,
  resetAllFeatureFlags,
  FEATURE_FLAGS,
}; 