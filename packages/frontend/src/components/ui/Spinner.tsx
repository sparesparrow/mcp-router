import React from 'react';
import styled, { keyframes } from 'styled-components';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const StyledSpinner = styled.div<{ size: string }>`
  display: inline-block;
  width: ${props => {
    switch (props.size) {
      case 'small':
        return '1rem';
      case 'large':
        return '3rem';
      default:
        return '2rem';
    }
  }};
  height: ${props => {
    switch (props.size) {
      case 'small':
        return '1rem';
      case 'large':
        return '3rem';
      default:
        return '2rem';
    }
  }};
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-left-color: #007bff;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

export const Spinner: React.FC<SpinnerProps> = ({ size = 'medium' }) => {
  return <StyledSpinner size={size} role="status" aria-label="Loading" />;
}; 