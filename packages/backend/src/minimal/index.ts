/**
 * Minimal backend server entry point
 * This is a temporary version that will compile during restructuring
 */
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { SimpleAgentConfig, AgentNodeType } from '@mcp-router/shared';

// Create Express server
const app = express();
const port = process.env.PORT || 3001;

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
app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
}); 