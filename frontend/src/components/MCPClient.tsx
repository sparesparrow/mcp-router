import React, { useCallback, useEffect, useState, useRef, ChangeEvent } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useTheme } from '@/hooks/useTheme';
import { Button, Card, Select, TextArea, Alert } from '@/components/ui';
import { MCPResponse, Tool, ToolResult } from '@/types/mcp';
import styles from './MCPClient.module.css';

interface MCPClientProps {
  serverUrl: string;
  apiKey: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export const MCPClient: React.FC<MCPClientProps> = ({
  serverUrl,
  apiKey,
  onConnect,
  onDisconnect,
  onError
}) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [toolParams, setToolParams] = useState<string>('{}');
  const [results, setResults] = useState<ToolResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messageIdCounter = useRef(0);
  const { theme } = useTheme();

  const { 
    connect, 
    disconnect, 
    sendMessage, 
    lastMessage, 
    connectionStatus 
  } = useWebSocket({
    url: `${serverUrl}/ws`,
    headers: {
      'X-API-Key': apiKey
    }
  });

  // Handle connection status changes
  useEffect(() => {
    if (connectionStatus === 'connected') {
      onConnect?.();
      // Request tool list on connection
      sendMessage({
        id: String(messageIdCounter.current++),
        method: 'tools/list',
        params: {}
      });
    } else if (connectionStatus === 'disconnected') {
      onDisconnect?.();
    }
  }, [connectionStatus, onConnect, onDisconnect, sendMessage]);

  // Handle incoming messages
  useEffect(() => {
    if (!lastMessage) return;

    try {
      const response: MCPResponse = JSON.parse(lastMessage);

      if (response.error) {
        setError(response.error.message);
        onError?.(new Error(response.error.message));
        return;
      }

      if (response.result) {
        if ('tools' in response.result) {
          // Handle tools/list response
          setTools(response.result.tools);
        } else {
          // Handle tool execution response
          setResults(prev => [{
            id: response.id,
            timestamp: new Date().toISOString(),
            result: response.result
          }, ...prev]);
        }
      }
    } catch (e) {
      setError('Failed to parse server response');
      onError?.(e as Error);
    }
  }, [lastMessage, onError]);

  const handleConnect = useCallback(() => {
    setError(null);
    connect();
  }, [connect]);

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const handleToolSelect = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const toolName = e.target.value;
    setSelectedTool(toolName);
    const tool = tools.find(t => t.name === toolName);
    if (tool) {
      setToolParams(JSON.stringify(tool.input_schema, null, 2));
    }
  }, [tools]);

  const handleExecuteTool = useCallback(async () => {
    if (!selectedTool) {
      setError('Please select a tool');
      return;
    }

    try {
      const params = JSON.parse(toolParams);
      setIsLoading(true);
      setError(null);

      sendMessage({
        id: String(messageIdCounter.current++),
        method: 'tools/call',
        params: {
          name: selectedTool,
          arguments: params
        }
      });
    } catch (e) {
      setError('Invalid parameters JSON');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTool, toolParams, sendMessage]);

  return (
    <div className={`${styles.mcpClient} theme-${theme}`}>
      <Card className={styles.connectionPanel}>
        <h2>MCP Client</h2>
        <div className={styles.statusBar}>
          <span className={`${styles.statusIndicator} ${styles[connectionStatus]}`}>
            {connectionStatus}
          </span>
          {connectionStatus === 'connected' ? (
            <Button onClick={handleDisconnect} variant="danger">
              Disconnect
            </Button>
          ) : (
            <Button onClick={handleConnect} variant="primary">
              Connect
            </Button>
          )}
        </div>
      </Card>

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card className={styles.toolPanel}>
        <h3>Available Tools</h3>
        <Select
          value={selectedTool}
          onChange={handleToolSelect}
          disabled={connectionStatus !== 'connected'}
        >
          <option value="">Select a tool...</option>
          {tools.map(tool => (
            <option key={tool.name} value={tool.name}>
              {tool.name} - {tool.description}
            </option>
          ))}
        </Select>

        <h3>Parameters</h3>
        <TextArea
          value={toolParams}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setToolParams(e.target.value)}
          disabled={connectionStatus !== 'connected'}
          placeholder="Enter tool parameters as JSON..."
        />

        <Button
          onClick={handleExecuteTool}
          disabled={!selectedTool || connectionStatus !== 'connected' || isLoading}
          loading={isLoading}
        >
          Execute Tool
        </Button>
      </Card>

      <Card className={styles.resultsPanel}>
        <h3>Results</h3>
        <div className={styles.resultsList}>
          {results.map(result => (
            <div key={result.id} className={styles.resultItem}>
              <div className={styles.resultHeader}>
                <span className={styles.resultId}>ID: {result.id}</span>
                <span className={styles.resultTimestamp}>{result.timestamp}</span>
              </div>
              <pre className={styles.resultContent}>
                {JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default MCPClient;