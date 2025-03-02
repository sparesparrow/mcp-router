#!/usr/bin/env node

/**
 * Fix imports script
 * 
 * This script helps update relative imports to use path aliases
 * to resolve import issues after the monorepo refactoring.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define the packages and their path mappings
const PACKAGES = {
  frontend: {
    dir: 'packages/frontend',
    pathMappings: {
      // Map relative imports to alias imports
      '../api/': '@mcp-router/frontend/api/',
      '../components/': '@mcp-router/frontend/components/',
      '../contexts/': '@mcp-router/frontend/contexts/',
      '../features/': '@mcp-router/frontend/features/',
      '../hooks/': '@mcp-router/frontend/hooks/',
      '../store/': '@mcp-router/frontend/store/',
      '../types/': '@mcp-router/frontend/types/',
      '../utils/': '@mcp-router/frontend/utils/',
      '../../../shared/src/': '@mcp-router/shared/',
    }
  },
  backend: {
    dir: 'packages/backend',
    pathMappings: {
      '../api/': '@mcp-router/backend/api/',
      '../core/': '@mcp-router/backend/core/',
      '../services/': '@mcp-router/backend/services/',
      '../types/': '@mcp-router/backend/types/',
      '../utils/': '@mcp-router/backend/utils/',
      '../../../shared/src/': '@mcp-router/shared/',
    }
  },
  shared: {
    dir: 'packages/shared',
    pathMappings: {
      '../types/': '@mcp-router/shared/types/',
      '../utils/': '@mcp-router/shared/utils/',
      '../core/': '@mcp-router/shared/core/',
    }
  }
};

// Run the script
console.log('Starting import fixes...');

// Process each package
Object.entries(PACKAGES).forEach(([packageName, config]) => {
  const packageDir = path.resolve(process.cwd(), config.dir);
  console.log(`\nProcessing package: ${packageName} in ${packageDir}`);
  
  // Get all TypeScript files in the package src directory
  const files = getTypeScriptFiles(path.join(packageDir, 'src'));
  console.log(`Found ${files.length} TypeScript files to process`);
  
  // Process each file
  files.forEach(file => {
    fixImportsInFile(file, config.pathMappings);
  });
});

console.log('\nImport fixes completed!');

// Helper function to get all TypeScript files in a directory
function getTypeScriptFiles(dir) {
  const results = [];
  
  // Skip node_modules
  if (dir.includes('node_modules')) {
    return results;
  }
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      results.push(...getTypeScriptFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(file.name)) {
      results.push(fullPath);
    }
  });
  
  return results;
}

// Helper function to fix imports in a file
function fixImportsInFile(filePath, pathMappings) {
  console.log(`Processing: ${path.relative(process.cwd(), filePath)}`);
  
  // Read the file
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;
  
  // Apply each path mapping
  Object.entries(pathMappings).forEach(([relativePath, aliasPath]) => {
    // Use regex to find and replace import paths
    const importRegex = new RegExp(`from ['"]${relativePath.replace(/\//g, '\\/')}([^'"]+)['"]`, 'g');
    const newContent = content.replace(importRegex, (match, importPath) => {
      changed = true;
      return `from '${aliasPath}${importPath}'`;
    });
    
    content = newContent;
  });
  
  // Write the file if changes were made
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  Fixed imports in: ${path.relative(process.cwd(), filePath)}`);
  }
} 