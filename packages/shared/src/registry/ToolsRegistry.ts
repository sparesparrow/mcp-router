/**
 * Registry for tool information
 */
import { ToolInfo } from '../types/mcp';

export class ToolsRegistry {
  private tools: Map<string, ToolInfo> = new Map();
  
  /**
   * Registers a tool
   */
  registerTool(id: string, info: ToolInfo): void {
    this.tools.set(id, info);
  }
  
  /**
   * Gets a tool by ID
   */
  getTool(id: string): ToolInfo | undefined {
    return this.tools.get(id);
  }
  
  /**
   * Gets all registered tools
   */
  getAllTools(): ToolInfo[] {
    return Array.from(this.tools.values());
  }
  
  /**
   * Removes a tool by ID
   */
  removeTool(id: string): boolean {
    return this.tools.delete(id);
  }
}
