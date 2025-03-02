/**
 * Minimal backend server entry point
 * This is a temporary version that will compile during restructuring
 */
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { SimpleAgentConfig, AgentNodeType } from '@mcp-router/shared';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Create Express server
const app = express();
const port = process.env.PORT || 3001;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  },
  path: '/ws'
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Sample data
const sampleAgent: SimpleAgentConfig = {
  id: 'sample-agent-1',
  name: 'Sample Agent',
  description: 'A sample agent for testing',
  type: AgentNodeType.LLM,
  capabilities: ['text-generation', 'chat']
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Handle initialization message
  socket.on('initialize', (data) => {
    console.log('Initialize request received:', data);
    socket.emit('initialized', { status: 'ok' });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
  
  // Handle workflow execution
  socket.on('execute_workflow', (data) => {
    console.log('Workflow execution request:', data);
    socket.emit('workflow_result', {
      execution_id: 'sample-execution',
      status: 'completed',
      result: { message: 'Workflow executed successfully' }
    });
  });
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'MCP Router Backend API' });
});

app.get('/api/agents', (req, res) => {
  res.json([sampleAgent]);
});

app.get('/api/agents/:id', (req, res) => {
  if (req.params.id === sampleAgent.id) {
    res.json(sampleAgent);
  } else {
    res.status(404).json({ error: 'Agent not found' });
  }
});

// Start server
httpServer.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
  console.log(`WebSocket server running on ${port}, path: /ws`);
}); 