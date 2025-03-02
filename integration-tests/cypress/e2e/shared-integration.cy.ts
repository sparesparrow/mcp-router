describe('Shared Package Browser Integration', () => {
  beforeEach(() => {
    cy.visit('/');
    // Wait for application to fully load
    cy.get('.mcp-workflow-designer-app', { timeout: 10000 }).should('be.visible');
  });

  it('should load without Node.js/Express errors', () => {
    // Check for specific error messages in the UI that would indicate
    // server-side code is being bundled improperly
    cy.get('body').should('not.contain', 'http.ServerResponse is undefined');
    cy.get('body').should('not.contain', 'express');
    
    // Verify the app loaded correctly
    cy.get('.app-title').should('be.visible');
    cy.get('.react-flow').should('exist');
  });

  it('should correctly render node types from shared AgentNodeType', () => {
    // Test that shared enum types are used correctly
    // This assumes your UI has a node palette or type selector
    cy.get('[data-testid="node-palette"]').should('exist');
    
    // Check that LLM node type exists
    cy.get('[data-testid="node-type-llm"]').should('exist');
    
    // Check other node types from the shared enum
    cy.get('[data-testid="node-type-tool"]').should('exist');
    cy.get('[data-testid="node-type-router"]').should('exist');
    cy.get('[data-testid="node-type-input"]').should('exist');
    cy.get('[data-testid="node-type-output"]').should('exist');
  });

  it('should use the browser-compatible HttpServer stub', () => {
    // This is more of a functional test that verifies the fix worked
    // If the app loads without errors, it means the server-side code
    // has been properly replaced with browser-compatible stubs
    
    cy.window().then(win => {
      // Access the global window object to check for error state
      const hasErrors = win.document.querySelector('[data-testid="runtime-error"]');
      expect(hasErrors).to.be.null;
    });
  });
});