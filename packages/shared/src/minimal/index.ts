/**
 * Enhanced minimal shared package index for browser environments
 * 
 * This version excludes Node.js server-specific dependencies
 * while maintaining the necessary types and utilities for the frontend.
 */

// Export our local types that contain browser-safe stubs
export * from './types';

// Explicitly re-export AgentNodeType from types
import { AgentNodeType } from './types';
export { AgentNodeType };

// We'll selectively re-export from other modules to avoid conflicts
// with types already defined in './types.ts'

// Export utilities that don't depend on Node.js (using browser-compatible versions)
export * from './utils/IdGenerator';

// Simple log for debugging when loaded
console.log('Browser-compatible shared package loaded'); 