import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Define custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users over 30 seconds
    { duration: '1m', target: 20 },   // Stay at 20 users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    'http_req_duration{name:createWorkflow}': ['p(95)<300'], // More stringent threshold for workflow creation
    'http_req_duration{name:executeWorkflow}': ['p(95)<800'], // Execution may take longer
    errors: ['rate<0.1'],  // Error rate should be less than 10%
  },
};

// Base URL - update this based on your environment
const BASE_URL = __ENV.API_URL || 'http://localhost:8000';

// Sample workflow data
const sampleWorkflow = {
  name: "Test Workflow",
  description: "Performance test workflow",
  nodes: [
    {
      id: "node1",
      type: "input",
      data: { label: "Input Node" },
      position: { x: 100, y: 100 }
    },
    {
      id: "node2",
      type: "llm",
      data: { label: "LLM Node" },
      position: { x: 300, y: 100 }
    },
    {
      id: "node3",
      type: "output",
      data: { label: "Output Node" },
      position: { x: 500, y: 100 }
    }
  ],
  edges: [
    {
      id: "edge1-2",
      source: "node1",
      target: "node2"
    },
    {
      id: "edge2-3",
      source: "node2",
      target: "node3"
    }
  ]
};

// Test execution
export default function() {
  // Test 1: Create a workflow
  let createResponse = http.post(
    `${BASE_URL}/api/workflows`,
    JSON.stringify(sampleWorkflow),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'createWorkflow' }
    }
  );
  
  check(createResponse, {
    'workflow created successfully': (r) => r.status === 201,
  }) || errorRate.add(1);
  
  if (createResponse.status === 201) {
    const workflowId = JSON.parse(createResponse.body).id;
    
    // Test 2: Get workflow by ID
    let getResponse = http.get(
      `${BASE_URL}/api/workflows/${workflowId}`,
      { tags: { name: 'getWorkflow' } }
    );
    
    check(getResponse, {
      'workflow retrieved successfully': (r) => r.status === 200,
    }) || errorRate.add(1);
    
    // Test 3: Execute workflow
    let executeResponse = http.post(
      `${BASE_URL}/api/workflows/${workflowId}/execute`,
      JSON.stringify({ input: "Test input" }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'executeWorkflow' }
      }
    );
    
    check(executeResponse, {
      'workflow executed successfully': (r) => r.status === 200,
    }) || errorRate.add(1);
  }
  
  // Pause between iterations
  sleep(1);
} 