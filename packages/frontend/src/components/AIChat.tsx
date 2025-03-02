import React, { useState, useEffect, useRef } from 'react';
import { MCPBackendService } from '../api/MCPBackendService';
import { ConnectionState } from '@mcp-router/shared';

interface AIChatProps {
  service: MCPBackendService;
}

const AIChat: React.FC<AIChatProps> = ({ service }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>(
    service.getConnectionState()
  );
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set up event listeners for connection state changes
    const handleConnected = () => setConnectionStatus(ConnectionState.CONNECTED);
    const handleDisconnected = () => setConnectionStatus(ConnectionState.DISCONNECTED);
    const handleReconnecting = () => setConnectionStatus(ConnectionState.RECONNECTING);
    const handleError = () => setConnectionStatus(ConnectionState.ERROR);

    service.on('connected', handleConnected);
    service.on('disconnected', handleDisconnected);
    service.on('reconnecting', handleReconnecting);
    service.on('error', handleError);

    // Connect to the service if not already connected
    if (service.getConnectionState() !== ConnectionState.CONNECTED) {
      service.connect().catch(console.error);
    }

    // Clean up event listeners
    return () => {
      service.removeListener('connected', handleConnected);
      service.removeListener('disconnected', handleDisconnected);
      service.removeListener('reconnecting', handleReconnecting);
      service.removeListener('error', handleError);
    };
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    // Reset response and set generating
    setResponse('');
    setIsGenerating(true);

    try {
      // Use streaming for real-time response
      const stream = await service.streamAIRequest(prompt);
      
      // Process the stream
      let fullResponse = '';
      for await (const chunk of stream) {
        fullResponse += chunk;
        setResponse(fullResponse);
        
        // Scroll to bottom of response
        if (responseRef.current) {
          responseRef.current.scrollTop = responseRef.current.scrollHeight;
        }
      }
    } catch (error) {
      console.error('Error generating response:', error);
      setResponse('An error occurred while generating the response. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case ConnectionState.CONNECTED:
        return 'Connected';
      case ConnectionState.CONNECTING:
        return 'Connecting...';
      case ConnectionState.RECONNECTING:
        return 'Reconnecting...';
      case ConnectionState.ERROR:
        return 'Connection Error';
      case ConnectionState.DISCONNECTED:
      default:
        return 'Disconnected';
    }
  };

  const getConnectionStatusClass = () => {
    switch (connectionStatus) {
      case ConnectionState.CONNECTED:
        return 'status-connected';
      case ConnectionState.CONNECTING:
      case ConnectionState.RECONNECTING:
        return 'status-connecting';
      case ConnectionState.ERROR:
      case ConnectionState.DISCONNECTED:
      default:
        return 'status-disconnected';
    }
  };

  return (
    <div className="ai-chat">
      <div className="ai-chat-header">
        <h2>AI Chat</h2>
        <div className={`connection-status ${getConnectionStatusClass()}`}>
          {getConnectionStatusText()}
        </div>
      </div>
      
      <div className="ai-chat-response" ref={responseRef}>
        {response ? (
          <div className="response-content">{response}</div>
        ) : (
          <div className="response-placeholder">
            Enter a prompt below to start a conversation.
          </div>
        )}
      </div>
      
      <form className="ai-chat-input" onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here..."
          rows={3}
          disabled={isGenerating || connectionStatus !== ConnectionState.CONNECTED}
        />
        <button 
          type="submit" 
          disabled={
            isGenerating || 
            !prompt.trim() || 
            connectionStatus !== ConnectionState.CONNECTED
          }
        >
          {isGenerating ? 'Generating...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default AIChat; 