/**
 * App.tsx
 * Main application entry point with refactored SOLID principles
 */

import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import WorkflowDesigner from './features/workflow-designer';
import { ServiceProvider } from './services/ServiceProvider';
import ConnectionStatus from './components/ConnectionStatus';
import NotificationList from './components/NotificationList';
import './App.css';

// Main App content
const AppContent: React.FC = () => {
  return (
    <div className="mcp-workflow-designer-app" style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <header style={{
        padding: '12px 20px',
        background: '#1e293b',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div className="app-title" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 'bold',
          }}>MCP Workflow Designer</h1>
          <span style={{
            fontSize: '12px',
            opacity: 0.7,
          }}>v1.0</span>
          <ConnectionStatus />
        </div>
        
        <div className="app-actions" style={{
          display: 'flex',
          gap: '12px',
        }}>
          <a 
            href="https://github.com/your-org/mcp-router"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'white',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
            }}
          >
            <span>GitHub</span>
          </a>
          
          <a 
            href="https://mcp-docs.example.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'white',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px',
            }}
          >
            <span>Documentation</span>
          </a>
        </div>
      </header>
      
      <main style={{
        flexGrow: 1,
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 56px)', // Subtract header height
      }}>
        <WorkflowDesigner />
      </main>
      
      {/* Global notification list */}
      <NotificationList />
    </div>
  );
};

// Root component with all providers
const App: React.FC = () => {
  return (
    <ReactFlowProvider>
      <ServiceProvider>
        <AppContent />
      </ServiceProvider>
    </ReactFlowProvider>
  );
};

export default App;