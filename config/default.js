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
      }
    ],
    
    // Discovery service configuration
    discovery: {
      enabled: true,
      methods: ['podman'],
      pollInterval: 30000
    },
    
    // Logging configuration
    logging: {
      level: 'info',
      format: 'text', // 'text' or 'json'
      timestamp: true,
      colors: true
    }
  }
}; 