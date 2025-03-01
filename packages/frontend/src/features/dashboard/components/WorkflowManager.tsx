import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useMCP } from '../../src/contexts/MCPContext';

interface WorkflowState {
  workflow_id: string;
  status: string;
  start_time: string;
  end_time?: string;
  results?: any;
  error?: string;
}

interface WorkflowManagerProps {
  workflows: WorkflowState[];
  onDeleteWorkflow?: (workflowId: string) => Promise<void>;
  onRestartWorkflow?: (workflowId: string) => Promise<void>;
  isLoading?: boolean;
  error?: Error | null;
}

const WorkflowManager: React.FC<WorkflowManagerProps> = React.memo(({
  workflows,
  onDeleteWorkflow,
  onRestartWorkflow,
  isLoading = false,
  error = null,
}) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowState | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionError, setActionError] = useState<Error | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { isConnected } = useMCP();

  const handleOpenDetails = useCallback((workflow: WorkflowState) => {
    setSelectedWorkflow(workflow);
    setDetailsOpen(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setDetailsOpen(false);
    setSelectedWorkflow(null);
  }, []);

  const handleDeleteWorkflow = useCallback(async (workflowId: string) => {
    if (!onDeleteWorkflow) return;
    
    setActionLoading(workflowId);
    setActionError(null);
    try {
      await onDeleteWorkflow(workflowId);
    } catch (error) {
      setActionError(error instanceof Error ? error : new Error('Failed to delete workflow'));
    } finally {
      setActionLoading(null);
    }
  }, [onDeleteWorkflow]);

  const handleRestartWorkflow = useCallback(async (workflowId: string) => {
    if (!onRestartWorkflow) return;
    
    setActionLoading(workflowId);
    setActionError(null);
    try {
      await onRestartWorkflow(workflowId);
    } catch (error) {
      setActionError(error instanceof Error ? error : new Error('Failed to restart workflow'));
    } finally {
      setActionLoading(null);
    }
  }, [onRestartWorkflow]);

  const getStatusColor = useCallback((status: string) => {
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
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return <PlayIcon />;
      case 'completed':
        return <RefreshIcon />;
      case 'failed':
        return <StopIcon />;
      default:
        return null;
    }
  }, []);

  const sortedWorkflows = useMemo(() => {
    return [...workflows].sort((a, b) => 
      new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );
  }, [workflows]);

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
          {error.message || 'An error occurred while loading workflows'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Workflow Management
      </Typography>

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError.message}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table aria-label="workflow management table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedWorkflows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No workflows available
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedWorkflows.map((workflow) => (
                <TableRow
                  key={workflow.workflow_id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {workflow.workflow_id}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(workflow.status)}
                      <Chip
                        label={workflow.status}
                        size="small"
                        color={getStatusColor(workflow.status) as any}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    {new Date(workflow.start_time).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {workflow.end_time
                      ? new Date(workflow.end_time).toLocaleString()
                      : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          onClick={() => handleOpenDetails(workflow)}
                          size="small"
                          aria-label={`View details for workflow ${workflow.workflow_id}`}
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                      {onRestartWorkflow && (
                        <Tooltip title="Restart Workflow">
                          <span>
                            <IconButton
                              onClick={() => handleRestartWorkflow(workflow.workflow_id)}
                              size="small"
                              disabled={!isConnected || actionLoading === workflow.workflow_id}
                              aria-label={`Restart workflow ${workflow.workflow_id}`}
                            >
                              {actionLoading === workflow.workflow_id ? (
                                <CircularProgress size={20} />
                              ) : (
                                <RefreshIcon />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      {onDeleteWorkflow && (
                        <Tooltip title="Delete Workflow">
                          <span>
                            <IconButton
                              onClick={() => handleDeleteWorkflow(workflow.workflow_id)}
                              size="small"
                              disabled={!isConnected || actionLoading === workflow.workflow_id}
                              aria-label={`Delete workflow ${workflow.workflow_id}`}
                            >
                              {actionLoading === workflow.workflow_id ? (
                                <CircularProgress size={20} />
                              ) : (
                                <DeleteIcon />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        aria-labelledby="workflow-details-dialog"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="workflow-details-dialog">
          Workflow Details
        </DialogTitle>
        <DialogContent dividers>
          {selectedWorkflow && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Workflow ID: {selectedWorkflow.workflow_id}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Status:{' '}
                <Chip
                  label={selectedWorkflow.status}
                  color={getStatusColor(selectedWorkflow.status) as any}
                  size="small"
                />
              </Typography>
              <Typography variant="body1" gutterBottom>
                Start Time: {new Date(selectedWorkflow.start_time).toLocaleString()}
              </Typography>
              {selectedWorkflow.end_time && (
                <Typography variant="body1" gutterBottom>
                  End Time: {new Date(selectedWorkflow.end_time).toLocaleString()}
                </Typography>
              )}
              {selectedWorkflow.error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {selectedWorkflow.error}
                </Alert>
              )}
              {selectedWorkflow.results && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Results:
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: 'grey.100' }}>
                    <pre style={{ margin: 0, overflowX: 'auto' }}>
                      {JSON.stringify(selectedWorkflow.results, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

WorkflowManager.displayName = 'WorkflowManager';

export default WorkflowManager; 