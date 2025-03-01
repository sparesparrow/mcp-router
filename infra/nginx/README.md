# Nginx Directory

This directory contains Nginx configuration files for the MCP Router project.

## Contents

- **nginx.conf**: Main Nginx configuration file for production deployments

## Purpose

The Nginx configuration provides:
- Reverse proxy for the MCP Router backend
- Static file serving for the frontend
- WebSocket support for real-time communication
- Load balancing capabilities for scaling
- SSL/TLS termination for secure connections
- HTTP/2 support for improved performance
- Rate limiting to prevent abuse

## Usage

This configuration is used in the Docker setup and for production deployments. It routes traffic between the frontend, backend, and MCP services.

### Configuration Highlights

- Frontend static files are served directly by Nginx
- API requests are proxied to the backend service
- WebSocket connections are properly configured for persistent connections
- Response compression is enabled for better performance
- HTTP to HTTPS redirection for security
- Cross-Origin Resource Sharing (CORS) headers

## Customization

When deploying to different environments, you may need to modify:
- Server names and ports
- SSL certificate paths
- Upstream server configurations
- Rate limiting settings
- Cache control headers
- Custom error pages

## Integration with Docker

The Nginx configuration is used in the Docker Compose setup to provide a unified entry point for the entire application. 