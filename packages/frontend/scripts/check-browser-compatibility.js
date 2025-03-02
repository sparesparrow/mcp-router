/**
 * Browser Compatibility Test Script
 * 
 * This script scans the built JavaScript files to ensure no Node.js server-specific
 * modules are included in the browser bundle.
 */

const fs = require('fs');
const path = require('path');

// List of problematic server-only packages that should not be in browser bundles
const SERVER_ONLY_IMPORTS = [
  'express',
  'http.ServerResponse',
  'express/lib',
  'http.Server',
  'http.IncomingMessage',
  'http\\:ServerResponse', // Escaped patterns
  'express\\/'
];

// The build directory to scan
const BUILD_DIR = path.join(__dirname, '../build');
const JS_DIR = path.join(BUILD_DIR, 'static/js');

function scanFile(filePath) {
  console.log(`Scanning ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const issues = [];
  
  SERVER_ONLY_IMPORTS.forEach(importPattern => {
    const regex = new RegExp(importPattern, 'g');
    const matches = content.match(regex);
    
    if (matches && matches.length > 0) {
      issues.push({
        file: path.basename(filePath),
        pattern: importPattern,
        occurrences: matches.length
      });
    }
  });
  
  return issues;
}

function scanDirectory() {
  if (!fs.existsSync(JS_DIR)) {
    console.error(`Build directory not found: ${JS_DIR}`);
    console.error('Please run npm run build first');
    process.exit(1);
  }
  
  const jsFiles = fs.readdirSync(JS_DIR)
    .filter(file => file.endsWith('.js'))
    .map(file => path.join(JS_DIR, file));
  
  let allIssues = [];
  
  jsFiles.forEach(file => {
    const fileIssues = scanFile(file);
    allIssues = [...allIssues, ...fileIssues];
  });
  
  return allIssues;
}

function runTest() {
  console.log('Checking for server dependencies in browser bundle...');
  const issues = scanDirectory();
  
  if (issues.length === 0) {
    console.log('✅ No server dependencies found in the browser bundle!');
    process.exit(0);
  } else {
    console.error('❌ Found server dependencies in the browser bundle:');
    issues.forEach(issue => {
      console.error(`  • ${issue.file}: Found ${issue.occurrences} occurrences of '${issue.pattern}'`);
    });
    process.exit(1);
  }
}

runTest(); 