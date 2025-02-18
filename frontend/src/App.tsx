import React from 'react';
import MCPStatus from './components/MCPStatus';
import { MCPProvider } from './contexts/MCPContext';
import './App.css';

function App() {
  return (
    <MCPProvider>
      <div className="App">
        <header className="App-header">
          <h1>System Context Monitor</h1>
        </header>
        <main>
          <MCPStatus />
        </main>
      </div>
    </MCPProvider>
  );
}

export default App; 