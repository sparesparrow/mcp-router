export class Logger {
  private context: string;
  
  constructor(context: string) {
    this.context = context;
  }
  
  debug(message: string): void {
    console.debug(`[${this.timestamp()}] [${this.context}] [DEBUG] ${message}`);
  }
  
  info(message: string): void {
    console.info(`[${this.timestamp()}] [${this.context}] [INFO] ${message}`);
  }
  
  warn(message: string): void {
    console.warn(`[${this.timestamp()}] [${this.context}] [WARN] ${message}`);
  }
  
  error(message: string): void {
    console.error(`[${this.timestamp()}] [${this.context}] [ERROR] ${message}`);
  }
  
  private timestamp(): string {
    return new Date().toISOString();
  }
} 