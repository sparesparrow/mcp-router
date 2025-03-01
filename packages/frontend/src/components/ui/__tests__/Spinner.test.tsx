import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Spinner } from '../Spinner';

describe('Spinner Component', () => {
  it('renders with default props', () => {
    const { container } = render(<Spinner />);
    const spinner = container.firstChild;
    
    expect(spinner).toHaveClass('spinner');
    expect(spinner).toHaveStyle({ width: '24px', height: '24px' });
  });

  it('renders with small size', () => {
    const { container } = render(<Spinner size="small" />);
    const spinner = container.firstChild;
    
    expect(spinner).toHaveStyle({ width: '16px', height: '16px' });
  });

  it('renders with large size', () => {
    const { container } = render(<Spinner size="large" />);
    const spinner = container.firstChild;
    
    expect(spinner).toHaveStyle({ width: '32px', height: '32px' });
  });

  it('applies custom className', () => {
    const { container } = render(<Spinner className="custom-class" />);
    const spinner = container.firstChild;
    
    expect(spinner).toHaveClass('spinner', 'custom-class');
  });
}); 