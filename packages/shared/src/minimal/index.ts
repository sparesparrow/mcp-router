/**
 * Enhanced minimal shared package index for browser environments
 * 
 * This version excludes Node.js server-specific dependencies
 * while maintaining the necessary types and utilities for the frontend.
 */

// Export our local types that contain browser-safe stubs
export * from './types';

// We'll selectively re-export from other modules to avoid conflicts
// with types already defined in './types.ts'

// Export utilities that don't depend on Node.js (using browser-compatible versions)
export * from './utils/IdGenerator';
export * from './utils/Logger';
export * from './utils/LoggerFactory';

// Log that the browser-compatible shared package has been loaded
console.log('Browser-compatible shared package loaded'); 