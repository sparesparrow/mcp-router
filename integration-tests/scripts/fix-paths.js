/**
 * This script checks and updates the path mappings in tsconfig.json
 * to ensure correct module resolution for integration tests
 */
const fs = require('fs');
const path = require('path');

// Function to update tsconfig.json paths
function updateTsconfigPaths() {
  const tsconfigPath = path.resolve(__dirname, '../tsconfig.json');
  
  if (!fs.existsSync(tsconfigPath)) {
    console.error('tsconfig.json not found at', tsconfigPath);
    return;
  }
  
  try {
    // Read the current tsconfig
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    // Ensure paths section exists
    if (!tsconfig.compilerOptions.paths) {
      tsconfig.compilerOptions.paths = {};
    }
    
    // Update the paths
    tsconfig.compilerOptions.paths = {
      "@/*": ["./src/*"],
      "shared": ["../packages/shared"],
      "shared/*": ["../packages/shared/*"],
      "frontend/*": ["../packages/frontend/*"],
      "backend/*": ["../packages/backend/*"]
    };
    
    // Update baseUrl if not set
    if (!tsconfig.compilerOptions.baseUrl) {
      tsconfig.compilerOptions.baseUrl = ".";
    }
    
    // Write the updated config
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    console.log('Updated path mappings in tsconfig.json');
  } catch (error) {
    console.error('Error updating tsconfig.json:', error);
  }
}

// Execute
updateTsconfigPaths(); 