import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, IconButton, Tooltip } from '@mui/material';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface QRDisplayData {
  contextId: string | undefined;
  timestamp: string;
  activeWorkflows: number;
}

interface QRDisplayProps {
  data: QRDisplayData;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
  error?: Error | null;
}

const QRDisplay: React.FC<QRDisplayProps> = ({
  data,
  onRefresh,
  isLoading = false,
  error = null,
}) => {
  const [qrValue, setQrValue] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      // Create a JSON string of the data for the QR code
      const qrData = JSON.stringify({
        ...data,
        type: 'system-context',
        version: '1.0',
      });
      setQrValue(qrData);
    } catch (error) {
      console.error('Error generating QR data:', error);
      setQrValue('');
    }
  }, [data]);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || refreshing) return;

    setRefreshing(true);
    setRefreshError(null);
    try {
      await onRefresh();
    } catch (error) {
      setRefreshError(error instanceof Error ? error : new Error('Failed to refresh QR code'));
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" component="h2">
          Context QR Code
        </Typography>
        {onRefresh && (
          <Tooltip title="Refresh QR Code">
            <span>
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing || isLoading}
                aria-label="Refresh QR code"
                size="small"
              >
                {refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>

      {(error || refreshError) && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => setRefreshError(null)}
        >
          {error?.message || refreshError?.message || 'An error occurred'}
        </Alert>
      )}

      <Paper
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {isLoading ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
            py={4}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading QR code...
            </Typography>
          </Box>
        ) : data.contextId ? (
          <>
            <Box
              sx={{
                backgroundColor: 'white',
                p: 2,
                borderRadius: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <QRCode
                value={qrValue}
                size={200}
                level="H"
                includeMargin={true}
                aria-label="Context QR code"
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Scan to access context
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Last updated: {new Date(data.timestamp).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Active workflows: {data.activeWorkflows}
            </Typography>
          </>
        ) : (
          <Box py={4}>
            <Typography variant="body1" color="text.secondary">
              Waiting for context connection...
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default React.memo(QRDisplay); 