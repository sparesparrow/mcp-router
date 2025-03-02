/**
 * MCP Integration Module
 *
 * This module demonstrates:
 *  - A basic in-memory (local) Transport implementation
 *  - An MCPServer that handles handshake and tools/list messages
 *  - An MCPClient that connects, sends messages, and processes responses
 */

import { LocalTransport } from './LocalTransport';
import { MCPServer } from './MCPServer';
import { MCPClient } from './client/MCPClient';
import { ClientConfig, Message, Response } from './types/mcp';
import { IMessageHandler } from './interfaces/IMessageHandler';

async function main() {
  try {
    // Create a local transport
    const transport = new LocalTransport();

    // Create our MCP server
    const server = new MCPServer();

    // Create a message handler that delegates to the server
    const serverHandler: IMessageHandler = {
      handleMessage: async (message: Message): Promise<Response> => {
        return await server.handleMessage(message);
      }
    };

    // Wire the transport to delegate incoming messages to the server
    transport.onMessage(serverHandler);

    // Configure the MCP client
    const clientConfig: ClientConfig = {
      name: "ExampleClient",
      version: "1.0.0",
      capabilities: ["handshake", "tools/list"]
    };

    // Create and connect the MCP client
    const client = new MCPClient(transport, clientConfig);
    await client.connect();

    // List available tools
    const tools = await client.listTools();
    console.log("Available tools:", tools);

    // Disconnect the client
    await client.disconnect();
  } catch (error) {
    console.error("MCP integration encountered an error:", error);
    process.exit(1);
  }
}

// Run the integration
if (require.main === module) {
  main().catch((error) => {
    console.error("Failed to run MCP integration:", error);
    process.exit(1);
  });
} 