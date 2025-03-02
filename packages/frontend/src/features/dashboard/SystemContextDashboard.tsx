import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  useTheme,
  Alert,
} from '@mui/material';
import { SystemHealth } from '../../types/monitoring';
import { fetchSystemHealth } from '../../api/monitoring';

const SystemContextDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const loadSystemHealth = async () => {
      try {
        const health = await fetchSystemHealth();
        setSystemHealth(health);
        setError(null);
      } catch (err) {
        setError('Failed to load system health data');
        console.error('Error loading system health:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSystemHealth();
    // Monitoring refresh has been disabled for performance reasons
    // const interval = setInterval(loadSystemHealth, 30000); // Refresh every 30 seconds
    // return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* System Overview */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <Typography component="h1" variant="h4" color="primary" gutterBottom>
              System Context Monitor
            </Typography>
            <Typography variant="body1" paragraph>
              Real-time monitoring and analysis of system components
            </Typography>
            
            {/* Display monitoring disabled message */}
            <Alert severity="info" sx={{ mt: 2 }}>
              System monitoring has been disabled for performance reasons. Re-enable it in feature flags when needed.
            </Alert>
          </Paper>
        </Grid>

        {/* Health Status */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 240,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              System Health
            </Typography>
            {systemHealth && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle1">Status</Typography>
                    <Typography
                      variant="h6"
                      color={systemHealth.status === 'healthy' ? 'success.main' : 'error.main'}
                    >
                      {systemHealth.status.toUpperCase()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle1">Uptime</Typography>
                    <Typography variant="h6">{systemHealth.uptime}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle1">CPU Usage</Typography>
                    <Typography variant="h6">{systemHealth.cpuUsage}%</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle1">Memory Usage</Typography>
                    <Typography variant="h6">{systemHealth.memoryUsage}%</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Active Services */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 240,
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Active Services
            </Typography>
            {systemHealth && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  {systemHealth.services.map((service) => (
                    <Grid item xs={6} key={service.name}>
                      <Paper
                        sx={{
                          p: 1,
                          backgroundColor:
                            service.status === 'running'
                              ? 'success.light'
                              : 'error.light',
                        }}
                      >
                        <Typography variant="subtitle2">{service.name}</Typography>
                        <Typography variant="body2">{service.status}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Alerts */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Recent Alerts
            </Typography>
            {systemHealth && systemHealth.alerts.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                {systemHealth.alerts.map((alert, index) => (
                  <Paper
                    key={index}
                    sx={{
                      p: 1,
                      mb: 1,
                      backgroundColor:
                        alert.severity === 'critical'
                          ? 'error.light'
                          : alert.severity === 'warning'
                          ? 'warning.light'
                          : 'info.light',
                    }}
                  >
                    <Typography variant="subtitle2">
                      {alert.timestamp} - {alert.message}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No recent alerts
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SystemContextDashboard; 