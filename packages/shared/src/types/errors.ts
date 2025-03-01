/**
 * Error types for the MCP Router
 * This is a simplified version during restructuring
 */

/**
 * MCP Error class for standardized error handling
 */
export class MCPError extends Error {
  code: string;
  details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'MCPError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Common error codes
 */
export enum ErrorCode {
  INTERNAL_ERROR = 'internal_error',
  INVALID_PARAMS = 'invalid_params',
  METHOD_NOT_FOUND = 'method_not_found',
  NO_HANDLER = 'no_handler',
  CONNECTION_ERROR = 'connection_error',
  TIMEOUT = 'timeout',
  UNAUTHORIZED = 'unauthorized',
  NOT_FOUND = 'not_found',
  VALIDATION_ERROR = 'validation_error'
} 