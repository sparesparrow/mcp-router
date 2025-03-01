import React, { useState, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Caught error:', error);
      setError(error.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) {
    return (
      <Box 
        role="alert" 
        sx={{ 
          p: 3, 
          m: 2, 
          border: '1px solid #ff1744',
          borderRadius: 1,
          backgroundColor: '#ffebee'
        }}
      >
        <Typography variant="h6" color="error" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant="body2" component="pre" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
          {error.message}
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => {
            setError(null);
            window.location.reload();
          }}
        >
          Try again
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
};

export default ErrorBoundary; 