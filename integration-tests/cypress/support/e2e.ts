// Import commands.js using ES2015 syntax:
import './commands';

// Augment the Cypress namespace to include custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(username: string, password: string): Chainable<void>;
      createWorkflow(name: string): Chainable<void>;
      addNode(type: string, position: { x: number, y: number }): Chainable<void>;
      connectNodes(sourceId: string, targetId: string): Chainable<void>;
    }
  }
}