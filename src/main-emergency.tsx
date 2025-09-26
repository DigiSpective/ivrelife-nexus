// Emergency Main Entry - Bypass Complex Bootstrap
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppEmergency from './App-emergency';

console.log('🚀 IV RELIFE Nexus - Emergency Restoration Starting...');

// Report module execution immediately
window.moduleExecutionStarted = true;
window.moduleExecutionTime = Date.now();

// Test if we can modify the page immediately to confirm JS execution
const fallbackDiv = document.querySelector('[style*="Loading application"]')?.parentElement;
if (fallbackDiv) {
  fallbackDiv.innerHTML = '🔄 ES6 Module executing, initializing React app...';
  console.log('✅ DOM manipulation from module script successful');
}

// Direct rendering without complex bootstrap
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  document.body.innerHTML = '<h1>ERROR: Root element not found</h1>';
} else {
  console.log('✅ Root element found, creating React app...');
  
  const root = ReactDOM.createRoot(rootElement);
  
  try {
    root.render(<AppEmergency />);
    console.log('✅ Emergency main loaded successfully');
    
    // Call the global success callback if it exists
    if (window.appLoadSuccess) {
      window.appLoadSuccess();
    }
  } catch (error) {
    console.error('❌ Error rendering React app:', error);
    if (window.appLoadError) {
      window.appLoadError(error);
    }
  }
}