import React from 'react';
import { render, screen } from '@testing-library/react';
import QRDisplay from '../QRDisplay';

const mockData = {
  contextId: 'test-context-123',
  timestamp: '2024-02-17T12:00:00Z',
  activeWorkflows: 3,
};

describe('QRDisplay', () => {
  it('renders QR code when contextId is provided', () => {
    render(<QRDisplay data={mockData} />);
    
    expect(screen.getByText('Context QR Code')).toBeInTheDocument();
    expect(screen.getByText('Scan to access context')).toBeInTheDocument();
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    
    // Check if QR code is rendered
    const qrCode = screen.getByRole('img');
    expect(qrCode).toBeInTheDocument();
    expect(qrCode.tagName.toLowerCase()).toBe('svg');
  });

  it('shows waiting message when contextId is undefined', () => {
    render(
      <QRDisplay
        data={{
          ...mockData,
          contextId: undefined,
        }}
      />
    );
    
    expect(screen.getByText('Waiting for context connection...')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('includes all required data in QR code', () => {
    render(<QRDisplay data={mockData} />);
    
    const qrCode = screen.getByRole('img');
    const qrValue = qrCode.getAttribute('value');
    const parsedValue = JSON.parse(qrValue || '');
    
    expect(parsedValue).toEqual({
      ...mockData,
      type: 'system-context',
      version: '1.0',
    });
  });
}); 