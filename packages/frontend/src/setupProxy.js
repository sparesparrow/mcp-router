/**
 * Setup proxy for development server
 * This file is automatically detected by react-scripts and used during development
 */
const path = require('path');

module.exports = function (app) {
  // No actual proxying is done here, but having this file can help with module resolution
  console.log('Using shared package from:', path.resolve(__dirname, '../../shared'));
}; 