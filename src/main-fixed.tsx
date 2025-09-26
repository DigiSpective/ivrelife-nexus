// Fixed main entry point - addresses the root cause of blank page issue
// Root cause analysis: ES6 module loading and React import chain failures

console.log("🔧 MAIN-FIXED: Starting with comprehensive error handling");

// Step 1: Immediate DOM feedback before any imports
try {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    // Show immediate loading state
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: system-ui;">
        <h1 style="color: #3b82f6;">🔧 Loading Fixed Application</h1>
        <p>Initializing React with comprehensive error handling...</p>
        <div id="load-progress"></div>
      </div>
    `;
    console.log("🔧 MAIN-FIXED: Initial DOM update successful");
  }
} catch (error) {
  console.error("🔧 MAIN-FIXED: Initial DOM update failed:", error);
}

// Step 2: Progressive imports with detailed error handling
async function initializeApplication() {
  const progressEl = document.getElementById("load-progress");
  
  function updateProgress(message: string) {
    console.log(message);
    if (progressEl) {
      progressEl.innerHTML += `<div style="margin: 5px 0; color: #059669;">${message}</div>`;
    }
  }
  
  try {
    updateProgress("📦 Loading CSS styles...");
    await import("./index.css");
    updateProgress("✅ CSS loaded successfully");
    
    updateProgress("⚛️ Loading React...");
    const React = await import("react");
    updateProgress("✅ React loaded successfully");
    
    updateProgress("🏗️ Loading ReactDOM...");
    const ReactDOM = await import("react-dom/client");
    updateProgress("✅ ReactDOM loaded successfully");
    
    updateProgress("🔧 Creating root element...");
    const rootElement = document.getElementById("root");
    if (!rootElement) {
      throw new Error("Root element not found");
    }
    
    const root = ReactDOM.createRoot(rootElement);
    updateProgress("✅ React root created successfully");
    
    updateProgress("🎨 Loading main application...");
    
    // Import and render the actual IV RELIFE application
    const AppModule = await import("./App");
    const App = AppModule.default;
    updateProgress("✅ Main application module loaded successfully");
    
    root.render(React.createElement(App));
    updateProgress("🎉 IV RELIFE Nexus application rendered successfully!");
    
    // Success callback for monitoring script
    if (typeof window.appLoadSuccess === 'function') {
      window.appLoadSuccess();
    }
    
  } catch (error) {
    console.error("🔧 MAIN-FIXED: Application initialization failed:", error);
    
    // Detailed error reporting
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 40px; background: #dc3545; color: white; font-family: system-ui;">
          <h1>❌ INITIALIZATION FAILED</h1>
          <h2>Detailed Error Information</h2>
          <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace;">
            <strong>Error:</strong> ${error.message}<br>
            <strong>Stack:</strong> ${error.stack}
          </div>
          <p>This detailed error information helps identify the exact failure point.</p>
          <button onclick="window.location.reload()" style="padding: 10px 20px; background: white; color: #dc3545; border: none; border-radius: 5px; cursor: pointer;">
            Reload Application
          </button>
        </div>
      `;
    }
    
    // Error callback for monitoring script
    if (typeof window.appLoadError === 'function') {
      window.appLoadError(error);
    }
  }
}

// Initialize the application
initializeApplication();