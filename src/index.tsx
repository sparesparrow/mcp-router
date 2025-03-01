/**
 * index.tsx
 * Application entry point
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Create root element if it doesn't exist
let rootElement = document.getElementById('root');
if (!rootElement) {
  rootElement = document.createElement('div');
  rootElement.id = 'root';
  document.body.appendChild(rootElement);
}

// Render the app
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 