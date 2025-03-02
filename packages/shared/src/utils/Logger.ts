/**
 * Logger for MCP Router
 */
export class Logger {
  constructor(private context: string) {}
  
  /**
   * Logs a debug message
   */
  debug(message: string, ...args: any[]): void {
    console.debug(`[${this.context}] ${message}`, ...args);
  }
  
  /**
   * Logs an info message
   */
  info(message: string, ...args: any[]): void {
    console.info(`[${this.context}] ${message}`, ...args);
  }
  
  /**
   * Logs a warning message
   */
  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.context}] ${message}`, ...args);
  }
  
  /**
   * Logs an error message
   */
  error(message: string, ...args: any[]): void {
    console.error(`[${this.context}] ${message}`, ...args);
  }
}
