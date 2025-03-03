/// <reference types="cypress" />

const fs = require('fs');
const path = require('path');

// Performance data storage
let performanceMetrics = [];

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  // Register custom tasks for performance testing
  on('task', {
    // Log performance data
    logPerformance({ name, duration }) {
      performanceMetrics.push({ name, duration, timestamp: new Date().toISOString() });
      return null;
    },
    
    // Get all performance data
    getPerformanceMetrics() {
      return performanceMetrics;
    },
    
    // Save performance data to file
    savePerformanceReport() {
      const reportDir = path.join(__dirname, '../../performance-reports');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportPath = path.join(reportDir, `performance-report-${timestamp}.json`);
      
      // Write data to file
      fs.writeFileSync(reportPath, JSON.stringify(performanceMetrics, null, 2));
      
      // Reset metrics for next run
      performanceMetrics = [];
      
      return reportPath;
    }
  });
  
  // Reset performance metrics at the start of each run
  on('before:run', () => {
    performanceMetrics = [];
  });
  
  // Save performance report after run completes
  on('after:run', () => {
    if (performanceMetrics.length > 0) {
      const reportPath = path.join(__dirname, '../../performance-reports', 
        `performance-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
      
      // Create directory if it doesn't exist
      const reportDir = path.dirname(reportPath);
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      
      // Write data to file
      fs.writeFileSync(reportPath, JSON.stringify(performanceMetrics, null, 2));
      
      console.log(`Performance report saved to: ${reportPath}`);
      
      // Reset metrics for next run
      performanceMetrics = [];
    }
  });

  return config;
};