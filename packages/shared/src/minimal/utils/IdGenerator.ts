/**
 * Utility for generating unique IDs (Browser-compatible version)
 */
export class IdGenerator {
  /**
   * Generates a UUID v4
   */
  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  /**
   * Generates a short ID (for testing and debugging)
   */
  static generateShortId(): string {
    return Math.random().toString(36).substring(2, 11);
  }
} 