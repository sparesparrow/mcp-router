# Configuration Directory

This directory contains configuration files for the MCP Router.

## Contents

- **default.js**: Default configuration settings for the MCP Router
- **default.example.js**: Example configuration with documentation for all available options

## Configuration Options

The configuration files define settings for:
- Server port and host
- Pre-configured MCP servers
- Discovery service settings
- Logging configuration

You can create custom configuration files for different environments by creating additional files like:
- `production.js`
- `development.js`
- `test.js`

The Node.js `config` package will load the appropriate configuration based on the `NODE_ENV` environment variable. 