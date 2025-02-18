import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card } from '../Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <div>Test Content</div>
      </Card>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Card className="custom-class">
        <div>Test Content</div>
      </Card>
    );

    const card = screen.getByText('Test Content').parentElement;
    expect(card).toHaveClass('custom-class');
  });

  it('handles click events when onClick is provided', () => {
    const handleClick = jest.fn();
    render(
      <Card onClick={handleClick}>
        <div>Clickable Card</div>
      </Card>
    );

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct elevation class', () => {
    const { container } = render(
      <Card elevation="high">
        <div>Test Content</div>
      </Card>
    );

    const card = container.firstChild;
    expect(card).toHaveClass('elevation-high');
  });

  it('applies correct padding class', () => {
    const { container } = render(
      <Card padding="large">
        <div>Test Content</div>
      </Card>
    );

    const card = container.firstChild;
    expect(card).toHaveClass('padding-large');
  });

  it('has correct accessibility attributes when clickable', () => {
    render(
      <Card onClick={() => {}}>
        <div>Clickable Card</div>
      </Card>
    );

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('does not have button role or tabIndex when not clickable', () => {
    const { container } = render(
      <Card>
        <div>Non-Clickable Card</div>
      </Card>
    );

    const card = container.firstChild;
    expect(card).not.toHaveAttribute('role');
    expect(card).not.toHaveAttribute('tabIndex');
  });
}); 