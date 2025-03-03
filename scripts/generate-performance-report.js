#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const REPORT_DIR = path.join(__dirname, '../performance-reports');
const OUTPUT_FILE = path.join(REPORT_DIR, 'performance-dashboard.html');

// Create directory if it doesn't exist
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Get all JSON reports
function getReportFiles() {
  const files = fs.readdirSync(path.join(__dirname, '../integration-tests/performance-reports'));
  return files
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(__dirname, '../integration-tests/performance-reports', file))
    .sort((a, b) => {
      // Sort by file modification time (newest first)
      return fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime();
    });
}

// Parse report files and aggregate data
function aggregateReports(files) {
  const metrics = {};
  const history = {};
  
  files.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const timestamp = path.basename(file).replace('performance-report-', '').replace('.json', '');
      
      data.forEach(entry => {
        // Initialize metric if not exists
        if (!metrics[entry.name]) {
          metrics[entry.name] = {
            min: Number.MAX_VALUE,
            max: 0,
            sum: 0,
            count: 0,
            avg: 0,
            latest: 0
          };
        }
        
        // Update metric
        const metric = metrics[entry.name];
        metric.min = Math.min(metric.min, entry.duration);
        metric.max = Math.max(metric.max, entry.duration);
        metric.sum += entry.duration;
        metric.count++;
        metric.avg = metric.sum / metric.count;
        metric.latest = entry.duration;
        
        // Update history
        if (!history[entry.name]) {
          history[entry.name] = [];
        }
        
        history[entry.name].push({
          timestamp: timestamp,
          value: entry.duration
        });
      });
    } catch (error) {
      console.error(`Error parsing file ${file}: ${error.message}`);
    }
  });
  
  return { metrics, history };
}

// Generate HTML report
function generateHtml(data) {
  const { metrics, history } = data;
  
  // Sort metrics by names
  const sortedMetricNames = Object.keys(metrics).sort();
  
  // Generate metrics table HTML
  const metricsTable = `
    <table class="metrics-table">
      <thead>
        <tr>
          <th>Metric Name</th>
          <th>Latest (ms)</th>
          <th>Average (ms)</th>
          <th>Min (ms)</th>
          <th>Max (ms)</th>
          <th>Count</th>
        </tr>
      </thead>
      <tbody>
        ${sortedMetricNames.map(name => `
          <tr>
            <td>${name}</td>
            <td>${metrics[name].latest.toFixed(2)}</td>
            <td>${metrics[name].avg.toFixed(2)}</td>
            <td>${metrics[name].min.toFixed(2)}</td>
            <td>${metrics[name].max.toFixed(2)}</td>
            <td>${metrics[name].count}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  // Generate charts data
  const chartsData = sortedMetricNames.map(name => {
    const chartData = history[name].map(item => ({
      x: new Date(item.timestamp.replace(/-/g, ':')),
      y: item.value
    })).sort((a, b) => a.x - b.x);
    
    return {
      name: name,
      data: JSON.stringify(chartData)
    };
  });
  
  // Generate chart divs
  const chartDivs = sortedMetricNames.map(name => 
    `<div class="chart-container">
      <h3>${name}</h3>
      <canvas id="chart-${name.replace(/\s+/g, '-')}"></canvas>
    </div>`
  ).join('');
  
  // Generate chart initialization JavaScript
  const chartScript = `
    document.addEventListener('DOMContentLoaded', function() {
      ${chartsData.map(chart => `
        (function() {
          const ctx = document.getElementById('chart-${chart.name.replace(/\s+/g, '-')}').getContext('2d');
          new Chart(ctx, {
            type: 'line',
            data: {
              datasets: [{
                label: '${chart.name} (ms)',
                data: ${chart.data},
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              scales: {
                x: {
                  type: 'time',
                  time: {
                    unit: 'day'
                  },
                  title: {
                    display: true,
                    text: 'Date'
                  }
                },
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Duration (ms)'
                  }
                }
              }
            }
          });
        })();
      `).join('\n')}
    });
  `;
  
  // Full HTML template
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCP-Router Performance Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 20px;
        background-color: #f5f5f5;
      }
      h1, h2 {
        color: #333;
      }
      .metrics-table {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 20px;
      }
      .metrics-table th, .metrics-table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
      }
      .metrics-table th {
        background-color: #4CAF50;
        color: white;
      }
      .metrics-table tr:nth-child(even) {
        background-color: #f2f2f2;
      }
      .metrics-table tr:hover {
        background-color: #ddd;
      }
      .chart-container {
        width: 100%;
        height: 300px;
        margin-bottom: 30px;
      }
      .chart-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
        gap: 20px;
      }
      .timestamp {
        color: #666;
        font-style: italic;
        margin-bottom: 20px;
      }
    </style>
  </head>
  <body>
    <h1>MCP-Router Performance Dashboard</h1>
    <p class="timestamp">Last updated: ${new Date().toLocaleString()}</p>
    
    <h2>Performance Metrics</h2>
    ${metricsTable}
    
    <h2>Performance Trends</h2>
    <div class="chart-grid">
      ${chartDivs}
    </div>
    
    <script>
      ${chartScript}
    </script>
  </body>
  </html>
  `;
}

// Main execution
try {
  console.log('Generating performance dashboard...');
  
  // Get report files
  const files = getReportFiles();
  if (files.length === 0) {
    console.log('No report files found. Run performance tests first.');
    process.exit(0);
  }
  
  // Aggregate reports
  const data = aggregateReports(files);
  
  // Generate HTML
  const html = generateHtml(data);
  
  // Write to file
  fs.writeFileSync(OUTPUT_FILE, html);
  
  console.log(`Performance dashboard generated at ${OUTPUT_FILE}`);
  
  // Open in browser if possible
  try {
    const cmd = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
    execSync(`${cmd} ${OUTPUT_FILE}`);
  } catch (error) {
    console.log('Could not open the dashboard automatically. Please open it manually.');
  }
} catch (error) {
  console.error('Error generating performance dashboard:', error.message);
  process.exit(1);
} 