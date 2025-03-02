/**
 * Factory for creating loggers
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
