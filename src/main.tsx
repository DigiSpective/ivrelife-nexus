// Enhanced main.tsx with comprehensive error handling and logging
console.log("🚀 Starting IV RELIFE Nexus application...");
console.log("🔍 main.tsx is executing - timestamp:", new Date().toISOString());

// Global error handlers to catch any issues
window.addEventListener('error', (e) => {
  console.error('🔥 Global error caught:', e.error, e.filename, e.lineno);
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 40px; background: #f8d7da; color: #721c24; font-family: Arial;">
        <h1>❌ JavaScript Error Detected</h1>
        <p><strong>Error:</strong> ${e.error?.message || 'Unknown error'}</p>
        <p><strong>File:</strong> ${e.filename}</p>
        <p><strong>Line:</strong> ${e.lineno}</p>
      </div>
    `;
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('🔥 Unhandled promise rejection:', e.reason);
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 40px; background: #f8d7da; color: #721c24; font-family: Arial;">
        <h1>❌ Promise Rejection</h1>
        <p><strong>Reason:</strong> ${e.reason}</p>
      </div>
    `;
  }
});

async function initializeApp() {
  try {
    console.log("📱 Starting app initialization...");
    
    // Show loading indicator
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 40px; background: #d4edda; color: #155724; font-family: Arial; text-align: center;">
          <h1>🔄 Loading React Application...</h1>
          <p>main.tsx is executing successfully</p>
          <p>Loading CSS and components...</p>
        </div>
      `;
    }

    // Import CSS
    console.log("📚 Loading CSS...");
    await import("./index.css");
    console.log("✅ CSS loaded successfully");

    // Import and call bootstrap
    console.log("🔗 Loading bootstrap...");
    const { initApp } = await import("./bootstrap");
    console.log("✅ Bootstrap loaded successfully");

    console.log("🚀 Calling initApp...");
    await initApp();
    console.log("✅ App initialization completed");

  } catch (error) {
    console.error("❌ App initialization failed:", error);
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 40px; background: #f8d7da; color: #721c24; font-family: Arial;">
          <h1>❌ Initialization Failed</h1>
          <p><strong>Error:</strong> ${error.message}</p>
          <pre style="background: #fff; padding: 10px; border: 1px solid #ccc; overflow: auto;">${error.stack}</pre>
          <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px; background: #dc3545; color: white; border: none; cursor: pointer;">
            Reload Page
          </button>
        </div>
      `;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  console.log("⏳ Document loading, waiting for DOMContentLoaded");
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  console.log("⚡ Document ready, initializing immediately");
  initializeApp();
}
