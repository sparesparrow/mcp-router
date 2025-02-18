import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

interface SystemContext {
  screenshots: ScreenshotData[];
  clipboard: ClipboardData[];
  network: NetworkData[];
  workflows: WorkflowState[];
}

interface ScreenshotData {
  timestamp: string;
  image_data: string;
  dimensions: [number, number];
}

interface ClipboardData {
  timestamp: string;
  content: string;
}

interface NetworkData {
  timestamp: string;
  type: string;
  data: any;
}

interface WorkflowState {
  workflow_id: string;
  status: string;
  start_time: string;
  end_time?: string;
  results?: any;
  error?: string;
}

interface ContextViewerProps {
  context: SystemContext;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
  error?: Error | null;
}

const ContextViewer: React.FC<ContextViewerProps> = React.memo(({
  context,
  onRefresh,
  isLoading = false,
  error = null,
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'primary';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return <RefreshIcon fontSize="small" />;
      case 'completed':
        return <CheckIcon fontSize="small" color="success" />;
      case 'failed':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return <WarningIcon fontSize="small" />;
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">
          {error.message || 'An error occurred while loading context data'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          System Context Overview
        </Typography>
        {onRefresh && (
          <Tooltip title="Refresh Context">
            <span>
              <IconButton
                onClick={onRefresh}
                disabled={isLoading}
                aria-label="Refresh context data"
                size="small"
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Box>

      <Paper sx={{ p: 2, mb: 2 }} component="section" aria-label="Monitoring Status">
        <Typography variant="subtitle1" gutterBottom component="h3">
          Active Monitoring
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Screenshots
                  <Chip
                    label={context.screenshots.length}
                    size="small"
                    color={context.screenshots.length > 0 ? 'primary' : 'default'}
                  />
                </Box>
              }
              secondary={`Last capture: ${
                context.screenshots.length > 0
                  ? new Date(context.screenshots[0].timestamp).toLocaleString()
                  : 'No captures'
              }`}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Clipboard Events
                  <Chip
                    label={context.clipboard.length}
                    size="small"
                    color={context.clipboard.length > 0 ? 'primary' : 'default'}
                  />
                </Box>
              }
              secondary={`Last event: ${
                context.clipboard.length > 0
                  ? new Date(context.clipboard[0].timestamp).toLocaleString()
                  : 'No events'
              }`}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Network Activity
                  <Chip
                    label={context.network.length}
                    size="small"
                    color={context.network.length > 0 ? 'primary' : 'default'}
                  />
                </Box>
              }
              secondary={`Last activity: ${
                context.network.length > 0
                  ? new Date(context.network[0].timestamp).toLocaleString()
                  : 'No activity'
              }`}
            />
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ p: 2 }} component="section" aria-label="Workflow Status">
        <Typography variant="subtitle1" gutterBottom component="h3">
          Active Workflows
        </Typography>
        <List dense>
          {context.workflows.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="No active workflows"
                secondary="Start a workflow to see it here"
              />
            </ListItem>
          ) : (
            context.workflows.map((workflow, index) => (
              <React.Fragment key={workflow.workflow_id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(workflow.status)}
                        <Typography variant="body1" component="span">
                          {workflow.workflow_id}
                        </Typography>
                        <Chip
                          label={workflow.status}
                          size="small"
                          color={getStatusColor(workflow.status) as any}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" component="div">
                          Started: {new Date(workflow.start_time).toLocaleString()}
                        </Typography>
                        {workflow.end_time && (
                          <Typography variant="body2" component="div">
                            Ended: {new Date(workflow.end_time).toLocaleString()}
                          </Typography>
                        )}
                        {workflow.error && (
                          <Typography
                            variant="body2"
                            component="div"
                            color="error"
                            sx={{ mt: 0.5 }}
                          >
                            Error: {workflow.error}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>
    </Box>
  );
});

ContextViewer.displayName = 'ContextViewer';

export default ContextViewer; 