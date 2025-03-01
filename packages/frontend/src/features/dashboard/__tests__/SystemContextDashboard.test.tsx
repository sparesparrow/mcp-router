import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material';
import SystemContextDashboard from '../SystemContextDashboard';
import { MCPProvider } from '../../../contexts/MCPContext';
import { useStore } from '../../../store';

// Mock dependencies
vi.mock('../../src/contexts/MCPContext', () => ({
  MCPProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useMCP: () => ({
    isConnected: true,
    isInitialized: true,
    lastError: null,
    capabilities: {
      screenshots: true,
      clipboard: true,
      network: true,
    },
    connect: vi.fn(),
  }),
}));

vi.mock('../../src/store', () => ({
  useStore: vi.fn(),
}));

// Mock theme for Material-UI
const theme = createTheme();

// Mock data
const mockContext = {
  screenshots: [
    {
      timestamp: '2024-03-20T10:00:00Z',
      image_data: 'base64data',
      dimensions: [1920, 1080] as [number, number],
    },
  ],
  clipboard: [
    {
      timestamp: '2024-03-20T10:01:00Z',
      content: 'Test clipboard content',
    },
  ],
  network: [
    {
      timestamp: '2024-03-20T10:02:00Z',
      type: 'request',
      data: { url: 'https://api.example.com' },
    },
  ],
  workflows: [
    {
      workflow_id: 'test-workflow-1',
      status: 'running',
      start_time: '2024-03-20T10:00:00Z',
    },
  ],
};

const mockStore = {
  context: mockContext,
  isLoading: false,
  error: null,
  initializeApp: vi.fn(),
  clearError: vi.fn(),
  executeWorkflow: vi.fn(),
  deleteWorkflow: vi.fn(),
  refreshContext: vi.fn(),
};

describe('SystemContextDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useStore as any).mockReturnValue(mockStore);
  });

  const renderDashboard = () => {
    return render(
      <ThemeProvider theme={theme}>
        <SystemContextDashboard />
      </ThemeProvider>
    );
  };

  it('initializes the app on mount', async () => {
    renderDashboard();
    expect(mockStore.initializeApp).toHaveBeenCalled();
  });

  it('renders loading state', async () => {
    (useStore as any).mockReturnValue({ ...mockStore, isLoading: true });
    renderDashboard();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders dashboard content when loaded', async () => {
    renderDashboard();
    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    expect(screen.getByText('System Context Monitor')).toBeInTheDocument();
  });

  it('handles refresh context', async () => {
    renderDashboard();
    const refreshButton = screen.getByTestId('refresh-button');
    await userEvent.click(refreshButton);
    expect(mockStore.refreshContext).toHaveBeenCalled();
  });

  it('handles workflow deletion', async () => {
    renderDashboard();
    // Find and click delete button in WorkflowManager
    const deleteButton = screen.getByLabelText(/delete workflow test-workflow-1/i);
    await userEvent.click(deleteButton);
    expect(mockStore.deleteWorkflow).toHaveBeenCalledWith('test-workflow-1');
  });

  it('handles workflow restart', async () => {
    renderDashboard();
    // Find and click restart button in WorkflowManager
    const restartButton = screen.getByLabelText(/restart workflow test-workflow-1/i);
    await userEvent.click(restartButton);
    expect(mockStore.executeWorkflow).toHaveBeenCalledWith('test-workflow-1', {
      restart: true,
      timestamp: expect.any(String),
    });
  });

  it('displays error snackbar when error occurs', async () => {
    const error = new Error('Test error');
    (useStore as any).mockReturnValue({ ...mockStore, error });
    renderDashboard();
    expect(screen.getByTestId('error-snackbar')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('clears error when snackbar is closed', async () => {
    const error = new Error('Test error');
    (useStore as any).mockReturnValue({ ...mockStore, error });
    renderDashboard();
    const closeButton = screen.getByLabelText(/close/i);
    await userEvent.click(closeButton);
    expect(mockStore.clearError).toHaveBeenCalled();
  });

  it('handles disconnected MCP state', async () => {
    vi.mocked(require('../../src/contexts/MCPContext').useMCP).mockReturnValue({
      isConnected: false,
      isInitialized: false,
      lastError: null,
      capabilities: {},
      connect: vi.fn(),
    });
    
    renderDashboard();
    expect(screen.getByText(/not connected to mcp server/i)).toBeInTheDocument();
    expect(screen.getByTestId('reconnect-button')).toBeInTheDocument();
  });

  it('handles MCP error state', async () => {
    vi.mocked(require('../../src/contexts/MCPContext').useMCP).mockReturnValue({
      isConnected: true,
      isInitialized: true,
      lastError: new Error('MCP connection error'),
      capabilities: {},
      connect: vi.fn(),
    });
    
    renderDashboard();
    expect(screen.getByTestId('mcp-error')).toBeInTheDocument();
    expect(screen.getByText(/mcp connection error/i)).toBeInTheDocument();
  });

  it('renders all main components', async () => {
    renderDashboard();
    // Check for main component sections
    expect(screen.getByText('System Context Monitor')).toBeInTheDocument();
    expect(screen.getByText('Screenshots')).toBeInTheDocument();
    expect(screen.getByText('Clipboard')).toBeInTheDocument();
    expect(screen.getByText('Network')).toBeInTheDocument();
    expect(screen.getByText('Workflow Management')).toBeInTheDocument();
    expect(screen.getByText('Context QR Code')).toBeInTheDocument();
  });

  it('displays correct workflow information', async () => {
    renderDashboard();
    expect(screen.getByText('test-workflow-1')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
  });

  it('cleans up on unmount', async () => {
    const { unmount } = renderDashboard();
    unmount();
    expect(mockStore.clearError).toHaveBeenCalled();
  });
}); 