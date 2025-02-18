import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Alert } from '../Alert';

describe('Alert Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders with default props', () => {
    render(<Alert message="Test message" />);
    
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('ℹ')).toBeInTheDocument();
  });

  it('renders with custom type and title', () => {
    render(
      <Alert
        type="success"
        message="Success message"
        title="Success Title"
      />
    );

    expect(screen.getByText('Success Title')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders without icon when showIcon is false', () => {
    render(
      <Alert
        message="Test message"
        showIcon={false}
      />
    );

    expect(screen.queryByText('ℹ')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <Alert
        message="Test message"
        onClose={onClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close alert/i });
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('auto closes after specified delay', () => {
    const onClose = jest.fn();
    render(
      <Alert
        message="Test message"
        autoClose={true}
        autoCloseDelay={2000}
        onClose={onClose}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders with correct ARIA attributes', () => {
    render(
      <Alert
        type="error"
        message="Error message"
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('cleans up timeout on unmount', () => {
    const onClose = jest.fn();
    const { unmount } = render(
      <Alert
        message="Test message"
        autoClose={true}
        autoCloseDelay={2000}
        onClose={onClose}
      />
    );

    unmount();
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onClose).not.toHaveBeenCalled();
  });
}); 