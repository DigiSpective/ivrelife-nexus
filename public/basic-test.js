console.log("🔵 BASIC-TEST: Non-module script executing");

// Immediate visual changes
document.body.style.backgroundColor = "#3b82f6";
document.body.style.color = "white";
document.body.style.padding = "20px";
document.body.style.fontFamily = "Arial, sans-serif";

console.log("🔵 BASIC-TEST: Body style applied");

// Update root immediately
const rootElement = document.getElementById("root");
if (rootElement) {
  console.log("🔵 BASIC-TEST: Root found, updating content");
  rootElement.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <h1 style="font-size: 2.5em; margin-bottom: 20px;">🔵 NON-MODULE SUCCESS</h1>
      <p style="font-size: 1.3em; margin-bottom: 15px;">Non-module JavaScript is working!</p>
      <p style="font-size: 1em; margin-bottom: 20px;">Time: ${new Date().toLocaleString()}</p>
      <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h2>✅ Status Report</h2>
        <p>✅ Basic JavaScript: WORKING</p>
        <p>✅ DOM manipulation: WORKING</p>
        <p>✅ HTML serving: WORKING</p>
        <p>✅ Non-module scripts: WORKING</p>
        <p>❓ ES6 modules: TESTING NEEDED</p>
      </div>
      <button onclick="testModuleLoading()" style="padding: 10px 20px; font-size: 16px; background: white; color: #3b82f6; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">Test ES6 Module</button>
      <button onclick="alert('Basic interaction working!')" style="padding: 10px 20px; font-size: 16px; background: rgba(255,255,255,0.2); color: white; border: 1px solid white; border-radius: 5px; cursor: pointer; margin: 5px;">Test Click</button>
    </div>
  `;
  console.log("🔵 BASIC-TEST: Content updated successfully");
} else {
  console.error("🔵 BASIC-TEST: No root element found!");
}

// Test function for ES6 module loading
function testModuleLoading() {
  console.log("🔵 BASIC-TEST: Testing ES6 module import...");
  
  // Try to import the ultra-minimal script as a module
  import('/src/main-ultra-minimal.tsx').then(() => {
    console.log("🔵 BASIC-TEST: ES6 module import SUCCESS");
    alert("✅ ES6 modules are working! The issue is likely in React/complex imports.");
  }).catch(error => {
    console.error("🔵 BASIC-TEST: ES6 module import FAILED:", error);
    alert("❌ ES6 module loading failed: " + error.message);
    
    // Try to provide more specific error details
    const rootElement = document.getElementById("root");
    if (rootElement) {
      rootElement.innerHTML += `
        <div style="background: rgba(255,0,0,0.2); padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid rgba(255,0,0,0.5);">
          <h3>❌ ES6 Module Loading Failed</h3>
          <p><strong>Error:</strong> ${error.message}</p>
          <p><strong>Type:</strong> ${error.name}</p>
          <p>This indicates the issue is with ES6 module loading, not basic JavaScript.</p>
        </div>
      `;
    }
  });
}

console.log("🔵 BASIC-TEST: Script complete");