// Custom commands for Cypress tests

// Command to login (example)
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-testid=username-input]').type(username);
  cy.get('[data-testid=password-input]').type(password);
  cy.get('[data-testid=login-button]').click();
  cy.url().should('not.include', '/login');
});

// Command to create a workflow
Cypress.Commands.add('createWorkflow', (name: string) => {
  cy.get('[data-testid=create-workflow-button]').click();
  cy.get('[data-testid=workflow-name-input]').type(name);
  cy.get('[data-testid=workflow-save-button]').click();
  cy.get('[data-testid=workflow-list]').should('contain', name);
});

// Command to add a node to workflow canvas
Cypress.Commands.add('addNode', (type: string, position: { x: number, y: number }) => {
  cy.get(`[data-testid=node-type-${type}]`).drag('[data-testid=react-flow-canvas]', {
    target: position
  });
  cy.get(`[data-testid=node-${type}]`).should('exist');
});

// Command to connect nodes
Cypress.Commands.add('connectNodes', (sourceId: string, targetId: string) => {
  cy.get(`[data-testid=node-${sourceId}] [data-testid=source-handle]`)
    .drag(`[data-testid=node-${targetId}] [data-testid=target-handle]`);
  cy.get(`[data-testid=edge-${sourceId}-${targetId}]`).should('exist');
});