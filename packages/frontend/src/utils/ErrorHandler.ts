/**
 * Error Handler Utility
 * 
 * Provides standardized error handling functions for the application.
 */
import { notificationService } from '../services/ServiceProvider';

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, code: string = 'app_error', details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Error codes for standard errors
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'validation_error',
  CONNECTION_ERROR = 'connection_error',
  API_ERROR = 'api_error',
  WORKFLOW_ERROR = 'workflow_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  NOT_FOUND_ERROR = 'not_found_error',
  UNEXPECTED_ERROR = 'unexpected_error'
}

/**
 * Logs an error to the console
 * @param error The error object
 * @param context Optional context information
 */
export function logError(error: any, context?: string): void {
  const prefix = context ? `[${context}] ` : '';
  
  if (error instanceof AppError) {
    console.error(`${prefix}${error.code}: ${error.message}`, error.details);
  } else if (error instanceof Error) {
    console.error(`${prefix}${error.name}: ${error.message}`, error.stack);
  } else {
    console.error(`${prefix}Unknown error:`, error);
  }
}

/**
 * Handles an error by logging it and showing a notification
 * @param error The error object
 * @param context Optional context for logging
 * @param userMessage Optional user-friendly message (defaults to error message)
 */
export function handleError(error: any, context?: string, userMessage?: string): void {
  // Log the error
  logError(error, context);
  
  // Determine a user-friendly message
  let message: string;
  
  if (userMessage) {
    message = userMessage;
  } else if (error instanceof AppError || error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else {
    message = 'An unexpected error occurred. Please try again.';
  }
  
  // Show notification
  notificationService.error(message);
}

/**
 * Creates an error handler function for a specific context
 * @param context The error context
 * @returns A function that handles errors in the given context
 */
export function createErrorHandler(context: string): (error: any, userMessage?: string) => void {
  return (error: any, userMessage?: string) => {
    handleError(error, context, userMessage);
  };
}

/**
 * Wraps a promise with standardized error handling
 * @param promise The promise to wrap
 * @param context Optional context for error logging
 * @param userMessage Optional user-friendly message for errors
 * @returns A new promise that handles errors
 */
export async function withErrorHandling<T>(
  promise: Promise<T>,
  context?: string,
  userMessage?: string
): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    handleError(error, context, userMessage);
    throw error; // Re-throw so calling code can still handle it if needed
  }
}
