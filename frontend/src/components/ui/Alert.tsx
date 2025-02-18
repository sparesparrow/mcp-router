import React from 'react';
import styled from 'styled-components';

interface AlertProps {
  children: React.ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error';
  onClose?: () => void;
}

const StyledAlert = styled.div<{ type: string }>`
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;

  ${props => {
    switch (props.type) {
      case 'success':
        return `
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        `;
      case 'warning':
        return `
          background-color: #fff3cd;
          color: #856404;
          border: 1px solid #ffeeba;
        `;
      case 'error':
        return `
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        `;
      default:
        return `
          background-color: #cce5ff;
          color: #004085;
          border: 1px solid #b8daff;
        `;
    }
  }}
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  line-height: 1;
  padding: 0.25rem;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.75;
  }
`;

export const Alert: React.FC<AlertProps> = ({
  children,
  type = 'info',
  onClose
}) => {
  return (
    <StyledAlert type={type}>
      <div>{children}</div>
      {onClose && (
        <CloseButton onClick={onClose} aria-label="Close alert">
          ×
        </CloseButton>
      )}
    </StyledAlert>
  );
};

export default Alert; 