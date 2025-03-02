#!/usr/bin/env node

/**
 * Check for circular dependencies in the codebase
 * 
 * This script uses madge to check for circular dependencies in the codebase.
 * It checks each package individually to make it easier to locate and fix issues.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const PACKAGES = ['frontend', 'backend', 'shared'];
const BASE_DIR = path.resolve(__dirname, '..');

// Colors for terminal output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

console.log(`${COLORS.blue}Checking for circular dependencies in the codebase...${COLORS.reset}\n`);

// Check if madge is installed
try {
  execSync('npx madge --version', { stdio: 'ignore' });
} catch (error) {
  console.log(`${COLORS.yellow}Installing madge globally...${COLORS.reset}`);
  execSync('npm install -g madge', { stdio: 'inherit' });
}

let hasCircular = false;

// Check each package for circular dependencies
PACKAGES.forEach(pkg => {
  const pkgDir = path.join(BASE_DIR, 'packages', pkg);
  const srcDir = path.join(pkgDir, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.log(`${COLORS.yellow}⚠️ ${pkg} package src directory not found, skipping...${COLORS.reset}`);
    return;
  }
  
  console.log(`${COLORS.blue}Checking ${pkg} package...${COLORS.reset}`);
  
  try {
    // Run madge to check for circular dependencies
    const result = execSync(`npx madge --circular ${srcDir}`, { encoding: 'utf-8' });
    
    if (result.includes('No circular dependency found')) {
      console.log(`${COLORS.green}✅ No circular dependencies found in ${pkg} package${COLORS.reset}`);
    } else {
      console.log(`${COLORS.red}❌ Circular dependencies found in ${pkg} package:${COLORS.reset}`);
      console.log(result);
      hasCircular = true;
    }
  } catch (error) {
    // If madge exits with an error, it usually means circular dependencies were found
    if (error.stdout) {
      console.log(`${COLORS.red}❌ Circular dependencies found in ${pkg} package:${COLORS.reset}`);
      console.log(error.stdout);
      hasCircular = true;
    } else {
      console.error(`${COLORS.red}Error checking ${pkg} package:${COLORS.reset}`, error.message);
    }
  }
  
  console.log(''); // Empty line for readability
});

// Provide guidance for fixing circular dependencies
if (hasCircular) {
  console.log(`${COLORS.yellow}Suggestions for fixing circular dependencies:${COLORS.reset}`);
  console.log(`${COLORS.yellow}1. Extract the shared code into a new module${COLORS.reset}`);
  console.log(`${COLORS.yellow}2. Use dependency injection instead of direct imports${COLORS.reset}`);
  console.log(`${COLORS.yellow}3. Restructure the code to avoid mutual dependencies${COLORS.reset}`);
  console.log(`${COLORS.yellow}4. Consider using interfaces to define contract between modules${COLORS.reset}`);
  
  process.exit(1); // Exit with error code
} else {
  console.log(`${COLORS.green}All packages are free of circular dependencies!${COLORS.reset}`);
} 