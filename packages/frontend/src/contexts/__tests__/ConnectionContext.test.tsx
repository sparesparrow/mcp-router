import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ConnectionProvider, useConnection } from '../services/ConnectionContext';
import { IConnectionService, ConnectionStatus } from '../../services/interfaces/IConnectionService';

// Mock implementation of IConnectionService
const mockConnectionService: jest.Mocked<IConnectionService> = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  getConnectionStatus: jest.fn(),
  onStatusChange: jest.fn(),
  isConnected: jest.fn(),
};

// Test component that uses the ConnectionContext
const TestConsumer = () => {
  const { connect, isConnected } = useConnection();
  
  return (
    <div>
      <button onClick={() => connect()}>Connect</button>
      <div data-testid="connection-status">
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
};

describe('ConnectionContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectionService.isConnected.mockReturnValue(false);
    mockConnectionService.getConnectionStatus.mockReturnValue(ConnectionStatus.DISCONNECTED);
  });

  it('should provide connection methods to consumers', () => {
    render(
      <ConnectionProvider connectionService={mockConnectionService}>
        <TestConsumer />
      </ConnectionProvider>
    );

    const connectButton = screen.getByText('Connect');
    act(() => {
      connectButton.click();
    });

    expect(mockConnectionService.connect).toHaveBeenCalledTimes(1);
  });

  it('should update connection status when service reports changes', () => {
    mockConnectionService.isConnected.mockReturnValue(false);
    
    // Setup onStatusChange to trigger callback with new status when called
    mockConnectionService.onStatusChange.mockImplementation(callback => {
      setTimeout(() => callback(ConnectionStatus.CONNECTED), 10);
      return () => {};
    });

    render(
      <ConnectionProvider connectionService={mockConnectionService}>
        <TestConsumer />
      </ConnectionProvider>
    );

    // Initial state should be disconnected
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');

    // After the status change callback fires, it should update to connected
    act(() => {
      jest.advanceTimersByTime(20);
    });
    
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
  });
}); 