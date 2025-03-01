// Example configuration file for MCP Router
// Copy this to default.js and modify as needed

module.exports = {
  router: {
    // Server configuration
    port: 8080,
    host: '0.0.0.0',
    
    // Pre-configured servers to register on startup
    servers: [
      {
        id: 'local-mcp',
        name: 'Local MCP Server',
        url: 'http://localhost:9000'
      },
      {
        id: 'another-server',
        name: 'Another MCP Server',
        url: 'http://example.com:8080',
        metadata: {
          description: 'Example of a remote MCP server',
          owner: 'example-team'
        }
      }
    ],
    
    // Discovery service configuration
    discovery: {
      enabled: true,      // Set to false to disable automatic discovery
      methods: ['podman'], // Available methods: 'podman', 'docker', 'kubernetes'
      pollInterval: 30000  // Poll interval in milliseconds (30 seconds)
    }
  },
  
  // Logging configuration
  logging: {
    level: 'info',        // Available levels: 'error', 'warn', 'info', 'debug'
    format: 'text',       // Available formats: 'text', 'json'
    timestamp: true,      // Include timestamps in logs
    colors: true          // Use colors in console output
  }
}; 