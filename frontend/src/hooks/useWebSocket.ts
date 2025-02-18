import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketConfig {
  url: string;
  headers?: Record<string, string>;
}

interface WebSocketHook {
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: any) => void;
  lastMessage: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

export const useWebSocket = (config: WebSocketConfig): WebSocketHook => {
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const socketRef = useRef<Socket | null>(null);

  const connect = () => {
    if (socketRef.current?.connected) return;

    setConnectionStatus('connecting');
    socketRef.current = io(config.url, {
      extraHeaders: config.headers || {},
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      setConnectionStatus('connected');
    });

    socketRef.current.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socketRef.current.on('message', (message: string) => {
      setLastMessage(message);
    });
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConnectionStatus('disconnected');
    }
  };

  const sendMessage = (message: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('message', message);
    }
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    connect,
    disconnect,
    sendMessage,
    lastMessage,
    connectionStatus,
  };
}; 