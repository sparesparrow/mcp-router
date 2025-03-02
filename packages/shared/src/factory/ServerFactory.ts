/**
 * Factory for creating server instances
 */
import { MCPServerCore } from '../server/MCPServerCore';
import { MessageHandlerRegistry } from '../handlers/MessageHandlerRegistry';
import { HandshakeHandler } from '../handlers/HandshakeHandler';
import { ToolsListHandler } from '../handlers/ToolsListHandler';
import { ClientRegistry } from '../registry/ClientRegistry';
import { ToolsRegistry } from '../registry/ToolsRegistry';
import { Logger } from '../utils/Logger';

export class ServerFactory {
  /**
   * Creates a standard MCP server with default handlers
   */
  static createStandardServer(logger?: Logger): MCPServerCore {
    // Create registries
    const handlerRegistry = new MessageHandlerRegistry();
    const clientRegistry = new ClientRegistry();
    const toolsRegistry = new ToolsRegistry();
    
    // Create logger
    const serverLogger = logger || new Logger('MCPServer');
    
    // Register default tools
    toolsRegistry.registerTool('screenshot', {
      id: 'screenshot',
      name: 'Screenshot Tool',
      description: 'Captures screen content'
    });
    
    toolsRegistry.registerTool('clipboard', {
      id: 'clipboard',
      name: 'Clipboard Tool',
      description: 'Manages clipboard operations'
    });
    
    // Register handlers
    handlerRegistry.registerHandler('handshake', new HandshakeHandler(clientRegistry));
    handlerRegistry.registerHandler('tools/list', new ToolsListHandler(toolsRegistry));
    
    // Create server
    return new MCPServerCore(handlerRegistry, serverLogger);
  }
}
