/**
 * Lightweight Bootstrap Loader
 * 
 * Minimal entry point that defers heavy initialization until after
 * DOM is ready to prevent ES6 module loading timeouts.
 */

import React from 'react';

console.log("🚀 IV RELIFE Nexus - Bootstrap starting...");

// Global error handlers for module loading diagnostics
window.addEventListener('error', (e) => {
  console.error('🔥 Module load error:', e.error, e.filename, e.lineno);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('🔥 Unhandled promise rejection:', e.reason);
});

// Lightweight app initializer
export async function initApp() {
  try {
    console.log("📱 Initializing React application...");
    console.log("🔍 Current location:", window.location.href);
    
    // Dynamic import of the main app to defer heavy loading
    // Back to original App to test if our changes broke it
    const { default: App } = await import('./App');
    const { createRoot } = await import('react-dom/client');
    
    const rootElement = document.getElementById("root");
    console.log("🎯 Root element:", rootElement);
    
    if (!rootElement) {
      throw new Error("Root element not found");
    }

    console.log("🚀 Creating React root...");
    const root = createRoot(rootElement);
    
    console.log("🎨 Rendering App component...");
    root.render(<App />);
    
    console.log("✅ Application started successfully");
    
    // Notify success callback if available
    if (typeof window !== 'undefined' && (window as any).appLoadSuccess) {
      (window as any).appLoadSuccess();
    }
    
  } catch (error) {
    console.error("❌ Application failed to start:", error);
    
    // Notify error callback if available
    if (typeof window !== 'undefined' && (window as any).appLoadError) {
      (window as any).appLoadError(error);
    }
    
    // Show fallback UI
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          padding: 40px; 
          background: #f8d7da; 
          color: #721c24; 
          border-radius: 8px; 
          margin: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">
          <h2>❌ Application Failed to Start</h2>
          <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
          <p>Please check the console for more details or refresh the page.</p>
          <button onclick="window.location.reload()" style="
            background: #dc3545; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 4px; 
            cursor: pointer;
            margin-top: 16px;
          ">
            Reload Page
          </button>
        </div>
      `;
    }
  }
}

// Bootstrap initialization is now handled by main.tsx
console.log("📋 Bootstrap module loaded and ready for initialization");