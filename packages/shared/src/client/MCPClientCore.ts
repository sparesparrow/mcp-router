/**
 * Core client implementation for MCP
 */
import { Message, Response, ClientConfig } from '../types/mcp';
import { IMessageTransport } from '../interfaces/IMessageTransport';
import { IConnectionManager } from '../interfaces/IConnectionManager';
import { MessageFactory } from './MessageFactory';
import { ResponseHandler } from './ResponseHandler';
import { Logger } from '../utils/Logger';
import { IMessageHandler } from '../interfaces/IMessageHandler';

export class MCPClientCore implements IMessageHandler {
  private logger: Logger;
  
  constructor(
    private transport: IMessageTransport,
    private connectionManager: IConnectionManager,
    private responseHandler: ResponseHandler,
    private config: ClientConfig,
    logger?: Logger
  ) {
    this.logger = logger || new Logger('MCPClientCore');
    // Set up message handling
    this.transport.onMessage(this);
  }

  /**
   * Connects to the MCP server
   */
  async connect(): Promise<Response> {
    if (this.connectionManager.isConnected()) {
      this.logger.debug('Already connected, ignoring connect request');
      throw new Error('Already connected to MCP server');
    }

    try {
      // Connect the transport
      await this.connectionManager.connect();
      
      // Send handshake
      const handshakeResponse = await this.sendHandshake();
      
      if (!handshakeResponse.success) {
        const errorMsg = handshakeResponse.error?.message || 'Unknown handshake error';
        this.logger.error(`Handshake failed: ${errorMsg}`);
        await this.connectionManager.disconnect();
        throw new Error(`Handshake failed: ${errorMsg}`);
      }

      this.logger.info("Connected to MCP server:", handshakeResponse.result);
      return handshakeResponse;
    } catch (error) {
      this.logger.error(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Disconnects from the MCP server
   */
  async disconnect(): Promise<void> {
    if (!this.connectionManager.isConnected()) {
      this.logger.debug('Not connected, ignoring disconnect request');
      return;
    }

    try {
      // Cancel all pending requests
      this.responseHandler.cancelAllRequests('Client disconnecting');
      
      // Disconnect the transport
      await this.connectionManager.disconnect();
      this.logger.info("Disconnected from MCP server");
    } catch (error) {
      this.logger.error(`Disconnection failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Lists available tools from the server
   */
  async listTools(): Promise<any> {
    if (!this.connectionManager.isConnected()) {
      throw new Error("Not connected to MCP server");
    }

    const response = await this.sendRequest(MessageFactory.createToolsListMessage());
    return response.result;
  }

  /**
   * Sends a handshake request to the server
   */
  private async sendHandshake(): Promise<Response> {
    const message = MessageFactory.createHandshakeMessage(
      this.config.name,
      this.config.version,
      this.config.capabilities || []
    );
    
    return this.sendRequest(message);
  }

  /**
   * Sends a request and waits for a response
   */
  private async sendRequest(message: Message): Promise<Response> {
    return new Promise<Response>((resolve, reject) => {
      this.responseHandler.registerRequest(message.id, resolve, reject);
      
      this.transport.sendMessage(message).catch(err => {
        // If sending fails, clean up the pending request
        this.responseHandler.handleResponse({
          id: message.id,
          success: false,
          error: err
        });
        reject(err);
      });
    });
  }

  /**
   * Handles incoming messages/responses
   */
  async handleMessage(message: Message): Promise<Response> {
    // For now, just treat all incoming messages as responses
    const response = message as unknown as Response;
    
    this.logger.debug(`Received response for message ID: ${response.id}`);
    const handled = this.responseHandler.handleResponse(response);
    
    if (!handled) {
      this.logger.warn(`No handler found for response ID: ${response.id}`);
    }
    
    // Acknowledge receipt
    return {
      id: message.id,
      success: true,
      result: { status: 'message_received' }
    };
  }
}
