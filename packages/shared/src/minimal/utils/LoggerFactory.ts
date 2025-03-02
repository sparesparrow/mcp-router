/**
 * Factory for creating loggers (Browser-compatible version)
 */
import { Logger } from './Logger';

export class LoggerFactory {
  /**
   * Creates a logger with the specified context
   */
  static createLogger(context: string): Logger {
    return new Logger(context);
  }
} 