import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  'aria-labelledby': string;
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

interface MonitoringPanelProps {
  screenshots: Array<{
    timestamp: string;
    image_data: string;
    dimensions: [number, number];
  }>;
  clipboard: Array<{
    timestamp: string;
    content: string;
  }>;
  network: Array<{
    timestamp: string;
    type: string;
    data: any;
  }>;
  isLoading?: boolean;
  error?: Error | null;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, 'aria-labelledby': ariaLabelledBy, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`monitoring-tabpanel-${index}`}
      aria-labelledby={ariaLabelledBy}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `monitoring-tab-${index}`,
    'aria-controls': `monitoring-tabpanel-${index}`,
  };
}

const MonitoringPanel: React.FC<MonitoringPanelProps> = ({
  screenshots,
  clipboard,
  network,
  isLoading = false,
  error = null,
}) => {
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
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
          {error.message || 'An error occurred while loading monitoring data'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="Monitoring tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Screenshots" {...a11yProps(0)} />
          <Tab label="Clipboard" {...a11yProps(1)} />
          <Tab label="Network" {...a11yProps(2)} />
        </Tabs>
      </Box>

      <TabPanel value={value} index={0} aria-labelledby="monitoring-tab-0">
        <List>
          {screenshots.length === 0 ? (
            <ListItem>
              <ListItemText primary="No screenshots available" />
            </ListItem>
          ) : (
            screenshots.map((screenshot, index) => (
              <ListItem key={`${screenshot.timestamp}-${index}`}>
                <Card sx={{ width: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {new Date(screenshot.timestamp).toLocaleString()}
                    </Typography>
                    <Box
                      component="img"
                      src={`data:image/png;base64,${screenshot.image_data}`}
                      alt={`Screenshot from ${screenshot.timestamp}`}
                      sx={{
                        maxWidth: '100%',
                        height: 'auto',
                        mt: 1,
                      }}
                      loading="lazy"
                    />
                  </CardContent>
                </Card>
              </ListItem>
            ))
          )}
        </List>
      </TabPanel>

      <TabPanel value={value} index={1} aria-labelledby="monitoring-tab-1">
        <List>
          {clipboard.length === 0 ? (
            <ListItem>
              <ListItemText primary="No clipboard events available" />
            </ListItem>
          ) : (
            clipboard.map((item, index) => (
              <ListItem key={`${item.timestamp}-${index}`}>
                <Card sx={{ width: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {new Date(item.timestamp).toLocaleString()}
                    </Typography>
                    <Typography
                      variant="body1"
                      component="pre"
                      sx={{
                        mt: 1,
                        p: 1,
                        backgroundColor: 'grey.100',
                        borderRadius: 1,
                        overflowX: 'auto',
                      }}
                    >
                      {item.content}
                    </Typography>
                  </CardContent>
                </Card>
              </ListItem>
            ))
          )}
        </List>
      </TabPanel>

      <TabPanel value={value} index={2} aria-labelledby="monitoring-tab-2">
        <List>
          {network.length === 0 ? (
            <ListItem>
              <ListItemText primary="No network events available" />
            </ListItem>
          ) : (
            network.map((event, index) => (
              <ListItem key={`${event.timestamp}-${index}`}>
                <Card sx={{ width: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {new Date(event.timestamp).toLocaleString()}
                    </Typography>
                    <Typography variant="subtitle1" color="primary">
                      {event.type}
                    </Typography>
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        mt: 1,
                        p: 1,
                        backgroundColor: 'grey.100',
                        borderRadius: 1,
                        overflowX: 'auto',
                      }}
                    >
                      {JSON.stringify(event.data, null, 2)}
                    </Typography>
                  </CardContent>
                </Card>
              </ListItem>
            ))
          )}
        </List>
      </TabPanel>
    </Box>
  );
};

export default React.memo(MonitoringPanel); 