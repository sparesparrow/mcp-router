/**
 * E2E tests that verify frontend and backend work together
 * Uses Puppeteer to test the full application
 */
import puppeteer from 'puppeteer';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import http from 'http';

describe('Frontend-Backend Integration', () => {
  let backendProcess: ChildProcess;
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;
  
  // Helper function to check if a port is in use
  const isPortInUse = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const server = http.createServer();
      server.once('error', () => {
        resolve(true); // Port is in use
      });
      server.once('listening', () => {
        server.close();
        resolve(false); // Port is not in use
      });
      server.listen(port);
    });
  };
  
  // Start backend and frontend before tests
  beforeAll(async () => {
    // Start backend server
    const backendPath = path.resolve(__dirname, '../../../packages/backend');
    backendProcess = spawn('npm', ['start'], {
      cwd: backendPath,
      stdio: 'pipe',
    });
    
    // Wait for backend to start (max 10 seconds)
    const backendPort = 3001; // Adjust to your backend port
    let attempts = 0;
    while (attempts < 20) {
      const inUse = await isPortInUse(backendPort);
      if (inUse) break;
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
  }, 30000);
  
  // Clean up after tests
  afterAll(async () => {
    if (browser) await browser.close();
    if (backendProcess) backendProcess.kill();
  });
  
  test('Frontend loads without HTTP module errors', async () => {
    // Navigate to the frontend
    await page.goto('http://localhost:3000');
    
    // Check for console errors related to HTTP module
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait for page to stabilize
    await page.waitForTimeout(2000);
    
    // Verify no HTTP module errors
    const httpErrors = consoleErrors.filter(error => 
      error.includes('http.ServerResponse') || 
      error.includes('express')
    );
    
    expect(httpErrors).toHaveLength(0);
  }, 15000);
  
  test('Workflow designer loads and shows components', async () => {
    await page.goto('http://localhost:3000');
    
    // Wait for the workflow designer to load
    await page.waitForSelector('.mcp-workflow-designer-app', { timeout: 5000 });
    
    // Check that key UI elements are present
    const appTitle = await page.$eval('.app-title h1', el => el.textContent);
    expect(appTitle).toBe('MCP Workflow Designer');
    
    // Verify canvas is present
    const canvas = await page.$('.react-flow');
    expect(canvas).toBeTruthy();
    
    // Verify mermaid panel is present and loads without errors
    const mermaidPanel = await page.$('[ref=diagramRef]');
    expect(mermaidPanel).toBeTruthy();
  }, 15000);
}); 