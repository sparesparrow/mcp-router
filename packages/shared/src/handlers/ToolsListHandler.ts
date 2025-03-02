/**
 * Handler for tools/list messages
 */
import { Message, Response, MCPError } from '../types/mcp';
import { MessageMethodHandler } from '../interfaces/IMessageHandlerRegistry';
import { ToolsRegistry } from '../registry/ToolsRegistry';

export class ToolsListHandler implements MessageMethodHandler {
  constructor(private toolsRegistry?: ToolsRegistry) {}
  
  /**
   * Handles a tools/list message
   */
  async handle(message: Message): Promise<Response> {
    // If we have a tools registry, use it; otherwise return example tools
    let tools;
    
    if (this.toolsRegistry) {
      tools = this.toolsRegistry.getAllTools();
    } else {
      // Example tools list - in a real implementation, this would be from the registry
      tools = [
        {
          id: "screenshot",
          name: "Screenshot Tool",
          description: "Captures screen content"
        },
        {
          id: "clipboard",
          name: "Clipboard Tool",
          description: "Manages clipboard operations"
        }
      ];
    }
    
    return {
      id: message.id,
      success: true,
      result: {
        tools
      }
    };
  }
}
