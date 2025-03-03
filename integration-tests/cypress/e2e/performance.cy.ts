describe('Workflow Performance Tests', () => {
  // Helper to measure operation time
  const measurePerformance = (operation: () => void, name: string) => {
    const start = performance.now();
    operation();
    cy.window().then(() => {
      const end = performance.now();
      const duration = end - start;
      cy.log(`${name} took ${duration.toFixed(2)}ms`);
      // Store performance metrics in Cypress environment
      // so they can be reported or checked later
      cy.task('logPerformance', { name, duration });
    });
  };

  beforeEach(() => {
    cy.visit('/');
    // Wait for application to fully load
    cy.get('.mcp-workflow-designer-app', { timeout: 10000 }).should('be.visible');
  });

  it('should measure workflow designer initialization time', () => {
    measurePerformance(() => {
      cy.reload();
    }, 'Workflow Designer Load');
    
    // Verify the app loaded correctly
    cy.get('.react-flow').should('exist');
  });

  it('should measure node creation performance', () => {
    // Get node palette
    cy.get('[data-testid="node-palette"]').should('exist');
    
    // Measure performance of adding nodes
    measurePerformance(() => {
      // Add an LLM node
      cy.get('[data-testid="node-type-llm"]').click();
      cy.get('.react-flow__renderer').click(300, 200);
      
      // Add a tool node
      cy.get('[data-testid="node-type-tool"]').click();
      cy.get('.react-flow__renderer').click(300, 300);
      
      // Add a router node
      cy.get('[data-testid="node-type-router"]').click();
      cy.get('.react-flow__renderer').click(300, 400);
    }, 'Node Creation');
    
    // Verify nodes were created
    cy.get('.react-flow__node').should('have.length', 3);
  });

  it('should measure workflow save and load performance', () => {
    // Create a simple workflow first
    cy.get('[data-testid="node-type-input"]').click();
    cy.get('.react-flow__renderer').click(100, 200);
    
    cy.get('[data-testid="node-type-llm"]').click();
    cy.get('.react-flow__renderer').click(300, 200);
    
    cy.get('[data-testid="node-type-output"]').click();
    cy.get('.react-flow__renderer').click(500, 200);
    
    // Connect the nodes
    cy.get('.react-flow__node').eq(0).find('.react-flow__handle-right').trigger('mousedown');
    cy.get('.react-flow__node').eq(1).find('.react-flow__handle-left').trigger('mouseup');
    
    cy.get('.react-flow__node').eq(1).find('.react-flow__handle-right').trigger('mousedown');
    cy.get('.react-flow__node').eq(2).find('.react-flow__handle-left').trigger('mouseup');
    
    // Measure save performance
    measurePerformance(() => {
      cy.get('[data-testid="save-workflow-button"]').click();
      cy.get('[data-testid="workflow-name-input"]').type('Performance Test Workflow');
      cy.get('[data-testid="save-workflow-confirm"]').click();
      cy.get('[data-testid="save-success-message"]').should('be.visible');
    }, 'Workflow Save');
    
    // Measure load performance
    measurePerformance(() => {
      cy.get('[data-testid="load-workflow-button"]').click();
      cy.get('[data-testid="workflow-list"]').contains('Performance Test Workflow').click();
      cy.get('[data-testid="load-workflow-confirm"]').click();
    }, 'Workflow Load');
    
    // Verify the workflow loaded correctly
    cy.get('.react-flow__node').should('have.length', 3);
    cy.get('.react-flow__edge').should('have.length', 2);
  });
}); 