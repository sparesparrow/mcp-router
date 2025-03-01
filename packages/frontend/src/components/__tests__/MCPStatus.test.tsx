import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MCPStatus from '../MCPStatus';
import { useMCP } from '../../contexts/MCPContext';

// Mock the MCP context hook
jest.mock('../../contexts/MCPContext', () => ({
  useMCP: jest.fn(),
}));

describe('MCPStatus', () => {
  const mockConnect = jest.fn();
  
  beforeEach(() => {
    (useMCP as jest.Mock).mockReturnValue({
      isConnected: false,
      isInitialized: true,
      lastError: null,
      connect: mockConnect,
      capabilities: {},
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle reconnect click', () => {
    render(<MCPStatus />);
    
    const reconnectButton = screen.getByRole('button', { name: /reconnect/i });
    fireEvent.click(reconnectButton);
    expect(mockConnect).toHaveBeenCalled();
  });

  it('should disable reconnect button when connected', () => {
    (useMCP as jest.Mock).mockReturnValue({
      isConnected: true,
      isInitialized: true,
      lastError: null,
      connect: mockConnect,
      capabilities: {},
    });

    render(<MCPStatus />);
    
    const reconnectButton = screen.getByRole('button', { name: /reconnect/i });
    expect(reconnectButton).toBeDisabled();
  });

  it('should enable reconnect button when error occurs', () => {
    (useMCP as jest.Mock).mockReturnValue({
      isConnected: false,
      isInitialized: true,
      lastError: new Error('Connection failed'),
      connect: mockConnect,
      capabilities: {},
    });

    render(<MCPStatus />);
    
    const reconnectButton = screen.getByRole('button', { name: /reconnect/i });
    expect(reconnectButton).not.toBeDisabled();
  });

  it('should display capabilities when initialized', () => {
    (useMCP as jest.Mock).mockReturnValue({
      isConnected: true,
      isInitialized: true,
      lastError: null,
      connect: mockConnect,
      capabilities: {
        screenshots: true,
        clipboard: true,
      },
    });

    render(<MCPStatus />);
    
    expect(screen.getByText('screenshots')).toBeInTheDocument();
    expect(screen.getByText('clipboard')).toBeInTheDocument();
  });
}); 