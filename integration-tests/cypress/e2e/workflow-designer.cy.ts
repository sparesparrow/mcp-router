describe('Workflow Designer', () => {
  beforeEach(() => {
    cy.visit('/');
    // Wait for application to fully load
    cy.get('.mcp-workflow-designer-app', { timeout: 10000 }).should('be.visible');
  });

  it('should display the application header', () => {
    cy.get('.app-title h1').should('have.text', 'MCP Workflow Designer');
  });

  it('should load the workflow canvas', () => {
    cy.get('.react-flow').should('exist');
    cy.get('.react-flow-panel').should('exist');
  });

  it('should show the Mermaid panel', () => {
    cy.contains('Mermaid Diagram').should('be.visible');
    cy.get('[ref=diagramRef]').should('exist');
  });

  it('should not show HTTP module errors in the console', () => {
    // This is a special test to verify our browser compatibility fix
    // Cypress can't directly check console errors, but we can verify the app loads
    // without visible errors
    cy.get('.react-flow').should('be.visible');
    cy.get('[data-testid="error-message"]').should('not.exist');
  });

  it('should be able to add a node to the canvas', () => {
    // This test assumes we have a node palette and can drag nodes
    // Implementation will depend on your actual UI
    cy.get('[data-testid="node-palette"]').should('be.visible');
    cy.get('[data-testid="node-input"]').drag('[data-testid="react-flow-pane"]', {
      force: true,
      target: { x: 300, y: 200 }
    });
    
    // Verify node was added
    cy.get('.react-flow__node').should('have.length.at.least', 1);
  });

  it('should be able to connect nodes', () => {
    // Add two nodes
    cy.get('[data-testid="node-input"]').drag('[data-testid="react-flow-pane"]', {
      force: true,
      target: { x: 200, y: 200 }
    });
    cy.get('[data-testid="node-output"]').drag('[data-testid="react-flow-pane"]', {
      force: true,
      target: { x: 500, y: 200 }
    });
    
    // Connect them
    cy.get('.react-flow__node').first().find('.react-flow__handle-right')
      .drag('.react-flow__node:last-child .react-flow__handle-left');
    
    // Verify edge was created
    cy.get('.react-flow__edge').should('have.length', 1);
  });

  it('should generate Mermaid diagram from workflow', () => {
    // Create a workflow with nodes
    // ... (implementation depends on your UI)
    
    // Open Mermaid panel and check diagram
    cy.contains('Mermaid Diagram').click();
    cy.get('[ref=diagramRef]').should('contain', 'graph TB');
  });
});