import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkflowManager from '../components/WorkflowManager';

const mockWorkflows = [
  {
    workflow_id: 'test-1',
    status: 'running',
    start_time: '2024-02-17T12:00:00Z',
  },
  {
    workflow_id: 'test-2',
    status: 'completed',
    start_time: '2024-02-17T11:00:00Z',
    end_time: '2024-02-17T11:30:00Z',
  },
  {
    workflow_id: 'test-3',
    status: 'failed',
    start_time: '2024-02-17T10:00:00Z',
    end_time: '2024-02-17T10:15:00Z',
    error: 'Test error message',
  },
];

describe('WorkflowManager', () => {
  it('renders workflow list', () => {
    render(<WorkflowManager workflows={mockWorkflows} />);
    
    expect(screen.getByText('Workflow Management')).toBeInTheDocument();
    expect(screen.getByText('test-1')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
  });

  it('sorts workflows by start time', () => {
    render(<WorkflowManager workflows={mockWorkflows} />);
    
    const rows = screen.getAllByRole('row');
    // First row is header, so we start from index 1
    expect(rows[1]).toHaveTextContent('test-1'); // Most recent
    expect(rows[2]).toHaveTextContent('test-2');
    expect(rows[3]).toHaveTextContent('test-3'); // Oldest
  });

  it('opens details dialog when clicking info button', () => {
    render(<WorkflowManager workflows={mockWorkflows} />);
    
    const infoButtons = screen.getAllByRole('button', { name: /view details/i });
    fireEvent.click(infoButtons[0]);
    
    expect(screen.getByText('Workflow Details')).toBeInTheDocument();
    expect(screen.getByText('test-1')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
  });

  it('displays error message in details dialog', () => {
    render(<WorkflowManager workflows={mockWorkflows} />);
    
    const infoButtons = screen.getAllByRole('button', { name: /view details/i });
    fireEvent.click(infoButtons[2]); // Click on failed workflow
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('closes details dialog', () => {
    render(<WorkflowManager workflows={mockWorkflows} />);
    
    const infoButton = screen.getAllByRole('button', { name: /view details/i })[0];
    fireEvent.click(infoButton);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(screen.queryByText('Workflow Details')).not.toBeInTheDocument();
  });
}); 