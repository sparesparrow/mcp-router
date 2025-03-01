import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TextArea } from '../TextArea';

describe('TextArea Component', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
  };

  it('renders with default props', () => {
    render(<TextArea {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('rows', '4');
  });

  it('handles value changes', () => {
    const onChange = jest.fn();
    render(<TextArea {...defaultProps} onChange={onChange} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New text' } });

    expect(onChange).toHaveBeenCalledWith('New text');
  });

  it('displays character count when maxLength is provided', () => {
    render(
      <TextArea
        {...defaultProps}
        value="Test"
        maxLength={10}
      />
    );

    expect(screen.getByText('4/10')).toBeInTheDocument();
  });

  it('applies disabled state correctly', () => {
    render(
      <TextArea
        {...defaultProps}
        disabled={true}
      />
    );

    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('applies custom rows', () => {
    render(
      <TextArea
        {...defaultProps}
        rows={8}
      />
    );

    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '8');
  });

  it('applies aria attributes correctly', () => {
    render(
      <TextArea
        {...defaultProps}
        aria-label="Test label"
        aria-describedby="test-desc"
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-label', 'Test label');
    expect(textarea).toHaveAttribute('aria-describedby', 'test-desc');
  });

  it('applies custom className', () => {
    render(
      <TextArea
        {...defaultProps}
        className="custom-class"
      />
    );

    const wrapper = screen.getByRole('textbox').parentElement;
    expect(wrapper?.className).toContain('custom-class');
  });

  it('applies required attribute', () => {
    render(
      <TextArea
        {...defaultProps}
        required={true}
      />
    );

    expect(screen.getByRole('textbox')).toBeRequired();
  });

  it('applies autoFocus correctly', () => {
    render(
      <TextArea
        {...defaultProps}
        autoFocus={true}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('autoFocus');
  });

  it('applies placeholder text', () => {
    const placeholder = 'Enter text here...';
    render(
      <TextArea
        {...defaultProps}
        placeholder={placeholder}
      />
    );

    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', placeholder);
  });
}); 